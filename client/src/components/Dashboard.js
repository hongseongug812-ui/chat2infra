import React, { useState, useEffect, useCallback } from 'react';
import { getInstances, getCost, killSwitch, checkHealth } from '../utils/api';
import {
  Server, DollarSign, AlertTriangle, PowerOff,
  RefreshCw, Shield, Cpu, Globe, Clock, Wifi, WifiOff
} from 'lucide-react';

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--bg-secondary)',
    borderLeft: '1px solid var(--border-primary)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--accent-cyan)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  iconBtn: {
    background: 'transparent',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.15s',
  },
  killBtn: {
    background: 'var(--accent-red-dim)',
    border: '1px solid var(--accent-red)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent-red)',
    padding: '6px 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    transition: 'all 0.15s',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  section: {
    marginBottom: '4px',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '8px',
    paddingLeft: '2px',
  },
  costCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    animation: 'fadeIn 0.3s ease',
  },
  costHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  costAmount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  costKrw: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    marginTop: '4px',
  },
  costIcon: {
    background: 'var(--accent-green-dim)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px',
    color: 'var(--accent-green)',
  },
  serviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  serviceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    fontSize: '12px',
  },
  serviceName: {
    color: 'var(--text-secondary)',
    maxWidth: '160px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  serviceCost: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    fontSize: '12px',
    fontWeight: 500,
  },
  instanceCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    padding: '14px',
    animation: 'fadeIn 0.3s ease',
    transition: 'border-color 0.15s',
  },
  instanceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  instanceName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  statusBadge: (state) => ({
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '99px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    ...(state === 'running' ? {
      background: 'var(--accent-green-dim)',
      color: 'var(--accent-green)',
      border: '1px solid var(--accent-green)',
    } : state === 'stopped' ? {
      background: 'var(--accent-red-dim)',
      color: 'var(--accent-red)',
      border: '1px solid var(--accent-red)',
    } : {
      background: 'var(--accent-amber-dim)',
      color: 'var(--accent-amber)',
      border: '1px solid var(--accent-amber)',
    }),
  }),
  instanceMeta: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--text-tertiary)',
  },
  metaValue: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
    fontSize: '11px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: 'var(--text-tertiary)',
    textAlign: 'center',
    gap: '8px',
  },
  alertBanner: {
    background: 'var(--accent-amber-dim)',
    border: '1px solid var(--accent-amber)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--accent-amber)',
    fontWeight: 500,
  },
  loadingDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent-cyan)',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
};

export default function Dashboard({ isDemo = false }) {
  const [instances, setInstances] = useState([]);
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [connStatus, setConnStatus] = useState({ server: false, openai: false, aws: false, region: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [instResult, costResult] = await Promise.allSettled([
        getInstances(),
        getCost(),
      ]);

      if (instResult.status === 'fulfilled' && instResult.value.success) {
        setInstances(instResult.value.instances || []);
        setConnStatus((prev) => ({ ...prev, aws: true }));
      }
      if (costResult.status === 'fulfilled' && costResult.value.success) {
        setCost(costResult.value);
      }

      if (instResult.status === 'rejected' && costResult.status === 'rejected') {
        setError('AWS 연결에 실패했습니다. 자격 증명을 확인해주세요.');
        setConnStatus((prev) => ({ ...prev, aws: false }));
      }
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      await checkHealth();
      setConnStatus((prev) => ({ ...prev, server: true }));
    } catch {
      setConnStatus({ server: false, openai: false, aws: false, region: '' });
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchHealth();
    const i1 = setInterval(fetchData, 30000);
    const i2 = setInterval(fetchHealth, 10000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, [fetchData, fetchHealth]);

  const handleKillSwitch = async () => {
    if (!window.confirm('⚠️ 실행 중인 모든 인스턴스를 중지합니다.\n정말 진행하시겠습니까?')) return;
    setKillSwitchActive(true);
    try {
      await killSwitch();
      await fetchData();
    } catch (err) {
      setError('킬 스위치 실행에 실패했습니다.');
    } finally {
      setKillSwitchActive(false);
    }
  };

  const runningCount = instances.filter((i) => i.state === 'running').length;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>⬡ Infrastructure</span>
        <div style={styles.headerActions}>
          <button style={styles.iconBtn} onClick={fetchData} title="새로고침">
            <RefreshCw size={14} />
          </button>
          {runningCount > 0 && (
            <button
              style={{ ...styles.killBtn, opacity: killSwitchActive ? 0.5 : 1 }}
              onClick={handleKillSwitch}
              disabled={killSwitchActive}
            >
              <PowerOff size={12} />
              KILL ALL
            </button>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {/* 연결 상태 섹션 */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>연결 상태</div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: '서버', ok: connStatus.server },
              { label: 'OpenAI', ok: connStatus.openai },
              { label: `AWS ${connStatus.region ? `(${connStatus.region})` : ''}`, ok: connStatus.aws },
            ].map(({ label, ok }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
                  color: ok ? 'var(--accent-green)' : 'var(--accent-red)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ok ? 'var(--accent-green)' : 'var(--accent-red)', display: 'inline-block' }} />
                  {ok ? 'connected' : 'disconnected'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={styles.alertBanner}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* 비용 섹션 */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>이번 달 비용</div>
          {loading && !cost ? (
            <div style={styles.costCard}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={styles.loadingDot} />
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>로딩 중...</span>
              </div>
            </div>
          ) : cost ? (
            <div style={styles.costCard}>
              <div style={styles.costHeader}>
                <div>
                  <div style={styles.costAmount}>${cost.totalCost.toFixed(2)}</div>
                  <div style={styles.costKrw}>
                    ≈ ₩{Math.round(cost.totalCost * 1400).toLocaleString()}
                  </div>
                </div>
                <div style={styles.costIcon}>
                  <DollarSign size={18} />
                </div>
              </div>
              {cost.alert && (
                <div style={{ ...styles.alertBanner, marginBottom: '10px' }}>
                  <AlertTriangle size={12} />
                  {cost.alert.message}
                </div>
              )}
              {cost.services?.length > 0 && (
                <div style={styles.serviceList}>
                  {cost.services.slice(0, 5).map((svc, i) => (
                    <div key={i} style={styles.serviceRow}>
                      <span style={styles.serviceName}>{svc.service}</span>
                      <span style={styles.serviceCost}>${svc.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.costCard}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>비용 데이터 없음</span>
            </div>
          )}
        </div>

        {/* 인스턴스 섹션 */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            EC2 인스턴스 ({instances.length})
          </div>
          {loading && instances.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.loadingDot} />
              <span style={{ fontSize: '12px' }}>인스턴스 조회 중...</span>
            </div>
          ) : instances.length === 0 ? (
            <div style={styles.emptyState}>
              <Server size={24} style={{ opacity: 0.3 }} />
              <span style={{ fontSize: '12px' }}>실행 중인 인스턴스가 없습니다</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                채팅으로 새 인스턴스를 생성해보세요
              </span>
            </div>
          ) : (
            instances.map((inst, i) => (
              <div
                key={inst.instanceId}
                style={{
                  ...styles.instanceCard,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div style={styles.instanceHeader}>
                  <span style={styles.instanceName}>{inst.name}</span>
                  <span style={styles.statusBadge(inst.state)}>{inst.stateKr}</span>
                </div>
                <div style={styles.instanceMeta}>
                  <div style={styles.metaItem}>
                    <Cpu size={11} />
                    <span style={styles.metaValue}>{inst.type}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <Globe size={11} />
                    <span style={styles.metaValue}>{inst.publicIp || '-'}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <Shield size={11} />
                    <span style={styles.metaValue}>{inst.instanceId}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <Clock size={11} />
                    <span style={styles.metaValue}>{inst.az}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
