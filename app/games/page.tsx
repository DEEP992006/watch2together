'use client';

import { motion } from 'framer-motion';
import { Heart, Gamepad2, Users, Star, Trophy, Sparkles, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface Game {
  id: number;
  name: string;
  category: string;
  players: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  romantic: boolean;
}

const games: Game[] = [
  // Romantic Games (60) - First Priority
  { id: 1, name: "Truth or Dare", category: "Romantic", players: "2+", difficulty: "Easy", description: "Spice up your night with fun questions and dares", romantic: true },
  { id: 2, name: "Compliment Battle", category: "Romantic", players: "2", difficulty: "Easy", description: "See who can give the sweetest compliments", romantic: true },
  { id: 3, name: "Memory Lane", category: "Romantic", players: "2", difficulty: "Easy", description: "Share your favorite memories together", romantic: true },
  { id: 4, name: "Future Dreams", category: "Romantic", players: "2", difficulty: "Easy", description: "Plan your dream future together", romantic: true },
  { id: 5, name: "Couples Trivia", category: "Romantic", players: "2", difficulty: "Medium", description: "Quiz each other about your relationship", romantic: true },
  { id: 6, name: "Love Languages", category: "Romantic", players: "2", difficulty: "Easy", description: "Discover each other's love languages", romantic: true },
  { id: 7, name: "Dream Date Planning", category: "Romantic", players: "2", difficulty: "Easy", description: "Plan your perfect date together", romantic: true },
  { id: 8, name: "Love Letter Writing", category: "Romantic", players: "2", difficulty: "Easy", description: "Write heartfelt letters to each other", romantic: true },
  { id: 9, name: "First Impressions", category: "Romantic", players: "2", difficulty: "Easy", description: "Share what you first thought of each other", romantic: true },
  { id: 10, name: "Love Story Retelling", category: "Romantic", players: "2", difficulty: "Easy", description: "Tell the story of how you met", romantic: true },
  { id: 11, name: "Couples Quiz Show", category: "Romantic", players: "2", difficulty: "Medium", description: "Test how well you know each other", romantic: true },
  { id: 12, name: "Kiss Count Challenge", category: "Romantic", players: "2", difficulty: "Easy", description: "Count kisses in creative ways", romantic: true },
  { id: 13, name: "Sweet Confession", category: "Romantic", players: "2", difficulty: "Easy", description: "Share your deepest feelings for each other", romantic: true },
  { id: 14, name: "Nickname Game", category: "Romantic", players: "2", difficulty: "Easy", description: "Create cute nicknames for each other", romantic: true },
  { id: 15, name: "Couples Bucket List", category: "Romantic", players: "2", difficulty: "Easy", description: "Create a bucket list of things to do together", romantic: true },
  { id: 16, name: "Virtual Date Planning", category: "Romantic", players: "2", difficulty: "Easy", description: "Plan the perfect virtual date together", romantic: true },
  { id: 17, name: "Romantic Playlist", category: "Romantic", players: "2", difficulty: "Easy", description: "Build a playlist of your relationship songs", romantic: true },
  { id: 18, name: "Love Notes", category: "Romantic", players: "2", difficulty: "Easy", description: "Write sweet messages to each other", romantic: true },
  { id: 19, name: "Couples Adventure", category: "Romantic", players: "2", difficulty: "Easy", description: "Plan your next romantic adventure", romantic: true },
  { id: 20, name: "Dream Wedding", category: "Romantic", players: "2", difficulty: "Medium", description: "Plan your dream wedding together", romantic: true },
  { id: 21, name: "Love Timeline", category: "Romantic", players: "2", difficulty: "Medium", description: "Map out your relationship timeline together", romantic: true },
  { id: 22, name: "Forever Love Quiz", category: "Romantic", players: "2", difficulty: "Medium", description: "Answer questions about your future together", romantic: true },
  { id: 23, name: "Karaoke Challenge", category: "Romantic", players: "2+", difficulty: "Medium", description: "Sing your hearts out together", romantic: true },
  { id: 24, name: "Dance Party", category: "Romantic", players: "2+", difficulty: "Easy", description: "Dance to your favorite songs", romantic: true },
  { id: 25, name: "Romantic Trivia", category: "Romantic", players: "2+", difficulty: "Easy", description: "Test your knowledge of love and romance", romantic: true },
  { id: 26, name: "Love Song Dedication", category: "Romantic", players: "2", difficulty: "Easy", description: "Dedicate and sing love songs to each other", romantic: true },
  { id: 27, name: "Couples Photo Challenge", category: "Romantic", players: "2", difficulty: "Easy", description: "Recreate your favorite couple photos", romantic: true },
  { id: 28, name: "Romantic Movie Quotes", category: "Romantic", players: "2+", difficulty: "Medium", description: "Guess romantic movie quotes together", romantic: true },
  { id: 29, name: "Love Poem Creation", category: "Romantic", players: "2", difficulty: "Medium", description: "Write romantic poems for each other", romantic: true },
  { id: 30, name: "Couples Yoga Poses", category: "Romantic", players: "2", difficulty: "Medium", description: "Try partner yoga poses together", romantic: true },
  { id: 31, name: "Romance Book Club", category: "Romantic", players: "2+", difficulty: "Medium", description: "Discuss romantic stories and books", romantic: true },
  { id: 32, name: "Love Language Discovery", category: "Romantic", players: "2", difficulty: "Easy", description: "Learn each other's love languages", romantic: true },
  { id: 33, name: "Romantic Scavenger Hunt", category: "Romantic", players: "2", difficulty: "Medium", description: "Create clues leading to romantic surprises", romantic: true },
  { id: 34, name: "Couple Goals Sharing", category: "Romantic", players: "2", difficulty: "Easy", description: "Share your relationship goals and dreams", romantic: true },
  { id: 35, name: "Sweet Memories Game", category: "Romantic", players: "2", difficulty: "Easy", description: "Share your sweetest memories together", romantic: true },
  { id: 36, name: "Love Story Reenactment", category: "Romantic", players: "2", difficulty: "Medium", description: "Act out your love story from the beginning", romantic: true },
  { id: 37, name: "Love Compatibility Quiz", category: "Romantic", players: "2", difficulty: "Easy", description: "Take fun compatibility tests together", romantic: true },
  { id: 38, name: "Romantic Dinner Menu", category: "Romantic", players: "2", difficulty: "Easy", description: "Plan your ideal romantic dinner menu", romantic: true },
  { id: 39, name: "Anniversary Countdown", category: "Romantic", players: "2", difficulty: "Easy", description: "Share what you love about each month together", romantic: true },
  { id: 40, name: "Couples Meditation", category: "Romantic", players: "2", difficulty: "Easy", description: "Meditate together and share the experience", romantic: true },
  { id: 41, name: "Love Fortune Telling", category: "Romantic", players: "2", difficulty: "Easy", description: "Predict your romantic future together", romantic: true },
  { id: 42, name: "Romantic Word Association", category: "Romantic", players: "2", difficulty: "Easy", description: "Say romantic words that remind you of each other", romantic: true },
  { id: 43, name: "Couples Vision Board", category: "Romantic", players: "2", difficulty: "Medium", description: "Create a vision board for your relationship", romantic: true },
  { id: 44, name: "Love Text Archive", category: "Romantic", players: "2", difficulty: "Easy", description: "Read your favorite old messages to each other", romantic: true },
  { id: 45, name: "Romantic Roleplay", category: "Romantic", players: "2", difficulty: "Medium", description: "Act out romantic scenarios together", romantic: true },
  { id: 46, name: "Pet Name Creation", category: "Romantic", players: "2", difficulty: "Easy", description: "Come up with new sweet nicknames", romantic: true },
  { id: 47, name: "Love Horoscope Reading", category: "Romantic", players: "2", difficulty: "Easy", description: "Read and discuss love horoscopes", romantic: true },
  { id: 48, name: "Romantic Charades", category: "Romantic", players: "2+", difficulty: "Medium", description: "Act out romantic movies and moments", romantic: true },
  { id: 49, name: "Couples Promise Exchange", category: "Romantic", players: "2", difficulty: "Easy", description: "Make and share romantic promises", romantic: true },
  { id: 50, name: "Love Map Quiz", category: "Romantic", players: "2", difficulty: "Medium", description: "Test how well you know your partner's world", romantic: true },
  { id: 51, name: "Romantic Wish List", category: "Romantic", players: "2", difficulty: "Easy", description: "Share romantic wishes for your relationship", romantic: true },
  { id: 52, name: "Couples Drawing Challenge", category: "Romantic", players: "2", difficulty: "Medium", description: "Draw each other or romantic scenes", romantic: true },
  { id: 53, name: "Love Language Acts", category: "Romantic", players: "2", difficulty: "Easy", description: "Demonstrate each other's love languages", romantic: true },
  { id: 54, name: "Romantic Slow Dance", category: "Romantic", players: "2", difficulty: "Easy", description: "Slow dance to your favorite songs", romantic: true },
  { id: 55, name: "Couples Stargazing Talk", category: "Romantic", players: "2", difficulty: "Easy", description: "Share dreams under the virtual stars", romantic: true },
  { id: 56, name: "Romantic Gesture Competition", category: "Romantic", players: "2", difficulty: "Medium", description: "See who can make the sweetest gesture", romantic: true },
  { id: 57, name: "Couples Movie Night", category: "Romantic", players: "2", difficulty: "Easy", description: "Pick and discuss romantic movies", romantic: true },
  { id: 58, name: "Love Affirmations", category: "Romantic", players: "2", difficulty: "Easy", description: "Share daily affirmations for each other", romantic: true },
  { id: 59, name: "Love Vow Renewal", category: "Romantic", players: "2", difficulty: "Medium", description: "Renew your relationship vows", romantic: true },
  { id: 60, name: "Romantic Destination Dreams", category: "Romantic", players: "2", difficulty: "Easy", description: "Plan your dream romantic getaway", romantic: true },
  
  // Regular Games (40)
  { id: 61, name: "Ludo", category: "Board Game", players: "2-4", difficulty: "Easy", description: "Classic board game - race your tokens home", romantic: false },
  { id: 62, name: "Chess", category: "Board Game", players: "2", difficulty: "Hard", description: "Strategic board game of kings and queens", romantic: false },
  { id: 63, name: "Checkers", category: "Board Game", players: "2", difficulty: "Medium", description: "Jump and capture opponent's pieces", romantic: false },
  { id: 64, name: "Tic Tac Toe", category: "Board Game", players: "2", difficulty: "Easy", description: "Classic X's and O's game", romantic: false },
  { id: 65, name: "Uno", category: "Card Game", players: "2-4", difficulty: "Easy", description: "Match colors and numbers to win", romantic: false },
  { id: 66, name: "Never Have I Ever", category: "Party", players: "2+", difficulty: "Easy", description: "Learn secrets about each other", romantic: false },
  { id: 67, name: "20 Questions", category: "Guessing", players: "2", difficulty: "Easy", description: "Guess what your partner is thinking", romantic: false },
  { id: 68, name: "Would You Rather", category: "Discussion", players: "2+", difficulty: "Easy", description: "Choose between impossible choices together", romantic: false },
  { id: 69, name: "Two Truths One Lie", category: "Guessing", players: "2+", difficulty: "Easy", description: "Guess which statement is the lie", romantic: false },
  { id: 70, name: "Snakes & Ladders", category: "Board Game", players: "2-4", difficulty: "Easy", description: "Roll dice and climb ladders, avoid snakes", romantic: false },
  { id: 71, name: "Connect Four", category: "Board Game", players: "2", difficulty: "Easy", description: "Connect four pieces in a row to win", romantic: false },
  { id: 72, name: "Battleship", category: "Board Game", players: "2", difficulty: "Medium", description: "Sink your opponent's fleet", romantic: false },
  { id: 73, name: "Rock Paper Scissors", category: "Classic", players: "2", difficulty: "Easy", description: "Classic hand game - best of 5", romantic: false },
  { id: 74, name: "Hangman", category: "Word", players: "2+", difficulty: "Easy", description: "Guess the word before the hangman is complete", romantic: false },
  { id: 75, name: "Pictionary", category: "Creative", players: "2+", difficulty: "Medium", description: "Draw and guess pictures", romantic: false },
  { id: 76, name: "Charades", category: "Entertainment", players: "2+", difficulty: "Easy", description: "Act out movies, shows, and phrases", romantic: false },
  { id: 77, name: "Song Association", category: "Music", players: "2+", difficulty: "Medium", description: "Say words that remind you of songs", romantic: false },
  { id: 78, name: "Finish the Lyrics", category: "Music", players: "2+", difficulty: "Easy", description: "Complete song lyrics together", romantic: false },
  { id: 79, name: "Movie Quote Game", category: "Entertainment", players: "2+", difficulty: "Medium", description: "Guess movies from famous quotes", romantic: false },
  { id: 80, name: "Scrabble", category: "Word", players: "2-4", difficulty: "Medium", description: "Form words for maximum points", romantic: false },
  { id: 81, name: "Boggle", category: "Word", players: "2+", difficulty: "Medium", description: "Find as many words as possible", romantic: false },
  { id: 82, name: "Trivia Quiz", category: "Trivia", players: "2+", difficulty: "Medium", description: "Test your general knowledge", romantic: false },
  { id: 83, name: "Name That Tune", category: "Music", players: "2+", difficulty: "Easy", description: "Guess the song from a few notes", romantic: false },
  { id: 84, name: "Riddles Challenge", category: "Trivia", players: "2+", difficulty: "Medium", description: "Solve tricky riddles together", romantic: false },
  { id: 85, name: "Word Chain", category: "Word", players: "2+", difficulty: "Easy", description: "Link words where last letter starts next word", romantic: false },
  { id: 86, name: "Story Building", category: "Creative", players: "2+", difficulty: "Medium", description: "Create a story together, one sentence at a time", romantic: false },
  { id: 87, name: "Rhyme Time", category: "Creative", players: "2+", difficulty: "Medium", description: "Create rhymes on the spot", romantic: false },
  { id: 88, name: "Category Challenge", category: "Trivia", players: "2+", difficulty: "Medium", description: "Name items in a category as fast as possible", romantic: false },
  { id: 89, name: "Alphabet Game", category: "Word", players: "2+", difficulty: "Easy", description: "Name things in a category from A to Z", romantic: false },
  { id: 90, name: "Poker", category: "Card Game", players: "2-4", difficulty: "Medium", description: "Bluff and bet to win chips", romantic: false },
  { id: 91, name: "Rummy", category: "Card Game", players: "2-4", difficulty: "Medium", description: "Form sets and sequences to win", romantic: false },
  { id: 92, name: "Go Fish", category: "Card Game", players: "2-4", difficulty: "Easy", description: "Collect matching pairs of cards", romantic: false },
  { id: 93, name: "Crazy Eights", category: "Card Game", players: "2-4", difficulty: "Easy", description: "Match suits or numbers to discard cards", romantic: false },
  { id: 94, name: "Memory Match", category: "Board Game", players: "2+", difficulty: "Easy", description: "Flip cards to find matching pairs", romantic: false },
  { id: 95, name: "Simon Says", category: "Classic", players: "2+", difficulty: "Easy", description: "Follow commands only when Simon says", romantic: false },
  { id: 96, name: "Hot Potato", category: "Classic", players: "2+", difficulty: "Easy", description: "Pass object before time runs out", romantic: false },
  { id: 97, name: "I Spy", category: "Guessing", players: "2+", difficulty: "Easy", description: "Guess what someone is looking at", romantic: false },
  { id: 98, name: "Dominos", category: "Board Game", players: "2-4", difficulty: "Easy", description: "Match numbers on domino tiles", romantic: false },
  { id: 99, name: "Mahjong", category: "Board Game", players: "2-4", difficulty: "Hard", description: "Match tiles in this classic Chinese game", romantic: false },
  { id: 100, name: "Sudoku Challenge", category: "Trivia", players: "2+", difficulty: "Hard", description: "Race to solve sudoku puzzles", romantic: false },
];

export default function GamesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [showRomanticOnly, setShowRomanticOnly] = useState(false);

  const categories = ['All', ...Array.from(new Set(games.map(g => g.category)))];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const filteredGames = games.filter(game => {
    const categoryMatch = selectedCategory === 'All' || game.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'All' || game.difficulty === selectedDifficulty;
    const romanticMatch = !showRomanticOnly || game.romantic;
    return categoryMatch && difficultyMatch && romanticMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Animated background hearts */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-rose-200/20"
            initial={{ y: '100vh', x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000) }}
            animate={{
              y: '-10vh',
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 5,
            }}
          >
            <Heart className="w-8 h-8" fill="currentColor" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-4 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Watch Together</span>
          </Link>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-rose-100">
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gamepad2 className="w-12 h-12 text-rose-500" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent text-center">
                Couple Games Collection
              </h1>
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <Heart className="w-12 h-12 text-rose-500" fill="currentColor" />
              </motion.div>
            </div>
            <p className="text-center text-gray-600 text-lg">
              100 Romantic Multiplayer Games to Play Together ✨💕
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-8 border border-rose-100"
        >
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-200 outline-none transition-all bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-4 py-2 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-200 outline-none transition-all bg-white"
                >
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Romantic Filter */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-rose-50 to-purple-50 px-4 py-3 rounded-xl hover:from-rose-100 hover:to-purple-100 transition-all">
                <input
                  type="checkbox"
                  checked={showRomanticOnly}
                  onChange={(e) => setShowRomanticOnly(e.target.checked)}
                  className="w-5 h-5 text-rose-600 border-rose-300 rounded focus:ring-rose-500"
                />
                <Heart className="w-5 h-5 text-rose-500" fill={showRomanticOnly ? 'currentColor' : 'none'} />
                <span className="font-semibold text-gray-700">Romantic Games Only</span>
              </label>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              Showing <span className="font-bold text-rose-600">{filteredGames.length}</span> game{filteredGames.length !== 1 ? 's' : ''}
            </span>
          </div>
        </motion.div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-rose-100 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-rose-600 transition-colors">
                    {game.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-rose-100 to-purple-100 text-rose-700 font-semibold">
                      {game.category}
                    </span>
                  </div>
                </div>
                {game.romantic && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Heart className="w-5 h-5 text-rose-500" fill="currentColor" />
                  </motion.div>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {game.description}
              </p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{game.players} players</span>
                </div>
                <div className={`px-2 py-1 rounded-full font-semibold ${
                  game.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                  game.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {game.difficulty}
                </div>
              </div>

              <motion.div
                className="mt-4 pt-4 border-t border-rose-100 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={false}
              >
                <button className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white py-2 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
                  Let's Play! 🎮
                </button>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Gamepad2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No games found with these filters</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedDifficulty('All');
                setShowRomanticOnly(false);
              }}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Reset Filters
            </button>
          </motion.div>
        )}

        {/* Fun Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 text-center border border-rose-100">
            <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <div className="text-2xl font-bold text-gray-800">{games.length}</div>
            <div className="text-sm text-gray-600">Total Games</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 text-center border border-rose-100">
            <Heart className="w-8 h-8 mx-auto mb-2 text-rose-500" fill="currentColor" />
            <div className="text-2xl font-bold text-gray-800">{games.filter(g => g.romantic).length}</div>
            <div className="text-sm text-gray-600">Romantic</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 text-center border border-rose-100">
            <Star className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <div className="text-2xl font-bold text-gray-800">{games.filter(g => g.difficulty === 'Easy').length}</div>
            <div className="text-sm text-gray-600">Easy Games</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 text-center border border-rose-100">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <div className="text-2xl font-bold text-gray-800">{categories.length - 1}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
