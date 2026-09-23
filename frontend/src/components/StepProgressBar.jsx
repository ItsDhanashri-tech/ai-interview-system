import React from 'react';
import { Check } from 'lucide-react';

export default function StepProgressBar({ currentStep }) {
  const steps = [
    { num: 1, label: 'Role' },
    { num: 2, label: 'Setup' },
    { num: 3, label: 'Camera/Mic' },
    { num: 4, label: 'Interview' },
    { num: 5, label: 'Analysis' },
    { num: 6, label: 'Report' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 mb-2">
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;

            return (
              <React.Fragment key={step.num}>
                {/* Step Circle & Label */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/50'
                        : 'bg-slate-900 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden md:inline transition-colors ${
                      isCurrent
                        ? 'text-white font-bold'
                        : isCompleted
                        ? 'text-emerald-400 font-medium'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-grow h-0.5 mx-2 rounded transition-colors ${
                      currentStep > step.num ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
