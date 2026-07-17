import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '../utils/cn';

export function Quiz({ quizData, quizState, dispatch }) {
  const { current, answers } = quizState;
  const quiz = quizData;
  const q = quiz[current];
  const existingAnswer = answers[current];
  const percent = Math.round(((current + 1) / quiz.length) * 100);
  const isTrueFalse = q.type === 'true-false' || (q.options && q.options.length === 2 && q.options.includes('True') && q.options.includes('False'));

  const isLast = current + 1 >= quiz.length;
  const allAnswered = !!existingAnswer;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm font-medium text-muted dark:text-muted-light mb-3">
          <span>Question {current + 1} of {quiz.length}</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(109,93,246,0.5)]"
          />
        </div>
      </div>

      {/* Question */}
      <motion.div 
        key={current}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex-1"
      >
        <div className="mb-8">
          {isTrueFalse && (
            <span className="inline-block px-3 py-1 mb-3 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-xs font-bold uppercase tracking-wider">
              True / False
            </span>
          )}
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white leading-tight">
            {q.question}
          </h2>
        </div>
        
        {/* Options */}
        <div className={cn(
          "grid gap-3",
          isTrueFalse ? "grid-cols-2" : "grid-cols-1"
        )}>
          {q.options.map((opt, i) => {
            let stateClass = "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-primary/50 hover:bg-primary/5";
            let Icon = null;
            
            if (existingAnswer) {
              if (i === q.answerIndex) {
                stateClass = "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300 z-10 shadow-[0_0_15px_rgba(34,197,94,0.15)]";
                Icon = CheckCircle2;
              } else if (i === existingAnswer.selectedIndex) {
                stateClass = "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-300 z-10";
                Icon = XCircle;
              } else {
                stateClass = "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-400 dark:text-gray-600 opacity-50";
              }
            }

            return (
              <button 
                key={i} 
                disabled={!!existingAnswer}
                className={cn(
                  "relative p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4",
                  stateClass,
                  isTrueFalse && "justify-center text-center p-6 text-lg font-semibold"
                )}
                onClick={() => {
                  if (existingAnswer) return;
                  dispatch({ type: 'QUIZ_ANSWER', answer: { questionIndex: current, selectedIndex: i, correct: i === q.answerIndex } });
                }}
              >
                {!isTrueFalse && (
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 font-bold text-sm transition-colors",
                    existingAnswer && i === q.answerIndex ? "bg-green-500 border-green-500 text-white" :
                    existingAnswer && i === existingAnswer.selectedIndex ? "bg-red-500 border-red-500 text-white" :
                    "border-gray-200 dark:border-white/20 text-gray-500 dark:text-gray-400"
                  )}>
                    {String.fromCharCode(65 + i)}
                  </div>
                )}
                
                <span className="flex-1 font-medium">{isTrueFalse ? (opt === 'True' ? 'True' : 'False') : opt}</span>
                
                {Icon && <Icon className="shrink-0" size={20} />}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {existingAnswer && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
              className="overflow-hidden"
            >
              <div className={cn(
                "p-5 rounded-2xl border flex gap-4",
                existingAnswer.correct 
                  ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50" 
                  : "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50"
              )}>
                <div className="shrink-0 mt-0.5">
                  {existingAnswer.correct ? <CheckCircle2 className="text-green-600 dark:text-green-400" /> : <XCircle className="text-red-600 dark:text-red-400" />}
                </div>
                <div>
                  <h4 className={cn("font-bold mb-1", existingAnswer.correct ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300")}>
                    {existingAnswer.correct ? 'Correct!' : 'Not quite.'}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {q.explanation || 'No explanation provided.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Actions */}
      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
        <button 
          className="flex items-center gap-2 px-4 py-2 text-muted dark:text-muted-light hover:text-gray-900 dark:hover:text-white transition-colors font-medium text-sm rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
          onClick={() => dispatch({ type: 'QUIZ_RESTART' })}
        >
          <RotateCcw size={16} />
          Restart Quiz
        </button>
        
        <button 
          disabled={!allAnswered}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all",
            allAnswered 
              ? "bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105" 
              : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed"
          )}
          onClick={() => dispatch({ type: 'QUIZ_NEXT' })}
        >
          {isLast ? 'See Results' : 'Next Question'}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
