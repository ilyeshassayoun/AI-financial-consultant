import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, RotateCcw, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FocusTrap } from './FocusTrap';
import { streamChatReply } from '../services/apiService';
import { useProfileStore } from '../stores/profileStore';
import AdvisorEventBanners from './advisor/AdvisorEventBanners';
import OptimizationPatchCard from './advisor/OptimizationPatchCard';
import StatutoryCitations from './advisor/StatutoryCitations';

const stepPrompts = {
  welcome: [
    'How does this 360° German financial audit work?',
    'Which German statutory sources does the model reference?',
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

export default function AdvisorDrawer({
  isOpen,
  onClose,
  profile,
  analysis: _analysis,
  currentStep = 'welcome',
  initialMessage,
  onApplyPatch
}) {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: '### Financial planning assistant\n\nI can explain the calculations currently shown in your plan, compare scenarios, and help you identify which inputs still need verification.\n\n*What would you like to review?*'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [deltaBadges, setDeltaBadges] = useState([]);
  const [patchProposals, setPatchProposals] = useState([]);
  const [citations, setCitations] = useState([]);

  const endOfMessagesRef = useRef(null);
  const inputRef = useRef(null);
  const drawerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const citationsRef = useRef([]);
  const patchesRef = useRef([]);
  const deltaBadgesRef = useRef([]);

  const scrollToBottom = useCallback(() => {
    if (typeof endOfMessagesRef.current?.scrollIntoView === 'function') {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handlePreviewScenario = useCallback((patch) => {
    if (patch && typeof patch === 'object') {
      useProfileStore.getState().previewScenario(patch);
    }
  }, []);

  const handleApplyToProfile = useCallback((patch) => {
    if (patch && typeof patch === 'object') {
      if (onApplyPatch) {
        onApplyPatch(patch);
      } else {
        useProfileStore.getState().updateProfile(patch);
        useProfileStore.getState().commitScenario();
      }
    }
  }, [onApplyPatch]);

  const submitMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text };
    const initialAssistantMessage = { role: 'assistant', content: '' };
    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, initialAssistantMessage]);
    setInput('');
    setLoading(true);

    // Reset current query events
    setActiveHighlight(null);
    setDeltaBadges([]);
    setPatchProposals([]);
    setCitations([]);
    citationsRef.current = [];
    patchesRef.current = [];
    deltaBadgesRef.current = [];

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
            setMessages([...updatedMessages, {
              role: 'assistant',
              content: accumulatedContent,
              citations: [...citationsRef.current],
              patches: [...patchesRef.current],
              deltaBadges: [...deltaBadgesRef.current]
            }]);
          }
        },
        (eventObj) => {
          if (signal.aborted || !eventObj) return;
          const eventName = eventObj.event;
          const eventData = eventObj.data || {};

          if (eventName === 'highlight_metric') {
            setActiveHighlight(eventData);
            // Pulse target element in the document
            try {
              const target = eventData.target;
              if (target) {
                const targetSelector = `[data-metric-target="${target}"], [data-stat="${target}"], #${target}, .metric-${target}`;
                const matched = document.querySelectorAll(targetSelector);
                matched.forEach(el => {
                  el.classList.add('fintech-metric-pulse');
                  setTimeout(() => el.classList.remove('fintech-metric-pulse'), eventData.duration_ms || 4000);
                });
                window.dispatchEvent(new CustomEvent('fintech:highlight_metric', { detail: eventData }));
              }
            } catch (err) {
              console.warn('[AdvisorDrawer] Could not pulse metric node:', err);
            }
          } else if (eventName === 'delta_badge') {
            setDeltaBadges(prev => {
              const next = [...prev.filter(b => b.target !== eventData.target), eventData];
              deltaBadgesRef.current = next;
              return next;
            });
            window.dispatchEvent(new CustomEvent('fintech:delta_badge', { detail: eventData }));
          } else if (eventName === 'patch_proposal' || eventName === 'optimization_patch') {
            const proposal = {
              proposal_id: eventData.proposal_id || `patch-${Date.now()}`,
              title: eventData.title || 'Optimization Patch',
              description: eventData.description || eventData.rationale || '',
              patch: eventData.patch || {},
              impact: eventData.impact || {},
              status: 'pending'
            };
            setPatchProposals(prev => {
              const next = [...prev.filter(p => p.proposal_id !== proposal.proposal_id), proposal];
              patchesRef.current = next;
              return next;
            });
          } else if (eventName === 'statutory_citation') {
            setCitations(prev => {
              const next = [...prev, eventData];
              citationsRef.current = next;
              return next;
            });
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
          content: '### Concierge temporarily unavailable\n\nYour financial calculations are still available on each specialist page. Please check your connection and retry shortly; no recommendation has been inferred while the service is unavailable.'
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
  }, [messages, loading, patchProposals, scrollToBottom]);

  // Cleanup on unmount or when drawer closes
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCopy = (text, idx) => {
    navigator.clipboard?.writeText(text);
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
    setActiveHighlight(null);
    setDeltaBadges([]);
    setPatchProposals([]);
    setCitations([]);
  };

  if (!isOpen) return null;

  const quickPrompts = stepPrompts[currentStep] || stepPrompts.welcome;

  return (
    <>
      <style>{`
        @keyframes fintechPulseGold {
          0% { box-shadow: 0 0 0 0 rgba(197, 160, 89, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(197, 160, 89, 0); }
          100% { box-shadow: 0 0 0 0 rgba(197, 160, 89, 0); }
        }
        .fintech-metric-pulse {
          animation: fintechPulseGold 1.6s infinite !important;
          outline: 2px solid var(--maison-gold, #c5a059) !important;
        }
      `}</style>
      <FocusTrap isActive={isOpen} containerRef={drawerRef} onEscape={onClose} />

      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8, 15, 26, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          transition: 'all 0.25s ease'
        }}
      />

      {/* Drawer Panel */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="AI Wealth Concierge Advisory Drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(540px, 100vw)',
          background: 'var(--bg-card, #ffffff)',
          borderLeft: '1px solid var(--border-architectural, #d8dee8)',
          boxShadow: '-8px 0 32px rgba(8, 15, 26, 0.16)',
          zIndex: 2001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideLeft 0.25s ease-out'
        }}
      >
        {/* Header */}
        <header style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-architectural, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card-subtle, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #10223d, #1a365d)',
              border: '1px solid var(--maison-gold, #c5a059)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--maison-gold, #c5a059)'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-serif, Georgia, serif)', color: 'var(--text-primary, #0f172a)' }}>
                Financial Plan Concierge
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #64748b)' }}>
                Model-grounded explanations · Live responses
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleResetChat}
              aria-label="Reset conversation"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary, #64748b)',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close advisory drawer"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary, #64748b)',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <AdvisorEventBanners activeHighlight={activeHighlight} deltaBadges={deltaBadges} />

        {/* Message Thread */}
        <div
          style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: 'var(--bg-main, #f8fafc)'
          }}
        >
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: isUser ? 'var(--maison-obsidian, #10223d)' : 'var(--bg-card, #ffffff)',
                    color: isUser ? '#ffffff' : 'var(--text-primary, #0f172a)',
                    border: '1px solid var(--border-architectural, #e2e8f0)',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <ReactMarkdown
                    components={{
                      h3: (props) => <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '4px 0 6px', color: isUser ? 'var(--maison-gold)' : 'var(--text-primary)' }} {...props} />,
                      p: (props) => <p style={{ margin: '0 0 6px' }} {...props} />,
                      ul: (props) => <ul style={{ margin: '4px 0 6px', paddingLeft: '18px' }} {...props} />,
                      li: (props) => <li style={{ margin: '2px 0' }} {...props} />,
                      strong: (props) => <strong style={{ color: isUser ? 'var(--maison-gold)' : 'var(--text-primary)', fontWeight: 800 }} {...props} />
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>

                  {/* Render citations attached to this turn */}
                  {idx === messages.length - 1 && <StatutoryCitations citations={citations} />}

                  {/* Render Optimization Patch Cards */}
                  {idx === messages.length - 1 && patchProposals.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      {patchProposals.map((proposal) => (
                        <OptimizationPatchCard
                          key={proposal.proposal_id}
                          proposal={proposal}
                          onPreview={handlePreviewScenario}
                          onApply={handleApplyToProfile}
                          onDismiss={(id) => setPatchProposals(prev => prev.filter(p => p.proposal_id !== id))}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {!isUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleCopy(m.content, idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary, #64748b)',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedIdx === idx ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                      <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Quick Question Chips */}
        <div style={{ padding: '10px 16px', background: 'var(--bg-card, #ffffff)', borderTop: '1px solid var(--border-architectural, #e2e8f0)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => submitMessage(prompt)}
              disabled={loading}
              style={{
                fontSize: '0.72rem',
                whiteSpace: 'nowrap',
                padding: '5px 10px',
                borderRadius: '16px',
                border: '1px solid var(--border-architectural, #e2e8f0)',
                background: 'var(--bg-card-subtle, #f8fafc)',
                color: 'var(--text-primary, #0f172a)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <footer style={{ padding: '12px 16px', background: 'var(--bg-card, #ffffff)', borderTop: '1px solid var(--border-architectural, #e2e8f0)' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitMessage(input);
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your financial plan or statutory rules..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-architectural, #cbd5e1)',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid var(--maison-gold, #c5a059)',
                background: 'var(--maison-obsidian, #10223d)',
                color: '#ffffff',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <Send size={15} color="var(--maison-gold, #c5a059)" />
            </button>
          </form>
        </footer>
      </aside>
    </>
  );
}
