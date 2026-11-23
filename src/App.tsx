import { useMemo, useState } from 'react';
import { Heart, Play, Search, Shuffle, Trophy, Volume2, VolumeX } from 'lucide-react';
import { AGE_GROUPS, AgeGroupId, GameEntry, GAMES, getAgeGroupMeta } from './data/games';
import { GameCoverArt } from './components/GameCoverArt';
import { GameStage } from './components/GameStage';
import { sound } from './utils/sound';
import {
  incrementPlayCount,
  loadPlayerStats,
  PlayerStats,
  recordHighScore,
  toggleFavoriteGame,
} from './utils/storage';

type NavView = 'catalog' | 'favorites' | 'records';

export default function App() {
  const [stats, setStats] = useState<PlayerStats>(() => loadPlayerStats());
  const [selectedAge, setSelectedAge] = useState<'all' | AgeGroupId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [navView, setNavView] = useState<NavView>('catalog');
  const [activeGame, setActiveGame] = useState<GameEntry | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());

  const handleToggleMute = () => {
    const next = !isMuted;
    sound.setMuted(next);
    setIsMuted(next);
  };

  const launchGame = (game: GameEntry) => {
    sound.playClick();
    const updated = incrementPlayCount(game.id);
    setStats(updated);
    setActiveGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRandomGame = () => {
    const pool =
      selectedAge === 'all' ? GAMES : GAMES.filter((g) => g.ageGroup === selectedAge);
    const list = pool.length > 0 ? pool : GAMES;
    const chosen = list[Math.floor(Math.random() * list.length)];
    launchGame(chosen);
  };

  const handleToggleFavorite = (gameId: string) => {
    sound.playClick();
    setStats(toggleFavoriteGame(gameId));
  };

  const handleScoreSave = (gameId: string, score: number) => {
    setStats(recordHighScore(gameId, score));
  };

  const filteredGames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return GAMES.filter((g) => {
      if (navView === 'favorites' && !stats.favorites.includes(g.id)) return false;
      if (selectedAge !== 'all' && g.ageGroup !== selectedAge) return false;
      if (
        q &&
        !g.title.toLowerCase().includes(q) &&
        !g.genre.toLowerCase().includes(q) &&
        !g.description.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [navView, searchQuery, selectedAge, stats.favorites]);

  const spotlightGame = useMemo(() => {
    if (selectedAge !== 'all') {
      return GAMES.find((g) => g.ageGroup === selectedAge && g.featured) ?? GAMES[0];
    }
    return GAMES.find((g) => g.id === 'koinot-qalqoni') ?? GAMES[0];
  }, [selectedAge]);

  const totalPlays = Object.values(stats.playCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7FB] text-slate-900">
      {/* Top Bar: Strict 3-Zone Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-4 sm:px-8 py-3.5">
          {/* Zone 1: Single text wordmark */}
          <button
            type="button"
            onClick={() => {
              setActiveGame(null);
              setNavView('catalog');
              setSelectedAge('all');
            }}
            className="font-display text-xl font-extrabold tracking-tight text-slate-950 whitespace-nowrap shrink-0 cursor-pointer"
          >
            ZiyoPlay
          </button>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => {
                setActiveGame(null);
                setNavView('catalog');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                navView === 'catalog' && !activeGame
                  ? 'text-slate-950 underline decoration-orange-600 decoration-2 underline-offset-8'
                  : 'hover:text-slate-950'
              }`}
            >
              Katalog
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveGame(null);
                setNavView('catalog');
                document.getElementById('age-brackets')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-950 cursor-pointer"
            >
              Yosh toifalari
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveGame(null);
                setNavView('favorites');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                navView === 'favorites' && !activeGame
                  ? 'text-slate-950 underline decoration-orange-600 decoration-2 underline-offset-8'
                  : 'hover:text-slate-950'
              }`}
            >
              Sevimlilar
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveGame(null);
                setNavView('records');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                navView === 'records' && !activeGame
                  ? 'text-slate-950 underline decoration-orange-600 decoration-2 underline-offset-8'
                  : 'hover:text-slate-950'
              }`}
            >
              Rekordlar
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleRandomGame}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-orange-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shuffle className="h-4 w-4" />
              Tasodifiy o‘yin
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1">
        {activeGame ? (
          <GameStage
            game={activeGame}
            bestScore={stats.highScores[activeGame.id] ?? 0}
            isFavorite={stats.favorites.includes(activeGame.id)}
            isMuted={isMuted}
            onBack={() => setActiveGame(null)}
            onToggleFavorite={handleToggleFavorite}
            onToggleMute={handleToggleMute}
            onScoreSave={handleScoreSave}
            onSelectGame={launchGame}
          />
        ) : (
          <div className="mx-auto max-w-[1280px] px-4 sm:px-8 py-8 space-y-10">
            {/* Mobile quick nav */}
            <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setNavView('catalog')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                  navView === 'catalog' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Katalog
              </button>
              <button
                type="button"
                onClick={() => setNavView('favorites')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                  navView === 'favorites' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Sevimlilar
              </button>
              <button
                type="button"
                onClick={() => setNavView('records')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                  navView === 'records' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Rekordlar
              </button>
            </div>

            {navView === 'catalog' && (
              <>
                {/* Hero Spotlight Split */}
                <section className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                  <div className="lg:col-span-6 flex flex-col justify-between gap-6">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-orange-600">
                        {getAgeGroupMeta(spotlightGame.ageGroup).label} · {spotlightGame.genre}
                      </p>
                      <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 text-balance">
                        Har bir yosh toifasi uchun maxsus tanlangan o‘yinlar
                      </h1>
                      <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
                        3–6 yoshli bolajonlardan tortib 20+ kattalargacha: har bir guruhning qiziqishi va fikrlash darajasiga mos alohida o‘yinlar bir joyda.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => launchGame(spotlightGame)}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-700 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        {spotlightGame.title}ni o‘ynash
                      </button>
                      <span className="text-xs font-medium text-slate-500">
                        Brauzerda darhol ochiladi · Ro‘yxatdan o‘tish shart emas
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-6">
                    <button
                      type="button"
                      onClick={() => launchGame(spotlightGame)}
                      className="group relative block h-full w-full min-h-[240px] overflow-hidden rounded-xl border border-slate-200 text-left cursor-pointer"
                    >
                      <GameCoverArt game={spotlightGame} className="h-full w-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white">
                        <div>
                          <p className="text-xs text-slate-200">
                            {getAgeGroupMeta(spotlightGame.ageGroup).label} · Tavsiya etilgan
                          </p>
                          <p className="font-display text-xl font-bold">{spotlightGame.title}</p>
                        </div>
                        <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-950 whitespace-nowrap shrink-0">
                          O‘ynash
                        </span>
                      </div>
                    </button>
                  </div>
                </section>

                {/* Interactive Age Group Filter Bar + Search Toolbar */}
                <section id="age-brackets" className="space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div
                      role="tablist"
                      aria-label="Yosh toifalari"
                      className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedAge('all')}
                        className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                          selectedAge === 'all'
                            ? 'bg-orange-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                        }`}
                      >
                        Barcha yoshlar
                      </button>
                      {AGE_GROUPS.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => setSelectedAge(group.id)}
                          className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                            selectedAge === group.id
                              ? 'bg-orange-600 text-white'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          {group.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="O‘yin qidirish..."
                          aria-label="O‘yin qidirish"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleMute}
                        aria-label={isMuted ? 'Ovozni yoqish' : 'Ovozni o‘chirish'}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 shrink-0 cursor-pointer"
                      >
                        {isMuted ? <VolumeX className="h-4 w-4 text-slate-400" /> : <Volume2 className="h-4 w-4 text-emerald-600" />}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Grouped Age Showcase */}
                {filteredGames.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                    <p className="font-display text-lg font-bold text-slate-900">
                      So‘rovingiz bo‘yicha o‘yin topilmadi
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Boshqa kalit so‘zni kiriting yoki barcha yosh toifalarini tanlang.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedAge('all');
                      }}
                      className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Filterni tozalash
                    </button>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {AGE_GROUPS.filter(
                      (grp) => selectedAge === 'all' || grp.id === selectedAge
                    ).map((group) => {
                      const groupGames = filteredGames.filter((g) => g.ageGroup === group.id);
                      if (groupGames.length === 0) return null;

                      return (
                        <section key={group.id} className="space-y-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
                            <div>
                              <h2 className="font-display text-2xl font-bold text-slate-950">
                                {group.label} — {group.audienceTitle}
                              </h2>
                              <p className="mt-0.5 text-sm text-slate-600">{group.focusSummary}</p>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 tabular-nums">
                              {groupGames.length} ta o‘yin
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groupGames.map((game) => (
                              <GameCatalogCard
                                key={game.id}
                                game={game}
                                bestScore={stats.highScores[game.id] ?? 0}
                                isFavorite={stats.favorites.includes(game.id)}
                                onPlay={() => launchGame(game)}
                                onToggleFavorite={() => handleToggleFavorite(game.id)}
                              />
                            ))}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {navView === 'favorites' && (
              <section className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h1 className="font-display text-3xl font-bold text-slate-950">Sevimli o‘yinlar</h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Siz saqlab qo‘ygan o‘yinlar shu yerda jamlanadi.
                  </p>
                </div>
                {filteredGames.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                    <p className="font-display text-lg font-bold text-slate-900">
                      Hozircha sevimli o‘yinlar yo‘q
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Katalogdagi istalgan o‘yin kartasidagi yurakcha tugmasini bosing.
                    </p>
                    <button
                      type="button"
                      onClick={() => setNavView('catalog')}
                      className="mt-4 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Katalogga o‘tish
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredGames.map((game) => (
                      <GameCatalogCard
                        key={game.id}
                        game={game}
                        bestScore={stats.highScores[game.id] ?? 0}
                        isFavorite={true}
                        onPlay={() => launchGame(game)}
                        onToggleFavorite={() => handleToggleFavorite(game.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {navView === 'records' && (
              <section className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="font-display text-3xl font-bold text-slate-950">Shaxsiy rekordlar</h1>
                    <p className="mt-1 text-sm text-slate-600">
                      Barcha yosh toifalari bo‘yicha to‘plangan natijalar brauzerda saqlanadi.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Jami o‘yin seanslari: <span className="font-mono tabular-nums">{totalPlays}</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="px-5 py-3.5">O‘yin nomi</th>
                        <th className="px-5 py-3.5">Yosh toifasi</th>
                        <th className="px-5 py-3.5">O‘ynalgan</th>
                        <th className="px-5 py-3.5">Eng yuqori natija</th>
                        <th className="px-5 py-3.5 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {GAMES.map((game) => {
                        const score = stats.highScores[game.id] ?? 0;
                        const plays = stats.playCounts[game.id] ?? 0;
                        return (
                          <tr key={game.id} className="hover:bg-slate-50/70">
                            <td className="px-5 py-3.5 font-semibold text-slate-900">{game.title}</td>
                            <td className="px-5 py-3.5 text-slate-600">
                              {getAgeGroupMeta(game.ageGroup).label}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-600 tabular-nums">{plays}</td>
                            <td className="px-5 py-3.5 font-mono font-bold text-slate-900 tabular-nums">
                              {score > 0 ? `${score} ${game.scoreUnit}` : '—'}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => launchGame(game)}
                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 cursor-pointer"
                              >
                                O‘ynash
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 sm:px-8 py-6 text-xs text-slate-500">
          <span>ZiyoPlay · 3–6, 7–10, 11–15, 16–20 va 20+ yosh toifalari uchun o‘yin portali</span>
          <div className="flex items-center gap-4">
            {AGE_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setActiveGame(null);
                  setNavView('catalog');
                  setSelectedAge(g.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-slate-900 transition-colors cursor-pointer"
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

interface GameCatalogCardProps {
  game: GameEntry;
  bestScore: number;
  isFavorite: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
}

function GameCatalogCard({
  game,
  bestScore,
  isFavorite,
  onPlay,
  onToggleFavorite,
}: GameCatalogCardProps) {
  const ageMeta = getAgeGroupMeta(game.ageGroup);

  return (
    <article className="group flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300">
      <button
        type="button"
        onClick={onPlay}
        className="relative sm:w-56 shrink-0 aspect-[4/3] sm:aspect-auto overflow-hidden cursor-pointer"
      >
        <GameCoverArt game={game} className="h-full w-full" />
      </button>

      <div className="flex flex-1 flex-col justify-between p-5 gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {ageMeta.label} <span aria-hidden="true">·</span> {game.genre}
            {bestScore > 0 && (
              <>
                {' '}
                <span aria-hidden="true">·</span>{' '}
                <span className="font-mono text-slate-700 tabular-nums">
                  Rekord: {bestScore}
                </span>
              </>
            )}
          </p>
          <h3 className="mt-1 font-display text-xl font-bold text-slate-950">{game.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{game.description}</p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onPlay}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-orange-600 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            O‘ynash
          </button>

          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-rose-600 cursor-pointer"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
}
