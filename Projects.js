import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI, authAPI } from '../api';
import { useAuth } from '../App';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
    loadUsers();
  }, []);

  const loadProjects = async () => {
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await authAPI.getUsers();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await projectsAPI.create(newProject);
      setProjects([data.project, ...projects]);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.loading}>Loading projects...</div>
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
          <Link to="/dashboard" style={styles.navLink}>
            <span style={styles.navIcon}>📊</span> Dashboard
          </Link>
          <Link to="/projects" style={styles.navLinkActive}>
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
          <div>
            <h1 style={styles.title}>Projects</h1>
            <p style={styles.subtitle}>Manage your team's projects</p>
          </div>
          <button onClick={() => setShowModal(true)} style={styles.createBtn}>
            + New Project
          </button>
        </header>

        {/* Projects Grid */}
        <div style={styles.projectsGrid}>
          {projects.length > 0 ? (
            projects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`} style={styles.projectCard}>
                <div style={styles.projectHeader}>
                  <div style={styles.projectIcon}>📁</div>
                  <h3 style={styles.projectName}>{project.name}</h3>
                </div>
                <p style={styles.projectDesc}>
                  {project.description || 'No description provided'}
                </p>
                <div style={styles.projectStats}>
                  <span style={styles.stat}>
                    <span style={styles.statIcon}>👥</span> {project.member_count} members
                  </span>
                  <span style={styles.stat}>
                    <span style={styles.statIcon}>✅</span> {project.task_count} tasks
                  </span>
                </div>
                <div style={styles.projectFooter}>
                  <span style={styles.owner}>by {project.owner_name}</span>
                </div>
              </Link>
            ))
          ) : (
            <div style={styles.empty}>
              <p>No projects yet. Create your first project!</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Create New Project</h2>
            
            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleCreateProject}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  style={styles.input}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  style={styles.textarea}
                  placeholder="Enter project description"
                  rows={4}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    fontSize: '0.9rem'
  },
  main: {
    flex: 1,
    marginLeft: '260px',
    padding: '32px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createBtn: {
    background: '#e94560',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  projectCard: {
    background: '#16213e',
    borderRadius: '12px',
    padding: '24px',
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  projectHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  projectIcon: {
    fontSize: '1.5rem'
  },
  projectName: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0
  },
  projectDesc: {
    color: '#a0a0b0',
    fontSize: '0.9rem',
    margin: 0,
    flex: 1
  },
  projectStats: {
    display: 'flex',
    gap: '16px'
  },
  stat: {
    color: '#a0a0b0',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  statIcon: {
    fontSize: '0.9rem'
  },
  projectFooter: {
    borderTop: '1px solid #2a2a4a',
    paddingTop: '12px'
  },
  owner: {
    color: '#a0a0b0',
    fontSize: '0.8rem'
  },
  empty: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    color: '#a0a0b0',
    padding: '40px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#16213e',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '500px'
  },
  modalTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 24px 0'
  },
  error: {
    background: 'rgba(233, 69, 96, 0.1)',
    border: '1px solid #e94560',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#e94560',
    fontSize: '0.9rem',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    color: '#a0a0b0',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    background: '#0f0f23',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    padding: '14px 16px',
    color: '#ffffff',
    fontSize: '1rem',
    outline: 'none'
  },
  textarea: {
    width: '100%',
    background: '#0f0f23',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    padding: '14px 16px',
    color: '#ffffff',
    fontSize: '1rem',
    outline: 'none',
    resize: 'vertical'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    padding: '12px 24px',
    color: '#a0a0b0',
    fontSize: '1rem',
    cursor: 'pointer'
  },
  submitBtn: {
    background: '#e94560',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default Projects;
