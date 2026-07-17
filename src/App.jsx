import React, { useReducer, useEffect, useRef, useState } from 'react';
import { generateContent } from './utils/ai';
import { EmptyState, LoadingState, ErrorState } from './components/States';
import { Flashcards } from './components/Flashcards';
import { Quiz } from './components/Quiz';
import { Results } from './components/Results';
import { History, saveToHistory } from './components/History';
import { Dashboard } from './components/Dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, BarChart3, Moon, Sun, Download, Sparkles, AlertCircle, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { cn } from './utils/cn';

const initialState = {
  theme: localStorage.getItem('sa_theme') || 'light',
  notes: localStorage.getItem('sa_notes') || '',
  mode: 'flashcards',          // 'flashcards' | 'quiz' | 'both'
  status: 'idle',              // 'idle' | 'loading' | 'success' | 'error'
  error: null,
  rejectionNote: null,
  requestId: 0,
  result: null,                // { flashcards: [], quiz: [], source: 'ai'|'fallback' }
  activeTab: 'flashcards',
  flashcards: { index: 0, flipped: new Set(), confidence: {} },  // confidence: { [cardId]: 'got-it' | 'review' }
  quiz: {
    current: 0,
    answers: [],
  },
  quizFinished: false,
  chaos: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'SET_NOTES':
      return { ...state, notes: action.value };
    case 'SET_MODE':
      return { ...state, mode: action.mode };
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'FLIP_CARD': {
      const flipped = new Set(state.flashcards.flipped);
      flipped.has(action.id) ? flipped.delete(action.id) : flipped.add(action.id);
      return { ...state, flashcards: { ...state.flashcards, flipped } };
    }
    case 'RATE_CARD': {
      const confidence = { ...state.flashcards.confidence, [action.id]: action.rating };
      return { ...state, flashcards: { ...state.flashcards, confidence } };
    }
    case 'GENERATE_START':
      return {
        ...state,
        status: 'loading',
        error: null,
        rejectionNote: null,
        requestId: state.requestId + 1,
        result: null,
        flashcards: { index: 0, flipped: new Set(), confidence: {} },
        quiz: { current: 0, answers: [] },
        quizFinished: false,
      };
    case 'GENERATE_SUCCESS':
      if (action.requestId !== state.requestId) return state;
      return {
        ...state,
        status: 'success',
        error: null,
        rejectionNote: action.rejectionNote || null,
        result: action.payload,
        activeTab: state.mode === 'quiz' ? 'quiz' : 'flashcards',
      };
    case 'GENERATE_FAILURE':
      if (action.requestId !== state.requestId) return state;
      return { ...state, status: 'error', error: action.error };
    case 'QUIZ_ANSWER': {
      const answers = state.quiz.answers.slice();
      answers[state.quiz.current] = action.answer;
      return { ...state, quiz: { ...state.quiz, answers } };
    }
    case 'QUIZ_NEXT': {
      if (state.quiz.current + 1 >= state.result.quiz.length) {
        return { ...state, quizFinished: true };
      }
      return {
        ...state,
        quiz: { ...state.quiz, current: state.quiz.current + 1 },
      };
    }
    case 'QUIZ_RESTART':
      return {
        ...state,
        quiz: { current: 0, answers: [] },
        quizFinished: false,
      };
    case 'QUIZ_PREV':
      if (state.quiz.current <= 0) return state;
      return { ...state, quiz: { ...state.quiz, current: state.quiz.current - 1 } };
    case 'QUIZ_RETEST_MISSED': {
      // Create a new quiz array with only missed questions
      const missedQuiz = action.missedIndices.map(i => state.result.quiz[i]);
      return {
        ...state,
        result: {
          ...state.result,
          quiz: missedQuiz
        },
        quiz: { current: 0, answers: [] },
        quizFinished: false,
      };
    }
    case 'QUIZ_RESTART_FULL':
      // Ideally we would fetch the original quiz, but for this demo, reloading is what the vanilla JS did
      window.location.reload();
      return state;
    case 'RESET':
      return {
        ...initialState,
        theme: state.theme,
        notes: state.notes,
        mode: state.mode,
      };
    case 'SET_CHAOS':
      return { ...state, chaos: action.chaos };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showHistory, setShowHistory] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const notesInputRef = useRef(null);
  const outputPanelRef = useRef(null);
  const triggerRef = useRef(null);
  const exportRef = useRef(null);

  // Sync theme
  useEffect(() => {
    localStorage.setItem('sa_theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Sync notes
  useEffect(() => {
    localStorage.setItem('sa_notes', state.notes);
  }, [state.notes]);

  // Toast listener
  const [toasts, setToasts] = React.useState([]);
  useEffect(() => {
    const handleToast = (e) => {
      const id = Date.now();
      setToasts(prev => [...prev, { ...e.detail, id }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 2500);
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  // Load history data for dashboard
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sa_history');
      if (raw) setHistoryData(JSON.parse(raw));
    } catch (_) {}
  }, [state.status]); // refresh when generation completes

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      // Ctrl+Enter: Generate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (triggerRef.current) triggerRef.current();
        return;
      }
      // Ctrl+E: Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (exportRef.current) exportRef.current();
        return;
      }
      // Arrow keys for navigation (only when not in textarea)
      if (document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' && state.status === 'success') {
        if (state.activeTab === 'quiz' && state.result?.quiz?.length) {
          dispatch({ type: 'QUIZ_NEXT' });
        }
      }
      if (e.key === 'ArrowLeft' && state.status === 'success') {
        if (state.activeTab === 'quiz' && state.quiz.current > 0) {
          dispatch({ type: 'QUIZ_PREV' });
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.status, state.activeTab, state.result, state.quiz.current]);

  const triggerGenerate = async () => {
    const notes = state.notes.trim();
    if (!notes) {
      if (notesInputRef.current) {
        notesInputRef.current.focus();
        notesInputRef.current.classList.remove('shake');
        void notesInputRef.current.offsetWidth; // trigger reflow
        notesInputRef.current.classList.add('shake');
      }
      return;
    }
    if (notes.length > 4000) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Notes are too long (4000 chars max). Please shorten them.', type: 'error' } }));
      if (notesInputRef.current) {
        notesInputRef.current.focus();
        notesInputRef.current.classList.remove('shake');
        void notesInputRef.current.offsetWidth;
        notesInputRef.current.classList.add('shake');
      }
      return;
    }

    dispatch({ type: 'GENERATE_START' });
    if (window.innerWidth < 900 && outputPanelRef.current) {
      outputPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const currentReqId = state.requestId + 1; // +1 because we dispatch immediately above
    try {
      const { payload, rejectionNote } = await generateContent(notes, state.mode, state.chaos);
      dispatch({ type: 'GENERATE_SUCCESS', payload, rejectionNote, requestId: currentReqId });
      saveToHistory(notes, payload);
    } catch (err) {
      dispatch({ type: 'GENERATE_FAILURE', error: err.message || 'Something went wrong', requestId: currentReqId });
    }
  };

  const chars = state.notes.length;
  const words = state.notes.trim() ? state.notes.trim().split(/\s+/).length : 0;
  
  let charClass = 'notes-charcount';
  if (chars > 4000) charClass += ' is-over';
  else if (chars > 3500) charClass += ' is-near';

  const exportToMarkdown = (result, confidence) => {
    let md = '# Study Materials\n\n';
    md += `*Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*\n\n`;

    if (result.flashcards?.length) {
      md += '## Flashcards\n\n';
      result.flashcards.forEach((c, i) => {
        const rating = confidence[c.id];
        const badge = rating === 'got-it' ? ' ✅' : rating === 'review' ? ' 🔄' : '';
        md += `### Card ${i + 1}${badge}\n`;
        md += `**Q:** ${c.front}\n\n`;
        md += `**A:** ${c.back}\n\n`;
        if (c.imageUrl) md += `![diagram](${c.imageUrl})\n\n`;
        md += '---\n\n';
      });
    }

    if (result.quiz?.length) {
      md += '## Quiz\n\n';
      result.quiz.forEach((q, i) => {
        md += `### Question ${i + 1}${q.type === 'true-false' ? ' (True/False)' : ''}\n`;
        md += `${q.question}\n\n`;
        q.options.forEach((opt, j) => {
          const marker = j === q.answerIndex ? '✅' : '⬜';
          md += `${marker} ${String.fromCharCode(65 + j)}) ${opt}\n`;
        });
        if (q.explanation) md += `\n> **Explanation:** ${q.explanation}\n`;
        md += '\n---\n\n';
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-materials-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Exported to Markdown!' } }));
  };

  // Wire up refs for keyboard shortcuts
  triggerRef.current = triggerGenerate;
  exportRef.current = state.result ? () => exportToMarkdown(state.result, state.flashcards.confidence) : null;

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg text-gray-900 dark:text-dark-text font-sans flex flex-col transition-colors duration-300">
      
      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "px-4 py-3 rounded-xl shadow-glass backdrop-blur-md border flex items-center gap-3 text-sm font-medium",
                toast.type === 'error' 
                  ? "bg-red-50/90 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300"
                  : "bg-white/90 dark:bg-dark-card border-primary/20 text-gray-800 dark:text-gray-200"
              )}
            >
              {toast.type === 'error' ? <AlertCircle size={18} /> : <div className="w-2 h-2 rounded-full bg-green-500" />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-dark-bg/80 border-b border-primary/10 dark:border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
              SA
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Study Assistant</h1>
              <p className="text-xs text-muted dark:text-muted-light font-medium">Notes → Flashcards & Quizzes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setShowHistory(!showHistory); setShowDashboard(false); }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                showHistory 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              )}
            >
              <BookOpen size={16} />
              <span className="hidden sm:inline">History</span>
            </button>
            <button 
              onClick={() => { setShowDashboard(!showDashboard); setShowHistory(false); }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                showDashboard 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              )}
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Stats</span>
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />
            <button 
              onClick={() => dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' })}
              className="p-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              {state.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row gap-8 p-4 lg:p-8">
        
        {/* Left Column (Input) - ~35% */}
        <section className="w-full lg:w-[35%] flex flex-col gap-6 shrink-0">
          
          {/* Notes Input Card */}
          <div className="glass-card flex flex-col overflow-hidden transition-shadow focus-within:shadow-[0_0_0_2px_rgba(109,93,246,0.5)]">
            <div className="px-5 py-3 border-b border-primary/5 dark:border-white/5 bg-white/40 dark:bg-white/5">
              <h2 className="text-xs font-bold text-muted dark:text-muted-light tracking-widest uppercase">Your Notes or Topic</h2>
            </div>
            <div className="relative flex-1 min-h-[250px]">
              <textarea 
                ref={notesInputRef}
                value={state.notes}
                onChange={(e) => dispatch({ type: 'SET_NOTES', value: e.target.value })}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    triggerGenerate();
                  }
                }}
                placeholder="Paste your study notes, a chapter, a topic, or anything you want to learn..."
                className="w-full h-full min-h-[250px] p-5 bg-transparent resize-none outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>
            
            {/* Word/Char Counter & Chaos Mode */}
            <div className="px-5 py-3 bg-white/40 dark:bg-white/5 flex items-center justify-between text-xs text-muted dark:text-muted-light border-t border-primary/5 dark:border-white/5">
              <div className="flex items-center gap-4">
                <span className={cn("font-medium", chars > 4000 ? "text-red-500" : chars > 3500 ? "text-orange-500" : "")}>
                  {chars} / 4000 chars
                </span>
                <span>{words} words</span>
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <span className="font-medium group-hover:text-primary transition-colors">Chaos Mode</span>
                <div className={cn(
                  "relative w-9 h-5 rounded-full transition-colors",
                  state.chaos ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"
                )}>
                  <input type="checkbox" className="sr-only" checked={state.chaos} onChange={(e) => dispatch({ type: 'SET_CHAOS', chaos: e.target.checked })} />
                  <motion.div 
                    layout 
                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: state.chaos ? 16 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="glass-card p-1.5 flex relative">
            {['flashcards', 'quiz', 'both'].map((mode) => (
              <button
                key={mode}
                onClick={() => dispatch({ type: 'SET_MODE', mode })}
                className={cn(
                  "flex-1 relative py-2.5 text-sm font-semibold capitalize z-10 transition-colors",
                  state.mode === mode ? "text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                {state.mode === mode && (
                  <motion.div
                    layoutId="activeMode"
                    className="absolute inset-0 bg-primary rounded-[14px] -z-10 shadow-md shadow-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {mode}
              </button>
            ))}
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={triggerGenerate}
            disabled={state.status === 'loading'}
            className={cn(
              "w-full py-4 rounded-[20px] font-bold text-lg text-white shadow-xl flex items-center justify-center gap-2 transition-all",
              state.status === 'loading' 
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-primary to-secondary shadow-primary/30 hover:shadow-primary/40 hover:from-primary/90 hover:to-secondary/90"
            )}
          >
            {state.status === 'loading' ? (
              <>
                <RefreshCw className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate Materials
              </>
            )}
          </motion.button>

          {/* Tip Card */}
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-2xl p-4 flex gap-3 text-sm text-primary/80 dark:text-primary/60">
            <Sparkles size={18} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Pro tip:</strong> Paste a URL, a messy brain dump, or highly technical concepts. The AI will extract the key learning objectives automatically.
            </p>
          </div>
        </section>

        {/* Right Column (Results) - ~65% */}
        <section className="w-full lg:w-[65%] flex flex-col min-h-[600px] relative" ref={outputPanelRef}>
          
          <AnimatePresence mode="wait">
            
            {showHistory && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 z-20"
              >
                <div className="glass-card h-full overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen className="text-primary"/> Study History</h2>
                    <button onClick={() => setShowHistory(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <History 
                      onLoad={(session) => {
                        dispatch({ type: 'SET_NOTES', value: session.notes });
                        dispatch({ type: 'GENERATE_SUCCESS', payload: session.result, rejectionNote: null, requestId: state.requestId });
                        setShowHistory(false);
                      }}
                      onClose={() => setShowHistory(false)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {showDashboard && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 z-20"
              >
                <div className="glass-card h-full overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="text-primary"/> Statistics</h2>
                    <button onClick={() => setShowDashboard(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <Dashboard history={historyData} onClose={() => setShowDashboard(false)} />
                  </div>
                </div>
              </motion.div>
            )}

            {!showHistory && !showDashboard && state.status === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <EmptyState />
              </motion.div>
            )}

            {!showHistory && !showDashboard && state.status === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center">
                <LoadingState />
              </motion.div>
            )}

            {!showHistory && !showDashboard && state.status === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center">
                <ErrorState error={state.error} onRetry={triggerGenerate} />
              </motion.div>
            )}

            {!showHistory && !showDashboard && state.status === 'success' && state.result && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                {state.rejectionNote && (
                  <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl flex items-start gap-3 text-orange-800 dark:text-orange-200 text-sm">
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <p><strong>Partial Generation:</strong> {state.rejectionNote}</p>
                  </div>
                )}
                
                {/* Result Tabs */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="glass-card p-1 inline-flex rounded-2xl">
                    {state.result.flashcards?.length > 0 && (
                      <button 
                        className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-colors", state.activeTab === 'flashcards' ? "bg-white dark:bg-dark-bg shadow-sm text-primary" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200")}
                        onClick={() => dispatch({ type: 'SET_TAB', tab: 'flashcards' })}
                      >
                        Flashcards
                      </button>
                    )}
                    {state.result.quiz?.length > 0 && (
                      <button 
                        className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-colors", state.activeTab === 'quiz' ? "bg-white dark:bg-dark-bg shadow-sm text-primary" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200")}
                        onClick={() => dispatch({ type: 'SET_TAB', tab: 'quiz' })}
                      >
                        Quiz
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => exportToMarkdown(state.result, state.flashcards.confidence)}
                    className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <Download size={16} />
                    Export .md
                  </button>
                </div>

                {/* Result Content */}
                <div className="flex-1 relative">
                  <AnimatePresence mode="wait">
                    {state.activeTab === 'flashcards' && state.result.flashcards?.length > 0 && (
                      <motion.div key="flashcards" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        <Flashcards 
                          flashcards={state.result.flashcards} 
                          flippedCards={state.flashcards.flipped}
                          confidence={state.flashcards.confidence}
                          dispatch={dispatch} 
                        />
                      </motion.div>
                    )}
                    
                    {state.activeTab === 'quiz' && state.result.quiz?.length > 0 && (
                      <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        {state.quizFinished ? (
                          <Results quizData={state.result.quiz} quizState={state.quiz} dispatch={dispatch} />
                        ) : (
                          <Quiz quizData={state.result.quiz} quizState={state.quiz} dispatch={dispatch} />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </section>
      </main>

    </div>
  );
}
