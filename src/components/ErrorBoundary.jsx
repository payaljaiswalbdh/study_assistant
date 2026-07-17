import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg, #f0f2f5)',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: '480px',
            textAlign: 'center',
            padding: '2.5rem',
            borderRadius: '16px',
            background: 'var(--card-bg, #fff)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: '1px solid var(--glass-border, rgba(0,0,0,0.06))',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😵</div>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.3rem', fontWeight: 700 }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--text-light, #666)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              The app encountered an unexpected error. Your study history is safe in localStorage.
            </p>
            <details style={{ textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-light, #999)' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Error details</summary>
              <pre style={{ 
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', 
                padding: '0.75rem', borderRadius: '8px',
                background: 'var(--glass-bg, #f5f5f5)', 
                maxHeight: '120px', overflow: 'auto' 
              }}>
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '999px',
                border: 'none',
                background: 'linear-gradient(135deg, hsl(255, 70%, 55%), hsl(280, 70%, 55%))',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 16px rgba(100,60,200,0.3)'; }}
              onMouseOut={(e) => { e.target.style.transform = ''; e.target.style.boxShadow = ''; }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
