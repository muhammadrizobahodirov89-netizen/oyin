import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Play, RotateCcw } from 'lucide-react';
import { sound } from '../../utils/sound';

interface SchoolMazeGameProps {
  bestScore: number;
  onScoreSave: (score: number) => void;
}

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';

interface Pos {
  r: number;
  c: number;
}

interface Beetle {
  r: number;
  c: number;
  dr: number;
  dc: number;
}

// # = wall, . = floor, P = player, G = gem, E = exit portal, B = patrolling beetle
const LEVELS: string[][] = [
  [
    '#########',
    '#P..#..G#',
    '#.#.#.#.#',
    '#G..B...#',
    '###.#.###',
    '#G..#..E#',
    '#########',
  ],
  [
    '###########',
    '#P.#...G..#',
    '#..#.###.##',
    '#G...B....#',
    '###.###.#.#',
    '#G..#...#.#',
    '#.#.#.###.#',
    '#...B...GE#',
    '###########',
  ],
  [
    '###########',
    '#P..#..G..#',
    '#.#.#.###.#',
    '#G..B...#.#',
    '###.###.#G#',
    '#...#...#.#',
    '#.###.###.#',
    '#G..B....E#',
    '###########',
  ],
];

function parseLevel(index: number) {
  const layout = LEVELS[index];
  const walls = new Set<string>();
  const gems = new Set<string>();
  const beetles: Beetle[] = [];
  let player: Pos = { r: 1, c: 1 };
  let exit: Pos = { r: 1, c: 1 };

  layout.forEach((row, r) => {
    row.split('').forEach((ch, c) => {
      const key = `${r},${c}`;
      if (ch === '#') walls.add(key);
      if (ch === 'P') player = { r, c };
      if (ch === 'G') gems.add(key);
      if (ch === 'E') exit = { r, c };
      if (ch === 'B') beetles.push({ r, c, dr: 0, dc: 1 });
    });
  });

  return {
    rows: layout.length,
    cols: layout[0].length,
    walls,
    gems,
    beetles,
    player,
    exit,
  };
}

export function SchoolMazeGame({ bestScore, onScoreSave }: SchoolMazeGameProps) {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [levelIdx, setLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState<Pos>({ r: 1, c: 1 });
  const [gems, setGems] = useState<Set<string>>(new Set());
  const [beetles, setBeetles] = useState<Beetle[]>([]);
  const [walls, setWalls] = useState<Set<string>>(new Set());
  const [exitPos, setExitPos] = useState<Pos>({ r: 1, c: 1 });
  const [dims, setDims] = useState({ rows: 7, cols: 9 });

  const loadLevel = useCallback((idx: number, resetScore = false) => {
    const parsed = parseLevel(idx);
    setLevelIdx(idx);
    setWalls(parsed.walls);
    setGems(parsed.gems);
    setBeetles(parsed.beetles);
    setPlayer(parsed.player);
    setExitPos(parsed.exit);
    setDims({ rows: parsed.rows, cols: parsed.cols });
    if (resetScore) setScore(0);
  }, []);

  const startGame = () => {
    sound.playSuccess();
    loadLevel(0, true);
    setGameState('PLAYING');
  };

  const movePlayer = useCallback(
    (dr: number, dc: number) => {
      if (gameState !== 'PLAYING') return;
      const nr = player.r + dr;
      const nc = player.c + dc;
      const key = `${nr},${nc}`;
      if (walls.has(key)) {
        sound.playSlide();
        return;
      }

      // Check beetle collision
      if (beetles.some((b) => b.r === nr && b.c === nc)) {
        sound.playHit();
        onScoreSave(score);
        setGameState('GAME_OVER');
        return;
      }

      let nextScore = score;
      if (gems.has(key)) {
        sound.playMatch();
        const nextGems = new Set(gems);
        nextGems.delete(key);
        setGems(nextGems);
        nextScore += 50;
        setScore(nextScore);

        if (nr === exitPos.r && nc === exitPos.c && nextGems.size === 0) {
          // handled below
        }
      } else {
        sound.playClick();
      }

      setPlayer({ r: nr, c: nc });

      const remainingGems = gems.has(key) ? gems.size - 1 : gems.size;
      if (nr === exitPos.r && nc === exitPos.c && remainingGems === 0) {
        const bonusScore = nextScore + 100;
        setScore(bonusScore);
        onScoreSave(bonusScore);
        sound.playSuccess();
        if (levelIdx + 1 < LEVELS.length) {
          loadLevel(levelIdx + 1, false);
        } else {
          setGameState('VICTORY');
        }
      }
    },
    [beetles, exitPos, gameState, gems, levelIdx, loadLevel, onScoreSave, player, score, walls]
  );

  // Keyboard navigation
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') movePlayer(-1, 0);
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') movePlayer(1, 0);
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') movePlayer(0, -1);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePlayer(0, 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, movePlayer]);

  // Beetle patrols
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = window.setInterval(() => {
      setBeetles((prev) =>
        prev.map((b) => {
          const nr = b.r + b.dr;
          const nc = b.c + b.dc;
          if (walls.has(`${nr},${nc}`)) {
            return { ...b, dr: -b.dr, dc: -b.dc };
          }
          return { ...b, r: nr, c: nc };
        })
      );
    }, 520);
    return () => window.clearInterval(interval);
  }, [gameState, walls]);

  // Detect beetle walking onto player
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    if (beetles.some((b) => b.r === player.r && b.c === player.c)) {
      sound.playHit();
      onScoreSave(score);
      setGameState('GAME_OVER');
    }
  }, [beetles, gameState, onScoreSave, player, score]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs font-medium text-slate-500">Bosqich</span>
            <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {levelIdx + 1} / {LEVELS.length}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Qolgan zumrad</span>
            <p className="font-mono text-2xl font-bold text-emerald-600 tabular-nums">{gems.size}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Ball</span>
            <p className="font-mono text-2xl font-bold text-amber-600 tabular-nums">{score}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Rekord</span>
            <p className="font-mono text-2xl font-bold text-slate-700 tabular-nums">
              {Math.max(bestScore, score)}
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500">
          Barcha zumradlarni yig‘ib darvozaga kiring
        </span>
      </div>

      <div className="relative flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-stone-900 p-5 min-h-[450px]">
        {gameState === 'TITLE_MENU' && (
          <div className="flex flex-col items-center text-center max-w-md text-white">
            <h3 className="font-display text-3xl font-bold">Xazina Labirinti</h3>
            <p className="mt-2 text-sm text-stone-300">
              Ibodatxona ichidagi zumradlarni yig‘ing. Qo‘ng‘iz qo‘riqchilariga duch kelmang! Barcha zumradlar yig‘ilgach yashil darvoza ochiladi.
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-bold text-white transition hover:bg-emerald-600"
            >
              <Play className="h-5 w-5 fill-current" />
              Sarguzashtni boshlash
            </button>
          </div>
        )}

        {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
          <div className="flex flex-col items-center text-center text-white animate-pop-in">
            <h3 className="font-display text-3xl font-bold">
              {gameState === 'VICTORY' ? 'Barcha xazinalar topildi!' : 'Qo‘ng‘iz tutib oldi!'}
            </h3>
            <p className="mt-2 text-base text-stone-300">
              Natija: <strong className="font-mono text-amber-400 tabular-nums">{score} ball</strong>
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-bold text-white transition hover:bg-emerald-600"
            >
              <RotateCcw className="h-5 w-5" />
              Qayta o‘ynash
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div className="flex flex-col items-center gap-5 w-full">
            <div
              className="grid gap-1 rounded-xl bg-stone-800 p-2.5 shadow-inner"
              style={{
                gridTemplateColumns: `repeat(${dims.cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: dims.rows }).map((_, r) =>
                Array.from({ length: dims.cols }).map((__, c) => {
                  const key = `${r},${c}`;
                  const isWall = walls.has(key);
                  const isPlayer = player.r === r && player.c === c;
                  const isGem = gems.has(key);
                  const isExit = exitPos.r === r && exitPos.c === c;
                  const isBeetle = beetles.some((b) => b.r === r && b.c === c);
                  const exitOpen = gems.size === 0;

                  return (
                    <div
                      key={key}
                      className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-md text-sm font-bold ${
                        isWall
                          ? 'bg-amber-700/90 border border-amber-500/40'
                          : isExit
                          ? exitOpen
                            ? 'bg-emerald-500 text-white'
                            : 'bg-stone-700 border border-emerald-500/50 text-emerald-300'
                          : 'bg-stone-950/60'
                      }`}
                    >
                      {isPlayer ? (
                        <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-sky-400 ring-2 ring-white" />
                      ) : isBeetle ? (
                        <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-md bg-rose-500 ring-2 ring-rose-300" />
                      ) : isGem ? (
                        <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-45 bg-emerald-400 shadow-xs" />
                      ) : isExit ? (
                        <span className="text-xs">{exitOpen ? 'CHIQ' : 'QULF'}</span>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            {/* Touch D-Pad */}
            <div className="grid grid-cols-3 gap-2">
              <div />
              <button
                type="button"
                onClick={() => movePlayer(-1, 0)}
                aria-label="Tepaga"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-800 text-white hover:bg-stone-700 active:scale-95"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
              <div />
              <button
                type="button"
                onClick={() => movePlayer(0, -1)}
                aria-label="Chapga"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-800 text-white hover:bg-stone-700 active:scale-95"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => movePlayer(1, 0)}
                aria-label="Pastga"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-800 text-white hover:bg-stone-700 active:scale-95"
              >
                <ArrowDown className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => movePlayer(0, 1)}
                aria-label="O‘ngga"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-800 text-white hover:bg-stone-700 active:scale-95"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
