import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Star } from 'lucide-react';
import { sound } from '../../utils/sound';

interface KidsBalloonGameProps {
  bestScore: number;
  onScoreSave: (score: number) => void;
}

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

interface ColorOption {
  id: string;
  label: string;
  hex: string;
  lightHex: string;
  shape: 'circle' | 'star' | 'heart' | 'diamond';
}

const COLORS: ColorOption[] = [
  { id: 'red', label: 'Qizil', hex: '#EF4444', lightHex: '#FCA5A5', shape: 'heart' },
  { id: 'blue', label: 'Ko‘k', hex: '#2563EB', lightHex: '#93C5FD', shape: 'circle' },
  { id: 'yellow', label: 'Sariq', hex: '#F59E0B', lightHex: '#FDE68A', shape: 'star' },
  { id: 'green', label: 'Yashil', hex: '#10B981', lightHex: '#6EE7B7', shape: 'diamond' },
];

interface Balloon {
  id: number;
  x: number;
  y: number;
  speed: number;
  color: ColorOption;
  size: number;
  swayOffset: number;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  color: string;
  text: string;
}

export function KidsBalloonGame({ bestScore, onScoreSave }: KidsBalloonGameProps) {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [targetColor, setTargetColor] = useState<ColorOption>(COLORS[0]);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [streak, setStreak] = useState(0);

  const nextId = useRef(1);
  const scoreRef = useRef(0);
  const targetRef = useRef<ColorOption>(COLORS[0]);
  const animRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  const pickNewTarget = useCallback((excludeId?: string) => {
    const pool = excludeId ? COLORS.filter((c) => c.id !== excludeId) : COLORS;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    targetRef.current = chosen;
    setTargetColor(chosen);
  }, []);

  const createBalloon = useCallback((forceTarget = false): Balloon => {
    const useTarget = forceTarget || Math.random() < 0.45;
    const color = useTarget
      ? targetRef.current
      : COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      id: nextId.current++,
      x: 10 + Math.random() * 80,
      y: 108,
      speed: 14 + Math.random() * 10,
      color,
      size: 76 + Math.floor(Math.random() * 14),
      swayOffset: Math.random() * Math.PI * 2,
    };
  }, []);

  const startGame = () => {
    sound.playSuccess();
    scoreRef.current = 0;
    setScore(0);
    setStreak(0);
    setTimeLeft(45);
    setBursts([]);
    pickNewTarget();
    setBalloons([createBalloon(true), createBalloon(false), createBalloon(true)]);
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setGameState('GAME_OVER');
          onScoreSave(scoreRef.current);
          sound.playSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [gameState, onScoreSave]);

  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    lastFrameRef.current = performance.now();
    spawnTimerRef.current = 0;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;
      spawnTimerRef.current += dt;

      setBalloons((prev) => {
        const moved = prev
          .map((b) => ({
            ...b,
            y: b.y - b.speed * dt,
          }))
          .filter((b) => b.y > -18);

        if (spawnTimerRef.current >= 0.95 && moved.length < 7) {
          spawnTimerRef.current = 0;
          const hasTarget = moved.some((b) => b.color.id === targetRef.current.id);
          moved.push(createBalloon(!hasTarget));
        }
        return moved;
      });

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameState, createBalloon]);

  const handlePop = (balloon: Balloon) => {
    if (gameState !== 'PLAYING') return;
    setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));

    const isTarget = balloon.color.id === targetColor.id;
    const points = isTarget ? 20 : 5;
    scoreRef.current += points;
    setScore(scoreRef.current);

    if (isTarget) {
      sound.playPop(streak);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak % 3 === 0) {
        pickNewTarget(targetColor.id);
      }
    } else {
      sound.playPop(0);
      setStreak(0);
    }

    const burstId = nextId.current++;
    setBursts((prev) => [
      ...prev,
      {
        id: burstId,
        x: balloon.x,
        y: balloon.y,
        color: balloon.color.hex,
        text: isTarget ? '+20' : '+5',
      },
    ]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((item) => item.id !== burstId));
    }, 500);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* HUD */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs font-medium text-slate-500">Ballar</span>
            <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{score}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Vaqt</span>
            <p className="font-mono text-2xl font-bold text-amber-600 tabular-nums">{timeLeft}s</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Rekord</span>
            <p className="font-mono text-2xl font-bold text-slate-700 tabular-nums">
              {Math.max(bestScore, score)}
            </p>
          </div>
        </div>

        {gameState === 'PLAYING' && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold"
              style={{ backgroundColor: targetColor.hex }}
            >
              <ShapeMark shape={targetColor.shape} />
            </span>
            <div className="text-left">
              <span className="block text-xs text-slate-500">Kerakli rang</span>
              <span className="text-base font-bold text-slate-900">{targetColor.label} shar</span>
            </div>
          </div>
        )}
      </div>

      {/* Play Arena */}
      <div className="relative h-[460px] w-full overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100 select-none">
        {/* Meadow hills */}
        <svg viewBox="0 0 800 120" className="pointer-events-none absolute bottom-0 left-0 w-full" preserveAspectRatio="none">
          <path d="M0 70 Q200 10 420 65 T800 50 L800 120 L0 120 Z" fill="#4ADE80" opacity="0.7" />
          <path d="M0 90 Q260 40 540 85 T800 75 L800 120 L0 120 Z" fill="#22C55E" />
        </svg>

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/85 p-6 text-center backdrop-blur-xs">
            <h3 className="font-display text-3xl font-bold text-slate-900">Rangli Sharlar</h3>
            <p className="mt-2 max-w-md text-base text-slate-600">
              Yuqorida ko‘rsatilgan rangdagi sharni topib bosing (+20 ball). Barcha sharlar quvnoq kuy chaladi!
            </p>
            <button
              onClick={startGame}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-amber-600 active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              O‘ynashni boshlash
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 p-6 text-center backdrop-blur-xs animate-pop-in">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-8 w-8 fill-current" />
              <Star className="h-10 w-10 fill-current" />
              <Star className="h-8 w-8 fill-current" />
            </div>
            <h3 className="mt-3 font-display text-3xl font-bold text-slate-900">Barakalla!</h3>
            <p className="mt-1 text-lg text-slate-600">
              To‘plangan ball: <strong className="font-mono text-slate-900 tabular-nums">{score}</strong>
            </p>
            <button
              onClick={startGame}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-amber-600 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              Yana o‘ynash
            </button>
          </div>
        )}

        {/* Balloons */}
        {balloons.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => handlePop(b)}
            aria-label={`${b.color.label} shar`}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}px`,
              height: `${b.size * 1.15}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute cursor-pointer transition-transform duration-100 hover:scale-110 active:scale-90 focus-visible:outline-2 focus-visible:outline-slate-900"
          >
            <svg viewBox="0 0 80 96" className="h-full w-full drop-shadow-md">
              <path d="M40 74 Q37 85 42 95" stroke="#475569" strokeWidth="2.5" fill="none" />
              <polygon points="35,73 45,73 40,67" fill={b.color.hex} />
              <ellipse cx="40" cy="37" rx="33" ry="36" fill={b.color.hex} />
              <ellipse cx="28" cy="24" rx="8" ry="13" fill={b.color.lightHex} opacity="0.55" transform="rotate(-20 28 24)" />
              <g transform="translate(40, 40)" fill="#FFFFFF" opacity="0.9">
                {b.color.shape === 'circle' && <circle r="9" />}
                {b.color.shape === 'diamond' && <polygon points="0,-11 11,0 0,11 -11,0" />}
                {b.color.shape === 'star' && (
                  <polygon points="0,-12 3,-4 12,-4 5,2 7,11 0,6 -7,11 -5,2 -12,-4 -3,-4" />
                )}
                {b.color.shape === 'heart' && (
                  <path d="M0 10 C-12 2 -14 -9 -5 -10 C-1 -10 0 -6 0 -6 C0 -6 1 -10 5 -10 C14 -9 12 2 0 10 Z" />
                )}
              </g>
            </svg>
          </button>
        ))}

        {/* Pop bursts */}
        {bursts.map((burst) => (
          <div
            key={burst.id}
            style={{ left: `${burst.x}%`, top: `${burst.y}%`, color: burst.color }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-display text-2xl font-extrabold drop-shadow-sm animate-pop-in"
          >
            {burst.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShapeMark({ shape }: { shape: ColorOption['shape'] }) {
  if (shape === 'circle') return <span className="inline-block h-3.5 w-3.5 rounded-full bg-white" />;
  if (shape === 'diamond') return <span className="inline-block h-3.5 w-3.5 rotate-45 bg-white" />;
  if (shape === 'star') return <span>★</span>;
  return <span>♥</span>;
}
