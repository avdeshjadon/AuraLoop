import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  Laptop,
  Download,
  Sparkles,
  Lock,
  RefreshCw,
  Plus,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Crown,
  Gift,
  Trash2,
} from 'lucide-react';
import {
  fetchRealFirestoreUsers,
  saveRealUsers,
  REAL_ADMIN_USER,
  adminSignIn,
  adminGrantFreePremium,
  adminRevokePro,
  adminToggleUserStatus,
  adminDeleteUser,
  subscribeRealUsers,
} from '../services/firebaseAuthService';

export default function UserManagement({
  onTriggerConfirmation,
  showToast,
  logActivity,
}) {
  const [users, setUsers] = useState([REAL_ADMIN_USER]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');

  // Firebase Admin Login Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('theavdeshjadon@gmail.com');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // New User Form state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPlan, setNewUserPlan] = useState('Pro Plan');

  const loadUsers = useCallback(async (showNotification = false) => {
    setLoading(true);
    try {
      const data = await fetchRealFirestoreUsers();
      setUsers(data);
      if (showNotification) {
        showToast(`Refreshed ${data.length} registered accounts.`);
      }
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers();
    // Subscribe to live cloud updates
    const unsubscribe = subscribeRealUsers((freshUsers) => {
      if (freshUsers && freshUsers.length > 0) {
        setUsers(freshUsers);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.device || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    const isPro = u.plan?.includes('Pro') || u.isGiftedPro;
    const matchesPlan =
      planFilter === 'All' ||
      (planFilter === 'Pro' && isPro) ||
      (planFilter === 'Free' && !isPro && u.plan !== 'Super Admin') ||
      (planFilter === 'Super Admin' && u.plan === 'Super Admin');
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await adminSignIn(authEmail, authPassword);
      showToast('Firebase Admin Session Authenticated!');
      setIsAuthModalOpen(false);
      await loadUsers();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddRealUser = (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserEmail.includes('@')) {
      showToast('Please enter a valid email.');
      return;
    }

    onTriggerConfirmation({
      title: 'Register Real AuraLoop Account',
      message: `Confirm creating user record for "${newUserEmail}" with ${newUserPlan}?`,
      targetName: newUserEmail,
      actionType: 'primary',
      confirmText: 'Create Account',
      onConfirm: async () => {
        const isPro = newUserPlan === 'Pro Plan';
        const newUserObj = {
          id: `USR_${Date.now()}`,
          name: newUserName.trim() || newUserEmail.split('@')[0],
          email: newUserEmail.trim(),
          role: isPro ? 'Pro Member' : 'Free User',
          status: 'Active',
          plan: newUserPlan,
          isGiftedPro: isPro,
          device: 'MacBook Pro (Apple Silicon macOS)',
          downloads: 0,
          lastSeen: 'Registered Today',
          avatar: (newUserName || newUserEmail).slice(0, 2).toUpperCase(),
          joined: new Date().toLocaleDateString(),
          verified: isPro,
        };

        if (isPro) {
          await adminGrantFreePremium(newUserObj);
        }

        const updated = [newUserObj, ...users.filter(u => u.email.toLowerCase() !== newUserEmail.toLowerCase())];
        setUsers(updated);
        saveRealUsers(updated);
        showToast(`Account created for ${newUserEmail}`);
        setIsAddUserOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        logActivity({
          title: newUserEmail,
          action: `Account Registered (${newUserPlan})`,
          category: 'User Sync',
          size: newUserPlan,
          type: 'user',
        });
      },
    });
  };

  const handleToggleStatus = (user) => {
    if (user.email === REAL_ADMIN_USER.email) {
      showToast('Super Admin account status cannot be altered.');
      return;
    }

    const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    onTriggerConfirmation({
      title: `${nextStatus === 'Active' ? 'Activate' : 'Suspend'} User Account`,
      message: `Are you sure you want to change status for "${user.name}" to ${nextStatus}?`,
      targetName: `${user.name} (${user.email})`,
      actionType: nextStatus === 'Active' ? 'success' : 'danger',
      confirmText: `${nextStatus} Account`,
      onConfirm: async () => {
        const updatedUser = await adminToggleUserStatus(user);
        const updated = users.map((u) => (u.id === user.id ? updatedUser : u));
        setUsers(updated);

        showToast(`User ${updatedUser.status === 'Suspended' ? 'suspended' : 'activated'}. Client sync triggered.`);
        logActivity({
          title: user.name,
          action: updatedUser.status === 'Suspended' ? 'Account Suspended (Screen Blackout)' : 'Account Re-activated',
          category: 'User Sync',
          size: user.plan,
          type: 'user',
        });
      },
    });
  };

  /**
   * Grant Free Lifetime Pro without Payment
   */
  const handleGrantFreePro = (user) => {
    if (user.email === REAL_ADMIN_USER.email) {
      showToast('Super Admin already has permanent full access.');
      return;
    }

    onTriggerConfirmation({
      title: '🎁 Grant Free Lifetime Pro',
      message: `Confirm granting complimentary Lifetime Pro access to "${user.name}" (${user.email}) without payment? They will immediately receive full 4K access, and when they log in to the website or macOS app, they will see a celebration popup saying they got Free Premium!`,
      targetName: `${user.name} (${user.email})`,
      actionType: 'primary',
      confirmText: 'Grant Free Lifetime Pro',
      onConfirm: async () => {
        try {
          const updatedUser = await adminGrantFreePremium(user);
          const updated = users.map((u) => (u.id === user.id ? updatedUser : u));
          setUsers(updated);
          showToast(`✨ Free Lifetime Pro granted to ${user.email}!`);
          logActivity({
            title: user.name,
            action: 'Granted Free Lifetime Pro (Admin Gift)',
            category: 'User Sync',
            size: 'Lifetime Pro',
            type: 'user',
          });
        } catch (err) {
          showToast(`Failed to grant Pro: ${err.message}`);
        }
      },
    });
  };

  /**
   * Downgrade user back to Free Tier
   */
  const handleRevokePro = (user) => {
    if (user.email === REAL_ADMIN_USER.email) {
      showToast('Super Admin subscription tier is permanent.');
      return;
    }

    onTriggerConfirmation({
      title: 'Revoke Pro Subscription',
      message: `Revert "${user.name}" (${user.email}) back to Free Tier?`,
      targetName: `${user.name} (${user.email})`,
      actionType: 'danger',
      confirmText: 'Switch to Free Tier',
      onConfirm: async () => {
        const updatedUser = await adminRevokePro(user);
        const updated = users.map((u) => (u.id === user.id ? updatedUser : u));
        setUsers(updated);
        showToast(`User switched to Free Tier`);
        logActivity({
          title: user.name,
          action: 'Revoked Pro tier (Switched to Free)',
          category: 'User Sync',
          size: 'Free Tier',
          type: 'user',
        });
      },
    });
  };

  /**
   * Permanently delete user from Firebase & Database
   */
  const handleDeleteUser = (user) => {
    if (user.email === REAL_ADMIN_USER.email) {
      showToast('Super Admin account cannot be deleted.');
      return;
    }

    onTriggerConfirmation({
      title: '🗑️ Permanently Delete User',
      message: `Are you sure you want to permanently delete "${user.name}" (${user.email})? This action cannot be undone. All Pro licenses, cloud records, and account access will be erased forever.`,
      targetName: `${user.name} (${user.email})`,
      actionType: 'danger',
      confirmText: 'Delete Permanently',
      onConfirm: async () => {
        try {
          await adminDeleteUser(user);
          const updated = users.filter((u) => u.id !== user.id && u.email?.toLowerCase() !== user.email?.toLowerCase());
          setUsers(updated);
          showToast(`User ${user.email} permanently deleted.`);
          logActivity({
            title: user.name,
            action: 'Permanently Deleted User Account (Firebase & Cloud)',
            category: 'User Sync',
            size: 'Deleted',
            type: 'user',
          });
        } catch (err) {
          showToast(`Failed to delete user: ${err.message}`);
        }
      },
    });
  };

  const proCount = users.filter((u) => u.plan?.includes('Pro') || u.isGiftedPro).length;
  const giftedCount = users.filter((u) => u.isGiftedPro).length;

  return (
    <div className="users-page">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
            User Directory & Real-Time Sync
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Manage registered accounts, grant complimentary Lifetime Pro access, and sync live state with macOS & Web.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn-light-pill"
            onClick={() => loadUsers(true)}
            title="Reload users from cloud database"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn-light-pill"
            onClick={() => setIsAuthModalOpen(true)}
          >
            <KeyRound size={15} />
            <span>Firebase Auth</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="primary-cta-btn"
            onClick={() => setIsAddUserOpen(true)}
          >
            <Plus size={15} />
            <span>Add User</span>
          </motion.button>
        </div>
      </div>

      {/* Real Stats Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-box-label">Verified Accounts</span>
            <div className="metric-box-icon"><Users size={14} /></div>
          </div>
          <div className="metric-box-value">{users.length}</div>
          <div className="metric-box-sub green">Real Firestore & Cloud Registry</div>
        </div>

        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-box-label">Lifetime Pro Members</span>
            <div className="metric-box-icon"><Crown size={14} /></div>
          </div>
          <div className="metric-box-value" style={{ color: 'var(--accent-orange)' }}>{proCount}</div>
          <div className="metric-box-sub">Full 4K Unlocked Access</div>
        </div>

        <div className="metric-box orange-accent">
          <div className="metric-box-header">
            <span className="metric-box-label">Complimentary Pro (Gifted)</span>
            <div className="metric-box-icon"><Gift size={14} /></div>
          </div>
          <div className="metric-box-value" style={{ fontSize: 24, fontWeight: 800 }}>
            {giftedCount}
          </div>
          <div className="metric-box-sub">Admin-granted Free Premium</div>
        </div>

        <div className="metric-box">
          <div className="metric-box-header">
            <span className="metric-box-label">macOS Client Sync</span>
            <div className="metric-box-icon"><Laptop size={14} /></div>
          </div>
          <div className="metric-box-value">Active</div>
          <div className="metric-box-sub green">Instant Cloud Sync On Login</div>
        </div>
      </div>

      {/* User Directory Table Card */}
      <div className="table-card">
        <div className="table-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 className="table-title">Registered Users ({filteredUsers.length})</h2>
            {loading && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Syncing...</span>}
          </div>
          <div className="table-controls">
            <input
              type="text"
              placeholder="Search by name, email, client..."
              className="table-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <select
              className="filter-btn"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
            <select
              className="filter-btn"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="All">All Tiers</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Pro">Pro Plan</option>
              <option value="Free">Free Tier</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User & Email</th>
                <th>Hardware & Client</th>
                <th>Subscription Tier</th>
                <th>Favorites</th>
                <th>Status</th>
                <th>Activity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isUserPro = u.plan?.includes('Pro') || u.isGiftedPro;
                const isSuperAdmin = u.email === REAL_ADMIN_USER.email || u.plan === 'Super Admin';

                return (
                  <tr key={u.id || u.email}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: isSuperAdmin
                              ? '#14171A'
                              : isUserPro
                              ? 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)'
                              : '#6b7280',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 12,
                            boxShadow: isUserPro ? '0 2px 8px rgba(228, 87, 46, 0.25)' : 'none',
                          }}
                        >
                          {u.avatar || (u.name || u.email || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{u.name || 'AuraLoop User'}</span>
                            {isSuperAdmin && (
                              <span style={{ fontSize: 10, background: 'var(--accent-orange-light)', color: 'var(--accent-orange)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                        <Laptop size={14} color="var(--text-muted)" />
                        <span>{u.device || 'macOS Native Client'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-pill)',
                            background: isSuperAdmin
                              ? '#14171A'
                              : isUserPro
                              ? 'var(--accent-orange-light)'
                              : 'var(--bg-card-subtle)',
                            color: isSuperAdmin
                              ? '#FFFFFF'
                              : isUserPro
                              ? 'var(--accent-orange)'
                              : 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {isUserPro && <Crown size={12} />}
                          {isSuperAdmin ? 'Super Admin' : (isUserPro ? 'Pro Plan' : 'Free Tier')}
                        </span>

                        {u.isGiftedPro && !isSuperAdmin && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            title="Complimentary Lifetime Pro access granted by Admin without payment"
                          >
                            <Gift size={11} />
                            Gifted Free
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <Download size={13} color="var(--text-muted)" />
                        <span>{u.downloads || 0}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          u.status === 'Active' ? 'completed' : 'failed'
                        }`}
                      >
                        <span className="status-dot" />
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.lastSeen || 'Active'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {!isSuperAdmin && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {!isUserPro ? (
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.95 }}
                              style={{
                                padding: '5px 12px',
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #e4572e 0%, #b93c18 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 999,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(228, 87, 46, 0.3)',
                              }}
                              onClick={() => handleGrantFreePro(u)}
                              title="Make this user Premium without payment"
                            >
                              <Sparkles size={12} />
                              <span>Gift Free Pro</span>
                            </motion.button>
                          ) : (
                            <button
                              className="btn-light-pill"
                              style={{ padding: '4px 10px', fontSize: 11 }}
                              onClick={() => handleRevokePro(u)}
                              title="Revert back to Free Tier"
                            >
                              Downgrade
                            </button>
                          )}

                          <button
                            className="btn-light-pill"
                            style={{
                              padding: '4px 10px',
                              fontSize: 11,
                              color: u.status === 'Active' ? '#DC2626' : '#10B981',
                            }}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>

                          <button
                            className="btn-light-pill"
                            style={{
                              padding: '4px 10px',
                              fontSize: 11,
                              color: '#DC2626',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            onClick={() => handleDeleteUser(u)}
                            title="Permanently delete user from Firebase & Cloud"
                          >
                            <Trash2 size={11} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firebase Admin Auth Modal */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Firebase Admin Authentication</h3>
              <button className="modal-close-btn" onClick={() => setIsAuthModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAdminSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Authenticate with Firebase Auth to fetch live users directly from Firestore.
              </p>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Admin Email</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter Firebase password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                />
              </div>
              {authError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(239, 68, 68, 0.22)',
                    color: 'var(--text-primary)',
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}
                >
                  <AlertCircle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                  <span>
                    {authError.includes('invalid-credential') || authError.includes('wrong-password')
                      ? 'Invalid admin credentials. Please double-check your email and password.'
                      : authError.replace(/^Firebase:\s*(Error\s*)?(\(auth\/)?|\)\.?$/gi, '').replace(/-/g, ' ')}
                  </span>
                </div>
              )}
              <div className="modal-footer" style={{ marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAuthModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-cta-btn" disabled={authLoading}>
                  {authLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Real User Modal */}
      {isAddUserOpen && (
        <div className="modal-overlay" onClick={() => setIsAddUserOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Register Real User Account</h3>
              <button className="modal-close-btn" onClick={() => setIsAddUserOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddRealUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@gmail.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Subscription Tier</label>
                <select
                  value={newUserPlan}
                  onChange={(e) => setNewUserPlan(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                >
                  <option value="Pro Plan">Pro Plan (Complimentary 4K Access)</option>
                  <option value="Free Tier">Free Tier</option>
                </select>
              </div>
              <div className="modal-footer" style={{ marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddUserOpen(false)}>Cancel</button>
                <button type="submit" className="primary-cta-btn">Register Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
