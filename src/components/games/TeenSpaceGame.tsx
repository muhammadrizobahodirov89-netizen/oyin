import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Shield } from 'lucide-react';
import { sound } from '../../utils/sound';

interface TeenSpaceGameProps {
  bestScore: number;
  onScoreSave: (score: number) => void;
}

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

interface Bullet {
  x: number;
  y: number;
  vy: number;
}

interface Enemy {
  x: number;
  y: number;
  r: number;
  vy: number;
  hp: number;
  kind: 'asteroid' | 'drone';
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  kind: 'twin' | 'heal';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function TeenSpaceGame({ bestScore, onScoreSave }: TeenSpaceGameProps) {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(3);
  const [wave, setWave] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const pointerXRef = useRef<number | null>(null);

  const startGame = () => {
    sound.playSuccess();
    setScore(0);
    setHp(3);
    setWave(1);
    setGameState('PLAYING');
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key) && gameState === 'PLAYING') {
        e.preventDefault();
      }
      keysRef.current.add(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 680;
    const H = 440;
    let shipX = W / 2;
    const shipY = H - 48;
    let localScore = 0;
    let localHp = 3;
    let twinTimer = 0;
    let fireCooldown = 0;
    let spawnTimer = 0;

    const stars = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      s: 1 + Math.random() * 2,
      v: 25 + Math.random() * 55,
    }));

    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let powerUps: PowerUp[] = [];
    let particles: Particle[] = [];

    let animId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;

      const currentWave = 1 + Math.floor(localScore / 250);
      setWave(currentWave);

      // Ship steering
      const speed = 360;
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) {
        shipX -= speed * dt;
        pointerXRef.current = null;
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) {
        shipX += speed * dt;
        pointerXRef.current = null;
      }
      if (pointerXRef.current !== null) {
        shipX += (pointerXRef.current - shipX) * Math.min(1, dt * 14);
      }
      shipX = Math.max(28, Math.min(W - 28, shipX));

      // Auto fire
      fireCooldown -= dt;
      if (twinTimer > 0) twinTimer -= dt;
      if (fireCooldown <= 0) {
        fireCooldown = twinTimer > 0 ? 0.14 : 0.19;
        if (twinTimer > 0) {
          bullets.push({ x: shipX - 12, y: shipY - 14, vy: -520 });
          bullets.push({ x: shipX + 12, y: shipY - 14, vy: -520 });
        } else {
          bullets.push({ x: shipX, y: shipY - 18, vy: -520 });
        }
        sound.playLaser();
      }

      // Enemy spawn
      spawnTimer -= dt;
      const spawnInterval = Math.max(0.35, 0.95 - currentWave * 0.08);
      if (spawnTimer <= 0) {
        spawnTimer = spawnInterval;
        const isDrone = Math.random() < Math.min(0.45, 0.15 + currentWave * 0.05);
        enemies.push({
          x: 32 + Math.random() * (W - 64),
          y: -26,
          r: isDrone ? 17 : 18 + Math.random() * 10,
          vy: (isDrone ? 145 : 105) + currentWave * 16,
          hp: isDrone ? 2 : 1,
          kind: isDrone ? 'drone' : 'asteroid',
        });
      }

      // Update entities
      stars.forEach((st) => {
        st.y += st.v * dt;
        if (st.y > H) {
          st.y = 0;
          st.x = Math.random() * W;
        }
      });

      bullets = bullets.filter((b) => {
        b.y += b.vy * dt;
        return b.y > -12;
      });

      powerUps = powerUps.filter((p) => {
        p.y += p.vy * dt;
        if (Math.hypot(p.x - shipX, p.y - shipY) < 28) {
          sound.playMatch();
          if (p.kind === 'twin') twinTimer = 8;
          else {
            localHp = Math.min(4, localHp + 1);
            setHp(localHp);
          }
          return false;
        }
        return p.y < H + 20;
      });

      enemies = enemies.filter((en) => {
        en.y += en.vy * dt;

        // Check bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          if (Math.hypot(b.x - en.x, b.y - en.y) < en.r + 6) {
            bullets.splice(i, 1);
            en.hp -= 1;
            if (en.hp <= 0) {
              sound.playPop(2);
              localScore += en.kind === 'drone' ? 35 : 20;
              setScore(localScore);
              for (let k = 0; k < 8; k++) {
                particles.push({
                  x: en.x,
                  y: en.y,
                  vx: (Math.random() - 0.5) * 180,
                  vy: (Math.random() - 0.5) * 180,
                  life: 0.35,
                  color: en.kind === 'drone' ? '#38BDF8' : '#FB923C',
                });
              }
              if (Math.random() < 0.12) {
                powerUps.push({
                  x: en.x,
                  y: en.y,
                  vy: 110,
                  kind: Math.random() < 0.7 ? 'twin' : 'heal',
                });
              }
              return false;
            }
          }
        }

        // Check player collision
        if (Math.hypot(en.x - shipX, en.y - shipY) < en.r + 18) {
          sound.playHit();
          localHp -= 1;
          setHp(localHp);
          if (localHp <= 0) {
            onScoreSave(localScore);
            setGameState('GAME_OVER');
          }
          return false;
        }

        if (en.y > H + 30) {
          return false;
        }
        return true;
      });

      particles = particles.filter((pt) => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        return pt.life > 0;
      });

      // Render
      ctx.fillStyle = '#070B19';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#94A3B8';
      stars.forEach((st) => {
        ctx.fillRect(st.x, st.y, st.s, st.s);
      });

      // Powerups
      powerUps.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = p.kind === 'twin' ? '#38BDF8' : '#10B981';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.kind === 'twin' ? '2X' : '+', p.x, p.y + 1);
      });

      // Bullets
      ctx.fillStyle = '#FACC15';
      bullets.forEach((b) => {
        ctx.fillRect(b.x - 2, b.y - 8, 4, 14);
      });

      // Enemies
      enemies.forEach((en) => {
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
        if (en.kind === 'drone') {
          ctx.fillStyle = '#E11D48';
          ctx.fill();
          ctx.strokeStyle = '#FDA4AF';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#64748B';
          ctx.fill();
          ctx.strokeStyle = '#CBD5E1';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Particles
      particles.forEach((pt) => {
        ctx.globalAlpha = Math.max(0, pt.life * 2.5);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1;

      // Player ship
      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(18, 16);
      ctx.lineTo(0, 9);
      ctx.lineTo(-18, 16);
      ctx.closePath();
      ctx.fillStyle = twinTimer > 0 ? '#38BDF8' : '#F97316';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      if (localHp > 0) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, onScoreSave]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 680 / rect.width;
    pointerXRef.current = (e.clientX - rect.left) * scaleX;
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
            <span className="text-xs font-medium text-slate-500">To‘lqin</span>
            <p className="font-mono text-2xl font-bold text-blue-600 tabular-nums">{wave}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Mustahkamlik</span>
            <div className="flex items-center gap-1 pt-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Shield
                  key={i}
                  className={`h-5 w-5 ${i < hp ? 'fill-orange-500 text-orange-500' : 'text-slate-200'}`}
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

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#070B19]">
        <canvas
          ref={canvasRef}
          width={680}
          height={440}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          className="block w-full h-auto max-h-[460px] touch-none cursor-crosshair"
        />

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 p-6 text-center text-white">
            <h3 className="font-display text-3xl font-bold">Koinot Qalqoni</h3>
            <p className="mt-2 max-w-md text-sm text-slate-300">
              Sichqoncha, barmoq yoki A/D strelkalari bilan kemani boshqaring. Lazer avtomatik otadi. 2X kuchaytirgichlarni tuting!
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-bold text-white transition hover:bg-blue-700"
            >
              <Play className="h-5 w-5 fill-current" />
              Parvozni boshlash
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center text-white animate-pop-in">
            <h3 className="font-display text-3xl font-bold">Kema shikastlandi</h3>
            <p className="mt-2 text-base text-slate-300">
              Yig‘ilgan ball: <strong className="font-mono text-orange-400 tabular-nums">{score}</strong>
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-bold text-white transition hover:bg-blue-700"
            >
              <RotateCcw className="h-5 w-5" />
              Qayta uchish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
