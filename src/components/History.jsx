import React, { useState, useEffect } from 'react';

export function History({ onLoad, onClose }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sa_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSessions(Array.isArray(parsed) ? parsed : []);
      }
    } catch (_) {}
  }, []);

  const handleDelete = (id) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('sa_history', JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setSessions([]);
    localStorage.removeItem('sa_history');
  };

  if (sessions.length === 0) {
    return (
      <div className="history-panel">
        <div className="history-header">
          <h3 style={{ margin: 0 }}>📚 Study History</h3>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: '0.85rem' }}>✕ Close</button>
        </div>
        <div className="history-empty" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No saved sessions yet</p>
          <p style={{ fontSize: '0.85rem' }}>Generate study materials and they'll appear here automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3 style={{ margin: 0 }}>📚 Study History</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={handleClearAll} style={{ fontSize: '0.8rem', color: 'var(--danger, #e74c3c)' }}>Clear all</button>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: '0.85rem' }}>✕ Close</button>
        </div>
      </div>
      <div className="history-list">
        {sessions.map(session => (
          <div key={session.id} className="history-item" onClick={() => onLoad(session)}>
            <div className="history-item-meta">
              <span className="history-item-date">{new Date(session.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="history-item-stats">
                {session.flashcardCount > 0 && `${session.flashcardCount} cards`}
                {session.flashcardCount > 0 && session.quizCount > 0 && ' · '}
                {session.quizCount > 0 && `${session.quizCount} questions`}
              </span>
            </div>
            <div className="history-item-preview">{session.preview}</div>
            <button 
              className="history-delete-btn" 
              onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
              aria-label="Delete session"
            >🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Save a generation to history.
 */
export function saveToHistory(notes, result) {
  try {
    const raw = localStorage.getItem('sa_history');
    const history = raw ? JSON.parse(raw) : [];
    
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      preview: notes.slice(0, 120).replace(/\n/g, ' ') + (notes.length > 120 ? '…' : ''),
      flashcardCount: result.flashcards?.length || 0,
      quizCount: result.quiz?.length || 0,
      notes,
      result,
    };

    // Keep most recent 20 sessions
    history.unshift(entry);
    if (history.length > 20) history.pop();
    
    localStorage.setItem('sa_history', JSON.stringify(history));
  } catch (_) {
    // localStorage full or disabled — silently skip
  }
}
