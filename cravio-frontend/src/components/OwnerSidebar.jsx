import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_W   = 240;
const COLLAPSED_W = 64;

/* ── SVG helpers ── */
const Svg = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {children}
  </svg>
);

const IconHome     = () => <Svg><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>;
const IconMenu     = () => <Svg><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></Svg>;
const IconOrders   = () => <Svg><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></Svg>;
const IconCalendar = () => <Svg><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>;
const IconProfile  = () => <Svg><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>;
const IconFinance  = () => <Svg><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Svg>;
const IconLogout   = () => <Svg><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>;
const IconChevronL = () => <Svg size={16}><polyline points="15 18 9 12 15 6"/></Svg>;
const IconChevronR = () => <Svg size={16}><polyline points="9 18 15 12 9 6"/></Svg>;

const OWNER_LINKS = [
  { to: '/owner/dashboard',    label: 'Dashboard',   Icon: IconHome     },
  { to: '/owner/menu',         label: 'Manage Menu', Icon: IconMenu     },
  { to: '/owner/orders',       label: 'Orders',      Icon: IconOrders   },
  { to: '/owner/reservations', label: 'Reservations',Icon: IconCalendar },
  { to: '/owner/expenses',     label: 'Financials & Expenses', Icon: IconFinance },
  { to: '/profile',            label: 'Profile',     Icon: IconProfile  },
];

const STYLE = `
  .cravio-owner-sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 200;
    background: white;
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    transition: width 0.22s cubic-bezier(.4,0,.2,1);
    overflow: hidden;
    box-shadow: 2px 0 10px rgba(0,0,0,0.06);
  }
  .cravio-owner-sidebar .owner-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 20px;
    text-decoration: none;
    color: var(--dark-soft, #555);
    background: transparent;
    border-left: 3px solid transparent;
    font-weight: 400;
    font-size: 0.9rem;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
    overflow: hidden;
  }
  .cravio-owner-sidebar .owner-link:hover {
    background: var(--cream, #f5f0e8);
    color: var(--olive, #4a5c3f);
  }
  .cravio-owner-sidebar .owner-link.active {
    background: var(--olive-pale, #eaf0e9);
    border-left-color: var(--olive, #4a5c3f);
    color: var(--olive, #4a5c3f);
    font-weight: 600;
  }
  .cravio-owner-sidebar .owner-link .link-tooltip {
    display: none;
    position: absolute;
    left: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    font-size: 0.78rem;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 300;
  }
  .cravio-owner-sidebar.collapsed .owner-link {
    padding: 11px 0;
    justify-content: center;
    border-left: none;
    border-right: 3px solid transparent;
    position: relative;
  }
  .cravio-owner-sidebar.collapsed .owner-link.active {
    border-left: none;
    border-right-color: var(--olive, #4a5c3f);
  }
  .cravio-owner-sidebar.collapsed .owner-link:hover .link-tooltip {
    display: block;
  }
`;

let styleInjected = false;

export default function OwnerSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!styleInjected && typeof document !== 'undefined') {
    const el = document.createElement('style');
    el.textContent = STYLE;
    document.head.appendChild(el);
    styleInjected = true;
  }

  const w = collapsed ? COLLAPSED_W : SIDEBAR_W;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* ── Fixed sidebar ── */}
      <aside
        className={`cravio-owner-sidebar${collapsed ? ' collapsed' : ''}`}
        style={{ width: w }}
      >
        {/* Header */}
        <div style={{
          padding: collapsed ? '18px 0' : '18px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 10,
          flexShrink: 0,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--olive)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1rem', flexShrink: 0,
              }}>
                {user?.first_name?.[0]?.toUpperCase() || 'O'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--terracotta)', fontWeight: 500 }}>Restaurant Owner</div>
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'var(--cream)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--olive-pale)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--cream)'}
          >
            {collapsed ? <IconChevronR /> : <IconChevronL />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {OWNER_LINKS.map(({ to, label, Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`owner-link${active ? ' active' : ''}`}
              >
                <Icon />
                {!collapsed && <span>{label}</span>}
                {collapsed && <span className="link-tooltip">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout — always at bottom */}
        <div style={{
          padding: collapsed ? '12px 0' : '12px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10,
              width: '100%',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#c0392b',
              fontSize: '0.88rem',
              padding: collapsed ? '9px 0' : '9px 12px',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <IconLogout />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Spacer so main content doesn't hide under fixed sidebar ── */}
      <div style={{ width: w, flexShrink: 0, transition: 'width 0.22s cubic-bezier(.4,0,.2,1)' }} />
    </>
  );
}
