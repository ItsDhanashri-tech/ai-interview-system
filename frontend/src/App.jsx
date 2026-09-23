import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import StepProgressBar from './components/StepProgressBar';
import InterviewSetup from './components/InterviewSetup';
import MediaCheck from './components/MediaCheck';
import LiveInterview from './components/LiveInterview';
import ResultDashboard from './components/ResultDashboard';
import InterviewHistory from './components/InterviewHistory';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Main view mode: 'wizard' or 'history'
  const [mainView, setMainView] = useState('wizard');
  
  // 6-step single-page wizard state (1 to 6)
  const [currentStep, setCurrentStep] = useState(1);

  // Interview setup state
  const [selectedRole, setSelectedRole] = useState(null);
  const [interviewType, setInterviewType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(3);

  // Active Session and Report state
  const [activeSession, setActiveSession] = useState(null);
  const [firstQuestion, setFirstQuestion] = useState(null);
  const [activeReportSessionId, setActiveReportSessionId] = useState(null);

  // Restore token from localStorage on load
  useEffect(() => {
    const savedToken = localStorage.getItem('ai_interview_token');
    if (savedToken) {
      setToken(savedToken);
      fetchMe(savedToken);
    }
  }, []);

  const fetchMe = async (authToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('ai_interview_token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ai_interview_token');
    setMainView('wizard');
    setCurrentStep(1);
  };

  const handleQuickDemo = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'demo@candidate.com',
          password: 'demo123'
        })
      });
      const data = await res.json();
      if (res.ok) {
        handleAuthSuccess(data.user, data.token);
      } else {
        const signupRes = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Demo Candidate',
            email: 'demo@candidate.com',
            password: 'demo123'
          })
        });
        const signupData = await signupRes.json();
        if (signupRes.ok) {
          handleAuthSuccess(signupData.user, signupData.token);
        }
      }
    } catch (err) {
      alert('Quick Demo connection error. Ensure backend server is running!');
    }
  };

  // Launch Session from Step 3 -> Step 4
  const handleProceedToInterview = async () => {
    if (!token) {
      setAuthModalOpen(true);
      return;
    }
    if (!selectedRole) return;

    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_role_id: selectedRole.id,
          interview_type: interviewType,
          difficulty: difficulty,
          question_count: questionCount,
          duration_minutes: questionCount * 3
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to start interview.');
      }
      setActiveSession(data.session);
      setFirstQuestion(data.first_question);
      setCurrentStep(4);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFinishInterview = (sessionId) => {
    setActiveReportSessionId(sessionId);
    setCurrentStep(5);
  };

  const handleViewHistoryReport = (sessionId) => {
    setActiveReportSessionId(sessionId);
    setMainView('wizard');
    setCurrentStep(6);
  };

  const resetToStepOne = () => {
    setMainView('wizard');
    setCurrentStep(1);
    setActiveSession(null);
    setFirstQuestion(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Navigation Top Bar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onNavigate={(target) => {
          if (target === 'history') {
            setMainView('history');
          } else {
            resetToStepOne();
          }
        }}
        currentTab={mainView === 'history' ? 'history' : 'dashboard'}
        onOpenAuth={() => setAuthModalOpen(true)}
        onQuickDemo={handleQuickDemo}
      />

      {/* Main Single-Page Content Area */}
      <main className="flex-grow py-4">
        {mainView === 'wizard' ? (
          <div>
            {/* Top 6-Step Progress Indicator */}
            <StepProgressBar currentStep={currentStep} />

            {/* STEP 1: Select Job Role */}
            {currentStep === 1 && (
              <InterviewSetup
                step={1}
                selectedRole={selectedRole}
                setSelectedRole={setSelectedRole}
                interviewType={interviewType}
                setInterviewType={setInterviewType}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                questionCount={questionCount}
                setQuestionCount={setQuestionCount}
                onNextStep={() => setCurrentStep(2)}
                onPrevStep={() => {}}
              />
            )}

            {/* STEP 2: Interview Setup */}
            {currentStep === 2 && (
              <InterviewSetup
                step={2}
                selectedRole={selectedRole}
                setSelectedRole={setSelectedRole}
                interviewType={interviewType}
                setInterviewType={setInterviewType}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                questionCount={questionCount}
                setQuestionCount={setQuestionCount}
                onNextStep={() => setCurrentStep(3)}
                onPrevStep={() => setCurrentStep(1)}
              />
            )}

            {/* STEP 3: Camera & Microphone Check */}
            {currentStep === 3 && (
              <MediaCheck
                onBack={() => setCurrentStep(2)}
                onContinue={handleProceedToInterview}
              />
            )}

            {/* STEP 4: Live AI Interview */}
            {currentStep === 4 && activeSession && firstQuestion && (
              <LiveInterview
                session={activeSession}
                firstQuestion={firstQuestion}
                token={token}
                onFinishInterview={handleFinishInterview}
              />
            )}

            {/* STEP 5: Performance Analysis Summary */}
            {currentStep === 5 && activeReportSessionId && (
              <ResultDashboard
                sessionId={activeReportSessionId}
                token={token}
                step={5}
                onGoToDetailedReport={() => setCurrentStep(6)}
                onGoToHistory={() => setMainView('history')}
                onRestart={resetToStepOne}
              />
            )}

            {/* STEP 6: Full Detailed Report */}
            {currentStep === 6 && activeReportSessionId && (
              <ResultDashboard
                sessionId={activeReportSessionId}
                token={token}
                step={6}
                onGoToDetailedReport={() => {}}
                onGoToHistory={() => setMainView('history')}
                onRestart={resetToStepOne}
              />
            )}
          </div>
        ) : (
          /* Interview History View */
          <InterviewHistory
            token={token}
            onViewReport={handleViewHistoryReport}
            onNewInterview={resetToStepOne}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>AI Interview Preparation System • Web Flow, Backend Architecture & Evaluation Engine</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onQuickDemo={handleQuickDemo}
      />

    </div>
  );
}
