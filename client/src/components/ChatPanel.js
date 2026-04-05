import React, { useState, useRef, useEffect } from 'react';
import { sendChat } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import { Send, Terminal, Loader2, Zap, Server, DollarSign, Trash2 } from 'lucide-react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--bg-primary)',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-sm)',
    background: 'linear-gradient(135deg, var(--accent-cyan), #06b6d4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--bg-primary)',
  },
  logoText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  logoSub: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    fontWeight: 400,
    marginLeft: '8px',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  welcomeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '24px',
    padding: '40px 20px',
  },
  welcomeTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
    textAlign: 'center',
    maxWidth: '400px',
    lineHeight: 1.6,
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    maxWidth: '500px',
    width: '100%',
  },
  quickBtn: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  quickBtnIcon: {
    color: 'var(--accent-cyan)',
    flexShrink: 0,
    marginTop: '1px',
  },
  quickBtnText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  messageRow: (isUser) => ({
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    animation: 'slideUp 0.25s ease',
  }),
  messageBubble: (isUser) => ({
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
    background: isUser ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
    color: isUser ? 'var(--bg-primary)' : 'var(--text-primary)',
    fontSize: '13px',
    lineHeight: 1.6,
    border: isUser ? 'none' : '1px solid var(--border-primary)',
    wordBreak: 'break-word',
  }),
  messageContent: {
    fontFamily: 'var(--font-sans)',
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    padding: '12px 16px',
    background: 'var(--bg-tertiary)',
    borderRadius: '14px 14px 14px 4px',
    border: '1px solid var(--border-primary)',
    width: 'fit-content',
  },
  typingDot: (delay) => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent-cyan)',
    animation: `typing 1.4s ease-in-out ${delay}s infinite`,
  }),
  inputArea: {
    padding: '16px 24px 20px',
    borderTop: '1px solid var(--border-primary)',
    flexShrink: 0,
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-lg)',
    padding: '6px 6px 6px 16px',
    transition: 'border-color 0.15s',
  },
  inputWrapperFocused: {
    borderColor: 'var(--accent-cyan)',
    boxShadow: 'var(--shadow-glow)',
  },
  textarea: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    resize: 'none',
    padding: '8px 0',
    maxHeight: '120px',
    lineHeight: 1.5,
  },
  sendBtn: (canSend) => ({
    background: canSend ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: canSend ? 'var(--bg-primary)' : 'var(--text-muted)',
    padding: '10px',
    cursor: canSend ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    flexShrink: 0,
  }),
  toolBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--accent-cyan)',
    background: 'var(--accent-cyan-dim)',
    padding: '2px 8px',
    borderRadius: '99px',
    marginBottom: '6px',
    display: 'inline-block',
  },
};

// 마크다운 내 코드블록 스타일링
const markdownComponents = {
  code: ({ inline, children }) => {
    if (inline) {
      return (
        <code style={{
          background: 'rgba(34, 211, 238, 0.1)',
          padding: '1px 5px',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--accent-cyan)',
        }}>
          {children}
        </code>
      );
    }
    return (
      <pre style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px',
        overflow: 'auto',
        margin: '8px 0',
      }}>
        <code style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-primary)',
        }}>
          {children}
        </code>
      </pre>
    );
  },
};

const QUICK_ACTIONS = [
  { icon: Server, text: '현재 돌아가고 있는 서버 보여줘', label: '서버 조회' },
  { icon: Zap, text: 't3.micro 서버 하나 만들어줘, 이름은 test-server', label: '서버 생성' },
  { icon: DollarSign, text: '이번 달 AWS 비용 얼마야?', label: '비용 확인' },
  { icon: Trash2, text: '안 쓰는 서버 있으면 정리해줘', label: '리소스 정리' },
];

export default function ChatPanel() {
  const [messages, setMessages] = useState([]); // { role, content, toolsUsed? }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMessage = { role: 'user', content: msg };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // textarea 높이 리셋
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      // API에는 role/content만 보냄
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await sendChat(apiMessages);

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: result.message,
          toolsUsed: result.toolsUsed || 0,
        },
      ]);
    } catch (err) {
      const errMsg = err.response?.data?.error || '요청 처리 중 오류가 발생했습니다.';
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `⚠️ ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    // auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const canSend = input.trim().length > 0 && !loading;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <Terminal size={18} strokeWidth={2.5} />
          </div>
          <div>
            <span style={styles.logoText}>Chat2Infra</span>
            <span style={styles.logoSub}>AI Cloud Manager</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 ? (
          <div style={styles.welcomeContainer}>
            <div>
              <div style={styles.welcomeTitle}>클라우드, 말로 하세요 ☁️</div>
              <div style={styles.welcomeSub}>
                서버 생성, 중지, 비용 확인까지<br />
                한국어 한 줄이면 충분합니다.
              </div>
            </div>
            <div style={styles.quickActions}>
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  style={styles.quickBtn}
                  onClick={() => handleSend(action.text)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                    e.currentTarget.style.background = 'var(--bg-card-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                    e.currentTarget.style.background = 'var(--bg-card)';
                  }}
                >
                  <action.icon size={15} style={styles.quickBtnIcon} />
                  <span style={styles.quickBtnText}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={styles.messageRow(msg.role === 'user')}>
              <div style={styles.messageBubble(msg.role === 'user')}>
                {msg.role === 'assistant' && msg.toolsUsed > 0 && (
                  <div style={styles.toolBadge}>
                    ⚡ AWS {msg.toolsUsed}건 실행
                  </div>
                )}
                <div style={styles.messageContent}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown components={markdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div style={styles.messageRow(false)}>
            <div style={styles.typingIndicator}>
              <span style={styles.typingDot(0)} />
              <span style={styles.typingDot(0.2)} />
              <span style={styles.typingDot(0.4)} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <div style={{ ...styles.inputWrapper, ...(focused ? styles.inputWrapperFocused : {}) }}>
          <textarea
            ref={textareaRef}
            style={styles.textarea}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="서버 만들어줘, 비용 확인해줘, 안 쓰는 거 꺼줘..."
            rows={1}
            disabled={loading}
          />
          <button
            style={styles.sendBtn(canSend)}
            onClick={() => handleSend()}
            disabled={!canSend}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
