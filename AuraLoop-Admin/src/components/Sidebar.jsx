import React from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  LayoutGrid,
  Clock,
  HardDrive,
  Users,
  Video,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme,
  onOpenHelp,
  onNavigateManage,
}) {
  const navItems = [
    { id: 'overview', icon: LayoutGrid, label: 'Overview' },
    { id: 'manage', icon: HardDrive, label: 'Manage' },
    { id: 'activity', icon: Clock, label: 'Activity Logs' },
    { id: 'users', icon: Users, label: 'Manage Users' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];


  return (
    <aside className="sidebar">
      {/* Sun / Moon Theme Toggle Pill with Liquid Water Wave Transition */}
      <div className="theme-toggle-pill">
        <motion.button
          whileTap={{ scale: 0.88 }}
          className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
          onClick={(e) => onToggleTheme('light', e)}
          title="Light Theme"
          aria-label="Switch to Light Theme"
        >
          <Sun size={15} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.88 }}
          className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
          onClick={(e) => onToggleTheme('dark', e)}
          title="Dark Theme"
          aria-label="Switch to Dark Theme"
        >
          <Moon size={15} />
        </motion.button>
      </div>

      {/* Navigation Icons with Motion */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'manage' && activeTab === 'bucket');
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className={`sidebar-icon-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (item.id === 'manage') {
                  if (onNavigateManage) {
                    onNavigateManage(null);
                  } else {
                    setActiveTab('manage');
                  }
                } else {
                  setActiveTab(item.id);
                }
              }}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={19} />
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveDot"
                  style={{
                    position: 'absolute',
                    left: -8,
                    width: 4,
                    height: 18,
                    borderRadius: '0 4px 4px 0',
                    background: 'var(--accent-orange)',
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="sidebar-icon-btn"
          onClick={onOpenHelp}
          title="Admin Help & Documentation"
          aria-label="Help & Documentation"
        >
          <HelpCircle size={19} />
        </motion.button>
      </div>
    </aside>
  );
}
