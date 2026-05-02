import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api';
import { useAuth } from '../App';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await dashboardAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: '#ffc947',
      in_progress: '#3b82f6',
      review: '#8b5cf6',
      done: '#00d9a5'
    };
    return colors[status] || '#a0a0b0';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#00d9a5',
      medium: '#ffc947',
      high: '#e94560'
    };
    return colors[priority] || '#a0a0b0';
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.logo}>TaskFlow</h2>
        </div>
        <nav style={styles.nav}>
          <Link to="/dashboard" style={styles.navLinkActive}>
            <span style={styles.navIcon}>📊</span> Dashboard
          </Link>
          <Link to="/projects" style={styles.navLink}>
            <span style={styles.navIcon}>📁</span> Projects
          </Link>
        </nav>
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user?.username?.charAt(0).toUpperCase()}</div>
            <div>
              <div style={styles.userName}>{user?.username}</div>
              <div style={styles.userRole}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user?.username}!</p>
        </header>

        <div style={styles.content}>
          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📁</div>
              <div>
                <div style={styles.statValue}>{stats?.totalProjects || 0}</div>
                <div style={styles.statLabel}>Projects</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div>
                <div style={styles.statValue}>{stats?.totalTasks || 0}</div>
                <div style={styles.statLabel}>Total Tasks</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>⚠️</div>
              <div>
                <div style={styles.statValue}>{stats?.overdueTasks?.length || 0}</div>
                <div style={styles.statLabel}>Overdue</div>
              </div>
            </div>
          </div>

          {/* Tasks by Status */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Tasks by Status</h2>
            <div style={styles.statusGrid}>
              {['todo', 'in_progress', 'review', 'done'].map((status) => (
                <div key={status} style={styles.statusCard}>
                  <div style={{ ...styles.statusDot, background: getStatusColor(status) }}></div>
                  <div style={styles.statusInfo}>
                    <div style={styles.statusValue}>
                      {stats?.tasksByStatus?.[status] || 0}
                    </div>
                    <div style={styles.statusLabel}>
                      {status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Tasks */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>My Tasks</h2>
            {stats?.myTasks?.length > 0 ? (
              <div style={styles.taskList}>
                {stats.myTasks.map((task) => (
                  <div key={task.id} style={styles.taskItem}>
                    <div style={styles.taskInfo}>
                      <div style={styles.taskTitle}>{task.title}</div>
                      <div style={styles.taskMeta}>
                        <span style={styles.projectTag}>{task.project_name}</span>
                        <span style={{
                          ...styles.priorityTag,
                          background: getPriorityColor(task.priority) + '20',
                          color: getPriorityColor(task.priority)
                        }}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <div style={styles.taskStatus}>
                      <span style={{
                        ...styles.statusBadge,
                        background: getStatusColor(task.status) + '20',
                        color: getStatusColor(task.status)
                      }}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.emptyText}>No tasks assigned to you.</p>
            )}
          </div>

          {/* Overdue Tasks */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Overdue Tasks</h2>
            {stats?.overdueTasks?.length > 0 ? (
              <div style={styles.taskList}>
                {stats.overdueTasks.map((task) => (
                  <div key={task.id} style={{ ...styles.taskItem, borderLeft: '3px solid #e94560' }}>
                    <div style={styles.taskInfo}>
                      <div style={styles.taskTitle}>{task.title}</div>
                      <div style={styles.taskMeta}>
                        <span style={styles.projectTag}>{task.project_name}</span>
                        <span style={styles.overdueDate}>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.emptyText}>No overdue tasks. Great job!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0f0f23'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: '#a0a0b0'
  },
  sidebar: {
    width: '260px',
    background: '#16213e',
    borderRight: '1px solid #2a2a4a',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh'
  },
  sidebarHeader: {
    padding: '24px',
    borderBottom: '1px solid #2a2a4a'
  },
  logo: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#e94560',
    margin: 0
  },
  nav: {
    flex: 1,
    padding: '16px'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    color: '#a0a0b0',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    transition: 'all 0.2s'
  },
  navLinkActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    color: '#ffffff',
    background: '#e94560',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem'
  },
  navIcon: {
    fontSize: '1.1rem'
  },
  userSection: {
    padding: '20px',
    borderTop: '1px solid #2a2a4a'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#e94560',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '1rem'
  },
  userName: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: '0.95rem'
  },
  userRole: {
    color: '#a0a0b0',
    fontSize: '0.8rem',
    textTransform: 'capitalize'
  },
  logoutBtn: {
    width: '100%',
    padding: '10px',
    background: 'transparent',
    border: '1px solid #e94560',
    borderRadius: '8px',
    color: '#e94560',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s'
  },
  main: {
    flex: 1,
    marginLeft: '260px',
    padding: '32px'
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '2rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 8px 0'
  },
  subtitle: {
    color: '#a0a0b0',
    margin: 0
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px'
  },
  statCard: {
    background: '#16213e',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
  },
  statIcon: {
    fontSize: '2rem'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#ffffff'
  },
  statLabel: {
    color: '#a0a0b0',
    fontSize: '0.9rem'
  },
  section: {
    background: '#16213e',
    borderRadius: '12px',
    padding: '24px'
  },
  sectionTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 20px 0'
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px'
  },
  statusCard: {
    background: '#0f0f23',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  statusInfo: {},
  statusValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#ffffff'
  },
  statusLabel: {
    color: '#a0a0b0',
    fontSize: '0.8rem'
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  taskItem: {
    background: '#0f0f23',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  taskInfo: {
    flex: 1
  },
  taskTitle: {
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: '8px'
  },
  taskMeta: {
    display: 'flex',
    gap: '12px'
  },
  projectTag: {
    background: '#1a1a2e',
    padding: '4px 10px',
    borderRadius: '4px',
    color: '#a0a0b0',
    fontSize: '0.8rem'
  },
  priorityTag: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    textTransform: 'capitalize'
  },
  taskStatus: {},
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    textTransform: 'capitalize'
  },
  overdueDate: {
    color: '#e94560',
    fontSize: '0.8rem'
  },
  emptyText: {
    color: '#a0a0b0',
    textAlign: 'center',
    padding: '20px'
  }
};

export default Dashboard;
