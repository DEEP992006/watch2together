'use client';

import { motion } from 'framer-motion';
import { Video, Gamepad2, Heart } from 'lucide-react';

export type SectionType = 'video' | 'games' | 'basic';

interface SectionTabsProps {
  currentSection: SectionType;
  onSectionChange: (section: SectionType) => void;
}

export default function SectionTabs({ currentSection, onSectionChange }: SectionTabsProps) {
  const tabs: { id: SectionType; label: string; icon: typeof Video }[] = [
    { id: 'video', label: 'Video', icon: Video },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'basic', label: 'Basic', icon: Heart },
  ];

  return (
    <div className="flex gap-2 mb-3 sm:mb-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentSection === tab.id;
        
        return (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSectionChange(tab.id)}
            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all ${
              isActive
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
