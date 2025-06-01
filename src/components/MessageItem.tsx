import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatters';

interface MessageProps {
  id: string;
  from: string;
  content: string;
  timestamp: number;
  onDelete: (id: string) => void;
}

const MessageItem: React.FC<MessageProps> = ({ 
  id, 
  from, 
  content, 
  timestamp, 
  onDelete 
}) => {
  return (
    <div className="card group mb-4 overflow-hidden transition-all hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center">
            <h3 className="font-medium text-primary">{from}</h3>
            <span className="ml-2 text-xs text-muted">{formatDate(timestamp)}</span>
          </div>
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
        
        <button 
          onClick={() => onDelete(id)}
          className="ml-2 -mr-2 -mt-2 rounded-full p-2 text-muted opacity-0 transition-opacity hover:bg-error/10 hover:text-error group-hover:opacity-100"
          aria-label="删除消息"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageItem;