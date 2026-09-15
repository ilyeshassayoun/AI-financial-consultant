import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function ProfileJourneyNavigation({
  subStep = 0,
  subStepTitles = [],
  stageLabels = [],
  stageDescriptions = [],
  cockpitCopy = [],
  score = null,
  cockpitMetrics = [],
  setSubStep,
  nextStep,
  prevStep,
  onOpenChat,
  children
}) {
  const reduceMotion = useReducedMotion();
  const activeStageTitle = subStepTitles[subStep]?.replace(/^\d+\.\s*/, '') || '';
  const journeyProgress = ((subStep + 1) / (subStepTitles.length || 1)) * 100;

  return (
    <motion.section
      className="profile-journey"
      aria-labelledby="profile-journey-title"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <header className="profile-journey__header">
        <div>
          <span className="profile-journey__eyebrow">Your financial blueprint / Step {subStep + 1} of {subStepTitles.length}</span>
          <h1 id="profile-journey-title">{activeStageTitle}</h1>
        </div>
        <div className="profile-journey__progress-context">
          <strong>{stageLabels[subStep]}</strong>
          <div 
            className="profile-journey__progress" 
            role="progressbar" 
            aria-label="Profile setup progress" 
            aria-valuemin="1" 
            aria-valuemax={subStepTitles.length} 
            aria-valuenow={subStep + 1}
          >
            <motion.span
              initial={false}
              animate={{ width: `${journeyProgress}%` }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <small>One decision at a time.</small>
        </div>
      </header>

      <motion.section
        className="profile-cockpit"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Live household signal"
      >
        <div className="profile-cockpit__copy">
          <span>Live plan signal</span>
          <h2>{cockpitCopy[subStep]}</h2>
          <p>{stageDescriptions[subStep]}. Recommendations update automatically.</p>
          {onOpenChat && (
            <button type="button" className="profile-cockpit__ask" onClick={() => onOpenChat(cockpitCopy[subStep])}>
              Ask the adviser <ArrowRight size={14} />
            </button>
          )}
        </div>
        <motion.div
          className="profile-cockpit__metrics"
          initial={reduceMotion ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.48, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          aria-label={score === null ? 'Plan readiness pending analysis' : `Plan readiness score ${score} out of 100`}
        >
          {cockpitMetrics.map((metric) => (
            <div key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.section>

      <div className="profile-journey__workspace">
        <nav className="profile-journey__rail" aria-label="Profile setup stages">
          <h2>Your journey</h2>
          <div>
            {stageLabels.map((label, index) => (
              <button
                key={label}
                type="button"
                className={index === subStep ? 'is-active' : ''}
                aria-current={index === subStep ? 'step' : undefined}
                aria-label={`${index + 1}. ${label}: ${stageDescriptions[index]}`}
                onClick={() => setSubStep(index)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span><strong>{label}</strong><small>{stageDescriptions[index]}</small></span>
              </button>
            ))}
          </div>
          <p>You can revisit any stage without losing your answers.</p>
        </nav>

        <motion.div
          key={subStep}
          className="profile-journey__content"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="wizard-card profile-journey__card">
            {children}

            {/* Wizard Footer Navigation Controls */}
            <div className="profile-journey__footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-architectural)', marginTop: '14px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => {
                  if (subStep > 0) setSubStep(prev => prev - 1);
                  else if (prevStep) prevStep();
                }} 
                style={{ padding: '10px 20px' }}
              >
                <ArrowLeft size={16} /> {subStep === 0 ? 'Back to Portal' : 'Previous'}
              </button>

              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Step {subStep + 1} of {subStepTitles.length}
              </span>

              {subStep < subStepTitles.length - 1 ? (
                <button type="button" className="btn-brand" onClick={() => setSubStep(prev => prev + 1)} style={{ padding: '10px 24px' }}>
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button type="button" className="btn-brand" onClick={nextStep} style={{ padding: '10px 24px' }}>
                  Proceed to Risk Shield <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
