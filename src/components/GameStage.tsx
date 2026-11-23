import { ArrowLeft, Heart, Volume2, VolumeX } from 'lucide-react';
import { GameEntry, GAMES, getAgeGroupMeta } from '../data/games';
import { KidsBalloonGame } from './games/KidsBalloonGame';
import { KidsMemoryGame } from './games/KidsMemoryGame';
import { SchoolMazeGame } from './games/SchoolMazeGame';
import { SchoolMathGame } from './games/SchoolMathGame';
import { TeenSpaceGame } from './games/TeenSpaceGame';
import { TeenSnakeGame } from './games/TeenSnakeGame';
import { Youth2048Game } from './games/Youth2048Game';
import { YouthReflexGame } from './games/YouthReflexGame';
import { AdultCardsGame } from './games/AdultCardsGame';
import { AdultWordSearchGame } from './games/AdultWordSearchGame';

interface GameStageProps {
  game: GameEntry;
  bestScore: number;
  isFavorite: boolean;
  isMuted: boolean;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleMute: () => void;
  onScoreSave: (gameId: string, score: number) => void;
  onSelectGame: (game: GameEntry) => void;
}

export function GameStage({
  game,
  bestScore,
  isFavorite,
  isMuted,
  onBack,
  onToggleFavorite,
  onToggleMute,
  onScoreSave,
  onSelectGame,
}: GameStageProps) {
  const ageMeta = getAgeGroupMeta(game.ageGroup);
  const peerGames = GAMES.filter((g) => g.ageGroup === game.ageGroup && g.id !== game.id);

  const renderGame = () => {
    const save = (score: number) => onScoreSave(game.id, score);
    switch (game.id) {
      case 'rangli-sharlar':
        return <KidsBalloonGame bestScore={bestScore} onScoreSave={save} />;
      case 'hayvonlar-xotirasi':
        return <KidsMemoryGame bestScore={bestScore} onScoreSave={save} />;
      case 'xazina-labirinti':
        return <SchoolMazeGame bestScore={bestScore} onScoreSave={save} />;
      case 'tezkor-hisob':
        return <SchoolMathGame bestScore={bestScore} onScoreSave={save} />;
      case 'koinot-qalqoni':
        return <TeenSpaceGame bestScore={bestScore} onScoreSave={save} />;
      case 'neon-iloncha':
        return <TeenSnakeGame bestScore={bestScore} onScoreSave={save} />;
      case 'taktik-2048':
        return <Youth2048Game bestScore={bestScore} onScoreSave={save} />;
      case 'reaksiya-ritm':
        return <YouthReflexGame bestScore={bestScore} onScoreSave={save} />;
      case 'oltin-kozir':
        return <AdultCardsGame bestScore={bestScore} onScoreSave={save} />;
      case 'soz-qidiruvi':
        return <AdultWordSearchGame bestScore={bestScore} onScoreSave={save} />;
      default:
        return null;
    }
  };

  return (
    <section className="mx-auto max-w-[1160px] px-4 sm:px-8 py-6">
      {/* Stage Top Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Katalogga qaytish
          </button>

          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{game.title}</h1>
            <p className="text-xs text-slate-500">
              {ageMeta.label} <span aria-hidden="true">·</span> {game.genre}{' '}
              <span aria-hidden="true">·</span> {game.controlsHint}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(game.id)}
            aria-label={isFavorite ? 'Sevimlilardan olish' : 'Sevimlilarga qo‘shish'}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
              isFavorite
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
            {isFavorite ? 'Saqlangan' : 'Sevimli'}
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Ovozni yoqish' : 'Ovozni o‘chirish'}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-slate-500" /> : <Volume2 className="h-4 w-4 text-emerald-600" />}
            {isMuted ? 'Ovoz o‘chiq' : 'Ovoz yoqiq'}
          </button>
        </div>
      </div>

      {/* Active Game Frame */}
      <div key={game.id}>{renderGame()}</div>

      {/* Peer Games in Same Age Group */}
      {peerGames.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              {ageMeta.label} toifasidagi boshqa o‘yin
            </h2>
            <p className="text-xs text-slate-500">{ageMeta.focusSummary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {peerGames.map((peer) => (
              <button
                key={peer.id}
                type="button"
                onClick={() => onSelectGame(peer)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-orange-400 hover:text-orange-600 whitespace-nowrap shrink-0"
              >
                {peer.title}ni ochish
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
