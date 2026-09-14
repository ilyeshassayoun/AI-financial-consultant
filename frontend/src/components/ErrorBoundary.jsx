import { Component } from 'react';
import styles from '../styles/shared.module.css';
import { getCorrelationId } from '../services/apiService';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, correlationId: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const correlationId = getCorrelationId();
    this.setState({
      error,
      errorInfo,
      correlationId
    });
    console.error(`[ErrorBoundary] [X-Correlation-ID: ${correlationId}] caught an error:`, error, errorInfo);
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.resetError();
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          const Fallback = this.props.fallback;
          return <Fallback error={this.state.error} correlationId={this.state.correlationId} resetError={this.resetError.bind(this)} />;
        }
        return this.props.fallback;
      }
      return (
        <div
          role="alert"
          aria-live="assertive"
          className={`${styles.cardBase} ${styles.animateFadeInUp}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'min(680px, calc(100% - 32px))',
            minHeight: '320px',
            padding: 'clamp(28px, 6vw, 52px)',
            textAlign: 'center',
            margin: 'clamp(24px, 8vh, 72px) auto',
            color: 'var(--text-primary, #12233f)',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-architectural, #d8dee8)',
            borderTop: '3px solid var(--maison-gold, #c5a059)',
            borderRadius: '18px',
            boxShadow: '0 18px 50px rgba(18, 35, 63, 0.12)',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '64px',
              height: '64px',
              marginBottom: '20px',
              borderRadius: '50%',
              background: 'rgba(197, 160, 89, 0.14)',
              border: '1px solid rgba(197, 160, 89, 0.4)',
              fontSize: '30px'
            }}
            aria-hidden="true"
          >
            ⚠️
          </div>
          <h2
            className={`${styles.textPrimary} ${styles.fontBold}`}
            style={{
              margin: '0 0 10px',
              color: 'var(--text-primary, #12233f)',
              fontSize: 'clamp(1.35rem, 4vw, 1.75rem)',
              lineHeight: 1.2
            }}
          >
            Something went wrong
          </h2>
          <p
            className={styles.textSecondary}
            style={{
              maxWidth: '480px',
              margin: '0 0 20px',
              color: 'var(--text-secondary, #526176)',
              fontSize: '1rem',
              lineHeight: 1.6
            }}
          >
            This section could not load. Your saved inputs are safe. Try the section again, or use the navigation to continue elsewhere.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px',
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'var(--bg-porcelain, #f4f6f8)',
              border: '1px solid var(--border-architectural, #d8dee8)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary, #526176)',
              fontFamily: 'monospace'
            }}
          >
            <span>Trace Diagnostic:</span>
            <strong style={{ color: 'var(--text-primary, #12233f)' }}>
              {this.state.correlationId || getCorrelationId()}
            </strong>
          </div>

          <button
            type="button"
            onClick={this.resetError.bind(this)}
            className={styles.btnPrimary}
            style={{
              minWidth: '148px',
              minHeight: '46px',
              padding: '12px 24px',
              border: '1px solid var(--maison-gold, #c5a059)',
              borderRadius: '10px',
              background: 'var(--maison-obsidian, #10223d)',
              color: '#ffffff',
              boxShadow: '0 8px 22px rgba(16, 34, 61, 0.2)',
              font: 'inherit',
              fontWeight: 750,
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: '24px', textAlign: 'left', width: '100%', maxWidth: '600px' }}>
              <summary className={styles.textSecondary} style={{ cursor: 'pointer' }}>
                Error Details (Development · Correlation ID: {this.state.correlationId || getCorrelationId()})
              </summary>
              <pre
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'var(--bg-porcelain)',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '12px',
                  color: 'var(--text-primary)'
                }}
              >
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }

  resetError() {
    this.setState({ hasError: false, error: null, errorInfo: null, correlationId: null });
  }
}

export default ErrorBoundary;
