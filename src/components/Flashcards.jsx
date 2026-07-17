import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RotateCw, Hand, ThumbsUp, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export function Flashcards({ flashcards, flippedCards, confidence = {}, dispatch }) {
  const [copiedId, setCopiedId] = React.useState(null);

  const handleCopy = async (e, text, id) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Copied to clipboard' } }));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to copy', type: 'error' } }));
    }
  };

  const gotItCount = Object.values(confidence).filter(v => v === 'got-it').length;
  const reviewCount = Object.values(confidence).filter(v => v === 'review').length;
  const ratedCount = gotItCount + reviewCount;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium">
          <Hand size={16} />
          Tap any card to flip it
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
            {flashcards.length} cards
          </span>
          {ratedCount > 0 && (
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">{gotItCount} Got it</span>
              <span className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">{reviewCount} Review</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-8 px-1">
        {flashcards.map((card, index) => {
          const isFlipped = flippedCards.has(card.id);
          const rating = confidence[card.id];
          
          return (
            <div 
              key={card.id || index}
              className="relative w-full h-[320px] perspective-[1000px] group"
              tabIndex={0}
              role="button"
              onClick={(e) => {
                if (e.target.closest('button')) return;
                dispatch({ type: 'FLIP_CARD', id: card.id });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  dispatch({ type: 'FLIP_CARD', id: card.id });
                }
              }}
            >
              <motion.div
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                className="w-full h-full relative preserve-3d cursor-pointer"
              >
                {/* Front Side */}
                <div className="absolute inset-0 backface-hidden w-full h-full">
                  <div className={cn(
                    "w-full h-full glass-card p-6 flex flex-col transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(109,93,246,0.15)]",
                    rating === 'got-it' ? "border-green-200 dark:border-green-900/50" : rating === 'review' ? "border-orange-200 dark:border-orange-900/50" : ""
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-light">Question</span>
                      {rating === 'got-it' && <ThumbsUp size={16} className="text-green-500" />}
                      {rating === 'review' && <AlertCircle size={16} className="text-orange-500" />}
                    </div>
                    
                    {card.imageUrl && (
                      <div className="w-full h-32 mb-4 rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center shrink-0">
                        <img src={card.imageUrl} alt="Reference" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    
                    <div className="flex-1 overflow-y-auto">
                      <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                        {card.front}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-muted dark:text-muted-light">
                      <span className="text-xs font-medium">Tap to reveal</span>
                      <RotateCw size={16} className="opacity-50 group-hover:opacity-100 group-hover:rotate-90 transition-all duration-300" />
                    </div>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full">
                  <div className="w-full h-full glass-card p-6 flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-dark-card dark:to-gray-900/50">
                    <div className="mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">Answer</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                      <p className="text-lg text-gray-800 dark:text-gray-100 leading-relaxed">
                        {card.back}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'RATE_CARD', id: card.id, rating: 'got-it' }); }}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                            rating === 'got-it' 
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" 
                              : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                          )}
                        >
                          <ThumbsUp size={14} /> Got it
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'RATE_CARD', id: card.id, rating: 'review' }); }}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                            rating === 'review' 
                              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800" 
                              : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                          )}
                        >
                          <AlertCircle size={14} /> Review
                        </button>
                      </div>
                      
                      <button 
                        onClick={(e) => handleCopy(e, card.back, card.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                          copiedId === card.id 
                            ? "bg-primary/10 text-primary" 
                            : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                        )}
                      >
                        {copiedId === card.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === card.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
