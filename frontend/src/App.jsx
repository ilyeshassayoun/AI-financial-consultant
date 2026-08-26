import { lazy, Suspense, useEffect, useCallback, useMemo, useState } from 'react';
import './App.css';
import TopNav from './components/TopNav';
import AdvisorDrawer from './components/AdvisorDrawer';
import FloatingAdvisorButton from './components/FloatingAdvisorButton';
import { PageTransition } from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import SkipLinks from './components/SkipLinks';
import GDPRConsentModal from './components/GDPRConsentModal';
import { useProfileStore } from './stores/profileStore';
import { fetchFullAnalysis } from './services/apiService';

const StepWelcome = lazy(() => import('./components/StepWelcome'));
const StepProfile = lazy(() => import('./components/StepProfile'));
const StepTax = lazy(() => import('./components/StepTax'));
const StepInsurance = lazy(() => import('./components/StepInsurance'));
const StepInvestment = lazy(() => import('./components/StepInvestment'));
const StepRetirement = lazy(() => import('./components/StepRetirement'));

const ErrorFallback = ({ error: _error, resetError }) => (
  <div className="cardBase animateFadeInUp" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, padding: 32, textAlign: 'center' }} role="alert">
    <div style={{ fontSize: 64, marginBottom: 16 }}>Warning</div>
    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h2>
    <p style={{ marginBottom: 24, maxWidth: 400 }}>This section failed to load. Please try again.</p>
    <button onClick={resetError} className="btnPrimary">Retry</button>
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
  const updateProfile = useProfileStore((state) => state.updateProfile);
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
  // BUG 2 FIX: resetProfile was used in GDPRConsentModal but never selected from store
  const resetProfile = useProfileStore((state) => state.resetProfile);
  const [isGDPROpen, setIsGDPROpen] = useState(false);

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
    const timer = setTimeout(async () => {
      const data = await fetchFullAnalysis(profile, controller.signal);
      if (!isCancelled && data) setAnalysis(data);
    }, 350);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [profile, setAnalysis]);

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
      />
      <main
        id="main-content"
        className="app-workspace"
        style={{
          flex: 1,
          padding: currentStep === 'welcome' ? '0 32px' : '24px 32px 60px 32px',
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
          <ErrorBoundary fallback={ErrorFallback}>
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
        onResetData={resetProfile}
      />
    </div>
  );
}

export default App;