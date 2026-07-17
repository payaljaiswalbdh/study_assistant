import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, XCircle, CheckCircle2, RotateCcw, ArrowRight, BookOpen } from 'lucide-react';
import { cn } from '../utils/cn';

export function Results({ quizData, quizState, dispatch }) {
  const { answers } = quizState;
  const total = quizData.length;
  const correct = answers.filter(a => a && a.correct).length;
  const wrong = total - correct;
  const percent = Math.round((correct / total) * 100);

  useEffect(() => {
    if (percent === 100) {
      triggerConfetti();
    }
  }, [percent]);

  let message = 'Nice work!';
  if (percent === 100) message = 'Perfect score — you crushed it.';
  else if (percent >= 80) message = 'Strong showing — you know this well.';
  else if (percent >= 60) message = 'Solid. Re-test the ones you missed to lock it in.';
  else if (percent >= 40) message = 'Made progress. Review the cards and try again.';
  else message = 'Worth another pass — flip through the cards and retry.';

  const wrongItems = answers
    .map((a, i) => ({ a, q: quizData[i] }))
    .filter(({ a }) => a && !a.correct);

  const handleRetestMissed = () => {
    const missedIndices = answers
      .map((a, i) => (a && !a.correct ? i : null))
      .filter(i => i !== null);
    if (!missedIndices.length) return;
    dispatch({ type: 'QUIZ_RETEST_MISSED', missedIndices });
  };

  const handleRestart = () => {
    dispatch({ type: 'QUIZ_RESTART_FULL' });
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto py-8">
      
      {/* Score Header */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ type: "spring", bounce: 0.5 }}
        className="text-center mb-10"
      >
        <div className="relative inline-block mb-6">
          <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-2xl shadow-primary/30 rotate-3">
            <span className="text-4xl font-black -rotate-3">{percent}%</span>
          </div>
          {percent === 100 && (
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
              className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-dark-bg z-10"
            >
              <Trophy size={20} />
            </motion.div>
          )}
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{message}</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium">You got {correct} out of {total} questions correct.</p>
      </motion.div>

      {/* Stats Breakdown */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 w-full mb-10"
      >
        <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-2"><CheckCircle2 size={20} /></div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{correct}</div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Correct</div>
        </div>
        <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-2"><XCircle size={20} /></div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{wrong}</div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Missed</div>
        </div>
        <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2"><Target size={20} /></div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</div>
        </div>
      </motion.div>

      {/* Missed Questions */}
      {wrongItems.length > 0 && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="w-full mb-10"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <XCircle className="text-red-500" size={20} /> Review Missed Questions
          </h3>
          <div className="space-y-4">
            {wrongItems.map(({ a, q }, idx) => (
              <div key={idx} className="glass-card p-6 border-red-100 dark:border-red-900/30">
                <p className="font-semibold text-gray-900 dark:text-white mb-4">{q.question}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl">
                    <XCircle size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold block text-xs uppercase tracking-wider mb-0.5">You answered</span>
                      {q.options[a.selectedIndex] || '—'}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/10 p-3 rounded-xl">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold block text-xs uppercase tracking-wider mb-0.5">Correct Answer</span>
                      {q.options[q.answerIndex]}
                    </div>
                  </div>
                </div>
                {q.explanation && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 text-sm text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Why: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="w-full flex flex-col sm:flex-row gap-3"
      >
        <button 
          onClick={handleRestart}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-[16px] bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <RotateCcw size={18} />
          Full Quiz
        </button>
        {wrongItems.length > 0 && (
          <button 
            onClick={handleRetestMissed}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-[16px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <Target size={18} />
            Re-test Missed
          </button>
        )}
        <button 
          onClick={() => dispatch({ type: 'SET_TAB', tab: 'flashcards' })}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-[16px] bg-primary text-white font-semibold shadow-lg shadow-primary/30 hover:scale-[1.02] transition-transform"
        >
          <BookOpen size={18} />
          Study Cards
        </button>
      </motion.div>
    </div>
  );
}

function triggerConfetti() {
  const colors = ['#8b5cf6', '#5b5bf3', '#10b981', '#f59e0b', '#ec4899'];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'absolute w-2 h-2 md:w-3 md:h-3 rounded-full opacity-0 pointer-events-none z-50';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.top = '-5vh';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Quick and dirty CSS animation for confetti
    const duration = Math.random() * 3 + 2;
    const tx = (Math.random() - 0.5) * 500;
    const keyframes = `
      @keyframes confetti-${i} {
        0% { transform: translateY(0) rotate(0) translateX(0); opacity: 1; }
        100% { transform: translateY(100vh) rotate(${Math.random() * 720}deg) translateX(${tx}px); opacity: 0; }
      }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = keyframes;
    document.head.appendChild(styleSheet);
    
    piece.style.animation = `confetti-${i} ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
    
    document.body.appendChild(piece);
    setTimeout(() => {
      piece.remove();
      styleSheet.remove();
    }, duration * 1000);
  }
}
