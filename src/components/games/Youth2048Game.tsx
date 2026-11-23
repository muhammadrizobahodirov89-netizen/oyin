import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Undo2 } from 'lucide-react';
import { sound } from '../../utils/sound';

interface Youth2048GameProps {
  bestScore: number;
  onScoreSave: (score: number) => void;
}

type Board = number[][];
type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function emptyBoard(): Board {
  return Array.from({ length: 4 }, () => [0, 0, 0, 0]);
}

function addRandomTile(board: Board): Board {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const copy = board.map((row) => [...row]);
  copy[r][c] = Math.random() < 0.9 ? 2 : 4;
  return copy;
}

function slideLine(line: number[]): { result: number[]; gained: number; moved: boolean } {
  const filtered = line.filter((v) => v !== 0);
  const merged: number[] = [];
  let gained = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      merged.push(val);
      gained += val;
      i++;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < 4) merged.push(0);
  const moved = merged.some((v, idx) => v !== line[idx]);
  return { result: merged, gained, moved };
}

function moveBoard(board: Board, dir: Dir): { board: Board; gained: number; moved: boolean } {
  let next = emptyBoard();
  let totalGained = 0;
  let anyMoved = false;

  if (dir === 'LEFT' || dir === 'RIGHT') {
    for (let r = 0; r < 4; r++) {
      const row = dir === 'RIGHT' ? [...board[r]].reverse() : [...board[r]];
      const { result, gained, moved } = slideLine(row);
      if (moved) anyMoved = true;
      totalGained += gained;
      next[r] = dir === 'RIGHT' ? result.reverse() : result;
    }
  } else {
    for (let c = 0; c < 4; c++) {
      const col = [board[0][c], board[1][c], board[2][c], board[3][c]];
      const oriented = dir === 'DOWN' ? col.reverse() : col;
      const { result, gained, moved } = slideLine(oriented);
      if (moved) anyMoved = true;
      totalGained += gained;
      const restored = dir === 'DOWN' ? result.reverse() : result;
      for (let r = 0; r < 4; r++) next[r][c] = restored[r];
    }
  }

  if (anyMoved) {
    next = addRandomTile(next);
  }
  return { board: next, gained: totalGained, moved: anyMoved };
}

function hasAnyMoves(board: Board): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return true;
      if (r < 3 && board[r][c] === board[r + 1][c]) return true;
      if (c < 3 && board[r][c] === board[r][c + 1]) return true;
    }
  }
  return false;
}

const TILE_STYLES: Record<number, string> = {
  0: 'bg-slate-800/70 text-transparent',
  2: 'bg-stone-100 text-slate-900',
  4: 'bg-amber-100 text-slate-900',
  8: 'bg-orange-400 text-white',
  16: 'bg-orange-500 text-white',
  32: 'bg-rose-500 text-white',
  64: 'bg-red-600 text-white',
  128: 'bg-amber-400 text-slate-950',
  256: 'bg-amber-500 text-white',
  512: 'bg-yellow-500 text-slate-950',
  1024: 'bg-emerald-500 text-white',
  2048: 'bg-sky-500 text-white',
};

export function Youth2048Game({ bestScore, onScoreSave }: Youth2048GameProps) {
  const [board, setBoard] = useState<Board>(() => addRandomTile(addRandomTile(emptyBoard())));
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [undosLeft, setUndosLeft] = useState(3);
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const restart = () => {
    sound.playSuccess();
    setBoard(addRandomTile(addRandomTile(emptyBoard())));
    setScore(0);
    setMoves(0);
    setUndosLeft(3);
    setHistory([]);
    setGameOver(false);
  };

  const applyMove = useCallback(
    (dir: Dir) => {
      if (gameOver) return;
      const { board: next, gained, moved } = moveBoard(board, dir);
      if (!moved) return;

      if (gained > 0) sound.playMerge();
      else sound.playSlide();

      setHistory((prev) => [...prev.slice(-4), { board, score }]);
      const nextScore = score + gained;
      setBoard(next);
      setScore(nextScore);
      setMoves((m) => m + 1);
      onScoreSave(nextScore);

      if (!hasAnyMoves(next)) {
        sound.playError();
        setGameOver(true);
      }
    },
    [board, gameOver, onScoreSave, score]
  );

  const handleUndo = () => {
    if (undosLeft <= 0 || history.length === 0 || gameOver) return;
    const prev = history[history.length - 1];
    sound.playClick();
    setBoard(prev.board);
    setScore(prev.score);
    setHistory((h) => h.slice(0, -1));
    setUndosLeft((u) => u - 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') applyMove('UP');
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') applyMove('DOWN');
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') applyMove('LEFT');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') applyMove('RIGHT');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [applyMove]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs font-medium text-slate-500">Ochko</span>
            <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{score}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Qadamlar</span>
            <p className="font-mono text-2xl font-bold text-orange-600 tabular-nums">{moves}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Rekord</span>
            <p className="font-mono text-2xl font-bold text-slate-700 tabular-nums">
              {Math.max(bestScore, score)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undosLeft <= 0 || history.length === 0 || gameOver}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-45"
          >
            <Undo2 className="h-4 w-4" />
            Bekor qilish ({undosLeft})
          </button>
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            Yangilash
          </button>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div
          onTouchStart={(e) => {
            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            if (!touchStart.current) return;
            const dx = e.changedTouches[0].clientX - touchStart.current.x;
            const dy = e.changedTouches[0].clientY - touchStart.current.y;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) {
              applyMove(dx > 0 ? 'RIGHT' : 'LEFT');
            } else if (Math.abs(dy) > 25) {
              applyMove(dy > 0 ? 'DOWN' : 'UP');
            }
            touchStart.current = null;
          }}
          className="grid grid-cols-4 gap-3 rounded-xl bg-slate-950 p-3 touch-none select-none"
        >
          {board.flatMap((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg font-display font-extrabold transition-transform duration-150 tabular-nums ${
                  val >= 1024 ? 'text-xl' : val >= 128 ? 'text-2xl' : 'text-3xl'
                } ${TILE_STYLES[val] ?? 'bg-indigo-600 text-white'}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        {/* Arrow controls for mouse/tap convenience */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyMove('LEFT')}
            aria-label="Chapga surish"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => applyMove('UP')}
            aria-label="Tepaga surish"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => applyMove('DOWN')}
            aria-label="Pastga surish"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => applyMove('RIGHT')}
            aria-label="O‘ngga surish"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-slate-950/90 p-6 text-center text-white animate-pop-in">
            <h3 className="font-display text-3xl font-bold">Yo‘llar yopildi</h3>
            <p className="mt-2 text-base text-slate-300">
              Yakuniy ochko: <strong className="font-mono text-amber-400 tabular-nums">{score}</strong>
            </p>
            <button
              type="button"
              onClick={restart}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-7 py-3.5 text-base font-bold text-white transition hover:bg-orange-700"
            >
              <RotateCcw className="h-5 w-5" />
              Yangi o‘yin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
