import React from 'react';

interface StepNavigationProps {
  steps: string[];
  activeStep: number;
}

const StepNavigation: React.FC<StepNavigationProps> = ({ steps, activeStep }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div
            className={`flex items-center ${
              index <= activeStep ? 'text-[#4169e1]' : 'text-gray-500'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index <= activeStep ? 'bg-[#4169e1] text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {index + 1}
            </div>
            <span className="mx-2">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-[2px] w-16 mx-2 ${
                index < activeStep ? 'bg-[#4169e1]' : 'bg-gray-700'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepNavigation;