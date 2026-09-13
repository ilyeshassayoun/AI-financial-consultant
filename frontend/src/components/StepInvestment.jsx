import InvestmentLaboratory from './InvestmentLaboratory';

export default function StepInvestment({ profile, updateProfile, nextStep, prevStep, analysis, subStep, setSubStep, analysisStatus, analysisError, onRetryAnalysis }) {
  return (
    <div className="investment-route animate-fade-in-up">
      <InvestmentLaboratory 
        profile={profile} 
        updateProfile={updateProfile} 
        lab={analysis?.investment_lab} 
        subStep={subStep}
        setSubStep={setSubStep}
        nextStep={nextStep}
        prevStep={prevStep}
        analysisStatus={analysisStatus}
        analysisError={analysisError}
        onRetryAnalysis={onRetryAnalysis}
      />
    </div>
  );
}
