'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Frown, Angry, Meh, Heart as HeartIcon } from 'lucide-react';
import { saveMood, getMoodHistory } from '@/app/actions/basic';
import { format } from 'date-fns';

interface MoodCheckinProps {
  username: string;
}

interface MoodEntry {
  id: number;
  username: string;
  mood: string;
  createdAt: Date;
}

const MOOD_OPTIONS = [
  { id: 'happy', label: 'Happy', icon: Smile, color: 'from-yellow-400 to-orange-400' },
  { id: 'excited', label: 'Excited', icon: HeartIcon, color: 'from-pink-400 to-rose-400' },
  { id: 'neutral', label: 'Neutral', icon: Meh, color: 'from-gray-400 to-slate-400' },
  { id: 'sad', label: 'Sad', icon: Frown, color: 'from-blue-400 to-indigo-400' },
  { id: 'angry', label: 'Angry', icon: Angry, color: 'from-red-400 to-orange-500' },
];

export default function MoodCheckin({ username }: MoodCheckinProps) {
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    loadMoodHistory();
  }, []);

  const loadMoodHistory = async () => {
    const result = await getMoodHistory(username, 10);
    if (result.success && result.moods) {
      setMoodHistory(result.moods as MoodEntry[]);
    }
  };

  const handleMoodClick = async (moodId: string) => {
    // Optimistic update
    const newMood: MoodEntry = {
      id: Date.now(),
      username,
      mood: moodId,
      createdAt: new Date(),
    };
    
    setMoodHistory((prev) => [newMood, ...prev]);
    setSelectedMood(moodId);

    // Save to database
    const result = await saveMood(username, moodId);
    if (result.success) {
      // Reload to get the actual saved data
      loadMoodHistory();
    } else {
      console.error('Failed to save mood:', result.error);
      // Rollback optimistic update on error
      setMoodHistory((prev) => prev.filter((m) => m.id !== newMood.id));
    }

    // Clear selection after animation
    setTimeout(() => setSelectedMood(null), 1000);
  };

  const getMoodIcon = (moodId: string) => {
    const mood = MOOD_OPTIONS.find((m) => m.id === moodId);
    return mood ? mood : MOOD_OPTIONS[2];
  };

  return (
    <div className="space-y-4">
      {/* Mood Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">How are you feeling?</h3>
        <div className="grid grid-cols-5 gap-2">
          {MOOD_OPTIONS.map((mood) => {
            const Icon = mood.icon;
            const isSelected = selectedMood === mood.id;
            
            return (
              <motion.button
                key={mood.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={isSelected ? { scale: [1, 1.3, 1] } : {}}
                onClick={() => handleMoodClick(mood.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                  isSelected
                    ? `bg-gradient-to-br ${mood.color} text-white shadow-lg`
                    : 'bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{mood.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Mood History */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Moods</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <AnimatePresence>
            {moodHistory.map((entry) => {
              const moodData = getMoodIcon(entry.mood);
              const Icon = moodData.icon;
              
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-2 bg-white rounded-lg"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${moodData.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{entry.username}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(entry.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-gray-600 capitalize">{entry.mood}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
