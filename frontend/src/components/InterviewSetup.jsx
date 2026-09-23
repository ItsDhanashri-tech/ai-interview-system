import React, { useState, useEffect } from 'react';
import { Briefcase, Sliders, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Clock, Layers } from 'lucide-react';

export default function InterviewSetup({
  step,
  selectedRole,
  setSelectedRole,
  interviewType,
  setInterviewType,
  difficulty,
  setDifficulty,
  questionCount,
  setQuestionCount,
  onNextStep,
  onPrevStep
}) {
  const [roles, setRoles] = useState([]);
  const [fetchingRoles, setFetchingRoles] = useState(true);

  useEffect(() => {
    fetchJobRoles();
  }, []);

  const fetchJobRoles = async () => {
    try {
      const res = await fetch('/api/job-roles');
      const data = await res.json();
      setRoles(data);
      if (data.length > 0 && !selectedRole) {
        setSelectedRole(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch job roles', err);
    } finally {
      setFetchingRoles(false);
    }
  };

  // Step 1: Role Selection View
  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
        <div className="text-center mb-8">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Step 1 of 6
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Select Your Target Job Role
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mt-1">
            Choose the specific domain position you want to practice for today.
          </p>
        </div>

        {fetchingRoles ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading available roles...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {roles.map((role) => {
              const isSelected = selectedRole?.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-b from-blue-600/20 to-indigo-600/10 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/30'
                      : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-white text-base leading-tight">{role.title}</h3>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-4">{role.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-700/50">
                    {role.sample_topics.slice(0, 3).map((topic, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-medium">
                        {topic.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onNextStep}
            disabled={!selectedRole}
            className="py-3 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-blue-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span>Continue to Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Configuration View
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      <div className="text-center mb-8">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1.5 mb-2">
          <Sliders className="w-3.5 h-3.5" /> Step 2 of 6
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Configure Your Mock Interview
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mt-1">
          Target Role: <strong className="text-white">{selectedRole?.title}</strong>
        </p>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
        
        {/* Selected Role Summary Header */}
        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{selectedRole?.title}</h4>
              <p className="text-xs text-slate-400">{selectedRole?.category} Domain</p>
            </div>
          </div>
          <button
            onClick={onPrevStep}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline"
          >
            Change Role
          </button>
        </div>

        {/* Interview Type Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Interview Focus Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['Technical', 'HR', 'Mixed'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setInterviewType(type)}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                  interviewType === type
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficulty(diff)}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                  difficulty === diff
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Number of Questions Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Number of Questions
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[3, 5, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuestionCount(num)}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                  questionCount === num
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {num} Questions
              </button>
            ))}
          </div>
        </div>

        {/* Estimation Footer */}
        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Estimated Duration: <strong className="text-slate-200">{questionCount * 3} minutes</strong></span>
          </div>
          <span className="text-[11px] text-slate-500">AI Evaluation included</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onPrevStep}
            className="py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back</span>
          </button>

          <button
            onClick={onNextStep}
            className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <span>Continue to Media Check</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
