import { lazy, Suspense, useEffect, useCallback, useMemo, useRef, useState } from 'react';
import './App.css';
import TopNav from './components/TopNav';
import AdvisorDrawer from './components/AdvisorDrawer';
import FloatingAdvisorButton from './components/FloatingAdvisorButton';
import { PageTransition } from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import SkipLinks from './components/SkipLinks';
import GDPRConsentModal from './components/GDPRConsentModal';
import { useProfileStore } from './stores/profileStore';
import { useAuthStore } from './stores/authStore';
import { fetchFullAnalysis } from './services/apiService';
import { getCurrentSession, logoutSession } from './services/authService';

const StepWelcome = lazy(() => import('./components/StepWelcome'));
const StepProfile = lazy(() => import('./components/StepProfile'));
const StepTax = lazy(() => import('./components/StepTax'));
const StepInsurance = lazy(() => import('./components/StepInsurance'));
const StepInvestment = lazy(() => import('./components/StepInvestment'));
const StepRetirement = lazy(() => import('./components/StepRetirement'));

const ErrorFallback = ({ error, resetError }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
    padding: '40px 24px',
    textAlign: 'center',
    background: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1px solid var(--border-architectural)',
    borderTop: '3px solid var(--accent-coral)',
    boxShadow: 'var(--shadow-md)',
    margin: '32px auto',
    maxWidth: '540px'
  }} role="alert">
    <div style={{
      width: '52px',
      height: '52px',
      borderRadius: '50%',
      background: 'rgba(239, 68, 68, 0.1)',
      color: 'var(--accent-coral)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
      fontSize: '1.4rem',
      fontWeight: 800
    }}>
      !
    </div>
    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>
      Section Encountered an Issue
    </h2>
    <p style={{ margin: '0 0 20px', maxWidth: '440px', color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: '1.5' }}>
      {error?.message || 'A calculation or rendering error occurred. You can retry loading or reset stored state.'}
    </p>
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <button onClick={resetError} className="btn-brand" style={{ padding: '10px 22px', borderRadius: '8px' }}>
        Retry Loading
      </button>
      <button
        onClick={() => {
          localStorage.removeItem('financial-consultant-profile');
          window.location.reload();
        }}
        className="btn-secondary"
        style={{ padding: '10px 18px', borderRadius: '8px' }}
      >
        Reset to Defaults
      </button>
    </div>
  </div>
);

const STEPS_ORDER = ['welcome', 'profile', 'insurance', 'tax', 'invest', 'pension'];

function App() {
  // BUG 1 FIX: theme useEffect must be INSIDE the component
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const profile = useProfileStore((state) => state.profile);
  const updateProfileStore = useProfileStore((state) => state.updateProfile);
  const analysis = useProfileStore((state) => state.analysis);
  const setAnalysis = useProfileStore((state) => state.setAnalysis);
  const currentStep = useProfileStore((state) => state.currentStep);
  const setCurrentStep = useProfileStore((state) => state.setCurrentStep);
  const subStepMap = useProfileStore((state) => state.subStepMap);
  const setSubStepMap = useProfileStore((state) => state.setSubStepMap);
  const isAdvisorDrawerOpen = useProfileStore((state) => state.isAdvisorDrawerOpen);
  const setIsAdvisorDrawerOpen = useProfileStore((state) => state.setIsAdvisorDrawerOpen);
  const initialChatMessage = useProfileStore((state) => state.initialChatMessage);
  const setInitialChatMessage = useProfileStore((state) => state.setInitialChatMessage);
  const resetAll = useProfileStore((state) => state.resetAll);
  const logout = useAuthStore((state) => state.logout);
  const login = useAuthStore((state) => state.login);
  const [isGDPROpen, setIsGDPROpen] = useState(false);
  const [analysisState, setAnalysisState] = useState({ status: analysis ? 'success' : 'idle', error: null });
  const [analysisRetryKey, setAnalysisRetryKey] = useState(0);
  const profileRef = useRef(profile);

  const updateProfile = useCallback((patch) => {
    setAnalysisState((state) => state.status === 'success' ? { status: 'stale', error: null } : state);
    updateProfileStore(patch);
  }, [updateProfileStore]);

  useEffect(() => {
    let active = true;
    getCurrentSession()
      .then(({ user }) => active && login({ user }))
      .catch(() => active && logout());
    return () => { active = false; };
  }, [login, logout]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const currentSubStep = useMemo(() =>
    typeof subStepMap[currentStep] === 'number' ? subStepMap[currentStep] : 0,
    [subStepMap, currentStep]
  );

  const setSubStepForCurrent = useCallback((updaterOrValue) => {
    setSubStepMap(prev => {
      const current = typeof prev[currentStep] === 'number' ? prev[currentStep] : 0;
      const nextVal = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
      return { ...prev, [currentStep]: nextVal };
    });
  }, [currentStep, setSubStepMap]);

  const handleApplyPatch = useCallback((patch) => {
    if (patch) updateProfile(patch);
  }, [updateProfile]);

  const handleOpenChat = useCallback((query) => {
    setInitialChatMessage(query || '');
    setIsAdvisorDrawerOpen(true);
  }, [setInitialChatMessage, setIsAdvisorDrawerOpen]);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();
    const profileForRequest = profileRef.current;
    const timer = setTimeout(async () => {
      setAnalysisState({ status: 'loading', error: null });
      const data = await fetchFullAnalysis(profileForRequest, controller.signal);
      if (isCancelled) return;
      if (profileRef.current !== profileForRequest) {
        setAnalysisState({ status: 'stale', error: null });
        return;
      }
      if (data) {
        setAnalysis(data);
        setAnalysisState({ status: 'success', error: null });
      } else {
        setAnalysisState({
          status: 'error',
          error: 'The analysis service could not be reached. Your inputs remain saved locally, so you can retry without re-entering them.'
        });
      }
    }, 350);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [setAnalysis, analysisRetryKey]);

  const retryAnalysis = useCallback(() => {
    setAnalysisState({ status: 'loading', error: null });
    setAnalysisRetryKey((key) => key + 1);
  }, []);

  const handleResetData = useCallback(async () => {
    resetAll();
    logout();
    localStorage.removeItem('financial-consultant-profile');
    try {
      await logoutSession();
    } catch {
      // Local state is cleared; surface no stale financial profile while the server call is retried on next sign-out.
    }
  }, [logout, resetAll]);

  const nextStep = useCallback(() => {
    const idx = STEPS_ORDER.indexOf(currentStep);
    if (idx < STEPS_ORDER.length - 1) {
      setCurrentStep(STEPS_ORDER[idx + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, setCurrentStep]);

  const prevStep = useCallback(() => {
    const idx = STEPS_ORDER.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS_ORDER[idx - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, setCurrentStep]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', background: 'var(--bg-porcelain)' }}>
      <SkipLinks />
      <TopNav
        currentStep={currentStep}
        setStep={setCurrentStep}
        currentSubStep={currentSubStep}
        onSubStepChange={setSubStepForCurrent}
        onOpenGDPR={() => setIsGDPROpen(true)}
        onOpenAdvisor={() => setIsAdvisorDrawerOpen(true)}
        onRefreshAnalysis={retryAnalysis}
        analysisStatus={analysisState.status}
      />
      <main
        id="main-content"
        className="app-workspace"
        style={{
          flex: 1,
          padding: currentStep === 'welcome' ? '0 clamp(12px, 3vw, 32px)' : 'clamp(14px, 2.5vw, 24px) clamp(12px, 3vw, 32px) 60px clamp(12px, 3vw, 32px)',
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          minHeight: currentStep === 'welcome' ? 'calc(100vh - 90px)' : 'auto'
        }}
        role="main"
      >
        <Suspense fallback={<div className="route-loading" role="status" aria-live="polite">Preparing your financial analysis...</div>}>
          <ErrorBoundary fallback={ErrorFallback} resetKey={`${currentStep}:${currentSubStep}`}>
            <PageTransition transitionKey={currentStep}>
              {currentStep === 'welcome' && <StepWelcome nextStep={nextStep} analysis={analysis} />}
              {currentStep === 'profile' && (
                <StepProfile profile={profile} updateProfile={updateProfile} nextStep={nextStep} prevStep={prevStep}
                  analysis={analysis} subStep={currentSubStep} setSubStep={setSubStepForCurrent}
                  onApplyPatch={handleApplyPatch} onOpenChat={handleOpenChat} />
              )}
              {currentStep === 'insurance' && (
                <StepInsurance profile={profile} updateProfile={updateProfile} nextStep={nextStep} prevStep={prevStep}
                  analysis={analysis} subStep={currentSubStep} setSubStep={setSubStepForCurrent}
                  onApplyPatch={handleApplyPatch} onOpenChat={handleOpenChat} />
              )}
              {currentStep === 'tax' && (
                <StepTax profile={profile} updateProfile={updateProfile} nextStep={nextStep} prevStep={prevStep}
                  analysis={analysis} subStep={currentSubStep} setSubStep={setSubStepForCurrent}
                  onApplyPatch={handleApplyPatch} onOpenChat={handleOpenChat} />
              )}
              {currentStep === 'invest' && (
                <StepInvestment profile={profile} updateProfile={updateProfile} nextStep={nextStep} prevStep={prevStep}
                  analysis={analysis} subStep={currentSubStep} setSubStep={setSubStepForCurrent}
                  analysisStatus={analysisState.status} analysisError={analysisState.error} onRetryAnalysis={retryAnalysis}
                  onApplyPatch={handleApplyPatch} onOpenChat={handleOpenChat} />
              )}
              {currentStep === 'pension' && (
                <StepRetirement profile={profile} updateProfile={updateProfile} nextStep={nextStep} prevStep={prevStep}
                  analysis={analysis} subStep={currentSubStep} setSubStep={setSubStepForCurrent}
                  onApplyPatch={handleApplyPatch} onOpenChat={handleOpenChat} />
              )}
            </PageTransition>
          </ErrorBoundary>
        </Suspense>
      </main>

      <FloatingAdvisorButton
        isOpen={isAdvisorDrawerOpen}
        onClick={() => setIsAdvisorDrawerOpen(prev => !prev)}
      />

      <AdvisorDrawer
        isOpen={isAdvisorDrawerOpen}
        onClose={() => setIsAdvisorDrawerOpen(false)}
        profile={profile}
        analysis={analysis}
        currentStep={currentStep}
        initialMessage={initialChatMessage}
        onApplyPatch={handleApplyPatch}
      />

      <GDPRConsentModal
        isOpen={isGDPROpen}
        onClose={() => setIsGDPROpen(false)}
        profile={profile}
        onResetData={handleResetData}
      />
    </div>
  );
}

export default App;
