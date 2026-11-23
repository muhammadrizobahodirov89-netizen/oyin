import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Shield } from 'lucide-react';
import { sound } from '../../utils/sound';

interface SchoolMathGameProps {
  bestScore: number;
  onScoreSave: (score: number) => void;
}

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

interface Meteor {
  id: number;
  expr: string;
  answer: number;
  options: number[];
  x: number;
  y: number;
  speed: number;
}

function generateMeteor(id: number, level: number): Meteor {
  const ops = level >= 2 ? ['+', '-', '×'] : ['+', '-'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = 2 + Math.floor(Math.random() * (8 + level * 3));
  let b = 2 + Math.floor(Math.random() * (6 + level * 2));
  let answer = 0;

  if (op === '+') {
    answer = a + b;
  } else if (op === '-') {
    if (b > a) [a, b] = [b, a];
    answer = a - b;
  } else {
    a = 2 + Math.floor(Math.random() * 8);
    b = 2 + Math.floor(Math.random() * 8);
    answer = a * b;
  }

  const opts = new Set<number>([answer]);
  while (opts.size < 4) {
    const delta = Math.floor(Math.random() * 7) - 3;
    const candidate = Math.max(0, answer + (delta === 0 ? 4 : delta));
    opts.add(candidate);
  }

  return {
    id,
    expr: `${a} ${op} ${b}`,
    answer,
    options: Array.from(opts).sort(() => Math.random() - 0.5),
    x: 20 + Math.random() * 60,
    y: 10,
    speed: 9 + Math.min(8, level * 1.4),
  };
}

export function SchoolMathGame({ bestScore, onScoreSave }: SchoolMathGameProps) {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [shield, setShield] = useState(3);
  const [combo, setCombo] = useState(0);
  const [meteor, setMeteor] = useState<Meteor | null>(null);

  const idRef = useRef(1);
  const scoreRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  const spawnNext = useCallback((currentScore: number) => {
    const level = 1 + Math.floor(currentScore / 120);
    setMeteor(generateMeteor(idRef.current++, level));
  }, []);

  const startGame = () => {
    sound.playSuccess();
    scoreRef.current = 0;
    setScore(0);
    setShield(3);
    setCombo(0);
    spawnNext(0);
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    lastRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;

      setMeteor((prev) => {
        if (!prev) return prev;
        const ny = prev.y + prev.speed * dt;
        if (ny >= 84) {
          sound.playHit();
          setCombo(0);
          setShield((hp) => {
            const nextHp = hp - 1;
            if (nextHp <= 0) {
              setGameState('GAME_OVER');
              onScoreSave(scoreRef.current);
            }
            return nextHp;
          });
          const level = 1 + Math.floor(scoreRef.current / 120);
          return generateMeteor(idRef.current++, level);
        }
        return { ...prev, y: ny };
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameState, onScoreSave]);

  const handleAnswer = (val: number) => {
    if (gameState !== 'PLAYING' || !meteor) return;
    if (val === meteor.answer) {
      const nextCombo = combo + 1;
      const pts = 20 + Math.min(30, combo * 5);
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setCombo(nextCombo);
      sound.playPop(nextCombo);
      spawnNext(scoreRef.current);
    } else {
      sound.playError();
      setCombo(0);
      setShield((hp) => {
        const nextHp = hp - 1;
        if (nextHp <= 0) {
          setGameState('GAME_OVER');
          onScoreSave(scoreRef.current);
        }
        return nextHp;
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs font-medium text-slate-500">Ball</span>
            <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{score}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Kombo</span>
            <p className="font-mono text-2xl font-bold text-emerald-600 tabular-nums">×{combo}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Qalqon</span>
            <div className="flex items-center gap-1 pt-1">
              {[0, 1, 2].map((i) => (
                <Shield
                  key={i}
                  className={`h-5 w-5 ${i < shield ? 'fill-sky-500 text-sky-500' : 'text-slate-300'}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-500">Rekord</span>
          <p className="font-mono text-2xl font-bold text-slate-700 tabular-nums">
            {Math.max(bestScore, score)}
          </p>
        </div>
      </div>

      <div className="relative flex h-[450px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white">
        {gameState === 'TITLE_MENU' && (
          <div className="m-auto flex max-w-md flex-col items-center text-center">
            <h3 className="font-display text-3xl font-bold">Tezkor Hisob</h3>
            <p className="mt-2 text-sm text-slate-300">
              Meteorit shahar qalqoniga tushmasdan turib, undagi misolning to‘g‘ri javobini tanlang!
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-bold text-white transition hover:bg-emerald-600"
            >
              <Play className="h-5 w-5 fill-current" />
              Himoyani boshlash
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="m-auto flex flex-col items-center text-center animate-pop-in">
            <h3 className="font-display text-3xl font-bold">Qalqon quvvati tugadi</h3>
            <p className="mt-2 text-base text-slate-300">
              Natijangiz: <strong className="font-mono text-emerald-400 tabular-nums">{score} ball</strong>
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

        {gameState === 'PLAYING' && meteor && (
          <>
            <div className="relative flex-1 w-full">
              <div
                style={{ left: `${meteor.x}%`, top: `${meteor.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-300 bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg"
              >
                <span className="font-display text-xl font-extrabold text-white tabular-nums">
                  {meteor.expr}
                </span>
              </div>
              {/* City shield arc */}
              <div className="absolute bottom-0 left-4 right-4 h-3 rounded-t-full bg-sky-500/40 border-t-2 border-sky-400" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              {meteor.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleAnswer(opt)}
                  className="rounded-xl border border-slate-700 bg-slate-800 py-3.5 font-mono text-xl font-bold text-white transition hover:border-emerald-400 hover:bg-slate-700 active:scale-95 tabular-nums"
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
