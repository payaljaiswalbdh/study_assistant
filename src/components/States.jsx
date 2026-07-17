import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, AlertTriangle, RefreshCw, FileText, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { cn } from '../utils/cn';

export function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        
        {/* Large Illustration / Icon */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
          <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-2xl shadow-primary/30 relative z-10 rotate-3">
            <Brain size={64} strokeWidth={1.5} className="-rotate-3" />
          </div>
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-4 -right-4 text-secondary opacity-70 z-0"
          >
            <Sparkles size={32} />
          </motion.div>
        </motion.div>

        <motion.h3 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Your Study Assistant
        </motion.h3>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-10"
        >
          Paste your notes on the left. We'll instantly convert them into interactive study materials.
        </motion.p>

        {/* Onboarding Pills */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center"><FileText size={14} /></div>
            1. Paste Notes
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center"><SlidersHorizontal size={14} /></div>
            2. Pick Mode
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center"><CheckCircle2 size={14} /></div>
            3. Generate
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="text-center flex flex-col items-center">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-primary">
          <Brain size={32} className="animate-pulse" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analyzing Knowledge...</h3>
      <p className="text-gray-500 dark:text-gray-400">Reading your notes and building study materials.</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="max-w-md w-full text-center glass-card p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />
      <div className="w-20 h-20 mx-auto rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-6">
        <AlertTriangle size={40} />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Something went wrong</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-8 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 font-mono text-sm break-words">
        {error}
      </p>
      <button 
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white font-semibold rounded-xl transition-colors"
      >
        <RefreshCw size={18} />
        Try Again
      </button>
    </div>
  );
}
