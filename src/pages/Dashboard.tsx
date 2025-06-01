import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Message } from '../types';
import { fetchMessages, deleteMessage, clearAllMessages } from '../api/messagesApi';
import LoadingSpinner from '../components/LoadingSpinner';
import Header from '../components/Header';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { logout } = useAuth();

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchMessages();
      if (response.success && response.data) {
        setMessages(response.data);
        setHasMore(response.data.length === 10);
      } else {
        setError(response.error || '加载失败');
      }
    } catch (err) {
      setError('加载失败');
      console.error('加载消息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    try {
      setLoading(true);
      const nextPage = page + 1;
      const response = await fetchMessages();
      if (response.success && response.data) {
        setMessages(prev => [...prev, ...response.data!]);
        setPage(nextPage);
        setHasMore(response.data.length === 10);
      } else {
        setError(response.error || '加载更多失败');
      }
    } catch (err) {
      setError('加载更多失败');
      console.error('加载更多消息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteMessage(id);
      if (response.success) {
        setMessages(prev => prev.filter(msg => msg.id !== id));
      } else {
        setError(response.error || '删除失败');
      }
    } catch (err) {
      setError('删除失败');
      console.error('删除消息失败:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('确定要清空所有消息吗？')) return;
    try {
      const response = await clearAllMessages();
      if (response.success) {
        setMessages([]);
      } else {
        setError(response.error || '清空失败');
      }
    } catch (err) {
      setError('清空失败');
      console.error('清空消息失败:', err);
    }
  };

  const handleLogout = () => {
    try {
      logout();
      navigate('/login');
    } catch (err) {
      console.error('退出登录错误:', err);
      setError(err instanceof Error ? err.message : '退出登录失败');
    }
  };

  const toggleMessage = (id: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatContent = (content: string) => {
    // 检查是否是 ASCII 码格式
    if (/^\d+(,\d+)*$/.test(content)) {
      try {
        const bytes = new Uint8Array(content.split(',').map(num => parseInt(num)));
        return new TextDecoder('utf-8').decode(bytes);
      } catch (e) {
        console.error('字符编码转换失败:', e);
        return content;
      }
    }

    // 处理 quoted-printable 编码
    if (content.includes('=E') || content.includes('=e')) {
      try {
        // 解码 quoted-printable
        const decoded = content
          .replace(/=\r\n/g, '')
          .replace(/=\n/g, '')
          .replace(/=([0-9A-F]{2})/gi, (_, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
          });

        // 处理中文字符
        if (decoded.includes('é') || decoded.includes('è')) {
          try {
            // 将字符串转换为 UTF-8 字节数组
            const encoder = new TextEncoder();
            const bytes = encoder.encode(decoded);
            
            // 使用 UTF-8 解码
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(bytes);
          } catch (e) {
            console.error('UTF-8 解码失败:', e);
            return decoded;
          }
        }
        
        return decoded;
      } catch (e) {
        console.error('quoted-printable 解码失败:', e);
        return content;
      }
    }

    // 处理其他编码的中文字符
    if (content.includes('é') || content.includes('è')) {
      try {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(content);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(bytes);
      } catch (e) {
        console.error('UTF-8 解码失败:', e);
        return content;
      }
    }

    return content;
  };

  const renderContent = (content: string | undefined, contentType: string | undefined) => {
    if (!content) {
      return (
        <div className="text-gray-500 italic">
          无内容
        </div>
      );
    }

    // 1. 屏蔽常见邮件头部
    let cleaned = content.replace(/^(Received|ARC-|Authentication-Results|DKIM-Signature|X-QQ-|MIME-Version|Content-Type|Content-Transfer-Encoding|Content-Disposition|From|To|Subject|Date|Message-ID|Return-Path|Delivered-To|List-|Precedence|Reply-To|Cc|Bcc|X-).*?:.*?\n/igm, '');
    cleaned = cleaned.replace(/\n{2,}/g, '\n');

    // 2. 处理混合编码
    const processMixedEncoding = (text: string) => {
      let processed = text;

      // 2.1 处理 ASCII 码（数字逗号分隔）
      const processAscii = (str: string) => {
        const parts = str.split(',').map(s => parseInt(s.trim()));
        if (parts.some(isNaN)) return str;
        try {
          return String.fromCharCode(...parts);
        } catch {
          return str;
        }
      };

      // 2.2 处理16进制
      const processHex = (str: string) => {
        const hexParts = str.match(/[0-9A-Fa-f]{2}/g);
        if (!hexParts) return str;
        try {
          const bytes = new Uint8Array(hexParts.map(h => parseInt(h, 16)));
          return new TextDecoder('utf-8').decode(bytes);
        } catch {
          return str;
        }
      };

      // 2.3 处理 quoted-printable
      const processQuotedPrintable = (str: string) => {
        return str.replace(/=([0-9A-Fa-f]{2})/gi, (_, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
        });
      };

      // 2.4 处理特殊字符序列
      const processSpecialChars = (str: string) => {
        return str
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // 移除控制字符
          .replace(/[^\x20-\x7E\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF]/g, '') // 只保留基本ASCII、中文和常用符号
          .replace(/\s+/g, ' ') // 合并空白字符
          .trim();
      };

      // 2.5 尝试不同的编码方式
      const encodings = [
        { pattern: /^\d+(,\d+)*$/, processor: processAscii },
        { pattern: /^[0-9A-Fa-f]{2}([ ,][0-9A-Fa-f]{2})*$/, processor: processHex },
        { pattern: /=([0-9A-Fa-f]{2})/, processor: processQuotedPrintable }
      ];

      // 2.6 分段处理
      const segments = processed.split(/(?<=[^0-9A-Fa-f,=])(?=[0-9A-Fa-f,=])|(?<=[0-9A-Fa-f,=])(?=[^0-9A-Fa-f,=])/);
      processed = segments.map(segment => {
        // 尝试每种编码方式
        for (const { pattern, processor } of encodings) {
          if (pattern.test(segment)) {
            return processor(segment);
          }
        }
        return segment;
      }).join('');

      // 2.7 最后清理特殊字符
      return processSpecialChars(processed);
    };

    // 3. 应用混合编码处理
    cleaned = processMixedEncoding(cleaned);

    // 4. 尝试提取 <body> 或 <html> 部分
    let htmlBody = '';
    const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      htmlBody = bodyMatch[1];
    } else {
      const htmlMatch = cleaned.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
      if (htmlMatch) {
        htmlBody = htmlMatch[1];
      } else {
        htmlBody = cleaned;
      }
    }

    // 5. 渲染 HTML
    return (
      <div 
        className="text-gray-700 whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{ __html: htmlBody }}
      />
    );
  };

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground">消息列表</h1>
            <div className="flex gap-4">
              <button
                onClick={handleClearAll}
                className="btn btn-secondary"
                disabled={messages.length === 0}
              >
                清空所有
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-error/10 text-error rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-muted">
                {messages.map((message) => (
                  <li key={message.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-primary">{message.from}</span>
                          <span className="text-xs text-muted">
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {message.subject && (
                          <p className="text-sm font-medium mb-1">{message.subject}</p>
                        )}
                        <div className="relative">
                          <div className="bg-muted/10 rounded-lg overflow-hidden">
                            <div className="p-4">
                              {expandedMessages.has(message.id) ? (
                                <div className="space-y-4">
                                  {renderContent(message.content, message.contentType)}
                                  <button
                                    onClick={() => toggleMessage(message.id)}
                                    className="text-sm text-muted hover:text-foreground transition-colors"
                                  >
                                    收起
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="line-clamp-3">
                                    {renderContent(message.content, message.contentType)}
                                  </div>
                                  <button
                                    onClick={() => toggleMessage(message.id)}
                                    className="text-sm text-muted hover:text-foreground transition-colors"
                                  >
                                    展开
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="ml-4 text-error hover:text-error/80"
                      >
                        删除
                      </button>
                    </div>
                  </li>
                ))}
                {messages.length === 0 && (
                  <li className="p-4 text-center text-muted">
                    暂无消息
                  </li>
                )}
              </ul>
            </div>
          )}

          {messages.length > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading || !hasMore}
                className={`px-4 py-2 rounded transition-colors ${
                  loading || !hasMore
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {loading ? '加载中...' : hasMore ? '加载更多' : '没有更多了'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}