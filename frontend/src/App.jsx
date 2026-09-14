import { lazy, Suspense, useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useInRouterContext, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import TopNav from './components/TopNav';
import FloatingAdvisorButton from './components/FloatingAdvisorButton';
import { PageTransition } from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import SkipLinks from './components/SkipLinks';
import ScenarioBanner from './components/ScenarioBanner';
import { useProfileStore, safeLocalStorage } from './stores/profileStore';
import { useAuthStore } from './stores/authStore';
import { fetchFullAnalysis, getAnalysisErrorMessage } from './services/apiService';
import { getCurrentSession, logoutSession } from './services/authService';

const StepWelcome = lazy(() => import('./components/StepWelcome'));
const StepProfile = lazy(() => import('./components/StepProfile'));
const StepTax = lazy(() => import('./components/StepTax'));
const StepInsurance = lazy(() => import('./components/StepInsurance'));
const StepInvestment = lazy(() => import('./components/StepInvestment'));
const StepRetirement = lazy(() => import('./components/StepRetirement'));
const AdvisorDrawer = lazy(() => import('./components/AdvisorDrawer'));
const GDPRConsentModal = lazy(() => import('./components/GDPRConsentModal'));
const AuditDossierModal = lazy(() => import('./components/AuditDossierModal'));

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
          safeLocalStorage.removeItem('financial-consultant-profile');
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

const PATH_TO_STEP = {
  '/': 'welcome',
  '/welcome': 'welcome',
  '/profile': 'profile',
  '/mandate': 'profile',
  '/insurance': 'insurance',
  '/risk': 'insurance',
  '/tax': 'tax',
  '/invest': 'invest',
  '/pension': 'pension',
  '/solvency': 'pension',
};

const STEP_TO_PATH = {
  welcome: '/welcome',
  profile: '/profile',
  insurance: '/insurance',
  tax: '/tax',
  invest: '/invest',
  pension: '/pension',
};

function RouteSync({ currentStep, setCurrentStep }) {
  const location = useLocation();
  const navigate = useNavigate();
  const lastPathname = useRef(null);

  // A single effect avoids two independent synchronization effects racing.
  // If the pathname changed first (deep link, back/forward), URL wins. If the
  // app step changed first (navigation button), state wins and updates the URL.
  useEffect(() => {
    const rawPath = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const mappedStep = PATH_TO_STEP[rawPath];
    if (lastPathname.current !== rawPath) {
      lastPathname.current = rawPath;
      if (mappedStep && mappedStep !== currentStep) setCurrentStep(mappedStep);
      return;
    }
    if (mappedStep !== currentStep) {
      const targetPath = STEP_TO_PATH[currentStep] || '/';
      lastPathname.current = targetPath;
      navigate(targetPath, { replace: false });
    }
  }, [currentStep, location.pathname, navigate, setCurrentStep]);

  return null;
}

function App() {
  const inRouter = useInRouterContext();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    safeLocalStorage.removeItem('theme');
  }, []);

  const profile = useProfileStore((state) => state.profile);
  const scenarioOverrides = useProfileStore((state) => state.scenarioOverrides);
  const previewScenario = useProfileStore((state) => state.previewScenario);
  const clearScenario = useProfileStore((state) => state.clearScenario);
  const commitScenario = useProfileStore((state) => state.commitScenario);
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
  const [isAuditDossierOpen, setIsAuditDossierOpen] = useState(false);
  const [hasLoadedAdvisor, setHasLoadedAdvisor] = useState(isAdvisorDrawerOpen);
  const [analysisState, setAnalysisState] = useState({ status: analysis ? 'success' : 'idle', error: null });
  const [analysisRetryKey, setAnalysisRetryKey] = useState(0);
  const effectiveProfile = useMemo(
    () => ({ ...profile, ...scenarioOverrides }),
    [profile, scenarioOverrides],
  );
  const profileRef = useRef(effectiveProfile);

  const updateProfile = useCallback((patch) => {
    clearScenario();
    setAnalysisState((state) => state.status === 'success' ? { status: 'stale', error: null } : state);
    updateProfileStore(patch);
  }, [clearScenario, updateProfileStore]);

  useEffect(() => {
    let active = true;
    getCurrentSession()
      .then(({ user }) => active && login({ user }))
      .catch(() => active && logout());
    return () => { active = false; };
  }, [login, logout]);

  useEffect(() => {
    profileRef.current = effectiveProfile;
  }, [effectiveProfile]);

  // Reactive recalculation on profile change with 400ms debounce
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setAnalysisRetryKey((key) => key + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [effectiveProfile]);

  const currentSubStep = useMemo(() =>
    (subStepMap && typeof subStepMap[currentStep] === 'number' && Number.isFinite(subStepMap[currentStep]))
      ? Math.max(0, subStepMap[currentStep])
      : 0,
    [subStepMap, currentStep]
  );

  const setSubStepForCurrent = useCallback((updaterOrValue) => {
    setSubStepMap(prev => {
      const safePrev = (prev && typeof prev === 'object') ? prev : {};
      const current = (typeof safePrev[currentStep] === 'number' && Number.isFinite(safePrev[currentStep])) ? safePrev[currentStep] : 0;
      const nextVal = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
      const safeNext = Number.isFinite(nextVal) ? Math.max(0, nextVal) : 0;
      return { ...safePrev, [currentStep]: safeNext };
    });
  }, [currentStep, setSubStepMap]);

  const handleApplyPatch = useCallback((patch) => {
    if (patch) previewScenario(patch);
  }, [previewScenario]);

  const handleOpenChat = useCallback((query) => {
    setInitialChatMessage(query || '');
    setHasLoadedAdvisor(true);
    setIsAdvisorDrawerOpen(true);
  }, [setInitialChatMessage, setIsAdvisorDrawerOpen]);

  const shouldRunAnalysis = currentStep !== 'welcome';

  useEffect(() => {
    if (!shouldRunAnalysis) return undefined;

    let isCancelled = false;
    const controller = new AbortController();
    const profileForRequest = profileRef.current;
    const runAnalysis = async () => {
      setAnalysisState({ status: 'loading', error: null });
      try {
        const data = await fetchFullAnalysis(profileForRequest, controller.signal);
        if (!data) throw new Error('The analysis service returned no data.');
        if (isCancelled) return;
        if (profileRef.current !== profileForRequest) {
          setAnalysisState({ status: 'stale', error: null });
          return;
        }
        setAnalysis(data);
        setAnalysisState({ status: 'success', error: null });
      } catch (error) {
        if (isCancelled || error?.name === 'AbortError') return;
        setAnalysisState({
          status: 'error',
          error: getAnalysisErrorMessage(error)
        });
      }
    };
    runAnalysis();
    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [setAnalysis, analysisRetryKey, shouldRunAnalysis]);

  const retryAnalysis = useCallback(() => {
    setAnalysisState({ status: 'loading', error: null });
    setAnalysisRetryKey((key) => key + 1);
  }, []);

  const handleResetData = useCallback(async () => {
    resetAll();
    logout();
    safeLocalStorage.removeItem('financial-consultant-profile');
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
      {inRouter && <RouteSync currentStep={currentStep} setCurrentStep={setCurrentStep} />}
      <SkipLinks />
      <TopNav
        currentStep={currentStep}
        setStep={setCurrentStep}
        onSubStepChange={setSubStepForCurrent}
        onOpenGDPR={() => setIsGDPROpen(true)}
        onOpenAuditDossier={() => setIsAuditDossierOpen(true)}
        onOpenAdvisor={() => {
          setHasLoadedAdvisor(true);
          setIsAdvisorDrawerOpen(true);
        }}
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
        <ScenarioBanner overrides={scenarioOverrides} onApply={commitScenario} onReset={clearScenario} />
        <ErrorBoundary fallback={ErrorFallback} resetKey={`${currentStep}:${currentSubStep}`}>
          <Suspense fallback={<div className="route-loading" role="status" aria-live="polite">Preparing this section…</div>}>
            <PageTransition transitionKey={currentStep}>
            {currentStep === 'welcome' && <StepWelcome nextStep={nextStep} analysis={analysis} />}
            {currentStep === 'profile' && (
              <StepProfile
                profile={effectiveProfile}
                updateProfile={updateProfile}
                nextStep={nextStep}
                prevStep={prevStep}
                analysis={analysis}
                subStep={currentSubStep}
                setSubStep={setSubStepForCurrent}
                onApplyPatch={handleApplyPatch}
                onOpenChat={handleOpenChat}
              />
            )}
            {currentStep === 'insurance' && (
              <StepInsurance
                profile={effectiveProfile}
                updateProfile={updateProfile}
                nextStep={nextStep}
                prevStep={prevStep}
                analysis={analysis}
                subStep={currentSubStep}
                setSubStep={setSubStepForCurrent}
                analysisStatus={analysisState.status}
                analysisError={analysisState.error}
                onRetryAnalysis={retryAnalysis}
                onApplyPatch={handleApplyPatch}
                onOpenChat={handleOpenChat}
              />
            )}
            {currentStep === 'tax' && (
              <StepTax
                profile={effectiveProfile}
                updateProfile={updateProfile}
                nextStep={nextStep}
                prevStep={prevStep}
                analysis={analysis}
                subStep={currentSubStep}
                setSubStep={setSubStepForCurrent}
                analysisStatus={analysisState.status}
                analysisError={analysisState.error}
                onRetryAnalysis={retryAnalysis}
                onApplyPatch={handleApplyPatch}
                onOpenChat={handleOpenChat}
              />
            )}
            {currentStep === 'invest' && (
              <StepInvestment
                profile={effectiveProfile}
                updateProfile={updateProfile}
                nextStep={nextStep}
                prevStep={prevStep}
                analysis={analysis}
                subStep={currentSubStep}
                setSubStep={setSubStepForCurrent}
                analysisStatus={analysisState.status}
                analysisError={analysisState.error}
                onRetryAnalysis={retryAnalysis}
                onPreviewScenario={handleApplyPatch}
                onApplyPatch={handleApplyPatch}
                onOpenChat={handleOpenChat}
              />
            )}
            {currentStep === 'pension' && (
              <StepRetirement
                profile={effectiveProfile}
                updateProfile={updateProfile}
                nextStep={nextStep}
                prevStep={prevStep}
                analysis={analysis}
                subStep={currentSubStep}
                setSubStep={setSubStepForCurrent}
                analysisStatus={analysisState.status}
                analysisError={analysisState.error}
                onRetryAnalysis={retryAnalysis}
                onApplyPatch={handleApplyPatch}
                onOpenChat={handleOpenChat}
              />
            )}
            </PageTransition>
          </Suspense>
        </ErrorBoundary>
      </main>

      <ErrorBoundary fallback={() => null}>
        <FloatingAdvisorButton
          isOpen={isAdvisorDrawerOpen}
          onClick={() => {
            if (!isAdvisorDrawerOpen) setHasLoadedAdvisor(true);
            setIsAdvisorDrawerOpen(prev => !prev);
          }}
        />
        <Suspense fallback={null}>
          {hasLoadedAdvisor && (
            <AdvisorDrawer
              isOpen={isAdvisorDrawerOpen}
              onClose={() => setIsAdvisorDrawerOpen(false)}
              profile={effectiveProfile}
              analysis={analysis}
              currentStep={currentStep}
              initialMessage={initialChatMessage}
              onApplyPatch={handleApplyPatch}
            />
          )}
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={() => null}>
        <Suspense fallback={null}>
          {isGDPROpen && (
            <GDPRConsentModal
              isOpen={isGDPROpen}
              onClose={() => setIsGDPROpen(false)}
              profile={profile}
              onResetData={handleResetData}
            />
          )}
          {isAuditDossierOpen && (
            <AuditDossierModal
              isOpen={isAuditDossierOpen}
              onClose={() => setIsAuditDossierOpen(false)}
              profile={effectiveProfile}
              analysis={analysis}
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;
