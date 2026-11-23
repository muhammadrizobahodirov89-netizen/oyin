import { useEffect, useRef, useState } from 'react';
import { Check, Play, RotateCcw, X } from 'lucide-react';
import { sound } from '../../utils/sound';

interface YouthReflexGameProps {
  bestScore: number;
  onScoreSave: (score: number) => void;
}

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

interface TargetNode {
  id: number;
  x: number;
  y: number;
  kind: 'target' | 'decoy';
  spawnedAt: number;
}

export function YouthReflexGame({ bestScore, onScoreSave }: YouthReflexGameProps) {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [avgMs, setAvgMs] = useState(0);
  const [nodes, setNodes] = useState<TargetNode[]>([]);

  const nextId = useRef(1);
  const scoreRef = useRef(0);
  const reactionsRef = useRef<number[]>([]);

  const spawnBatch = () => {
    const batch: TargetNode[] = [
      {
        id: nextId.current++,
        x: 15 + Math.random() * 70,
        y: 18 + Math.random() * 64,
        kind: 'target',
        spawnedAt: performance.now(),
      },
    ];
    if (Math.random() < 0.65) {
      batch.push({
        id: nextId.current++,
        x: 15 + Math.random() * 70,
        y: 18 + Math.random() * 64,
        kind: 'decoy',
        spawnedAt: performance.now(),
      });
    }
    setNodes(batch);
  };

  const startGame = () => {
    sound.playSuccess();
    scoreRef.current = 0;
    reactionsRef.current = [];
    setScore(0);
    setHits(0);
    setMisses(0);
    setAvgMs(0);
    setTimeLeft(30);
    spawnBatch();
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

  const handleNodeClick = (node: TargetNode) => {
    if (gameState !== 'PLAYING') return;
    if (node.kind === 'target') {
      const rt = Math.round(performance.now() - node.spawnedAt);
      reactionsRef.current.push(rt);
      const avg = Math.round(
        reactionsRef.current.reduce((a, b) => a + b, 0) / reactionsRef.current.length
      );
      setAvgMs(avg);
      const speedBonus = rt < 450 ? 35 : rt < 750 ? 25 : 15;
      scoreRef.current += speedBonus;
      setScore(scoreRef.current);
      setHits((h) => h + 1);
      sound.playPop(hits);
      spawnBatch();
    } else {
      sound.playError();
      scoreRef.current = Math.max(0, scoreRef.current - 20);
      setScore(scoreRef.current);
      setMisses((m) => m + 1);
      spawnBatch();
    }
  };

  const totalClicks = hits + misses;
  const accuracy = totalClicks > 0 ? Math.round((hits / totalClicks) * 100) : 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs font-medium text-slate-500">Ball</span>
            <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{score}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Vaqt</span>
            <p className="font-mono text-2xl font-bold text-orange-600 tabular-nums">{timeLeft}s</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">O‘rtacha reaksiya</span>
            <p className="font-mono text-2xl font-bold text-emerald-600 tabular-nums">
              {avgMs > 0 ? `${avgMs} ms` : '—'}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Aniqlik</span>
            <p className="font-mono text-2xl font-bold text-slate-700 tabular-nums">{accuracy}%</p>
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-500">Rekord</span>
          <p className="font-mono text-2xl font-bold text-slate-700 tabular-nums">
            {Math.max(bestScore, score)}
          </p>
        </div>
      </div>

      <div className="relative h-[440px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#111827] select-none">
        {/* Subtle crosshair guide */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15">
          <div className="h-64 w-64 rounded-full border border-slate-400" />
        </div>

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/88 p-6 text-center text-white">
            <h3 className="font-display text-3xl font-bold">Reaksiya Poligoni</h3>
            <p className="mt-2 max-w-md text-sm text-slate-300">
              Yashil tasdiq nishonlarini iloji boricha tez bosing. Qizil X tuzoqlariga tegmang (-20 ball).
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-7 py-3.5 text-base font-bold text-white transition hover:bg-orange-700"
            >
              <Play className="h-5 w-5 fill-current" />
              Sinovni boshlash
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center text-white animate-pop-in">
            <h3 className="font-display text-3xl font-bold">Vaqt tugadi</h3>
            <p className="mt-2 text-base text-slate-300">
              Ball: <strong className="font-mono text-orange-400 tabular-nums">{score}</strong> ·
              Reaksiya: <strong className="font-mono text-emerald-400 tabular-nums">{avgMs} ms</strong> ·
              Aniqlik: <strong className="font-mono tabular-nums">{accuracy}%</strong>
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-7 py-3.5 text-base font-bold text-white transition hover:bg-orange-700"
            >
              <RotateCcw className="h-5 w-5" />
              Qayta sinash
            </button>
          </div>
        )}

        {gameState === 'PLAYING' &&
          nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => handleNodeClick(node)}
              aria-label={node.kind === 'target' ? 'Yashil nishon' : 'Qizil tuzoq'}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-100 hover:scale-105 active:scale-90 ${
                node.kind === 'target'
                  ? 'bg-emerald-500 ring-4 ring-emerald-400/30'
                  : 'bg-rose-600 ring-4 ring-rose-400/30'
              }`}
            >
              {node.kind === 'target' ? <Check className="h-7 w-7 stroke-[3]" /> : <X className="h-7 w-7 stroke-[3]" />}
            </button>
          ))}
      </div>
    </div>
  );
}
