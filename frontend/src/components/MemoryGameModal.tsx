import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Trophy, Gamepad2, Timer, Zap } from 'lucide-react';

interface MemoryGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SYMBOLS_6X6 = [
  '🚀', '💻', '⚡', '🎮', '🧠', '🎨',
  '🔥', '💎', '🎯', '🌟', '🦄', '🪐',
  '🔮', '🎧', '🏆', '🍕', '🐱', '🌈',
];

interface Card {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

export const MemoryGameModal: React.FC<MemoryGameModalProps> = ({ isOpen, onClose }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isWon, setIsWon] = useState(false);

  const initGame = () => {
    const deck = [...SYMBOLS_6X6, ...SYMBOLS_6X6].sort(() => Math.random() - 0.5);
    const newCards: Card[] = deck.map((symbol, index) => ({
      id: index,
      symbol,
      flipped: false,
      matched: false,
    }));
    setCards(newCards);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setSeconds(0);
    setIsTimerRunning(false);
    setIsLocked(false);
    setIsWon(false);
  };

  useEffect(() => {
    if (isOpen) {
      initGame();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isTimerRunning || isWon) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isTimerRunning, isWon]);

  const handleCardClick = (index: number) => {
    if (isLocked) return;
    const card = cards[index];
    if (card.flipped || card.matched || flippedIndices.includes(index)) return;

    // Start timer on first card interaction
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const card1 = newCards[firstIdx];
      const card2 = newCards[secondIdx];

      if (card1.symbol === card2.symbol) {
        // Match found
        card1.matched = true;
        card2.matched = true;
        setCards(newCards);
        setFlippedIndices([]);
        const newMatches = matches + 1;
        setMatches(newMatches);

        if (newMatches === 18) {
          setIsWon(true);
        }
      } else {
        // No match
        setIsLocked(true);
        setTimeout(() => {
          newCards[firstIdx].flipped = false;
          newCards[secondIdx].flipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 650);
      }
    }
  };

  if (!isOpen) return null;

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">6x6 Memory Game</h3>
              <p className="text-xs text-slate-400">Match all 18 pairs to win!</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={initGame}
              title="Restart Game"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 my-3 p-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-center text-xs font-mono">
          <div className="flex items-center justify-center gap-1 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Moves: <strong className="text-white">{moves}</strong></span>
          </div>
          <div className="flex items-center justify-center gap-1 text-slate-300">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pairs: <strong className="text-emerald-400">{matches} / 18</strong></span>
          </div>
          <div className="flex items-center justify-center gap-1 text-slate-300">
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span>Time: <strong className="text-amber-400">{mins}:{secs}</strong></span>
          </div>
        </div>

        {/* 6x6 Grid */}
        <div className="grid grid-cols-6 gap-2 flex-1 min-h-0 overflow-y-auto p-1 max-w-[420px] mx-auto w-full">
          {cards.map((card, idx) => {
            const isFlipped = card.flipped || card.matched;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(idx)}
                className={`aspect-square rounded-xl border flex items-center justify-center text-xl transition-all duration-300 select-none cursor-pointer transform ${
                  card.matched
                    ? 'bg-emerald-950/80 border-emerald-500 shadow-md shadow-emerald-500/20 text-white scale-95'
                    : isFlipped
                    ? 'bg-indigo-900 border-indigo-400 text-white rotate-y-180'
                    : 'bg-slate-800/90 border-slate-700 hover:border-indigo-500 hover:bg-slate-750 text-indigo-400 active:scale-95'
                }`}
              >
                {isFlipped ? card.symbol : '✦'}
              </button>
            );
          })}
        </div>

        {/* Victory Screen */}
        {isWon && (
          <div className="mt-3 p-3 bg-emerald-900/90 border border-emerald-400 rounded-2xl text-center animate-bounce">
            <p className="text-sm font-extrabold text-white">🎉 Victory! All 18 pairs matched in {moves} moves ({mins}:{secs})!</p>
          </div>
        )}
      </div>
    </div>
  );
};
