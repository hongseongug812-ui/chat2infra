import React, { useState } from 'react';
import { login, register, loginDemo } from '../utils/api';
import { User, Lock, Zap, ChevronRight, AlertCircle } from 'lucide-react';

const s = {
  page: {
    minHeight: '100vh', width: '100vw',
    background: 'var(--bg-primary)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  },
  logo: {
    fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 800,
    color: 'var(--accent-cyan)', letterSpacing: '-0.02em', marginBottom: '8px',
  },
  tagline: { fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '40px' },
  card: {
    width: '100%', maxWidth: '400px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border-primary)' },
  tab: (active) => ({
    flex: 1, padding: '14px', textAlign: 'center', cursor: 'pointer',
    fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600,
    background: active ? 'var(--bg-card)' : 'transparent',
    color: active ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
    borderBottom: active ? '2px solid var(--accent-cyan)' : '2px solid transparent',
    transition: 'all 0.15s',
  }),
  body: { padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 },
  inputRow: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' },
  input: {
    width: '100%', background: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '14px',
    padding: '10px 12px 10px 36px', outline: 'none',
    transition: 'border-color 0.15s',
  },
  btn: {
    background: 'var(--accent-cyan)', border: 'none',
    borderRadius: 'var(--radius-sm)', color: 'var(--bg-primary)',
    fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700,
    padding: '12px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    transition: 'opacity 0.15s',
  },
  demoSection: { padding: '0 28px 28px' },
  divider: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  dividerLine: { flex: 1, height: '1px', background: 'var(--border-primary)' },
  dividerText: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  demoBtn: {
    width: '100%', background: 'transparent',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
    fontSize: '13px', fontWeight: 600, padding: '11px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    transition: 'all 0.15s',
  },
  error: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)',
    borderRadius: 'var(--radius-sm)', color: 'var(--accent-red)',
    fontSize: '12px', padding: '10px 12px',
  },
};

export default function LoginPage({ onAuth }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFocusIn = (e) => (e.target.style.borderColor = 'var(--accent-cyan)');
  const handleFocusOut = (e) => (e.target.style.borderColor = 'var(--border-primary)');

  const doAuth = async (fn) => {
    setError('');
    setLoading(true);
    try {
      const data = await fn();
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('isDemo', data.isDemo ? 'true' : 'false');
      onAuth(data);
    } catch (err) {
      setError(err.response?.data?.error || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return setError('아이디와 비밀번호를 입력해주세요.');
    doAuth(() => tab === 'login' ? login(username, password) : register(username, password));
  };

  return (
    <div style={s.page}>
      <div style={s.logo}>⬡ Chat2Infra</div>
      <p style={s.tagline}>채팅 한 줄로 끝내는 AWS 인프라 자동 관리</p>

      <div style={s.card}>
        <div style={s.tabs}>
          <div style={s.tab(tab === 'login')} onClick={() => { setTab('login'); setError(''); }}>로그인</div>
          <div style={s.tab(tab === 'register')} onClick={() => { setTab('register'); setError(''); }}>회원가입</div>
        </div>

        <form style={s.body} onSubmit={handleSubmit}>
          {error && (
            <div style={s.error}><AlertCircle size={14} />{error}</div>
          )}
          <div style={s.fieldWrap}>
            <span style={s.label}>아이디</span>
            <div style={s.inputRow}>
              <User size={14} style={s.inputIcon} />
              <input style={s.input} placeholder="아이디 입력" value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={handleFocusIn} onBlur={handleFocusOut} autoComplete="username" />
            </div>
          </div>
          <div style={s.fieldWrap}>
            <span style={s.label}>비밀번호 {tab === 'register' && <span style={{ color: 'var(--text-muted)' }}>(6자 이상)</span>}</span>
            <div style={s.inputRow}>
              <Lock size={14} style={s.inputIcon} />
              <input style={s.input} type="password" placeholder="비밀번호 입력" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleFocusIn} onBlur={handleFocusOut} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
            </div>
          </div>
          <button type="submit" style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {tab === 'login' ? '로그인' : '회원가입'} <ChevronRight size={16} />
          </button>
        </form>

        <div style={s.demoSection}>
          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>또는</span>
            <div style={s.dividerLine} />
          </div>
          <button
            style={s.demoBtn}
            onClick={() => doAuth(loginDemo)}
            disabled={loading}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-amber)'; e.currentTarget.style.color = 'var(--accent-amber)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Zap size={14} /> 데모로 체험하기 (AWS 불필요)
          </button>
        </div>
      </div>

      <p style={{ marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Powered by GPT-4o mini + AWS SDK
      </p>
    </div>
  );
}
