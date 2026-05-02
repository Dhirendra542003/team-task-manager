import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../App';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authAPI.login({ email, password });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <h1 style={styles.logoText}>Task Manager</h1>
          <p style={styles.tagline}>Manage your team's tasks efficiently</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="Enter your email"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account? <Link to="/register" style={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
    padding: '20px'
  },
  card: {
    background: '#16213e',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  logo: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  logoText: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '2rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0'
  },
  tagline: {
    color: '#a0a0b0',
    fontSize: '0.9rem',
    margin: 0
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    color: '#a0a0b0',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  input: {
    background: '#0f0f23',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    padding: '14px 16px',
    color: '#ffffff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    background: '#e94560',
    border: 'none',
    borderRadius: '8px',
    padding: '16px',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    color: '#a0a0b0',
    fontSize: '0.9rem'
  },
  link: {
    color: '#e94560',
    textDecoration: 'none',
    fontWeight: '500'
  }
};

export default Login;
