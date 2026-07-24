import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import EvidenceVaultDashboard from './components/EvidenceVault/EvidenceVaultDashboard';
import Assistant from './components/Assistant/Assistant';
import LandingPage from './components/Landing/LandingPage';
import { InvestigationProvider } from './context/InvestigationContext';

const VaultIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const BotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);

const TABS = [
  { id: 'vault',     path: '/vault',     label: 'Evidence Vault', Icon: VaultIcon },
  { id: 'assistant', path: '/assistant', label: 'AI Assistant',   Icon: BotIcon   },
];

// Layout wrapper for authenticated/dashboard routes
const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Navbar ── */}
      <header style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 28px',
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          {/* Gradient-border logo mark */}
          <div style={{
            width: '34px', height: '34px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #ef4444, #3b82f6)',
            padding: '1.5px',
            boxShadow: '-6px 0 20px rgba(239,68,68,0.3), 6px 0 20px rgba(59,130,246,0.3)',
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '7.5px',
              background: '#0d0d17',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em',
            }}>N</div>
          </div>
          <div>
            <div style={{
              fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #f87171, #a78bfa, #60a5fa, #f87171)',
              backgroundSize: '300%',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 5s linear infinite',
            }}>NETHRA AI</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.07em', marginTop: '-1px' }}>
              DIGITAL FORENSICS PLATFORM
            </div>
          </div>
        </Link>

        {/* Tab switcher */}
        <nav style={{
          display: 'flex', gap: '4px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px', padding: '3px',
        }}>
          {TABS.map(({ id, path, label, Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <button
                key={id}
                onClick={() => navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '7px 18px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 500,
                  transition: 'all 0.22s ease',
                  background: active
                    ? id === 'vault'
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(59,130,246,0.12)'
                    : 'transparent',
                  color: active
                    ? id === 'vault' ? '#f87171' : '#60a5fa'
                    : 'rgba(255,255,255,0.35)',
                  outline: active
                    ? `1px solid ${id === 'vault' ? 'rgba(239,68,68,0.28)' : 'rgba(59,130,246,0.28)'}`
                    : '1px solid transparent',
                  boxShadow: active
                    ? `0 0 16px ${id === 'vault' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)'}`
                    : 'none',
                }}
              >
                <Icon /> {label}
              </button>
            );
          })}
        </nav>

      </header>

      {/* ── Content ── */}
      <main style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <InvestigationProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/vault" 
          element={
            <DashboardLayout>
              <EvidenceVaultDashboard />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/assistant" 
          element={
            <DashboardLayout>
              <Assistant />
            </DashboardLayout>
          } 
        />
      </Routes>
    </InvestigationProvider>
  );
}
