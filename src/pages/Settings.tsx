import React, { useState } from 'react';
import { Mail } from 'lucide-react';

const Settings: React.FC = () => {
  const [showCopied, setShowCopied] = useState(false);
  const workerUrl = import.meta.env.VITE_WORKER_URL || '未配置';
  
  const handleCopyEmail = () => {
    // Extract email from worker URL (this is just an example)
    const emailParts = workerUrl.split('.');
    if (emailParts.length > 1) {
      const email = `${emailParts[0]}@example.com`;
      navigator.clipboard.writeText(email);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };
  
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">设置</h2>
      
      <div className="card mb-6">
        <h3 className="mb-4 text-xl font-semibold">转发邮箱</h3>
        <p className="mb-4 text-muted">
          将短信转发到以下邮箱地址，系统会自动处理并显示在消息列表中。
        </p>
        
        <div className="flex items-center gap-2">
          <div className="relative flex flex-1 items-center">
            <Mail className="absolute left-3 h-5 w-5 text-muted" />
            <input
              type="text"
              value={`${workerUrl.split('.')[0]}@example.com`}
              readOnly
              className="input w-full pl-10"
            />
          </div>
          
          <button 
            onClick={handleCopyEmail}
            className="btn btn-primary"
          >
            {showCopied ? '已复制' : '复制'}
          </button>
        </div>
      </div>
      
      <div className="card">
        <h3 className="mb-4 text-xl font-semibold">关于系统</h3>
        <p className="mb-2">
          短信转发系统利用 Cloudflare 的邮件路由、Workers 和 KV 存储构建。
        </p>
        <p className="mb-4">
          当您的手机将短信转发到指定邮箱时，Cloudflare 的邮件路由会将其发送至 Worker，然后在此网页上显示。
        </p>
        
        <div className="rounded-lg bg-card p-4">
          <h4 className="mb-2 font-medium">系统信息</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted">
            <li>Worker URL: {workerUrl}</li>
            <li>存储类型: Cloudflare KV</li>
            <li>版本: 1.0.0</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;