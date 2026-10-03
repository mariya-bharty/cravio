import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_W  = 240; // expanded width px
const COLLAPSED_W = 64; // icon-only width px

/* ── Tiny SVG icon helper ── */
const Svg = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {children}
  </svg>
);

const IconHome     = () => <Svg><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>;
const IconStore    = () => <Svg><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></Svg>;
const IconUsers    = () => <Svg><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>;
const IconTag      = () => <Svg><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Svg>;
const IconProfile  = () => <Svg><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>;
const IconLogout   = () => <Svg><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>;
const IconChevronL = () => <Svg size={16}><polyline points="15 18 9 12 15 6"/></Svg>;
const IconChevronR = () => <Svg size={16}><polyline points="9 18 15 12 9 6"/></Svg>;

const ADMIN_LINKS = [
  { to: '/admin/restaurants',  label: 'Manage Restaurants',  Icon: IconHome    },
  { to: '/admin/users',        label: 'Manage Users',        Icon: IconUsers   },
  { to: '/admin/promos',       label: 'Manage Promo Codes',  Icon: IconTag     },
  { to: '/admin/dashboard',    label: 'Platform Analytics',  Icon: IconStore   },
  { to: '/profile',            label: 'Profile',             Icon: IconProfile },
];

/* ─────────────────────────────────────────────
   CSS injected once — keeps component self-contained
───────────────────────────────────────────── */
const STYLE = `
  .cravio-admin-sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 200;
    background: var(--dark, #1a2018);
    display: flex;
    flex-direction: column;
    transition: width 0.22s cubic-bezier(.4,0,.2,1);
    overflow: hidden;
    box-shadow: 2px 0 12px rgba(0,0,0,0.18);
  }
  .cravio-admin-sidebar .sidebar-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 20px;
    text-decoration: none;
    color: rgba(255,255,255,0.6);
    background: transparent;
    border-left: 3px solid transparent;
    font-weight: 400;
    font-size: 0.9rem;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
    overflow: hidden;
  }
  .cravio-admin-sidebar .sidebar-link:hover {
    background: rgba(255,255,255,0.06);
    color: white;
  }
  .cravio-admin-sidebar .sidebar-link.active {
    background: rgba(255,255,255,0.1);
    border-left-color: var(--terracotta, #c17b4e);
    color: white;
    font-weight: 600;
  }
  /* Tooltip shown when collapsed */
  .cravio-admin-sidebar .sidebar-link .link-tooltip {
    display: none;
    position: absolute;
    left: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.85);
    color: white;
    font-size: 0.78rem;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 300;
  }
  .cravio-admin-sidebar.collapsed .sidebar-link {
    padding: 11px 0;
    justify-content: center;
    border-left: none;
    border-right: 3px solid transparent;
    position: relative;
  }
  .cravio-admin-sidebar.collapsed .sidebar-link.active {
    border-left: none;
    border-right-color: var(--terracotta, #c17b4e);
  }
  .cravio-admin-sidebar.collapsed .sidebar-link:hover .link-tooltip {
    display: block;
  }
  /* Push main content */
  .cravio-admin-layout-main {
    transition: margin-left 0.22s cubic-bezier(.4,0,.2,1);
  }
`;

let styleInjected = false;

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location  = useLocation();
  const { user, logout } = useAuth();
  const navigate  = useNavigate();

  /* Inject styles once */
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
      {/* ── The fixed sidebar ── */}
      <aside
        className={`cravio-admin-sidebar${collapsed ? ' collapsed' : ''}`}
        style={{ width: w }}
      >
        {/* ── Top: avatar + collapse toggle ── */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 10,
          flexShrink: 0,
        }}>
          {/* Avatar */}
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--terracotta, #c17b4e)',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
              }}>
                {user?.first_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(193,123,78,0.9)', fontWeight: 500 }}>Super Admin</div>
              </div>
            </div>
          )}

          {/* Collapse toggle button */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            {collapsed ? <IconChevronR /> : <IconChevronL />}
          </button>
        </div>

        {/* ── Nav links (scrollable if content overflows) ── */}
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {ADMIN_LINKS.map(({ to, label, Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`sidebar-link${active ? ' active' : ''}`}
              >
                <Icon />
                {!collapsed && <span>{label}</span>}
                {collapsed && <span className="link-tooltip">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* ── Logout — always visible at bottom ── */}
        <div style={{
          padding: collapsed ? '14px 0' : '14px 12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
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
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.88rem',
              padding: collapsed ? '9px 0' : '9px 12px',
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(193,123,78,0.15)';
              e.currentTarget.style.color = '#e8a87c';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            <IconLogout />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Spacer div so page content doesn't hide under fixed sidebar ── */}
      <div style={{ width: w, flexShrink: 0, transition: 'width 0.22s cubic-bezier(.4,0,.2,1)' }} />
    </>
  );
}
