'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, RefreshCw, Users, Trophy, Star, CheckCircle, Send, ArrowRight, Lightbulb } from 'lucide-react';
import Pusher from 'pusher-js';
import { prompts } from '@/data/truthOrDarePrompts';

// Game phases for turn-based play
type GamePhase = 'waiting' | 'ready' | 'choosing' | 'asking' | 'answering' | 'viewing-answer' | 'game-over';

interface Player {
  name: string;
  id: string;
  joinedAt: number;
}

interface GameState {
  phase: GamePhase;
  currentTurnPlayerId: string; // Player whose turn it is to choose/answer
  otherPlayerId: string; // Player who asks the question
  choice: 'truth' | 'dare' | null;
  question: string; // Question or task typed by other player
  answer: string; // Answer typed by current player
  round: number;
  maxRounds: number;
  players: Player[];
  scores: { [playerId: string]: number };
  senderId?: string;
}

interface TruthOrDareGameProps {
  room: string;
  username: string;
  onSendMessage?: (message: string) => void;
}

export default function TruthOrDareGame({ room, username, onSendMessage }: TruthOrDareGameProps) {
  const pusherRef = useRef<Pusher | null>(null);
  const senderIdRef = useRef(Math.random().toString(36));
  const [mounted, setMounted] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  
  // Local input states
  const [questionInput, setQuestionInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    phase: 'waiting',
    currentTurnPlayerId: '',
    otherPlayerId: '',
    choice: null,
    question: '',
    answer: '',
    round: 1,
    maxRounds: 10,
    players: [],
    scores: {},
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Setup Pusher connection for multiplayer sync
  useEffect(() => {
    if (!mounted || !room || !username) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '25786def95c5c13eda17', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    });

    pusherRef.current = pusher;
    const channel = pusher.subscribe(`game-${room}`);

    // Announce player joined
    const myPlayer: Player = {
      name: username,
      id: senderIdRef.current,
      joinedAt: Date.now(),
    };

    // Listen for player joined
    channel.bind('player-joined', (data: Player) => {
      if (data.id === senderIdRef.current) return;
      
      setGameState(prev => {
        const playerExists = prev.players.some(p => p.id === data.id);
        if (playerExists) return prev;
        
        const newPlayers = [...prev.players, data];
        
        // Auto-transition to ready when we have 2 players
        if (newPlayers.length === 2 && prev.phase === 'waiting') {
          return { ...prev, players: newPlayers, phase: 'ready' };
        }
        
        return { ...prev, players: newPlayers };
      });
    });

    // Listen for game state updates
    channel.bind('game-state-update', (data: GameState) => {
      if (data.senderId === senderIdRef.current) return;
      setGameState(data);
    });

    // Announce this player
    setTimeout(() => {
      triggerGameEvent('player-joined', myPlayer);
      setGameState(prev => {
        const newPlayers = [myPlayer];
        return {
          ...prev,
          players: newPlayers,
        };
      });
    }, 500);

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [mounted, room, username]);

  // Trigger Pusher event
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

  // Start the game - Player 1 goes first
  const handleStartGame = () => {
    if (gameState.players.length !== 2) return;

    const player1 = gameState.players[0];
    const player2 = gameState.players[1];

    const newState: GameState = {
      ...gameState,
      phase: 'choosing',
      currentTurnPlayerId: player1.id,
      otherPlayerId: player2.id,
      choice: null,
      question: '',
      answer: '',
    };

    setGameState(newState);
    triggerGameEvent('game-state-update', newState);

    if (onSendMessage) {
      onSendMessage(`🎮 Game started! ${player1.name} goes first!`);
    }
  };

  // Player chooses Truth or Dare
  const handleChoice = (choice: 'truth' | 'dare') => {
    const newState: GameState = {
      ...gameState,
      phase: 'asking',
      choice,
    };

    setGameState(newState);
    triggerGameEvent('game-state-update', newState);

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurnPlayerId);
    if (onSendMessage) {
      onSendMessage(`${currentPlayer?.name} chose ${choice.toUpperCase()}!`);
    }
  };

  // Other player submits a question/task
  const handleSubmitQuestion = () => {
    if (!questionInput.trim()) return;

    const newState: GameState = {
      ...gameState,
      phase: 'answering',
      question: questionInput,
    };

    setGameState(newState);
    triggerGameEvent('game-state-update', newState);
    
    const otherPlayer = gameState.players.find(p => p.id === gameState.otherPlayerId);
    if (onSendMessage) {
      onSendMessage(`${otherPlayer?.name} asked: ${questionInput}`);
    }

    setQuestionInput('');
  };

  // Current player submits their answer
  const handleSubmitAnswer = () => {
    if (!answerInput.trim()) return;

    const newState: GameState = {
      ...gameState,
      phase: 'viewing-answer',
      answer: answerInput,
    };

    // Award point
    const newScores = { ...gameState.scores };
    newScores[gameState.currentTurnPlayerId] = (newScores[gameState.currentTurnPlayerId] || 0) + 1;
    newState.scores = newScores;

    setGameState(newState);
    triggerGameEvent('game-state-update', newState);

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurnPlayerId);
    if (onSendMessage) {
      onSendMessage(`${currentPlayer?.name} answered: ${answerInput}`);
    }

    setAnswerInput('');

    // Celebrate with hearts
    setShowHearts(true);
    setTimeout(() => setShowHearts(false), 1600);
  };

  // Move to next round
  const handleNextRound = () => {
    const newRound = gameState.round + 1;

    // Check if game is over
    if (newRound > gameState.maxRounds) {
      const newState: GameState = {
        ...gameState,
        phase: 'game-over',
      };
      setGameState(newState);
      triggerGameEvent('game-state-update', newState);

      if (onSendMessage) {
        const sortedPlayers = gameState.players
          .map(p => ({ name: p.name, score: gameState.scores[p.id] || 0 }))
          .sort((a, b) => b.score - a.score);
        
        if (sortedPlayers[0].score > sortedPlayers[1].score) {
          onSendMessage(`🏆 Game Over! ${sortedPlayers[0].name} wins!`);
        } else {
          onSendMessage(`🏆 Game Over! It's a tie!`);
        }
      }
      return;
    }

    // Switch players
    const newState: GameState = {
      ...gameState,
      phase: 'choosing',
      currentTurnPlayerId: gameState.otherPlayerId,
      otherPlayerId: gameState.currentTurnPlayerId,
      choice: null,
      question: '',
      answer: '',
      round: newRound,
    };

    setGameState(newState);
    triggerGameEvent('game-state-update', newState);

    const nextPlayer = gameState.players.find(p => p.id === gameState.otherPlayerId);
    if (onSendMessage) {
      onSendMessage(`Round ${newRound}: ${nextPlayer?.name}'s turn!`);
    }
  };

  // Reset game
  const handleResetGame = () => {
    if (gameState.players.length !== 2) return;

    const player1 = gameState.players[0];
    const player2 = gameState.players[1];

    const resetState: GameState = {
      phase: 'choosing',
      currentTurnPlayerId: player1.id,
      otherPlayerId: player2.id,
      choice: null,
      question: '',
      answer: '',
      round: 1,
      maxRounds: 10,
      players: gameState.players,
      scores: {},
    };

    setGameState(resetState);
    triggerGameEvent('game-state-update', resetState);
    setQuestionInput('');
    setAnswerInput('');

    if (onSendMessage) {
      onSendMessage('🔄 Game reset!');
    }
  };

  if (!mounted) return null;

  const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurnPlayerId);
  const otherPlayer = gameState.players.find(p => p.id === gameState.otherPlayerId);
  const isMyTurn = gameState.currentTurnPlayerId === senderIdRef.current;
  const amIAsking = gameState.otherPlayerId === senderIdRef.current;

  return (
    <div className="h-full w-full bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 relative overflow-hidden flex flex-col">
      {/* Animated background hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-rose-200/20"
            initial={{ y: '100%', x: Math.random() * 100 + '%' }}
            animate={{ y: '-10%', x: Math.random() * 100 + '%' }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 5,
            }}
          >
            <Heart className="w-6 h-6" fill="currentColor" />
          </motion.div>
        ))}
      </div>

      {/* Celebration burst */}
      <AnimatePresence>
        {showHearts && (
          <motion.div
            key="celebrate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-20"
          >
            {[...Array(14)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-rose-400/70"
                initial={{
                  x: `${50 + (Math.random() * 40 - 20)}%`,
                  y: '55%',
                  scale: 0.3,
                  rotate: Math.random() * 60 - 30,
                }}
                animate={{
                  y: `${10 + Math.random() * 10}%`,
                  x: `${50 + (Math.random() * 60 - 30)}%`,
                  scale: 1,
                  rotate: Math.random() * 120 - 60,
                  opacity: [1, 0.9, 0.6, 0],
                }}
                transition={{ duration: 1.2 + Math.random() * 0.4, ease: 'easeOut' }}
              >
                <Heart className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 h-full flex flex-col p-3">
        {/* PHASE: WAITING FOR PLAYERS */}
        {gameState.phase === 'waiting' && gameState.players.length < 2 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 max-w-md w-full border border-rose-200 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block mb-4"
              >
                <Users className="w-12 h-12 text-rose-500 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Waiting for Players...
              </h2>
              <p className="text-gray-600 mb-4">
                {gameState.players.length}/2 players in room
              </p>
              {gameState.players.map(player => (
                <div key={player.id} className="bg-rose-50 rounded-lg p-2 text-sm font-semibold text-gray-700 mb-2">
                  {player.name} {player.id === senderIdRef.current && '(You)'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PHASE: READY TO START */}
        {gameState.phase === 'ready' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 max-w-md w-full border border-rose-200 text-center">
              <Heart className="w-12 h-12 text-rose-500 mx-auto mb-4" fill="currentColor" />
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Ready to Play!
              </h2>
              <p className="text-gray-600 mb-4 text-sm">
                Take turns asking each other Truth or Dare questions
              </p>
              {gameState.players.map(player => (
                <div key={player.id} className="bg-rose-50 rounded-lg p-2 text-sm font-semibold text-gray-700 mb-2">
                  {player.name} {player.id === senderIdRef.current && '(You)'}
                </div>
              ))}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartGame}
                className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg mt-4"
              >
                Start Game 🎮
              </motion.button>
            </div>
          </div>
        )}

        {/* GAME IN PROGRESS */}
        {gameState.phase !== 'waiting' && gameState.phase !== 'ready' && gameState.phase !== 'game-over' && (
          <div className="flex-1 flex flex-col">
            {/* Header - Score & Round Info */}
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-lg p-2 mb-2 border border-rose-200">
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-semibold text-gray-700">Round {gameState.round}/{gameState.maxRounds}</span>
                </div>
                <div className="flex gap-2">
                  {gameState.players.map(player => (
                    <div
                      key={player.id}
                      className={`px-2 py-1 rounded-lg text-xs ${
                        player.id === gameState.currentTurnPlayerId
                          ? 'bg-rose-100 border border-rose-500'
                          : 'bg-gray-50'
                      }`}
                    >
                      <span className="font-semibold">{player.name}</span>
                      <Heart className="w-3 h-3 inline ml-1 text-rose-500" fill="currentColor" />
                      <span className="ml-0.5 font-bold">{gameState.scores[player.id] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Love meter */}
              <div className="mt-2">
                <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 via-pink-500 to-purple-600 rounded-full"
                    style={{ width: `${Math.min(100, ((gameState.round - 1) / gameState.maxRounds) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Turn Indicator */}
            <motion.div
              key={currentPlayer?.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-2"
            >
              <div className="inline-flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full shadow-md border border-rose-200">
                <Sparkles className="w-3 h-3 text-rose-500" />
                <span className="text-xs font-bold text-gray-800">
                  {isMyTurn ? "Your Turn!" : `${currentPlayer?.name}'s Turn`}
                </span>
              </div>
            </motion.div>

            {/* Main Game Area */}
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
              <div className="w-full max-w-lg px-2">
                
                {/* PHASE: CHOOSING - Current player chooses Truth or Dare */}
                {gameState.phase === 'choosing' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/90 backdrop-blur-xl rounded-xl shadow-xl p-4 border border-rose-200"
                  >
                    <h3 className="text-lg font-bold text-center mb-3 text-gray-800">
                      {isMyTurn ? 'Choose your challenge!' : `Waiting for ${currentPlayer?.name}...`}
                    </h3>
                    <p className="text-center text-xs text-gray-500 mb-3">Make it sweet, spicy, or a little daring 💞</p>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleChoice('truth')}
                        disabled={!isMyTurn}
                        className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-4 rounded-xl shadow-lg disabled:opacity-50"
                      >
                        <Star className="w-8 h-8 mx-auto mb-1" />
                        <div className="text-sm font-bold">TRUTH ✨</div>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleChoice('dare')}
                        disabled={!isMyTurn}
                        className="bg-gradient-to-br from-rose-400 to-pink-600 text-white p-4 rounded-xl shadow-lg disabled:opacity-50"
                      >
                        <Sparkles className="w-8 h-8 mx-auto mb-1" />
                        <div className="text-sm font-bold">DARE ❤️</div>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* PHASE: ASKING - Other player types question/task */}
                {gameState.phase === 'asking' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-gradient-to-br ${
                      gameState.choice === 'truth'
                        ? 'from-blue-400 to-blue-600'
                        : 'from-rose-400 to-pink-600'
                    } text-white p-4 rounded-xl shadow-xl`}
                  >
                    <div className="text-center mb-3">
                      {gameState.choice === 'truth' ? (
                        <Star className="w-8 h-8 mx-auto mb-1" />
                      ) : (
                        <Sparkles className="w-8 h-8 mx-auto mb-1" />
                      )}
                      <h3 className="text-lg font-bold uppercase">{gameState.choice}</h3>
                      <p className="text-xs text-white/80 mt-1">
                        {currentPlayer?.name} is ready to answer
                      </p>
                    </div>

                    {amIAsking ? (
                      <div className="space-y-2">
                        <textarea
                          value={questionInput}
                          onChange={(e) => setQuestionInput(e.target.value)}
                          placeholder={gameState.choice === 'truth' ? 'Ask a truth question...' : 'Give a dare task...'}
                          className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white text-sm resize-none"
                          rows={3}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmitQuestion())}
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const filtered = prompts.filter(p => p.type === gameState.choice);
                            const random = filtered[Math.floor(Math.random() * filtered.length)];
                            setQuestionInput(random.text);
                          }}
                          className="w-full bg-white/20 backdrop-blur-sm text-white py-1.5 rounded-lg font-semibold flex items-center justify-center gap-2 border border-white/30 text-sm"
                        >
                          <Lightbulb className="w-4 h-4" />
                          Suggest {gameState.choice === 'truth' ? 'Question' : 'Dare'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSubmitQuestion}
                          disabled={!questionInput.trim()}
                          className="w-full bg-white text-gray-800 py-2 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          Submit Question
                        </motion.button>
                      </div>
                    ) : (
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                        <p className="text-sm">Waiting for {otherPlayer?.name} to ask...</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* PHASE: ANSWERING - Current player answers */}
                {gameState.phase === 'answering' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-gradient-to-br ${
                      gameState.choice === 'truth'
                        ? 'from-blue-400 to-blue-600'
                        : 'from-rose-400 to-pink-600'
                    } text-white p-4 rounded-xl shadow-xl`}
                  >
                    <div className="text-center mb-3">
                      {gameState.choice === 'truth' ? (
                        <Star className="w-8 h-8 mx-auto mb-1" />
                      ) : (
                        <Sparkles className="w-8 h-8 mx-auto mb-1" />
                      )}
                      <h3 className="text-lg font-bold uppercase">{gameState.choice}</h3>
                    </div>

                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
                      <p className="text-sm font-semibold mb-1">{otherPlayer?.name} asks:</p>
                      <p className="text-base">{gameState.question}</p>
                    </div>

                    {isMyTurn ? (
                      <div className="space-y-2">
                        <textarea
                          value={answerInput}
                          onChange={(e) => setAnswerInput(e.target.value)}
                          placeholder="Type your answer..."
                          className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white text-sm resize-none"
                          rows={3}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmitAnswer())}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSubmitAnswer}
                          disabled={!answerInput.trim()}
                          className="w-full bg-white text-gray-800 py-2 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Submit Answer
                        </motion.button>
                      </div>
                    ) : (
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                        <p className="text-sm">Waiting for {currentPlayer?.name} to answer...</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* PHASE: VIEWING ANSWER */}
                {gameState.phase === 'viewing-answer' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-gradient-to-br ${
                      gameState.choice === 'truth'
                        ? 'from-blue-400 to-blue-600'
                        : 'from-rose-400 to-pink-600'
                    } text-white p-4 rounded-xl shadow-xl`}
                  >
                    <div className="text-center mb-3">
                      <CheckCircle className="w-8 h-8 mx-auto mb-1" />
                      <h3 className="text-lg font-bold">Answered!</h3>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs font-semibold mb-1">{otherPlayer?.name} asked:</p>
                        <p className="text-sm">{gameState.question}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs font-semibold mb-1">{currentPlayer?.name} answered:</p>
                        <p className="text-sm">{gameState.answer}</p>
                      </div>
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
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 text-gray-700 rounded-lg font-semibold shadow-md border border-rose-200 text-xs"
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
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 max-w-md w-full border border-rose-200 text-center">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                Game Over!
              </h2>
              <div className="bg-gradient-to-r from-rose-50 to-purple-50 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Final Scores</h3>
                {gameState.players
                  .map(p => ({ ...p, score: gameState.scores[p.id] || 0 }))
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex justify-between p-2 rounded-lg mb-1 ${
                        index === 0 ? 'bg-yellow-100 border border-yellow-400' : 'bg-white'
                      }`}
                    >
                      <span className="font-semibold text-sm">
                        {index === 0 && '👑 '}{player.name}
                      </span>
                      <span className="font-bold text-sm">{player.score}</span>
                    </div>
                  ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetGame}
                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
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
