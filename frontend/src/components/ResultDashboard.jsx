import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, AlertTriangle, BookOpen, RefreshCw, BarChart2, Check, ArrowRight, ArrowLeft, History, HelpCircle } from 'lucide-react';

export default function ResultDashboard({ sessionId, token, step, onGoToDetailedReport, onGoToHistory, onRestart }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [sessionId]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/interviews/${sessionId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Report not found.');
      }
      setReportData(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-semibold text-sm">Compiling interview performance analytics & feedback...</p>
      </div>
    );
  }

  if (!reportData) return null;

  const { session, report, questions } = reportData;
  const overall = report.overall_score;

  const getBadgeColor = (score) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (score >= 60) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  };

  const questionsAnswered = questions.filter(q => q.answer).length;
  const questionsMissed = questions.length - questionsAnswered;

  // STEP 5: Performance Analysis Summary
  if (step === 5) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        
        <div className="text-center mb-6">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1.5 mb-2">
            <BarChart2 className="w-3.5 h-3.5" /> Step 5 of 6 — Performance Analysis
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Interview Performance Summary
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Target Role: <strong className="text-white">{session.job_role?.title}</strong> • {session.interview_type} ({session.difficulty})
          </p>
        </div>

        {/* Overall Score Banner */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-extrabold text-2xl">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Overall Interview Score</span>
              <span className="text-3xl font-black text-white">{overall}<span className="text-sm font-normal text-slate-400">/100</span></span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center border-l border-slate-700/80 pl-6">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Answered</span>
              <span className="text-base font-bold text-emerald-400">{questionsAnswered} / {questions.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Missed</span>
              <span className="text-base font-bold text-amber-400">{questionsMissed}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Est. Time</span>
              <span className="text-base font-bold text-blue-400">{session.question_count * 3} min</span>
            </div>
          </div>
        </div>

        {/* Evaluation Metrics Breakdown */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Evaluation Breakdown</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(report.category_breakdown || {}).map(([cat, score]) => (
              <div key={cat} className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{cat}</span>
                  <span className="text-white font-bold">{score}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Confidence / Communication Indicator Note */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs text-slate-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>
              Communication & Confidence indicators are evaluated based on answer completeness, structure, and text/speech clarity during your session.
            </span>
          </div>
        </div>

        {/* Continue to Detailed Report Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onGoToDetailedReport}
            className="py-3 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-blue-600/25 transition-all flex items-center gap-2"
          >
            <span>View Full Detailed Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    );
  }

  // STEP 6: Detailed Report View
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8 animate-fade-in">
      
      {/* Step Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-block mb-1">
            Step 6 of 6 — Full Detailed Report
          </span>
          <h1 className="text-2xl font-extrabold text-white">
            Interview Performance Analysis & Feedback Report
          </h1>
          <p className="text-xs text-slate-400">
            {session.job_role?.title} • {session.interview_type} ({session.difficulty})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGoToHistory}
            className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <History className="w-4 h-4" />
            <span>View History</span>
          </button>

          <button
            onClick={onRestart}
            className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Interview</span>
          </button>
        </div>
      </div>

      {/* Summary Score Card */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-base">Overall Candidate Score</h3>
          <p className="text-xs text-slate-400">Based on technical accuracy, completeness, relevance & communication</p>
        </div>
        <div className="text-3xl font-black text-emerald-400">{overall}/100</div>
      </div>

      {/* Strengths & Action Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Top Strengths</span>
          </h3>
          <ul className="space-y-2">
            {report.strengths.map((str, i) => (
              <li key={i} className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Actionable Improvement Plan</span>
          </h3>
          <ul className="space-y-2">
            {report.improvement_plan.map((item, i) => (
              <li key={i} className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question Analysis Review */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Question Analysis & Detailed Feedback</h3>

        <div className="space-y-4">
          {questions.map((q) => {
            const ev = q.evaluation || {};
            const qScore = ev.overall_question_score || 0;
            return (
              <div key={q.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/80 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                      Question #{q.question_number} • {q.category}
                    </span>
                    <h4 className="font-bold text-white text-sm">"{q.question_text}"</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${getBadgeColor(qScore)}`}>
                    {qScore}/100
                  </span>
                </div>

                {q.answer && (
                  <div className="p-3 bg-slate-800/60 rounded-lg text-xs text-slate-300 italic border border-slate-700/50">
                    <span className="font-semibold not-italic text-slate-400">Candidate Answer: </span>
                    "{q.answer.text_response}"
                  </div>
                )}

                {ev.feedback_text && (
                  <div className="text-xs text-slate-300">
                    <span className="font-bold text-slate-400">AI Feedback: </span>
                    {ev.feedback_text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={onGoToHistory}
          className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          <span>Back to Interview History</span>
        </button>

        <button
          onClick={onRestart}
          className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Start New Interview</span>
        </button>
      </div>

    </div>
  );
}
