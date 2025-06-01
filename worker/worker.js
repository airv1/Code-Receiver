export default {
  async email(message, env, ctx) {
    try {
      console.log('Received email:', {
        from: message.from,
        to: message.to,
        subject: message.subject,
        hasText: !!message.text,
        hasHtml: !!message.html,
        hasRaw: !!message.raw,
        hasAttachments: message.attachments ? message.attachments.length > 0 : false,
        rawSize: message.rawSize,
        headers: message.headers ? Object.fromEntries(message.headers) : {}
      });

      // 获取发件人信息
      let from = 'Unknown';
      if (message.from) {
        if (Array.isArray(message.from)) {
          from = message.from[0].address || message.from[0].name || 'Unknown';
        } else if (typeof message.from === 'string') {
          from = message.from;
        } else if (message.from.address) {
          from = message.from.address;
        }
      }

      // 获取主题
      let subject = 'No Subject';
      if (message.subject) {
        subject = message.subject;
      } else if (message.headers && message.headers.get('subject')) {
        subject = message.headers.get('subject');
      }

      // 获取邮件内容
      let content = '';
      let contentType = 'text/html';
      
      try {
        console.log('开始处理邮件内容...');
        // 首先尝试获取HTML内容
        if (message.html) {
          console.log('找到 HTML 内容，开始读取...');
          const htmlStream = message.html;
          const htmlChunks = [];
          const htmlReader = htmlStream.getReader();
          
          while (true) {
            const { done, value } = await htmlReader.read();
            if (done) break;
            htmlChunks.push(value);
          }
          
          content = htmlChunks.join('');
          console.log('原始 HTML 内容:', content);
        }
        // 如果没有HTML内容，尝试获取文本内容
        else if (message.text) {
          console.log('找到文本内容，开始读取...');
          const textStream = message.text;
          const textChunks = [];
          const textReader = textStream.getReader();
          
          while (true) {
            const { done, value } = await textReader.read();
            if (done) break;
            textChunks.push(value);
          }
          
          content = textChunks.join('');
          console.log('原始文本内容:', content);
          contentType = 'text/plain';
        }
        // 如果都没有，尝试获取原始内容
        else if (message.raw) {
          console.log('找到原始内容，开始读取...');
          const rawStream = message.raw;
          const rawChunks = [];
          const rawReader = rawStream.getReader();
          
          while (true) {
            const { done, value } = await rawReader.read();
            if (done) break;
            rawChunks.push(value);
          }
          
          content = rawChunks.join('');
          console.log('原始内容:', content);
          
          // 尝试解析 MIME 格式
          if (content.includes('Content-Type: multipart/alternative')) {
            console.log('检测到 MIME 格式，开始解析...');
            
            // 首先尝试提取 HTML 部分
            const htmlPartMatch = content.match(/Content-Type: text\/html;[^]*?charset="UTF-8"[^]*?Content-Transfer-Encoding: base64\s*\n\s*([A-Za-z0-9+/=]+)(?=\s*------=_NextPart_)/);
            if (htmlPartMatch) {
              console.log('找到 HTML 部分');
              try {
                content = atob(htmlPartMatch[1]);
                contentType = 'text/html';
                console.log('使用 HTML 内容');
              } catch (e) {
                console.log('Failed to decode base64 HTML part:', e);
              }
            } else {
              // 如果没有找到 HTML 部分，尝试纯文本部分
              const textPartMatch = content.match(/Content-Type: text\/plain;[^]*?charset="UTF-8"[^]*?Content-Transfer-Encoding: base64\s*\n\s*([A-Za-z0-9+/=]+)(?=\s*------=_NextPart_)/);
              if (textPartMatch) {
                console.log('找到纯文本部分');
                try {
                  content = atob(textPartMatch[1]);
                  contentType = 'text/plain';
                  console.log('使用纯文本内容');
                } catch (e) {
                  console.log('Failed to decode base64 text part:', e);
                }
              }
            }
          }
        }
        // 最后尝试从附件中获取内容
        else if (message.attachments && message.attachments.length > 0) {
          for (const attachment of message.attachments) {
            if (attachment.content) {
              const attachmentStream = attachment.content;
              const attachmentChunks = [];
              const attachmentReader = attachmentStream.getReader();
              
              while (true) {
                const { done, value } = await attachmentReader.read();
                if (done) break;
                attachmentChunks.push(value);
              }
              
              content = attachmentChunks.join('');
              
              // 检查是否是 base64 编码
              if (content.match(/^[A-Za-z0-9+/=]+$/)) {
                try {
                  content = atob(content);
                } catch (e) {
                  console.log('Not a valid base64 string, using as is');
                }
              }
              
              contentType = attachment.contentType || 'text/plain';
              console.log('Using attachment content, type:', contentType, 'length:', content.length);
              break;
            }
          }
        }

        // 处理 QQ 邮箱的特殊格式
        if (content.includes('X-QQ-')) {
          console.log('检测到 QQ 邮箱格式，开始处理...');
          
          // 移除所有邮件头信息
          content = content
            // 移除所有 Received 头
            .replace(/Received:.*?\n/gs, '')
            // 移除所有 ARC 相关头
            .replace(/ARC-.*?\n/gs, '')
            // 移除所有 Authentication 相关头
            .replace(/Authentication-Results:.*?\n/gs, '')
            // 移除所有 DKIM 相关头
            .replace(/DKIM-Signature:.*?\n/gs, '')
            // 移除所有 X-QQ 相关头
            .replace(/X-QQ-.*?\n/gs, '')
            // 移除所有 MIME 相关头
            .replace(/MIME-Version:.*?\n/gs, '')
            .replace(/Content-Type:.*?\n/gs, '')
            .replace(/Content-Transfer-Encoding:.*?\n/gs, '')
            .replace(/Content-Disposition:.*?\n/gs, '')
            // 移除所有 From/To/Subject 头
            .replace(/From:.*?\n/gs, '')
            .replace(/To:.*?\n/gs, '')
            .replace(/Subject:.*?\n/gs, '')
            // 移除所有 Date 头
            .replace(/Date:.*?\n/gs, '')
            // 移除所有 Message-ID 头
            .replace(/Message-ID:.*?\n/gs, '')
            // 移除所有 MIME 分隔符
            .replace(/------=_NextPart_.*?\n/gs, '')
            .replace(/^--.*?\n/gm, '')
            // 移除所有空行
            .replace(/\n\n+/g, '\n')
            .trim();

          // 自动检测和处理编码
          const processEncoding = (text) => {
            let processed = text;

            // 1. 处理 base64 编码
            if (processed.match(/^[A-Za-z0-9+/=]+$/)) {
              try {
                processed = atob(processed);
              } catch (e) {
                console.log('Base64 解码失败:', e);
              }
            }

            // 2. 处理 quoted-printable 编码
            if (processed.includes('=')) {
              try {
                // 移除软换行
                processed = processed
                  .replace(/=\r\n/g, '')
                  .replace(/=\n/g, '')
                  .replace(/=\s/g, '');

                // 解码 quoted-printable
                processed = processed.replace(/=([0-9A-F]{2})/gi, (_, p1) => {
                  return String.fromCharCode(parseInt(p1, 16));
                });
              } catch (e) {
                console.log('Quoted-printable 解码失败:', e);
              }
            }

            // 3. 处理 ASCII 码格式
            if (/^\d+(,\d+)*$/.test(processed)) {
              try {
                const bytes = new Uint8Array(processed.split(',').map(num => parseInt(num)));
                processed = new TextDecoder('utf-8').decode(bytes);
              } catch (e) {
                console.log('ASCII 解码失败:', e);
              }
            }

            // 4. 处理 UTF-8 编码
            try {
              const encoder = new TextEncoder();
              const bytes = encoder.encode(processed);
              const decoder = new TextDecoder('utf-8');
              processed = decoder.decode(bytes);
            } catch (e) {
              console.log('UTF-8 解码失败:', e);
            }

            // 5. 处理 Unicode 转义序列
            if (processed.includes('\\u')) {
              try {
                processed = processed.replace(/\\u([0-9a-fA-F]{4})/g, (_, p1) => {
                  return String.fromCharCode(parseInt(p1, 16));
                });
              } catch (e) {
                console.log('Unicode 解码失败:', e);
              }
            }

            // 6. 处理 URL 编码
            if (processed.includes('%')) {
              try {
                processed = decodeURIComponent(processed);
              } catch (e) {
                console.log('URL 解码失败:', e);
              }
            }

            return processed;
          };

          // 应用编码处理
          content = processEncoding(content);

          // 提取实际内容
          const contentMatch = content.match(/([\s\S]*?)(?=\n\n|$)/);
          if (contentMatch) {
            content = contentMatch[1];
          }

          // 清理内容
          content = content
            // 移除多余的空格
            .replace(/\s+/g, ' ')
            // 移除开头和结尾的空格
            .trim();

          console.log('处理后的内容:', content);
        }

        // 如果内容为空，记录详细信息
        if (!content) {
          console.error('No content found in email. Message details:', {
            from,
            to: message.to,
            subject,
            hasText: !!message.text,
            hasHtml: !!message.html,
            hasRaw: !!message.raw,
            hasAttachments: message.attachments ? message.attachments.length > 0 : false,
            rawSize: message.rawSize,
            headers: message.headers ? Object.fromEntries(message.headers) : {}
          });
          throw new Error('No content found in email');
        }

        // 记录成功提取的内容信息
        console.log('Successfully extracted content:', {
          contentType,
          contentLength: content.length,
          contentPreview: content.substring(0, 100) + '...'
        });
      } catch (error) {
        console.error('Error reading message content:', error);
        throw error;
      }

      const id = generateId();
      const messageData = {
        id,
        from,
        to: message.to,
        subject,
        content,
        contentType,
        timestamp: Date.now(),
        processed: true,
        metadata: {
          messageId: message.messageId,
          hasText: !!message.text,
          hasHtml: !!message.html,
          hasRaw: !!message.raw,
          hasAttachments: message.attachments ? message.attachments.length > 0 : false,
          rawSize: message.rawSize,
          headers: message.headers ? Object.fromEntries(message.headers) : {}
        }
      };

      console.log('Saving message:', {
        id,
        from,
        to: message.to,
        subject,
        contentType,
        contentLength: content.length,
        metadata: messageData.metadata
      });
      
      await env.SMS_MESSAGES.put(id, JSON.stringify(messageData));
      
      console.log(`Successfully processed email from ${from} with ID: ${id}`);
      
      return new Response('Message processed successfully', { status: 200 });
    } catch (error) {
      console.error('Email processing error:', error);
      return new Response(`Error processing email: ${error.message}`, { status: 500 });
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://gv.airv.us',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }
    
    if (path === '/credentials' && request.method === 'GET') {
      try {
        const authHeader = request.headers.get('Authorization') || '';
        console.log('Received auth header:', authHeader);
        
        if (!authHeader.startsWith('Basic ')) {
          console.log('Invalid auth header format');
          return new Response(
            JSON.stringify({ success: false, error: 'Authorization required' }),
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
                'WWW-Authenticate': 'Basic realm="SMS Forwarding System"'
              },
            }
          );
        }
        
        const [username, password] = atob(authHeader.replace('Basic ', '')).split(':');
        console.log('Decoded credentials:', { username, password: password ? '***' : undefined });
        
        const isValid = await validateAuth(username, password, env);
        
        if (!isValid) {
          console.log('Invalid credentials');
          return new Response(
            JSON.stringify({ success: false, error: 'Unauthorized' }),
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        }
        
        console.log('Credentials validated successfully');
        return new Response(
          JSON.stringify({
            success: true,
            credentials: {
              username: env.AUTH_USERNAME,
              password: env.AUTH_PASSWORD
            }
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        console.error('Error in /credentials endpoint:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to get credentials' }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    }
    
    if (path === '/login' && request.method === 'POST') {
      try {
        const body = await request.json();
        console.log('Login request body:', { 
          username: body.username,
          password: body.password ? '***' : undefined
        });
        
        const { username, password } = body;
        const isValid = await validateAuth(username, password, env);
        
        if (isValid) {
          console.log('Login successful');
          return new Response(
            JSON.stringify({ 
              success: true,
              message: '登录成功'
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        }
        
        console.log('Login failed: invalid credentials');
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: '用户名或密码不正确' 
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        console.error('Error in /login endpoint:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: '登录请求无效' 
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    }
    
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Basic ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
            'WWW-Authenticate': 'Basic realm="SMS Forwarding System"'
          },
        }
      );
    }
    
    const [username, password] = atob(authHeader.replace('Basic ', '')).split(':');
    const isValid = await validateAuth(username, password, env);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    if (path === '/messages' && request.method === 'GET') {
      try {
        const { keys } = await env.SMS_MESSAGES.list();
        const messages = [];
        
        for (const key of keys) {
          const messageData = await env.SMS_MESSAGES.get(key.name, { type: 'json' });
          if (messageData) {
            messages.push(messageData);
          }
        }
        
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 10;
        const start = (page - 1) * limit;
        const end = start + limit;
        
        messages.sort((a, b) => b.timestamp - a.timestamp);
        const paginatedMessages = messages.slice(start, end);
        
        return new Response(
          JSON.stringify({
            success: true,
            messages: paginatedMessages,
            pagination: {
              total: messages.length,
              page,
              limit,
              totalPages: Math.ceil(messages.length / limit)
            }
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        console.error('Error fetching messages:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    }
    
    if (path === '/messages' && request.method === 'DELETE') {
      try {
        const { keys } = await env.SMS_MESSAGES.list();
        
        await Promise.all(
          keys.map(key => env.SMS_MESSAGES.delete(key.name))
        );
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'All messages deleted successfully'
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        console.error('Error deleting messages:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    }
    
    // 添加单个邮件删除的路由
    if (path.startsWith('/messages/') && request.method === 'DELETE') {
      try {
        const id = path.split('/').pop();
        if (!id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Message ID is required' }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        }
        
        await env.SMS_MESSAGES.delete(id);
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Message deleted successfully'
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        console.error('Error deleting message:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Not found' }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

async function validateAuth(username, password, env) {
  console.log('Validating auth:', { 
    providedUsername: username,
    providedPassword: password ? '***' : undefined,
    envUsername: env.AUTH_USERNAME,
    envPassword: env.AUTH_PASSWORD ? '***' : undefined
  });
  
  if (!username || !password) {
    console.log('Missing username or password');
    return false;
  }
  
  if (!env.AUTH_USERNAME || !env.AUTH_PASSWORD) {
    console.log('Missing environment variables AUTH_USERNAME or AUTH_PASSWORD');
    return false;
  }
  
  const isValid = username === env.AUTH_USERNAME && password === env.AUTH_PASSWORD;
  console.log('Auth validation result:', isValid);
  
  return isValid;
}
