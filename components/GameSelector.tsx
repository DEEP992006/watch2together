'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Users, ArrowLeftRight, Sparkles } from 'lucide-react';

export type GameMode = 'truthDare' | 'whoMoreLikely' | 'wouldYouRather';

interface GameOption {
  id: GameMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface GameSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (gameMode: GameMode) => void;
}

export default function GameSelector({ isOpen, onClose, onSelectGame }: GameSelectorProps) {
  const games: GameOption[] = [
    {
      id: 'truthDare',
      name: 'Truth or Dare',
      description: 'Classic game of honesty and daring challenges',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'from-rose-400 to-pink-600',
    },
    {
      id: 'whoMoreLikely',
      name: "Who's More Likely To",
      description: 'Vote on who would do something in a scenario',
      icon: <Users className="w-8 h-8" />,
      color: 'from-purple-400 to-indigo-600',
    },
    {
      id: 'wouldYouRather',
      name: 'Would You Rather',
      description: 'Choose between two challenging options',
      icon: <ArrowLeftRight className="w-8 h-8" />,
      color: 'from-blue-400 to-cyan-600',
    },
  ];

  const handleSelectGame = (gameMode: GameMode) => {
    onSelectGame(gameMode);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Heart className="w-7 h-7 text-rose-500" fill="currentColor" />
                  Choose a Game
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Pick a game to play together
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {games.map((game) => (
                <motion.button
                  key={game.id}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectGame(game.id)}
                  className="relative group"
                >
                  <div className={`bg-gradient-to-br ${game.color} p-6 rounded-2xl shadow-lg text-white h-full flex flex-col items-center justify-center text-center transition-all group-hover:shadow-2xl`}>
                    <div className="mb-3 transform group-hover:scale-110 transition-transform">
                      {game.icon}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{game.name}</h3>
                    <p className="text-xs text-white/90 leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Both players will see the same game interface
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
