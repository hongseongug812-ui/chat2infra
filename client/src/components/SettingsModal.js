import React, { useState, useEffect } from 'react';
import { X, Cloud, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { getSettings, saveSettings } from '../utils/api';

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(6,8,13,0.85)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-lg)', width: '440px', maxWidth: '95vw',
    padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px',
    animation: 'fadeIn 0.2s ease',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px', display: 'flex' },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600,
    color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px',
  },
  badge: (set) => ({
    fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600,
    padding: '2px 8px', borderRadius: '99px',
    ...(set
      ? { background: 'var(--accent-green-dim)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)' }
      : { background: 'var(--accent-amber-dim)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber)' }),
  }),
  field: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' },
  label: { fontSize: '12px', color: 'var(--text-secondary)' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  input: {
    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)', fontSize: '12px',
    padding: '9px 36px 9px 12px', outline: 'none', transition: 'border-color 0.15s',
  },
  eyeBtn: { position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' },
  saveBtn: {
    background: 'var(--accent-cyan)', border: 'none', borderRadius: 'var(--radius-sm)',
    color: 'var(--bg-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
    padding: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    transition: 'opacity 0.15s',
  },
};

export default function SettingsModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: 'ap-northeast-2' });
  const [showSecret, setShowSecret] = useState(false);
  const [status, setStatus] = useState({ awsKeySet: false, awsRegion: 'ap-northeast-2' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then((d) => { setStatus(d); setForm((f) => ({ ...f, awsRegion: d.awsRegion })); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(form);
      setSaved(true);
      const updated = await getSettings();
      setStatus(updated);
      onSaved?.();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <span style={s.title}>⚙ AWS 연결 설정</span>
          <button style={s.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <div>
          <div style={s.sectionLabel}>
            <Cloud size={12} /> AWS 자격 증명
            <span style={s.badge(status.awsKeySet)}>{status.awsKeySet ? '● 설정됨' : '● 미설정'}</span>
          </div>

          <div style={s.field}>
            <span style={s.label}>Access Key ID</span>
            <input style={s.input} placeholder="AKIA..." value={form.awsAccessKeyId}
              onChange={(e) => setForm((f) => ({ ...f, awsAccessKeyId: e.target.value }))}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-cyan)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-primary)')} />
          </div>

          <div style={s.field}>
            <span style={s.label}>Secret Access Key</span>
            <div style={s.inputWrap}>
              <input style={s.input} type={showSecret ? 'text' : 'password'} placeholder="••••••••"
                value={form.awsSecretAccessKey}
                onChange={(e) => setForm((f) => ({ ...f, awsSecretAccessKey: e.target.value }))}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-cyan)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-primary)')} />
              <button style={s.eyeBtn} onClick={() => setShowSecret(!showSecret)} type="button">
                {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          <div style={s.field}>
            <span style={s.label}>리전</span>
            <select style={{ ...s.input, padding: '9px 12px', cursor: 'pointer' }}
              value={form.awsRegion} onChange={(e) => setForm((f) => ({ ...f, awsRegion: e.target.value }))}>
              <option value="ap-northeast-2">ap-northeast-2 (서울)</option>
              <option value="ap-northeast-1">ap-northeast-1 (도쿄)</option>
              <option value="us-east-1">us-east-1 (버지니아)</option>
              <option value="us-west-2">us-west-2 (오레곤)</option>
              <option value="eu-west-1">eu-west-1 (아일랜드)</option>
            </select>
          </div>
        </div>

        <button style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
          {saved ? <><CheckCircle size={14} /> 저장됨!</> : <><Save size={14} /> 저장하기</>}
        </button>
      </div>
    </div>
  );
}
