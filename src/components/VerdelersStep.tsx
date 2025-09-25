import React from 'react';

interface VerdelersStepProps {
  onNext?: () => void;
  onPrevious?: () => void;
  data?: any;
  onDataChange?: (data: any) => void;
}

const VerdelersStep: React.FC<VerdelersStepProps> = ({
  onNext,
  onPrevious,
  data,
  onDataChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Verdelers Step
        </h2>
        <p className="text-gray-600">
          This component needs to be implemented with the proper functionality.
        </p>
      </div>
      
      <div className="flex justify-between">
        {onPrevious && (
          <button
            type="button"
            onClick={onPrevious}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Previous
          </button>
        )}
        
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default VerdelersStep;