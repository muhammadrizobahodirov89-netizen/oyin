import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Play, RotateCcw } from 'lucide-react';
import { sound } from '../../utils/sound';

interface TeenSnakeGameProps {
  bestScore: number;
  onScoreSave: (score: number) => void;
}

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';
type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Point {
  x: number;
  y: number;
}

const GRID = 20;

export function TeenSnakeGame({ bestScore, onScoreSave }: TeenSnakeGameProps) {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [speedLevel, setSpeedLevel] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dirRef = useRef<Dir>('RIGHT');
  const nextDirRef = useRef<Dir>('RIGHT');
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const bonusRef = useRef<{ pos: Point; ttl: number } | null>(null);
  const scoreRef = useRef(0);

  const spawnFood = useCallback((snake: Point[]): Point => {
    while (true) {
      const pt = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID),
      };
      if (!snake.some((s) => s.x === pt.x && s.y === pt.y)) return pt;
    }
  }, []);

  const changeDir = useCallback((newDir: Dir) => {
    const cur = dirRef.current;
    if (
      (cur === 'UP' && newDir === 'DOWN') ||
      (cur === 'DOWN' && newDir === 'UP') ||
      (cur === 'LEFT' && newDir === 'RIGHT') ||
      (cur === 'RIGHT' && newDir === 'LEFT')
    ) {
      return;
    }
    nextDirRef.current = newDir;
  }, []);

  const startGame = () => {
    sound.playSuccess();
    const initial = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    snakeRef.current = initial;
    dirRef.current = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    foodRef.current = spawnFood(initial);
    bonusRef.current = null;
    scoreRef.current = 0;
    setScore(0);
    setSpeedLevel(1);
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') changeDir('UP');
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') changeDir('DOWN');
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') changeDir('LEFT');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') changeDir('RIGHT');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [changeDir, gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tickMs = Math.max(70, 140 - (speedLevel - 1) * 12);

    const interval = window.setInterval(() => {
      dirRef.current = nextDirRef.current;
      const head = snakeRef.current[0];
      const next = { ...head };
      if (dirRef.current === 'UP') next.y -= 1;
      if (dirRef.current === 'DOWN') next.y += 1;
      if (dirRef.current === 'LEFT') next.x -= 1;
      if (dirRef.current === 'RIGHT') next.x += 1;

      if (
        next.x < 0 ||
        next.x >= GRID ||
        next.y < 0 ||
        next.y >= GRID ||
        snakeRef.current.some((s) => s.x === next.x && s.y === next.y)
      ) {
        sound.playHit();
        onScoreSave(scoreRef.current);
        setGameState('GAME_OVER');
        return;
      }

      const nextSnake = [next, ...snakeRef.current];
      let ate = false;

      if (next.x === foodRef.current.x && next.y === foodRef.current.y) {
        ate = true;
        scoreRef.current += 20;
        setScore(scoreRef.current);
        setSpeedLevel(1 + Math.floor(scoreRef.current / 100));
        sound.playPop(nextSnake.length);
        foodRef.current = spawnFood(nextSnake);
        if (!bonusRef.current && Math.random() < 0.25) {
          bonusRef.current = { pos: spawnFood(nextSnake), ttl: 32 };
        }
      } else if (
        bonusRef.current &&
        next.x === bonusRef.current.pos.x &&
        next.y === bonusRef.current.pos.y
      ) {
        ate = true;
        scoreRef.current += 50;
        setScore(scoreRef.current);
        setSpeedLevel(1 + Math.floor(scoreRef.current / 100));
        sound.playMatch();
        bonusRef.current = null;
      }

      if (!ate) nextSnake.pop();
      snakeRef.current = nextSnake;

      if (bonusRef.current) {
        bonusRef.current.ttl -= 1;
        if (bonusRef.current.ttl <= 0) bonusRef.current = null;
      }

      // Draw
      const size = canvas.width;
      const cell = size / GRID;
      ctx.fillStyle = '#0B1324';
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = '#17223B';
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell, 0);
        ctx.lineTo(i * cell, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cell);
        ctx.lineTo(size, i * cell);
        ctx.stroke();
      }

      // Food
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(
        foodRef.current.x * cell + cell / 2,
        foodRef.current.y * cell + cell / 2,
        cell * 0.36,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Golden bonus
      if (bonusRef.current) {
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(
          bonusRef.current.pos.x * cell + cell / 2,
          bonusRef.current.pos.y * cell + cell / 2,
          cell * 0.42,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Snake
      nextSnake.forEach((seg, idx) => {
        ctx.fillStyle = idx === 0 ? '#34D399' : '#10B981';
        ctx.beginPath();
        ctx.roundRect(seg.x * cell + 2, seg.y * cell + 2, cell - 4, cell - 4, 5);
        ctx.fill();
      });
    }, tickMs);

    return () => window.clearInterval(interval);
  }, [gameState, onScoreSave, spawnFood, speedLevel]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs font-medium text-slate-500">Ball</span>
            <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{score}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Tezlik darajasi</span>
            <p className="font-mono text-2xl font-bold text-emerald-600 tabular-nums">×{speedLevel}</p>
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-500">Rekord</span>
          <p className="font-mono text-2xl font-bold text-slate-700 tabular-nums">
            {Math.max(bestScore, score)}
          </p>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#0B1324] p-5">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="h-[340px] w-[340px] sm:h-[400px] sm:w-[400px] rounded-xl border border-slate-700"
        />

        {/* Mobile D-Pad */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
          <div />
          <button
            type="button"
            onClick={() => changeDir('UP')}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-white"
            aria-label="Tepaga"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
          <div />
          <button
            type="button"
            onClick={() => changeDir('LEFT')}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-white"
            aria-label="Chapga"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => changeDir('DOWN')}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-white"
            aria-label="Pastga"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => changeDir('RIGHT')}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-white"
            aria-label="O‘ngga"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-slate-950/88 p-6 text-center text-white">
            <h3 className="font-display text-3xl font-bold">Turbo Iloncha</h3>
            <p className="mt-2 max-w-md text-sm text-slate-300">
              Qizil mevalar (+20) va vaqtinchalik oltin mevalarni (+50) yig‘ing. Devorga va o‘zingizga urilmang!
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-bold text-white transition hover:bg-emerald-600"
            >
              <Play className="h-5 w-5 fill-current" />
              O‘ynash
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-slate-950/90 p-6 text-center text-white animate-pop-in">
            <h3 className="font-display text-3xl font-bold">O‘yin tugadi</h3>
            <p className="mt-2 text-base text-slate-300">
              Natija: <strong className="font-mono text-emerald-400 tabular-nums">{score} ball</strong>
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-bold text-white transition hover:bg-emerald-600"
            >
              <RotateCcw className="h-5 w-5" />
              Qayta boshlash
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
