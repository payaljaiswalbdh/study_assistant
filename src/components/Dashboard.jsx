import React from 'react';
import { motion } from 'framer-motion';
import { X, BarChart3, Calendar, Layers, CheckSquare, Command } from 'lucide-react';
import { cn } from '../utils/cn';

export function Dashboard({ history, onClose }) {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden absolute top-16 right-4 w-80 z-50">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
          <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <BarChart3 size={18} className="text-primary" /> 
            Study Dashboard
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors text-gray-500">
            <X size={16} />
          </button>
        </div>
        <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4 border border-gray-100 dark:border-white/5">
            <BarChart3 size={24} className="text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">No study data yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Generate some study materials to see your stats here.</p>
        </div>
      </div>
    );
  }

  const totalSessions = history.length;
  const totalCards = history.reduce((sum, s) => sum + (s.flashcardCount || 0), 0);
  const totalQuestions = history.reduce((sum, s) => sum + (s.quizCount || 0), 0);

  // Group sessions by day
  const byDay = {};
  history.forEach(s => {
    const day = new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    byDay[day] = (byDay[day] || 0) + 1;
  });

  const days = Object.entries(byDay).slice(0, 7).reverse();
  const maxCount = Math.max(...days.map(([, c]) => c), 1);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="flex flex-col h-auto max-h-[80vh] bg-white dark:bg-[#1a1a24] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden absolute top-16 right-4 w-80 z-50 origin-top-right"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
        <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <BarChart3 size={18} className="text-primary" /> 
          Study Dashboard
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-500">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass-card p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-transparent">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              <Calendar size={14} className="text-blue-500" /> Sessions
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{totalSessions}</div>
          </div>
          <div className="glass-card p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-transparent">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              <Layers size={14} className="text-purple-500" /> Cards
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{totalCards}</div>
          </div>
          <div className="glass-card p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gradient-to-br from-white to-gray-50 dark:from-white/5 dark:to-transparent col-span-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              <CheckSquare size={14} className="text-green-500" /> Quiz Questions
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{totalQuestions}</div>
          </div>
        </div>

        {days.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Activity (Last 7 Days)</div>
            <div className="flex items-end gap-2 h-24">
              {days.map(([day, count], i) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded transition-opacity">
                    {count}
                  </div>
                  <div className="w-full relative h-[60px] bg-gray-50 dark:bg-white/5 rounded-t-sm flex items-end">
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${Math.max((count / maxCount) * 100, 10)}%` }} transition={{ delay: i * 0.05 + 0.2, type: "spring" }}
                      className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-sm"
                    />
                  </div>
                  <div className="text-[9px] font-medium text-gray-400 whitespace-nowrap rotate-[-45deg] origin-top-left mt-2">
                    {day}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">
            <Command size={14} /> Keyboard Shortcuts
          </div>
          <div className="grid grid-cols-1 gap-2 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            <div className="flex items-center justify-between">
              <span>Generate</span>
              <div className="flex gap-1">
                <Kbd>Ctrl</Kbd><Kbd>Enter</Kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Export</span>
              <div className="flex gap-1">
                <Kbd>Ctrl</Kbd><Kbd>E</Kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Navigate</span>
              <div className="flex gap-1">
                <Kbd>←</Kbd><Kbd>→</Kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Flip card</span>
              <Kbd>Space</Kbd>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono shadow-sm">
      {children}
    </kbd>
  );
}
