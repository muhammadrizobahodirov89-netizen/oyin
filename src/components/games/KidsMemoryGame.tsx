import { useEffect, useState } from 'react';
import { Play, RotateCcw, Trophy } from 'lucide-react';
import { sound } from '../../utils/sound';

interface KidsMemoryGameProps {
  bestScore: number;
  onScoreSave: (score: number) => void;
}

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

interface AnimalSpec {
  id: string;
  name: string;
  bg: string;
}

const ANIMALS: AnimalSpec[] = [
  { id: 'lion', name: 'Sher', bg: '#FEF3C7' },
  { id: 'cat', name: 'Mushuk', bg: '#FCE7F3' },
  { id: 'frog', name: 'Qurbaqa', bg: '#D1FAE5' },
  { id: 'owl', name: 'Boyo‘g‘li', bg: '#E0E7FF' },
  { id: 'fox', name: 'Tulki', bg: '#FFEDD5' },
  { id: 'bear', name: 'Ayiq', bg: '#F3E8FF' },
];

interface CardItem {
  uid: number;
  animal: AnimalSpec;
  flipped: boolean;
  matched: boolean;
}

export function KidsMemoryGame({ bestScore, onScoreSave }: KidsMemoryGameProps) {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [pairCount, setPairCount] = useState<4 | 6>(4);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);

  const startLevel = (pairs: 4 | 6 = pairCount) => {
    sound.playSuccess();
    const chosen = ANIMALS.slice(0, pairs);
    const deck = [...chosen, ...chosen]
      .sort(() => Math.random() - 0.5)
      .map((animal, idx) => ({
        uid: idx,
        animal,
        flipped: false,
        matched: false,
      }));
    setPairCount(pairs);
    setCards(deck);
    setSelected([]);
    setMoves(0);
    setScore(0);
    setLocked(false);
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING' || cards.length === 0) return;
    if (cards.every((c) => c.matched)) {
      const finalScore = Math.max(100, pairCount * 100 - moves * 10);
      setScore(finalScore);
      onScoreSave(finalScore);
      const t = setTimeout(() => {
        sound.playSuccess();
        setGameState('GAME_OVER');
      }, 450);
      return () => clearTimeout(t);
    }
  }, [cards, gameState, moves, pairCount, onScoreSave]);

  const handleFlip = (index: number) => {
    if (locked || gameState !== 'PLAYING') return;
    const card = cards[index];
    if (card.flipped || card.matched) return;

    sound.playPop(index);
    const updated = cards.map((c, idx) => (idx === index ? { ...c, flipped: true } : c));
    setCards(updated);

    const nextSelected = [...selected, index];
    setSelected(nextSelected);

    if (nextSelected.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [firstIdx, secondIdx] = nextSelected;
      if (updated[firstIdx].animal.id === updated[secondIdx].animal.id) {
        setTimeout(() => {
          sound.playMatch();
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx ? { ...c, matched: true } : c
            )
          );
          setSelected([]);
          setLocked(false);
        }, 320);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx ? { ...c, flipped: false } : c
            )
          );
          setSelected([]);
          setLocked(false);
        }, 750);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs font-medium text-slate-500">Urinishlar</span>
            <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{moves}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Topilgan juftlik</span>
            <p className="font-mono text-2xl font-bold text-emerald-600 tabular-nums">
              {cards.filter((c) => c.matched).length / 2} / {pairCount}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Rekord</span>
            <p className="font-mono text-2xl font-bold text-slate-700 tabular-nums">{bestScore}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => startLevel(4)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              pairCount === 4 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Oson (8 karta)
          </button>
          <button
            type="button"
            onClick={() => startLevel(6)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              pairCount === 6 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            O‘rta (12 karta)
          </button>
        </div>
      </div>

      <div className="relative min-h-[430px] rounded-2xl border border-amber-200 bg-amber-50/70 p-5 flex items-center justify-center">
        {gameState === 'TITLE_MENU' && (
          <div className="flex flex-col items-center text-center max-w-md">
            <h3 className="font-display text-3xl font-bold text-slate-900">Hayvonlar Xotirasi</h3>
            <p className="mt-2 text-base text-slate-600">
              Katta kartochkalarni oching va bir xil hayvonchalarni juftlang. Xotirani rivojlantirish uchun ajoyib o‘yin!
            </p>
            <button
              type="button"
              onClick={() => startLevel(pairCount)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-amber-600"
            >
              <Play className="h-5 w-5 fill-current" />
              O‘ynash
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div
            className={`grid w-full max-w-2xl gap-4 ${
              pairCount === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4'
            }`}
          >
            {cards.map((card, idx) => {
              const revealed = card.flipped || card.matched;
              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleFlip(idx)}
                  aria-label={revealed ? card.animal.name : 'Yopiq karta'}
                  className={`group relative flex aspect-[4/4.2] min-h-[96px] flex-col items-center justify-center rounded-2xl border-2 p-3 transition-transform duration-150 ${
                    card.matched
                      ? 'border-emerald-400 bg-white scale-[0.98]'
                      : revealed
                      ? 'border-amber-400 bg-white shadow-sm'
                      : 'border-amber-300 bg-amber-400 hover:-translate-y-0.5 hover:bg-amber-500'
                  }`}
                >
                  {revealed ? (
                    <div className="flex flex-col items-center gap-1.5 animate-pop-in">
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-xl"
                        style={{ backgroundColor: card.animal.bg }}
                      >
                        <AnimalIllustration id={card.animal.id} />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{card.animal.name}</span>
                    </div>
                  ) : (
                    <span className="font-display text-3xl font-extrabold text-white">?</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="flex flex-col items-center text-center animate-pop-in">
            <Trophy className="h-14 w-14 text-amber-500" />
            <h3 className="mt-3 font-display text-3xl font-bold text-slate-900">Ajoyib xotira!</h3>
            <p className="mt-1 text-base text-slate-600">
              {moves} ta urinishda barcha juftlik topildi · Ball: <strong className="font-mono tabular-nums">{score}</strong>
            </p>
            <button
              type="button"
              onClick={() => startLevel(pairCount)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-amber-600"
            >
              <RotateCcw className="h-5 w-5" />
              Qayta o‘ynash
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AnimalIllustration({ id }: { id: string }) {
  switch (id) {
    case 'lion':
      return (
        <svg viewBox="0 0 64 64" className="h-12 w-12">
          <circle cx="32" cy="32" r="24" fill="#D97706" />
          <circle cx="32" cy="34" r="16" fill="#FBBF24" />
          <circle cx="26" cy="31" r="2.5" fill="#1E293B" />
          <circle cx="38" cy="31" r="2.5" fill="#1E293B" />
          <polygon points="32,36 28,40 36,40" fill="#78350F" />
        </svg>
      );
    case 'cat':
      return (
        <svg viewBox="0 0 64 64" className="h-12 w-12">
          <polygon points="16,28 20,10 30,22" fill="#F472B6" />
          <polygon points="48,28 44,10 34,22" fill="#F472B6" />
          <circle cx="32" cy="36" r="18" fill="#F9A8D4" />
          <circle cx="26" cy="33" r="2.5" fill="#1E293B" />
          <circle cx="38" cy="33" r="2.5" fill="#1E293B" />
          <path d="M28 41 Q32 45 36 41" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'frog':
      return (
        <svg viewBox="0 0 64 64" className="h-12 w-12">
          <circle cx="21" cy="22" r="8" fill="#10B981" />
          <circle cx="43" cy="22" r="8" fill="#10B981" />
          <ellipse cx="32" cy="38" rx="20" ry="15" fill="#34D399" />
          <circle cx="21" cy="22" r="3.5" fill="#FFFFFF" />
          <circle cx="43" cy="22" r="3.5" fill="#FFFFFF" />
          <circle cx="21" cy="22" r="1.8" fill="#0F172A" />
          <circle cx="43" cy="22" r="1.8" fill="#0F172A" />
          <path d="M23 41 Q32 47 41 41" stroke="#065F46" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'owl':
      return (
        <svg viewBox="0 0 64 64" className="h-12 w-12">
          <ellipse cx="32" cy="35" rx="18" ry="20" fill="#6366F1" />
          <circle cx="24" cy="29" r="7" fill="#FFFFFF" />
          <circle cx="40" cy="29" r="7" fill="#FFFFFF" />
          <circle cx="24" cy="29" r="3" fill="#0F172A" />
          <circle cx="40" cy="29" r="3" fill="#0F172A" />
          <polygon points="32,33 28,39 36,39" fill="#F59E0B" />
        </svg>
      );
    case 'fox':
      return (
        <svg viewBox="0 0 64 64" className="h-12 w-12">
          <polygon points="14,14 28,24 16,34" fill="#EA580C" />
          <polygon points="50,14 36,24 48,34" fill="#EA580C" />
          <polygon points="14,32 50,32 32,52" fill="#F97316" />
          <circle cx="25" cy="33" r="2.5" fill="#0F172A" />
          <circle cx="39" cy="33" r="2.5" fill="#0F172A" />
          <circle cx="32" cy="48" r="3.5" fill="#0F172A" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" className="h-12 w-12">
          <circle cx="18" cy="20" r="8" fill="#9333EA" />
          <circle cx="46" cy="20" r="8" fill="#9333EA" />
          <circle cx="32" cy="36" r="18" fill="#A855F7" />
          <circle cx="26" cy="33" r="2.5" fill="#FFFFFF" />
          <circle cx="38" cy="33" r="2.5" fill="#FFFFFF" />
          <ellipse cx="32" cy="41" rx="6" ry="4" fill="#E9D5FF" />
        </svg>
      );
  }
}
