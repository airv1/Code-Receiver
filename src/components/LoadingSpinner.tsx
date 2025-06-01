import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };
  
  return (
    <div className="flex items-center justify-center p-4">
      <div 
        className={`animate-spin rounded-full border-solid border-primary border-t-transparent ${sizeClasses[size]}`}
        role="status"
        aria-label="加载中"
      />
    </div>
  );
};

export default LoadingSpinner;