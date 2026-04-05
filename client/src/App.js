import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import ChatPanel from './components/ChatPanel';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';
import { PanelRightOpen, PanelRightClose, Settings, LogOut } from 'lucide-react';

const styles = {
  app: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-primary)' },
  chatPane: { flex: 1, minWidth: 0, height: '100%', transition: 'all 0.3s ease' },
  dashboardPane: (open) => ({
    width: open ? '360px' : '0px', minWidth: open ? '360px' : '0px',
    height: '100%', overflow: 'hidden', transition: 'all 0.3s ease',
  }),
  iconBtn: {
    position: 'fixed', right: '16px', zIndex: 100,
    background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
    padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  },
};

const hoverOn = (e) => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; };
const hoverOff = (e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-secondary)'; };

export default function App() {
  const [auth, setAuth] = useState(null);
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const isDemo = localStorage.getItem('isDemo') === 'true';
    if (token && username) setAuth({ token, username, isDemo });
  }, []);

  const handleAuth = (data) => setAuth(data);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isDemo');
    setAuth(null);
  };

  if (!auth) return <LoginPage onAuth={handleAuth} />;

  return (
    <div style={styles.app}>
      <div style={styles.chatPane}>
        <ChatPanel isDemo={auth.isDemo} username={auth.username} />
      </div>
      <div style={styles.dashboardPane(dashboardOpen)}>
        <Dashboard isDemo={auth.isDemo} />
      </div>

      {/* 대시보드 토글 */}
      <button style={{ ...styles.iconBtn, top: '14px' }} onClick={() => setDashboardOpen(!dashboardOpen)}
        title={dashboardOpen ? '대시보드 닫기' : '대시보드 열기'} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
        {dashboardOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
      </button>

      {/* 설정 (데모 모드에서는 숨김) */}
      {!auth.isDemo && (
        <button style={{ ...styles.iconBtn, top: '54px' }} onClick={() => setSettingsOpen(true)}
          title="AWS 설정" onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
          <Settings size={16} />
        </button>
      )}

      {/* 로그아웃 */}
      <button style={{ ...styles.iconBtn, top: auth.isDemo ? '54px' : '94px' }} onClick={handleLogout}
        title={`로그아웃 (${auth.username})`} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
        <LogOut size={16} />
      </button>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} onSaved={() => setSettingsOpen(false)} />}
    </div>
  );
}
