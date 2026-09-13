import { Component } from 'react';
import styles from '../styles/shared.module.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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
          return <Fallback error={this.state.error} resetError={this.resetError.bind(this)} />;
        }
        return this.props.fallback;
      }
      return (
        <div className={`${styles.cardBase} ${styles.animateFadeInUp}`} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          padding: '40px',
          textAlign: 'center',
          margin: '20px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>⚠️</div>
          <h2 className={`${styles.textPrimary} ${styles.fontBold}`} style={{
            marginBottom: '8px',
            fontSize: '20px'
          }}>Something went wrong</h2>
          <p className={styles.textSecondary} style={{
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            This section could not load. Try again or open another section.
          </p>
          <button
            onClick={this.resetError.bind(this)}
            className={styles.btnPrimary}
          >
            Try Again
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: '24px', textAlign: 'left', width: '100%', maxWidth: '600px' }}>
              <summary className={styles.textSecondary} style={{ cursor: 'pointer' }}>
                Error Details (Development)
              </summary>
              <pre style={{
                marginTop: '12px',
                padding: '12px',
                background: 'var(--bg-porcelain)',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '12px',
                color: 'var(--text-primary)'
              }}>
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
    this.setState({ hasError: false, error: null, errorInfo: null });
  }
}

export default ErrorBoundary;
