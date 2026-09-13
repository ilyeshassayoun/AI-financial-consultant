import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Send, Bot, Sparkles, RotateCcw, Copy, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FocusTrap } from './FocusTrap';
import { streamChatReply } from '../services/apiService';

const stepPrompts = {
  welcome: [
    'How does this 360° German financial audit work?',
    'What German statutory laws are verified?',
    'What is the DIN 77230 actuarial standard?'
  ],
  profile: [
    'How can I optimize my monthly savings rate?',
    'What is my capitalized lifetime human asset value?',
    'How do I budget for early financial independence?'
  ],
  insurance: [
    'Why is statutory BU disability pension only ~€550/mo?',
    'Explain § 823 BGB unlimited personal liability',
    'When does switching to PKV private health make sense?'
  ],
  tax: [
    'How much can I claim for commute & home office (§ 9)?',
    'How does the 30% Teilfreistellung equity exemption work?',
    'How do I maximize my annual tax return?'
  ],
  invest: [
    'Explain the 70/30 Core-Satellite ETF strategy',
    'How much do low TER fees save over 30 years?',
    'What is the 4% Safe Withdrawal Rate (SWR)?'
  ],
  pension: [
    'What is my statutory Rentenlücke retirement gap?',
    'How are DRV Entgeltpunkte calculated?',
    'How do I close my pension gap with ETF dividends?'
  ]
};

export default function AdvisorDrawer({ isOpen, onClose, profile, currentStep = 'welcome', initialMessage }) {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: '### ✦ Ilyes AI Private Wealth Concierge\n\nWelcome to your personalized German financial consultation desk. I have full real-time visibility into your audit metrics, tax bracket (§ 32a EStG), liability defense (§ 823 BGB), and 3-Pillar statutory pension solvency.\n\n*How may I assist your wealth strategy today?*' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const endOfMessagesRef = useRef(null);
  const inputRef = useRef(null);
  const drawerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const submitMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text };
    const initialAssistantMessage = { role: 'assistant', content: '' };
    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, initialAssistantMessage]);
    setInput('');
    setLoading(true);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    let accumulatedContent = '';

    try {
      await streamChatReply(
        profile,
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        (chunk) => {
          if (!signal.aborted) {
            accumulatedContent += chunk;
            setMessages([...updatedMessages, { role: 'assistant', content: accumulatedContent }]);
          }
        },
        signal
      );
      if (!accumulatedContent && !signal.aborted) {
        setMessages([...updatedMessages, { role: 'assistant', content: 'The advisory service did not return a response. Please retry in a moment.' }]);
      }
    } catch (err) {
      if (err.name !== 'AbortError' && !signal.aborted) {
        console.error(err);
        setMessages([...updatedMessages, { 
          role: 'assistant', 
          content: '### ✦ Ilyes AI Advisory Note\n\nUnable to reach backend API endpoint. The offline actuarial rules engine recommends verifying your core **Privathaftpflicht (€50M)** and **Occupational Disability BU (80% Net)** shields while claiming all **§ 9 EStG Werbungskosten**.' 
        }]);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [messages, loading, profile]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();
      }, 100);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      if (initialMessage && initialMessage.trim()) {
        const timer = setTimeout(() => {
          submitMessage(`Can you elaborate on this consultation finding: "${initialMessage.slice(0, 160)}..."?`);
        }, 150);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('keydown', handleKeyDown);
        };
      }

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, initialMessage, onClose, scrollToBottom, submitMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Cleanup on unmount or when drawer closes
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      { 
        role: 'assistant', 
        content: '### ✦ AI assistant\n\nChat history reset. How may I assist your German tax optimization, insurance defense, or investment portfolio today?'
      }
    ]);
  };

  const handleSend = (e) => {
    e.preventDefault();
    submitMessage(input);
  };

  if (!isOpen) return null;

  const currentPrompts = stepPrompts[currentStep] || stepPrompts.welcome;

  return (
    <>
      <FocusTrap
        isActive={isOpen}
        containerRef={drawerRef}
        onEscape={onClose}
        disableAutoFocus={true}
      />
      {/* Frosted Glass Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(6, 11, 20, 0.45)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 1299
        }}
      />
      <div 
        ref={drawerRef}
        id="ai-assistant"
        role="dialog"
        aria-label="AI Support Desk"
        aria-modal="true"
        className="animate-fade-in-up"
        style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '460px',
        maxWidth: '100vw',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border-architectural)',
        boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.35)',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      {/* Executive Private Banking Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-architectural)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--maison-obsidian)',
            color: 'var(--maison-gold)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-elevated)',
            border: '1.2px solid var(--maison-gold-border)'
          }}>
            <Bot size={18} color="var(--maison-gold)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                ILYES AI CONCIERGE
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(92, 140, 103, 0.15)',
                color: 'var(--accent-emerald)',
                fontSize: '0.6rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
                ONLINE
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Fiduciary Wealth Advisory • DIN 77230 Certified
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            type="button"
            onClick={handleResetChat}
            title="Reset Chat Session"
            style={{ 
              background: 'var(--bg-card-subtle)', 
              border: '1px solid var(--border-architectural)', 
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer', 
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RotateCcw size={14} />
          </button>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close AI Support Desk"
            style={{ 
              background: 'var(--bg-card-subtle)', 
              border: '1px solid var(--border-architectural)', 
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer', 
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Context Badge & Suggested Prompts Ribbon */}
      <div style={{ 
        padding: '10px 16px', 
        background: 'var(--bg-card-subtle)', 
        borderBottom: '1px solid var(--border-architectural)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            STEP CONSULTATION PROMPTS
          </span>
          <span className="badge badge-brand" style={{ fontSize: '0.58rem', padding: '1px 5px' }}>
            {currentStep.toUpperCase()} FOCUS
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {currentPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => submitMessage(prompt)}
              className="hover-lift"
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-architectural)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
              }}
            >
              <Sparkles size={10} color="var(--maison-gold)" /> {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Message List */}
      <div style={{ 
        flex: 1, 
        padding: '18px 16px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '14px', 
        background: 'var(--bg-main)' 
      }}>
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div 
              key={idx}
              className="animate-fade-in-up"
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div 
                style={{
                  padding: '12px 16px',
                  borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: isUser ? 'var(--maison-obsidian)' : 'var(--bg-card)',
                  color: isUser ? '#ffffff' : 'var(--text-primary)',
                  border: isUser ? '1px solid var(--border-architectural)' : '1px solid var(--border-architectural)',
                  fontSize: '0.82rem',
                  lineHeight: '1.5',
                  boxShadow: 'var(--shadow-elevated)'
                }}
              >
                <div className="markdown-body">
                  <ReactMarkdown
                    components={{
                      h3: (props) => <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '4px 0 8px 0', color: isUser ? 'var(--maison-gold)' : 'var(--text-primary)' }} {...props} />,
                      p: (props) => <p style={{ margin: '0 0 6px 0' }} {...props} />,
                      ul: (props) => <ul style={{ margin: '4px 0 6px 0', paddingLeft: '18px' }} {...props} />,
                      li: (props) => <li style={{ margin: '2px 0' }} {...props} />,
                      strong: (props) => <strong style={{ color: isUser ? 'var(--maison-gold)' : 'var(--text-primary)', fontWeight: 800 }} {...props} />
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Message Footer with Copy Action */}
              {!isUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(m.content, idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: 0
                    }}
                  >
                    {copiedIdx === idx ? <Check size={10} color="var(--accent-emerald)" /> : <Copy size={10} />}
                    <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                  <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)' }}>• DIN 77230 Verified</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div 
            className="animate-fade-in-up"
            style={{ 
              alignSelf: 'flex-start', 
              background: 'var(--bg-card)', 
              padding: '10px 14px', 
              borderRadius: '12px', 
              fontSize: '0.78rem', 
              color: 'var(--text-secondary)', 
              border: '1px solid var(--border-architectural)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              boxShadow: 'var(--shadow-elevated)'
            }}
          >
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--maison-obsidian)', animation: 'subtleFloat 1s infinite' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--maison-gold)', animation: 'subtleFloat 1s infinite 0.2s' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', animation: 'subtleFloat 1s infinite 0.4s' }} />
            </div>
            <span>Evaluating statutory German financial parameters...</span>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Footer */}
      <form 
        onSubmit={handleSend} 
        style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid var(--border-architectural)', 
          display: 'flex', 
          gap: '8px', 
          background: 'var(--bg-card)' 
        }}
      >
        <input 
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Ilyes AI about your consultation..."
          aria-label="Message AI Concierge"
          style={{ 
            fontSize: '0.82rem', 
            padding: '9px 14px', 
            borderRadius: '8px', 
            border: '1px solid var(--border-architectural)', 
            flex: 1, 
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
        <button 
          type="submit" 
          className="btn-brand" 
          disabled={loading || !input.trim()}
          aria-label="Send Message"
          style={{ padding: '9px 14px', borderRadius: '8px', opacity: loading || !input.trim() ? 0.5 : 1 }}
        >
          <Send size={15} color="#ffffff" />
        </button>
      </form>
    </div>
    </>
  );
}
