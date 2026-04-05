import React, { useState } from 'react';
import ChatPanel from './components/ChatPanel';
import Dashboard from './components/Dashboard';
import { PanelRightOpen, PanelRightClose } from 'lucide-react';

const styles = {
  app: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: 'var(--bg-primary)',
  },
  chatPane: (dashboardOpen) => ({
    flex: 1,
    minWidth: 0,
    height: '100%',
    transition: 'all 0.3s ease',
  }),
  dashboardPane: (open) => ({
    width: open ? '360px' : '0px',
    minWidth: open ? '360px' : '0px',
    height: '100%',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  }),
  toggleBtn: {
    position: 'fixed',
    top: '14px',
    right: '16px',
    zIndex: 100,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
};

export default function App() {
  const [dashboardOpen, setDashboardOpen] = useState(true);

  return (
    <div style={styles.app}>
      <div style={styles.chatPane(dashboardOpen)}>
        <ChatPanel />
      </div>
      <div style={styles.dashboardPane(dashboardOpen)}>
        <Dashboard />
      </div>
      <button
        style={styles.toggleBtn}
        onClick={() => setDashboardOpen(!dashboardOpen)}
        title={dashboardOpen ? '대시보드 닫기' : '대시보드 열기'}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-cyan)';
          e.currentTarget.style.color = 'var(--accent-cyan)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-primary)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        {dashboardOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
      </button>
    </div>
  );
}
