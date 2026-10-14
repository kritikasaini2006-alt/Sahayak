import React from 'react';
import { Check } from 'lucide-react';

export default function EligibilityStepper({ steps, currentStep, onStepClick }) {
  const progressPercentage = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);

  return (
    <div className="w-full space-y-4">
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Form Progress"
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => onStepClick && isCompleted && onStepClick(step.number)}
              disabled={!isCompleted && !isCurrent}
              className={`text-left p-2 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center gap-2 ${
                isCurrent
                  ? 'bg-navy-50/80 border border-navy-200'
                  : isCompleted
                  ? 'hover:bg-slate-100 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-navy-800 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
              </div>
              <div className="overflow-hidden">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Step {step.number}
                </span>
                <span
                  className={`block text-xs font-semibold truncate ${
                    isCurrent ? 'text-navy-900' : 'text-slate-600'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

