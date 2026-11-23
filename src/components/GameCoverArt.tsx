import { useState } from 'react';
import { GameEntry } from '../data/games';

interface GameCoverArtProps {
  game: GameEntry;
  className?: string;
}

export function GameCoverArt({ game, className = '' }: GameCoverArtProps) {
  const [imgError, setImgError] = useState(false);

  if (game.coverImage && !imgError) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
        <img
          src={game.coverImage}
          alt={game.title}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <VectorGameCover variant={game.artVariant} title={game.title} />
    </div>
  );
}

function VectorGameCover({ variant, title }: { variant: GameEntry['artVariant']; title: string }) {
  switch (variant) {
    case 'memory':
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" aria-label={title}>
          <rect width="400" height="300" fill="#FEF3C7" />
          <circle cx="340" cy="50" r="70" fill="#FDE68A" />
          <circle cx="50" cy="260" r="80" fill="#FDE68A" />
          <g transform="translate(55,48)">
            <rect width="125" height="92" rx="14" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="4" />
            <circle cx="62" cy="46" r="24" fill="#F59E0B" />
            <circle cx="54" cy="42" r="3.5" fill="#1E293B" />
            <circle cx="70" cy="42" r="3.5" fill="#1E293B" />
            <path d="M54 52 Q62 59 70 52" stroke="#1E293B" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
          <g transform="translate(220,48)">
            <rect width="125" height="92" rx="14" fill="#F97316" />
            <circle cx="62" cy="46" r="20" fill="#FFEDD5" opacity="0.35" />
            <path d="M54 40 L62 32 L70 40 L62 48 Z" fill="#FFFFFF" />
          </g>
          <g transform="translate(55,160)">
            <rect width="125" height="92" rx="14" fill="#10B981" />
            <circle cx="62" cy="46" r="20" fill="#D1FAE5" opacity="0.35" />
            <rect x="52" y="36" width="20" height="20" rx="5" fill="#FFFFFF" />
          </g>
          <g transform="translate(220,160)">
            <rect width="125" height="92" rx="14" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="4" />
            <polygon points="62,22 70,38 88,40 75,52 78,70 62,61 46,70 49,52 36,40 54,38" fill="#F59E0B" />
          </g>
        </svg>
      );

    case 'math':
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" aria-label={title}>
          <rect width="400" height="300" fill="#0F172A" />
          <circle cx="75" cy="52" r="2" fill="#94A3B8" />
          <circle cx="195" cy="36" r="2.5" fill="#E2E8F0" />
          <circle cx="325" cy="70" r="2" fill="#94A3B8" />
          <circle cx="290" cy="140" r="1.5" fill="#CBD5E1" />
          <g transform="translate(60,42)">
            <circle cx="48" cy="48" r="38" fill="#10B981" stroke="#34D399" strokeWidth="4" />
            <text x="48" y="55" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="700" fontFamily="Outfit, sans-serif">
              8 + 7
            </text>
          </g>
          <g transform="translate(225,75)">
            <circle cx="54" cy="54" r="44" fill="#EA580C" stroke="#FDBA74" strokeWidth="4" />
            <text x="54" y="61" textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="700" fontFamily="Outfit, sans-serif">
              9 × 4
            </text>
          </g>
          <path d="M0 248 Q200 205 400 248 L400 300 L0 300 Z" fill="#1E293B" />
          <path d="M10 250 Q200 207 390 250" stroke="#38BDF8" strokeWidth="4" fill="none" />
          <rect x="172" y="220" width="56" height="32" rx="8" fill="#334155" stroke="#64748B" strokeWidth="2" />
          <circle cx="200" cy="236" r="7" fill="#38BDF8" />
        </svg>
      );

    case 'snake':
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" aria-label={title}>
          <rect width="400" height="300" fill="#0B1324" />
          <g stroke="#1E293B" strokeWidth="1">
            <line x1="80" y1="0" x2="80" y2="300" />
            <line x1="160" y1="0" x2="160" y2="300" />
            <line x1="240" y1="0" x2="240" y2="300" />
            <line x1="320" y1="0" x2="320" y2="300" />
            <line x1="0" y1="75" x2="400" y2="75" />
            <line x1="0" y1="150" x2="400" y2="150" />
            <line x1="0" y1="225" x2="400" y2="225" />
          </g>
          <path
            d="M72 210 L185 210 L185 118 L272 118"
            fill="none"
            stroke="#10B981"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="278" cy="118" r="16" fill="#34D399" />
          <circle cx="283" cy="112" r="3" fill="#0F172A" />
          <circle cx="283" cy="124" r="3" fill="#0F172A" />
          <circle cx="322" cy="186" r="15" fill="#F59E0B" />
          <circle cx="317" cy="181" r="4" fill="#FEF3C7" />
        </svg>
      );

    case 'reflex':
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" aria-label={title}>
          <rect width="400" height="300" fill="#111827" />
          <circle cx="200" cy="150" r="110" fill="none" stroke="#1F2937" strokeWidth="2" />
          <circle cx="200" cy="150" r="70" fill="none" stroke="#374151" strokeWidth="2" />
          <circle cx="130" cy="105" r="34" fill="#10B981" />
          <circle cx="130" cy="105" r="15" fill="#FFFFFF" />
          <circle cx="275" cy="185" r="28" fill="#EF4444" />
          <path d="M265 175 L285 195 M285 175 L265 195" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          <circle cx="255" cy="88" r="22" fill="#F59E0B" />
        </svg>
      );

    case 'wordsearch':
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" aria-label={title}>
          <rect width="400" height="300" fill="#F8FAFC" />
          <rect x="44" y="34" width="312" height="232" rx="14" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          <rect x="66" y="122" width="212" height="44" rx="10" fill="#DBEAFE" />
          <g fill="#0F172A" fontSize="22" fontWeight="700" fontFamily="Outfit, sans-serif" textAnchor="middle">
            <text x="92" y="88">Q</text><text x="144" y="88">U</text><text x="196" y="88">Y</text><text x="248" y="88">O</text><text x="300" y="88">S</text>
            <text x="92" y="152" fill="#1D4ED8">K</text><text x="144" y="152" fill="#1D4ED8">I</text><text x="196" y="152" fill="#1D4ED8">T</text><text x="248" y="152" fill="#1D4ED8">O</text><text x="300" y="152">B</text>
            <text x="92" y="216">M</text><text x="144" y="216">A</text><text x="196" y="216">N</text><text x="248" y="216">T</text><text x="300" y="216">I</text>
          </g>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 400 300" className="h-full w-full" aria-label={title}>
          <rect width="400" height="300" fill="#E2E8F0" />
          <circle cx="200" cy="150" r="64" fill="#94A3B8" />
        </svg>
      );
  }
}
