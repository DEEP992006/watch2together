'use client';

import { motion } from 'framer-motion';
import { Smile } from 'lucide-react';
import MoodCheckin from './MoodCheckin';

interface BasicPanelProps {
  username: string;
}

export default function BasicPanel({ username }: BasicPanelProps) {
  return (
    <div className="space-y-4">
      {/* Daily Mood Check-in Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-rose-100"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg">
            <Smile className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Daily Mood Check-in</h2>
        </div>
        <MoodCheckin username={username} />
      </motion.div>
    </div>
  );
}
