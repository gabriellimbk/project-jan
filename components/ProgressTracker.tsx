
import React from 'react';

interface ProgressTrackerProps {
  current: number;
  total: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-bold text-indigo-900">Progress</span>
        <span className="text-sm font-medium text-slate-500">{current} of {total} Complete</span>
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
