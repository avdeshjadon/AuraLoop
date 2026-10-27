import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import './admin.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './components/Overview';
import ActivityView from './components/ActivityView';
import BucketManager from './components/BucketManager';
import UserManagement from './components/UserManagement';
import Reports from './components/Reports';
import Settings from './components/Settings';
import LoginPage from './components/LoginPage';
import ConfirmationModal from './components/ConfirmationModal';
import VideoPreviewModal from './components/VideoPreviewModal';
import UploadModal from './components/UploadModal';
import SineWaveTransition from './components/SineWaveTransition';
import { fetchCatalog, saveCatalogToStorage, getCatalogStats, fallbackWallpapers } from './services/catalogService';
import { getActivities, logActivity } from './services/activityService';

export default function AdminDashboard({ onBackToSite, currentUser }) {
  // Authentication session check (persists across refreshes, requires login on fresh browser window)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const isSessionAuthed = sessionStorage.getItem('auraloop_admin_session') === 'authenticated';
    const isUserAdmin = currentUser?.email?.toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || 'theavdeshjadon@gmail.com').toLowerCase();
    return isSessionAuthed || isUserAdmin;
  });

  useEffect(() => {
    if (currentUser?.email?.toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || 'theavdeshjadon@gmail.com').toLowerCase()) {
      setIsAuthenticated(true);
      sessionStorage.setItem('auraloop_admin_session', 'authenticated');
      sessionStorage.setItem('auraloop_admin_email', currentUser.email);
    }
  }, [currentUser]);


  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState(() => localStorage.getItem('auraloop_theme') || 'light');
  const [wallpapers, setWallpapers] = useState(() => {
    try {
      const saved = localStorage.getItem('auraloop_catalog_custom');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return fallbackWallpapers || [];
  });
  const [activities, setActivities] = useState(getActivities());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedBucketFolder, setSelectedBucketFolder] = useState(null);
  const [manageViewKey, setManageViewKey] = useState(0);

  // Dedicated reliable navigation handler for Manage / Bucket tab
  const handleNavigateToManage = (folderName = null) => {
    setSelectedBucketFolder(folderName);
    setManageViewKey((prev) => prev + 1);
    setActiveTab('manage');
  };

  // Fluid 3-Layer Sinusoidal Water Wave Transition State
  const [waveTransition, setWaveTransition] = useState(null);

  // Modals state
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    targetName: '',
    actionType: 'danger',
    confirmText: 'Confirm',
    onConfirm: () => {},
  });

  const [previewWallpaper, setPreviewWallpaper] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('auraloop_theme', theme);
  }, [theme]);

  // Load real catalog on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchCatalog();
      setWallpapers(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('auraloop_admin_session');
    sessionStorage.removeItem('auraloop_admin_email');
    setIsAuthenticated(false);
    showToast('Logged out of Admin Console.');
  };

  /**
   * Fluid 3-Layer Sinusoidal Water Wave Theme Toggle
   * Captures old theme snapshot, immediately sets new theme on live DOM,
   * and peels away old theme with undulating sine wave to reveal live new theme in real-time.
   */
  const handleToggleTheme = (newTheme, event) => {
    if (newTheme === theme) return;

    let x = 38;
    let y = 44;

    if (event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    // 1. Capture snapshot of current DOM in the old theme before switching
    const shellEl = document.querySelector('.admin-shell');
    let snapshotEl = null;
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    if (shellEl) {
      snapshotEl = shellEl.cloneNode(true);
      snapshotEl.setAttribute('data-theme', theme);
    }

    const fromTheme = theme;

    // 2. Immediately switch the live page theme underneath
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('auraloop_theme', newTheme);
    setTheme(newTheme);

    // 3. Launch fluid wave transition
    setWaveTransition({
      origin: { x, y },
      fromTheme,
      targetTheme: newTheme,
      snapshotEl,
      scrollY,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const data = await fetchCatalog();
    setWallpapers(data);
    setActivities(getActivities());
    setTimeout(() => {
      setRefreshing(false);
      showToast('Synced with Cloudflare R2 catalog!');
    }, 400);
  };

  const handleTriggerConfirmation = ({
    title,
    message,
    targetName,
    actionType = 'danger',
    confirmText = 'Delete',
    onConfirm,
  }) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      targetName,
      actionType,
      confirmText,
      loading: false,
      onConfirm: async () => {
        setConfirmation((prev) => ({ ...prev, loading: true }));
        try {
          if (typeof onConfirm === 'function') {
            await onConfirm();
          }
          await new Promise((resolve) => setTimeout(resolve, 360));
        } finally {
          setConfirmation((prev) => ({ ...prev, isOpen: false, loading: false }));
        }
      },
    });
  };

  const handleUpdateWallpapers = (updatedList, activityDetails) => {
    setWallpapers(updatedList);
    saveCatalogToStorage(updatedList);
    if (activityDetails) {
      const updatedActs = logActivity(activityDetails);
      setActivities(updatedActs);
    }
  };

  // Upload Progress in Navbar State
  const [uploadProgress, setUploadProgress] = useState(null); // { progress: number, fileName: string } | null

  // Activity Deletion Handlers
  const handleDeleteActivity = (act) => {
    handleTriggerConfirmation({
      title: 'Delete Activity Log',
      message: `Are you sure you want to delete this activity log from your history?`,
      targetName: act.title || act.action,
      actionType: 'danger',
      confirmText: 'Delete Log',
      onConfirm: () => {
        const remaining = activities.filter((a) => a.id !== act.id);
        setActivities(remaining);
        try {
          localStorage.setItem('auraloop_activities', JSON.stringify(remaining));
        } catch (e) {}
        showToast('Activity log deleted.');
      },
    });
  };

  const handleClearAllActivities = () => {
    handleTriggerConfirmation({
      title: 'Clear All Activities',
      message: 'Are you sure you want to clear all recent activity logs? This cannot be undone.',
      targetName: `${activities.length} activity entries`,
      actionType: 'danger',
      confirmText: 'Clear All',
      onConfirm: () => {
        setActivities([]);
        try {
          localStorage.setItem('auraloop_activities', JSON.stringify([]));
        } catch (e) {}
        showToast('All activity logs cleared.');
      },
    });
  };

  const handleUploadSuccess = (newWallpaper) => {
    // Start realistic navbar progress indicator
    setUploadProgress({ progress: 12, fileName: newWallpaper.title });
    let p = 12;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 22) + 12;
      if (p >= 100) {
        clearInterval(interval);
        setUploadProgress({ progress: 100, fileName: newWallpaper.title });
        setTimeout(() => {
          setUploadProgress(null);
          showToast(`"${newWallpaper.title}" uploaded to R2 successfully!`);
        }, 600);
      } else {
        setUploadProgress({ progress: p, fileName: newWallpaper.title });
      }
    }, 280);

    const updated = [newWallpaper, ...wallpapers];
    handleUpdateWallpapers(updated, {
      title: newWallpaper.title,
      action: 'Uploaded 4K Loop to R2',
      category: newWallpaper.category,
      size: `${newWallpaper.duration || 15}s • 60fps`,
      type: 'upload',
    });
  };

  const catalogStats = React.useMemo(() => getCatalogStats(wallpapers), [wallpapers]);

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => setIsAuthenticated(true)}
        showToast={showToast}
        onBackToSite={onBackToSite}
      />
    );
  }

  return (
    <div className="admin-shell">
      {/* 3-Layer Fluid Sinusoidal Water Wave Theme Transition */}
      {waveTransition && (
        <SineWaveTransition
          origin={waveTransition.origin}
          fromTheme={waveTransition.fromTheme}
          targetTheme={waveTransition.targetTheme}
          snapshotEl={waveTransition.snapshotEl}
          scrollY={waveTransition.scrollY}
          onComplete={() => {
            setWaveTransition(null);
          }}
        />
      )}

      {/* Left Icon Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenHelp={() => setIsHelpOpen(true)}
        onNavigateManage={handleNavigateToManage}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header - Clean, No ADMIN text, with avatar dropdown & upload progress */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          uploadProgress={uploadProgress}
          totalWallpapers={catalogStats.totalWallpapers}
          theme={theme}
          onLogout={handleLogout}
          onNavigateManage={handleNavigateToManage}
          onBackToSite={onBackToSite}
        />

        {/* Tab Views with Fluid Smooth Page Transition */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Overview
                wallpapers={wallpapers}
                catalogStats={catalogStats}
                activities={activities}
                onOpenUpload={() => setIsUploadOpen(true)}
                onOpenVideoPreview={(wp) => setPreviewWallpaper(wp)}
                onRefresh={handleRefresh}
                setActiveTab={setActiveTab}
                onSelectFolder={handleNavigateToManage}
                onSelectActivityAction={(act) => {
                  const matched = wallpapers.find((w) => w.title === act.title);
                  if (matched) setPreviewWallpaper(matched);
                  else showToast(`Activity: ${act.title}`);
                }}
                onDeleteActivity={handleDeleteActivity}
                onClearAllActivities={handleClearAllActivities}
              />
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <ActivityView
                activities={activities}
                wallpapers={wallpapers}
                onRefresh={handleRefresh}
                showToast={showToast}
                onTriggerConfirmation={handleTriggerConfirmation}
                onOpenVideoPreview={(wp) => setPreviewWallpaper(wp)}
              />
            </motion.div>
          )}

          {(activeTab === 'manage' || activeTab === 'bucket') && (
            <motion.div
              key={`manage-tab-${manageViewKey}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <BucketManager
                key={`bucket-manager-${selectedBucketFolder || 'all'}-${manageViewKey}`}
                wallpapers={wallpapers}
                initialFolder={selectedBucketFolder}
                onOpenUpload={() => setIsUploadOpen(true)}
                onOpenVideoPreview={(wp) => setPreviewWallpaper(wp)}
                onTriggerConfirmation={handleTriggerConfirmation}
                onRefresh={handleRefresh}
                showToast={showToast}
                onUpdateWallpapers={handleUpdateWallpapers}
              />
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <UserManagement
                onTriggerConfirmation={handleTriggerConfirmation}
                showToast={showToast}
                logActivity={(act) => {
                  const updated = logActivity(act);
                  setActivities(updated);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Reports
                wallpapers={wallpapers}
                catalogStats={catalogStats}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Settings
                showToast={showToast}
                theme={theme}
                setTheme={(th) => handleToggleTheme(th, null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Footer */}
        <footer
          style={{
            marginTop: 48,
            paddingTop: 22,
            paddingBottom: 28,
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: 12.5,
            color: 'var(--text-muted)',
            letterSpacing: 0.1,
          }}
        >
          <span>This admin panel is belongs to <strong style={{ color: 'var(--text-secondary)' }}>Avdesh Jadon</strong></span>
        </footer>
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        targetName={confirmation.targetName}
        actionType={confirmation.actionType}
        confirmText={confirmation.confirmText}
        loading={confirmation.loading}
        onConfirm={confirmation.onConfirm}
        onCancel={() => setConfirmation((prev) => ({ ...prev, isOpen: false, loading: false }))}
      />

      {/* Video Preview Modal */}
      {previewWallpaper && (
        <VideoPreviewModal
          wallpaper={previewWallpaper}
          onClose={() => setPreviewWallpaper(null)}
          showToast={showToast}
        />
      )}

      {/* Upload Wallpaper Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        categories={catalogStats.categories}
        onTriggerConfirmation={handleTriggerConfirmation}
        onUploadSuccess={handleUploadSuccess}
        showToast={showToast}
      />

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="modal-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">AuraLoop Admin Guide</h3>
              <button className="modal-close-btn" onClick={() => setIsHelpOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ fontSize: 13, lineHeight: 1.6 }}>
              <p style={{ marginBottom: 10 }}>
                Welcome to <strong>AuraLoop Admin</strong>, the central control room for AuraLoop 4K video live wallpapers.
              </p>
              <ul style={{ paddingLeft: 18, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li><strong>Manage / CDN:</strong> Browse R2 bucket folders, drag-and-drop collections, rename files, and delete items with custom confirmation popups.</li>
                <li><strong>Users:</strong> Real user management with Firebase Authentication & Firestore sync. Suspend action triggers black screen in macOS app.</li>
                <li><strong>Settings:</strong> Manage admin email & password, verify Cloudflare R2 bucket connection, and toggle themes.</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setIsHelpOpen(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="toast-container"
          >
            <div className="toast-item">
              <CheckCircle2 size={15} style={{ color: '#10B981', flexShrink: 0 }} />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
