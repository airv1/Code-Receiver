export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  
  // Less than 1 minute
  if (diffMins < 1) {
    return '刚刚';
  }
  
  // Less than 1 hour
  if (diffMins < 60) {
    return `${diffMins} 分钟前`;
  }
  
  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }
  
  // Less than 7 days
  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }
  
  // Full date
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};