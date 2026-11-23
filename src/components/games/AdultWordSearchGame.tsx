import { useMemo, useState } from 'react';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { sound } from '../../utils/sound';

interface AdultWordSearchGameProps {
  bestScore: number;
  onScoreSave: (score: number) => void;
}

interface WordPlacement {
  word: string;
  cells: [number, number][];
  orientation: string;
}

interface ThemeBoard {
  id: string;
  name: string;
  words: string[];
}

const THEMES: ThemeBoard[] = [
  {
    id: 'tabiat',
    name: 'Tabiat',
    words: ['QUYOSH', 'DARYO', 'CHINOR', 'BAHOR', 'BULUT', 'TOG'],
  },
  {
    id: 'shahar',
    name: 'Shaharlar',
    words: ['TOSHKENT', 'BUXORO', 'XIVA', 'TERMIZ', 'QO‘QON', 'NAMANGAN'].map((w) =>
      w.replace('‘', '')
    ),
  },
  {
    id: 'ilm',
    name: 'Tafakkur',
    words: ['KITOB', 'MANTIQ', 'BILIM', 'FAZO', 'QALAM', 'ZAKO'],
  },
];

const SIZE = 9;
const DIRS: { dr: number; dc: number; label: string }[] = [
  { dr: 0, dc: 1, label: 'Gorizontal (chapdan o‘ngga)' },
  { dr: 1, dc: 0, label: 'Vertikal (tepadan pastga)' },
  { dr: 1, dc: 1, label: 'Diagonal' },
];

function buildPuzzle(words: string[]): { grid: string[][]; placements: WordPlacement[] } {
  const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
  const placements: WordPlacement[] = [];

  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 120 && !placed; attempt++) {
      const dir = DIRS[Math.floor(Math.random() * DIRS.length)];
      const maxR = dir.dr === 0 ? SIZE - 1 : SIZE - word.length;
      const maxC = dir.dc === 0 ? SIZE - 1 : SIZE - word.length;
      if (maxR < 0 || maxC < 0) continue;

      const r0 = Math.floor(Math.random() * (maxR + 1));
      const c0 = Math.floor(Math.random() * (maxC + 1));

      let fits = true;
      const cells: [number, number][] = [];
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dir.dr * i;
        const c = c0 + dir.dc * i;
        const existing = grid[r][c];
        if (existing !== '' && existing !== word[i]) {
          fits = false;
          break;
        }
        cells.push([r, c]);
      }

      if (fits) {
        cells.forEach(([r, c], idx) => {
          grid[r][c] = word[idx];
        });
        placements.push({ word, cells, orientation: dir.label });
        placed = true;
      }
    }
  }

  const alphabet = 'ABDEFGHIJKLMNOPQRSTUVXYZ';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid, placements };
}

export function AdultWordSearchGame({ bestScore, onScoreSave }: AdultWordSearchGameProps) {
  const [themeIdx, setThemeIdx] = useState(0);
  const [seed, setSeed] = useState(1);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const [hintTier, setHintTier] = useState(0);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [highlightedCell, setHighlightedCell] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);

  const theme = THEMES[themeIdx];
  const { grid, placements } = useMemo(() => buildPuzzle(theme.words), [theme, seed]);

  const foundCellSet = useMemo(() => {
    const s = new Set<string>();
    placements.forEach((p) => {
      if (foundWords.includes(p.word)) {
        p.cells.forEach(([r, c]) => s.add(`${r},${c}`));
      }
    });
    return s;
  }, [foundWords, placements]);

  const resetBoard = (newThemeIdx = themeIdx) => {
    sound.playSuccess();
    setThemeIdx(newThemeIdx);
    setSeed((s) => s + 1);
    setFoundWords([]);
    setStartCell(null);
    setHintTier(0);
    setHintMessage(null);
    setHighlightedCell(null);
    setScore(0);
  };

  const handleCellClick = (r: number, c: number) => {
    if (!startCell) {
      sound.playClick();
      setStartCell([r, c]);
      return;
    }

    const [sr, sc] = startCell;
    if (sr === r && sc === c) {
      setStartCell(null);
      return;
    }

    // Check if [startCell -> clicked] matches any unfound placement (in either order)
    const match = placements.find((p) => {
      if (foundWords.includes(p.word)) return false;
      const first = p.cells[0];
      const last = p.cells[p.cells.length - 1];
      return (
        (first[0] === sr && first[1] === sc && last[0] === r && last[1] === c) ||
        (last[0] === sr && last[1] === sc && first[0] === r && first[1] === c)
      );
    });

    if (match) {
      sound.playMatch();
      const nextFound = [...foundWords, match.word];
      setFoundWords(nextFound);
      setHintTier(0);
      setHintMessage(null);
      setHighlightedCell(null);
      const nextScore = score + match.word.length * 15;
      setScore(nextScore);
      onScoreSave(nextScore);
      if (nextFound.length === placements.length) {
        sound.playSuccess();
      }
    } else {
      sound.playError();
    }
    setStartCell(null);
  };

  // 4-Tier Hint System (per 4_games_2d_casual.md)
  const handleHint = () => {
    const remaining = placements.find((p) => !foundWords.includes(p.word));
    if (!remaining) return;

    const nextTier = Math.min(4, hintTier + 1);
    setHintTier(nextTier);
    sound.playClick();

    if (nextTier === 1) {
      setHintMessage(`1-yordam: Keyingi so‘z "${remaining.word[0]}" harfi bilan boshlanadi (${remaining.word}).`);
    } else if (nextTier === 2) {
      setHintMessage(`2-yordam: "${remaining.word}" so‘zi yo‘nalishi — ${remaining.orientation}.`);
    } else if (nextTier === 3) {
      const [r, c] = remaining.cells[0];
      setHintMessage(`3-yordam: "${remaining.word}" ${r + 1}-qator, ${c + 1}-ustundan boshlanadi.`);
    } else {
      const [r, c] = remaining.cells[0];
      setHighlightedCell([r, c]);
      setHintMessage(`4-yordam: Bosh harf katagi jadvalda ko‘rsatildi. Boshidan oxirigacha bosing.`);
    }
  };

  const allDone = placements.length > 0 && foundWords.length === placements.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs font-medium text-slate-500">Topilgan so‘zlar</span>
            <p className="font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {foundWords.length} / {placements.length}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Ball</span>
            <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{score}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Rekord</span>
            <p className="font-mono text-2xl font-bold text-slate-700 tabular-nums">
              {Math.max(bestScore, score)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {THEMES.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              onClick={() => resetBoard(idx)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                themeIdx === idx ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5">
        {/* Large Accessible Grid (>=44px cells) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center">
          <div
            className="grid gap-1.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xs select-none"
            style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
          >
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const key = `${r},${c}`;
                const isFound = foundCellSet.has(key);
                const isStart = startCell?.[0] === r && startCell?.[1] === c;
                const isHinted = highlightedCell?.[0] === r && highlightedCell?.[1] === c;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCellClick(r, c)}
                    className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg font-display text-lg sm:text-xl font-bold transition ${
                      isStart
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : isFound
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : isHinted
                        ? 'bg-amber-200 text-amber-950 ring-2 ring-amber-400'
                        : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            So‘zning birinchi harfini bosing, so‘ngra oxirgi harfini bosing.
          </p>
        </div>

        {/* Word List + 4-Tier Hints */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <h4 className="font-display text-lg font-bold text-slate-900">Qidirilayotgan so‘zlar</h4>
            <ul className="mt-3 grid grid-cols-2 lg:grid-cols-1 gap-2">
              {placements.map((p) => {
                const done = foundWords.includes(p.word);
                return (
                  <li
                    key={p.word}
                    className={`rounded-lg border px-3 py-2 text-base font-semibold tracking-wide ${
                      done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 line-through'
                        : 'border-slate-200 bg-slate-50 text-slate-900'
                    }`}
                  >
                    {p.word}
                  </li>
                );
              })}
            </ul>

            {hintMessage && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                {hintMessage}
              </div>
            )}

            {allDone && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
                Barcha so‘zlar topildi! Ajoyib natija.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleHint}
              disabled={allDone}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-45"
            >
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Yordam olish ({hintTier}/4)
            </button>
            <button
              type="button"
              onClick={() => resetBoard(themeIdx)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
              Yangi jadval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
