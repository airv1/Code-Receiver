import React from 'react';
import { MessageSquareOff } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message = '暂无消息' }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-card p-12 text-center">
      <MessageSquareOff className="mb-4 h-16 w-16 text-muted" />
      <h3 className="mb-2 text-xl font-medium">{message}</h3>
      <p className="text-muted">新的短信将在收到后自动显示在这里</p>
    </div>
  );
};

export default EmptyState;