'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Users, Trophy, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import Pusher from 'pusher-js';
import { whoMoreLikelyQuestions } from '@/data/whoMoreLikelyQuestions';

type GamePhase = 'waiting' | 'ready' | 'voting' | 'results' | 'game-over';

interface Player {
  name: string;
  id: string;
  joinedAt: number;
}

interface GameState {
  phase: GamePhase;
  currentQuestion: string;
  round: number;
  maxRounds: number;
  players: Player[];
  votes: { [playerId: string]: string }; // playerId -> votedForPlayerId
  scores: { [playerId: string]: number };
  senderId?: string;
}

interface WhoMoreLikelyProps {
  room: string;
  username: string;
  onSendMessage?: (message: string) => void;
}

export default function WhoMoreLikely({ room, username, onSendMessage }: WhoMoreLikelyProps) {
  const pusherRef = useRef<Pusher | null>(null);
  const senderIdRef = useRef(Math.random().toString(36));
  const [mounted, setMounted] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    phase: 'waiting',
    currentQuestion: '',
    round: 1,
    maxRounds: 10,
    players: [],
    votes: {},
    scores: {},
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !room || !username) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '25786def95c5c13eda17', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    });

    pusherRef.current = pusher;
    const channel = pusher.subscribe(`game-${room}`);

    const myPlayer: Player = {
      name: username,
      id: senderIdRef.current,
      joinedAt: Date.now(),
    };

    channel.bind('player-joined', (data: Player) => {
      if (data.id === senderIdRef.current) return;

      setGameState((prev) => {
        const playerExists = prev.players.some((p) => p.id === data.id);
        if (playerExists) return prev;

        const newPlayers = [...prev.players, data];

        if (newPlayers.length === 2 && prev.phase === 'waiting') {
          return { ...prev, players: newPlayers, phase: 'ready' };
        }

        return { ...prev, players: newPlayers };
      });
    });

    channel.bind('game-state-update', (data: GameState) => {
      if (data.senderId === senderIdRef.current) return;
      setGameState(data);
    });

    setTimeout(() => {
      triggerGameEvent('player-joined', myPlayer);
      setGameState((prev) => ({
        ...prev,
        players: [myPlayer],
      }));
    }, 500);

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [mounted, room, username]);

  const triggerGameEvent = async (event: string, data: any) => {
    await fetch('/api/pusher/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: `game-${room}`,
        event,
        data: { ...data, senderId: senderIdRef.current },
      }),
    });
  };

  const handleStartGame = () => {
    if (gameState.players.length !== 2) return;

    const randomQuestion = whoMoreLikelyQuestions[Math.floor(Math.random() * whoMoreLikelyQuestions.length)];

    const newState: GameState = {
      ...gameState,
      phase: 'voting',
      currentQuestion: randomQuestion,
      votes: {},
    };

    setGameState(newState);
    triggerGameEvent('game-state-update', newState);

    if (onSendMessage) {
      onSendMessage(`🎮 Game started! Round 1`);
    }
  };

  const handleVote = (votedForPlayerId: string) => {
    const newVotes = { ...gameState.votes, [senderIdRef.current]: votedForPlayerId };

    const newState: GameState = {
      ...gameState,
      votes: newVotes,
    };

    // Check if both players voted
    if (Object.keys(newVotes).length === 2) {
      newState.phase = 'results';

      // Award points based on votes
      const voteCounts: { [playerId: string]: number } = {};
      Object.values(newVotes).forEach((votedId) => {
        voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
      });

      const newScores = { ...gameState.scores };
      Object.keys(voteCounts).forEach((playerId) => {
        newScores[playerId] = (newScores[playerId] || 0) + voteCounts[playerId];
      });
      newState.scores = newScores;
    }

    setGameState(newState);
    triggerGameEvent('game-state-update', newState);
  };

  const handleNextRound = () => {
    const newRound = gameState.round + 1;

    if (newRound > gameState.maxRounds) {
      const newState: GameState = {
        ...gameState,
        phase: 'game-over',
      };
      setGameState(newState);
      triggerGameEvent('game-state-update', newState);

      if (onSendMessage) {
        const sortedPlayers = gameState.players
          .map((p) => ({ name: p.name, score: gameState.scores[p.id] || 0 }))
          .sort((a, b) => b.score - a.score);

        if (sortedPlayers[0].score > sortedPlayers[1].score) {
          onSendMessage(`🏆 Game Over! ${sortedPlayers[0].name} wins!`);
        } else {
          onSendMessage(`🏆 Game Over! It's a tie!`);
        }
      }
      return;
    }

    const randomQuestion = whoMoreLikelyQuestions[Math.floor(Math.random() * whoMoreLikelyQuestions.length)];

    const newState: GameState = {
      ...gameState,
      phase: 'voting',
      currentQuestion: randomQuestion,
      round: newRound,
      votes: {},
    };

    setGameState(newState);
    triggerGameEvent('game-state-update', newState);

    if (onSendMessage) {
      onSendMessage(`Round ${newRound} started!`);
    }
  };

  const handleResetGame = () => {
    if (gameState.players.length !== 2) return;

    const randomQuestion = whoMoreLikelyQuestions[Math.floor(Math.random() * whoMoreLikelyQuestions.length)];

    const resetState: GameState = {
      phase: 'voting',
      currentQuestion: randomQuestion,
      round: 1,
      maxRounds: 10,
      players: gameState.players,
      votes: {},
      scores: {},
    };

    setGameState(resetState);
    triggerGameEvent('game-state-update', resetState);

    if (onSendMessage) {
      onSendMessage('🔄 Game reset!');
    }
  };

  if (!mounted) return null;

  const hasVoted = gameState.votes[senderIdRef.current] !== undefined;

  return (
    <div className="h-full w-full bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative overflow-hidden flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-purple-200/20"
            initial={{ y: '100%', x: Math.random() * 100 + '%' }}
            animate={{ y: '-10%', x: Math.random() * 100 + '%' }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 5,
            }}
          >
            <Users className="w-6 h-6" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 h-full flex flex-col p-3">
        {/* PHASE: WAITING */}
        {gameState.phase === 'waiting' && gameState.players.length < 2 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 max-w-md w-full border border-purple-200 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block mb-4"
              >
                <Users className="w-12 h-12 text-purple-500 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Waiting for Players...</h2>
              <p className="text-gray-600 mb-4">{gameState.players.length}/2 players in room</p>
              {gameState.players.map((player) => (
                <div key={player.id} className="bg-purple-50 rounded-lg p-2 text-sm font-semibold text-gray-700 mb-2">
                  {player.name} {player.id === senderIdRef.current && '(You)'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PHASE: READY */}
        {gameState.phase === 'ready' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 max-w-md w-full border border-purple-200 text-center">
              <Users className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Ready to Play!</h2>
              <p className="text-gray-600 mb-4 text-sm">Vote on who's more likely to do something</p>
              {gameState.players.map((player) => (
                <div key={player.id} className="bg-purple-50 rounded-lg p-2 text-sm font-semibold text-gray-700 mb-2">
                  {player.name} {player.id === senderIdRef.current && '(You)'}
                </div>
              ))}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartGame}
                className="w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 text-white py-3 rounded-xl font-bold shadow-lg mt-4"
              >
                Start Game 🎮
              </motion.button>
            </div>
          </div>
        )}

        {/* GAME IN PROGRESS */}
        {gameState.phase !== 'waiting' && gameState.phase !== 'ready' && gameState.phase !== 'game-over' && (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-lg p-2 mb-2 border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-semibold text-gray-700">Round {gameState.round}/{gameState.maxRounds}</span>
                </div>
                <div className="flex gap-2">
                  {gameState.players.map((player) => (
                    <div key={player.id} className="px-2 py-1 rounded-lg text-xs bg-gray-50">
                      <span className="font-semibold">{player.name}</span>
                      <Trophy className="w-3 h-3 inline ml-1 text-yellow-500" />
                      <span className="ml-0.5 font-bold">{gameState.scores[player.id] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
              <div className="w-full max-w-lg px-2">
                {/* PHASE: VOTING */}
                {gameState.phase === 'voting' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/90 backdrop-blur-xl rounded-xl shadow-xl p-4 border border-purple-200"
                  >
                    <div className="text-center mb-4">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{gameState.currentQuestion}</h3>
                      <p className="text-sm text-gray-600">{hasVoted ? 'Waiting for other player...' : 'Cast your vote!'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {gameState.players.map((player) => (
                        <motion.button
                          key={player.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleVote(player.id)}
                          disabled={hasVoted}
                          className={`p-4 rounded-xl shadow-lg font-bold text-white ${
                            hasVoted
                              ? gameState.votes[senderIdRef.current] === player.id
                                ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                : 'bg-gray-300'
                              : 'bg-gradient-to-br from-purple-400 to-indigo-600'
                          } disabled:opacity-70`}
                        >
                          {player.name}
                          {player.id === senderIdRef.current && <div className="text-xs mt-1">(You)</div>}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* PHASE: RESULTS */}
                {gameState.phase === 'results' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-purple-400 to-indigo-600 text-white p-4 rounded-xl shadow-xl"
                  >
                    <div className="text-center mb-4">
                      <Trophy className="w-8 h-8 mx-auto mb-2" />
                      <h3 className="text-lg font-bold">Results!</h3>
                    </div>

                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
                      <p className="text-sm font-semibold mb-2">Votes:</p>
                      {gameState.players.map((player) => {
                        const voteCount = Object.values(gameState.votes).filter((v) => v === player.id).length;
                        return (
                          <div key={player.id} className="flex justify-between mb-1">
                            <span>{player.name}</span>
                            <span className="font-bold">{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                          </div>
                        );
                      })}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNextRound}
                      className="w-full bg-white text-gray-800 py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Next Round
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Reset Button */}
            <div className="text-center mt-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetGame}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 text-gray-700 rounded-lg font-semibold shadow-md border border-purple-200 text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </motion.button>
            </div>
          </div>
        )}

        {/* PHASE: GAME OVER */}
        {gameState.phase === 'game-over' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 max-w-md w-full border border-purple-200 text-center">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Game Over!
              </h2>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Final Scores</h3>
                {gameState.players
                  .map((p) => ({ ...p, score: gameState.scores[p.id] || 0 }))
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex justify-between p-2 rounded-lg mb-1 ${
                        index === 0 ? 'bg-yellow-100 border border-yellow-400' : 'bg-white'
                      }`}
                    >
                      <span className="font-semibold text-sm">
                        {index === 0 && '👑 '}
                        {player.name}
                      </span>
                      <span className="font-bold text-sm">{player.score}</span>
                    </div>
                  ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetGame}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Play Again
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
