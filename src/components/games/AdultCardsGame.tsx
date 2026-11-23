import { useEffect, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { sound } from '../../utils/sound';

interface AdultCardsGameProps {
  bestScore: number;
  onScoreSave: (score: number) => void;
}

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';
type Suit = '♠' | '♥' | '♦' | '♣';

interface Card {
  id: string;
  suit: Suit;
  rank: number; // 6..14 (11=J, 12=Q, 13=K, 14=A)
  label: string;
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: { rank: number; label: string }[] = [
  { rank: 9, label: '9' },
  { rank: 10, label: '10' },
  { rank: 11, label: 'J' },
  { rank: 12, label: 'Q' },
  { rank: 13, label: 'K' },
  { rank: 14, label: 'A' },
];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const r of RANKS) {
      deck.push({ id: `${suit}-${r.label}`, suit, rank: r.rank, label: r.label });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function isRed(suit: Suit): boolean {
  return suit === '♥' || suit === '♦';
}

function trickWinner(lead: Card, reply: Card, trump: Suit): 'lead' | 'reply' {
  if (lead.suit === reply.suit) {
    return reply.rank > lead.rank ? 'reply' : 'lead';
  }
  if (reply.suit === trump && lead.suit !== trump) return 'reply';
  return 'lead';
}

export function AdultCardsGame({ bestScore, onScoreSave }: AdultCardsGameProps) {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [trump, setTrump] = useState<Suit>('♠');
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [botHand, setBotHand] = useState<Card[]>([]);
  const [turn, setTurn] = useState<'player' | 'bot'>('player');
  const [playerCard, setPlayerCard] = useState<Card | null>(null);
  const [botCard, setBotCard] = useState<Card | null>(null);
  const [playerTricks, setPlayerTricks] = useState(0);
  const [botTricks, setBotTricks] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [statusNote, setStatusNote] = useState('Sizning yurishingiz');
  const [resolving, setResolving] = useState(false);

  const startRound = () => {
    sound.playSuccess();
    const deck = createDeck();
    const chosenTrump = SUITS[Math.floor(Math.random() * SUITS.length)];
    const pHand = deck.slice(0, 6).sort((a, b) => a.suit.localeCompare(b.suit) || a.rank - b.rank);
    const bHand = deck.slice(6, 12);

    setTrump(chosenTrump);
    setPlayerHand(pHand);
    setBotHand(bHand);
    setTurn('player');
    setPlayerCard(null);
    setBotCard(null);
    setPlayerTricks(0);
    setBotTricks(0);
    setPlayerScore(0);
    setResolving(false);
    setStatusNote(`Kozir masti: ${chosenTrump}. Istalgan kartani tashlang.`);
    setGameState('PLAYING');
  };

  const canPlayCard = (card: Card): boolean => {
    if (turn !== 'player' || resolving || playerCard !== null) return false;
    if (!botCard) return true; // Player leads
    const hasLeadSuit = playerHand.some((c) => c.suit === botCard.suit);
    if (hasLeadSuit) return card.suit === botCard.suit;
    return true;
  };

  const pickBotCard = (hand: Card[], leadCard: Card | null, currentTrump: Suit): Card => {
    if (!leadCard) {
      // Bot leads: prefer non-trump medium/high card
      const nonTrump = hand.filter((c) => c.suit !== currentTrump);
      const pool = nonTrump.length > 0 ? nonTrump : hand;
      return [...pool].sort((a, b) => b.rank - a.rank)[0];
    }
    const matching = hand.filter((c) => c.suit === leadCard.suit);
    if (matching.length > 0) {
      const winners = matching.filter((c) => c.rank > leadCard.rank).sort((a, b) => a.rank - b.rank);
      if (winners.length > 0) return winners[0];
      return [...matching].sort((a, b) => a.rank - b.rank)[0];
    }
    const trumps = hand.filter((c) => c.suit === currentTrump).sort((a, b) => a.rank - b.rank);
    if (trumps.length > 0 && leadCard.suit !== currentTrump) return trumps[0];
    return [...hand].sort((a, b) => a.rank - b.rank)[0];
  };

  // Handle trick resolution once both cards are on the felt
  useEffect(() => {
    if (gameState !== 'PLAYING' || !playerCard || !botCard || resolving) return;
    setResolving(true);

    const playerLed = turn === 'bot'; // turn flipped to bot after player led, or stayed player after bot led
    const lead = playerLed ? playerCard : botCard;
    const reply = playerLed ? botCard : playerCard;
    const winnerRole = trickWinner(lead, reply, trump);
    const playerWon = (playerLed && winnerRole === 'lead') || (!playerLed && winnerRole === 'reply');

    const t = setTimeout(() => {
      if (playerWon) {
        sound.playMatch();
        setPlayerTricks((p) => p + 1);
        setPlayerScore((s) => s + 30);
        setStatusNote('Siz bu qo‘lni yutdingiz! Navbat sizda.');
      } else {
        sound.playSlide();
        setBotTricks((b) => b + 1);
        setStatusNote('Raqib bot qo‘lni oldi.');
      }

      const nextScore = playerWon ? playerScore + 30 : playerScore;
      setPlayerCard(null);
      setBotCard(null);
      setResolving(false);

      if (playerHand.length === 0 && botHand.length === 0) {
        const bonus = playerTricks + (playerWon ? 1 : 0) > botTricks + (playerWon ? 0 : 1) ? 50 : 0;
        const total = nextScore + bonus;
        setPlayerScore(total);
        onScoreSave(total);
        setGameState('GAME_OVER');
      } else {
        setTurn(playerWon ? 'player' : 'bot');
      }
    }, 900);

    return () => clearTimeout(t);
  }, [
    botCard,
    botHand.length,
    botTricks,
    gameState,
    onScoreSave,
    playerCard,
    playerHand.length,
    playerScore,
    playerTricks,
    resolving,
    trump,
    turn,
  ]);

  // Automatic bot turn with realistic 650ms thinking delay
  useEffect(() => {
    if (gameState !== 'PLAYING' || turn !== 'bot' || resolving || botCard !== null) return;
    if (botHand.length === 0) return;

    const t = setTimeout(() => {
      const chosen = pickBotCard(botHand, playerCard, trump);
      sound.playClick();
      setBotHand((prev) => prev.filter((c) => c.id !== chosen.id));
      setBotCard(chosen);
      if (!playerCard) {
        setTurn('player');
        setStatusNote(`Bot ${chosen.label}${chosen.suit} tashladi. Javob bering.`);
      }
    }, 650);

    return () => clearTimeout(t);
  }, [botCard, botHand, gameState, playerCard, resolving, trump, turn]);

  const handlePlayerCard = (card: Card) => {
    if (!canPlayCard(card)) return;
    sound.playClick();
    setPlayerHand((prev) => prev.filter((c) => c.id !== card.id));
    setPlayerCard(card);
    if (!botCard) {
      setTurn('bot');
      setStatusNote('Raqib bot o‘ylamoqda...');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs font-medium text-slate-500">Kozir</span>
            <p className={`font-display text-2xl font-bold ${isRed(trump) ? 'text-red-600' : 'text-slate-900'}`}>
              {trump}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Sizning qo‘llar</span>
            <p className="font-mono text-2xl font-bold text-emerald-700 tabular-nums">{playerTricks}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Bot qo‘llari</span>
            <p className="font-mono text-2xl font-bold text-slate-700 tabular-nums">{botTricks}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Ochko</span>
            <p className="font-mono text-2xl font-bold text-amber-600 tabular-nums">{playerScore}</p>
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-500">Rekord</span>
          <p className="font-mono text-2xl font-bold text-slate-700 tabular-nums">
            {Math.max(bestScore, playerScore)}
          </p>
        </div>
      </div>

      {/* Felt Table with Mahogany Frame */}
      <div className="relative flex min-h-[470px] flex-col justify-between rounded-2xl border-8 border-[#3E2723] bg-[#0F5132] p-5 text-white shadow-inner">
        {gameState === 'TITLE_MENU' && (
          <div className="m-auto flex max-w-md flex-col items-center text-center">
            <h3 className="font-display text-3xl font-bold">Oltin Kozir</h3>
            <p className="mt-2 text-sm text-emerald-100">
              6 ta kartali klassik duel. Yurish qilingan mastdan karta bo‘lsa, shu mastni tashlash shart; bo‘lmasa kozir bilan urishingiz mumkin.
            </p>
            <button
              type="button"
              onClick={startRound}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-slate-950 transition hover:bg-amber-400"
            >
              <Play className="h-5 w-5 fill-current" />
              Partiyani boshlash
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="m-auto flex flex-col items-center text-center animate-pop-in">
            <h3 className="font-display text-3xl font-bold">
              {playerTricks > botTricks
                ? 'Siz g‘alaba qozondingiz!'
                : playerTricks === botTricks
                ? 'Durang natija'
                : 'Bot ustun keldi'}
            </h3>
            <p className="mt-2 text-base text-emerald-100">
              Hisob: <strong className="font-mono tabular-nums">{playerTricks} : {botTricks}</strong> · Ochko:{' '}
              <strong className="font-mono text-amber-300 tabular-nums">{playerScore}</strong>
            </p>
            <button
              type="button"
              onClick={startRound}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-slate-950 transition hover:bg-amber-400"
            >
              <RotateCcw className="h-5 w-5" />
              Yangi partiya
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <>
            {/* Opponent Hand */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-emerald-200">Raqib bot ({botHand.length} karta)</span>
              <div className="flex items-center justify-center gap-2">
                {botHand.map((c) => (
                  <div
                    key={c.id}
                    className="h-16 w-11 sm:h-20 sm:w-14 rounded-lg border border-amber-200/40 bg-emerald-900 shadow-sm flex items-center justify-center"
                  >
                    <div className="h-10 w-7 rounded border border-emerald-700 bg-emerald-950/50" />
                  </div>
                ))}
              </div>
            </div>

            {/* Active Battle Zone */}
            <div className="my-4 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-6 min-h-[116px]">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-emerald-200">Bot</span>
                  {botCard ? (
                    <PlayingCardView card={botCard} />
                  ) : (
                    <div className="h-28 w-20 rounded-xl border-2 border-dashed border-emerald-300/30" />
                  )}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-emerald-200">Siz</span>
                  {playerCard ? (
                    <PlayingCardView card={playerCard} />
                  ) : (
                    <div className="h-28 w-20 rounded-xl border-2 border-dashed border-emerald-300/30" />
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-amber-200">{statusNote}</p>
            </div>

            {/* Player Hand */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {playerHand.map((card) => {
                  const playable = canPlayCard(card);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      disabled={!playable}
                      onClick={() => handlePlayerCard(card)}
                      className={`transition-transform duration-150 ${
                        playable
                          ? 'cursor-pointer hover:-translate-y-2 focus-visible:outline-2 focus-visible:outline-amber-300'
                          : 'cursor-not-allowed opacity-45'
                      }`}
                    >
                      <PlayingCardView card={card} highlighted={playable} />
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PlayingCardView({ card, highlighted = false }: { card: Card; highlighted?: boolean }) {
  const red = isRed(card.suit);
  return (
    <div
      className={`flex h-28 w-20 flex-col justify-between rounded-xl bg-white p-2.5 shadow-md select-none ${
        highlighted ? 'ring-2 ring-amber-400' : 'border border-slate-200'
      }`}
    >
      <div className={`text-left font-display text-base font-bold leading-none ${red ? 'text-red-600' : 'text-slate-900'}`}>
        {card.label}
        <span className="ml-0.5">{card.suit}</span>
      </div>
      <div className={`text-center text-3xl leading-none ${red ? 'text-red-600' : 'text-slate-900'}`}>
        {card.suit}
      </div>
      <div className={`text-right font-display text-base font-bold leading-none ${red ? 'text-red-600' : 'text-slate-900'}`}>
        {card.label}
      </div>
    </div>
  );
}
