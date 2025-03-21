import React, { useState } from 'react';
import axios from 'axios';

interface LoginViewProps {
  onLogin: (portfolioId: string) => void;
}

const API_BASE_URL = (true)
  ? 'https://antique-icy-finch.glitch.me' 
  : 'http://localhost:3001';

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [typedId, setTypedId] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state

  const validIdRegex = /^[A-Za-z0-9]{3,}$/;

  const handleLoadOrCreate = async () => {
    if (loading) return; // Prevent multiple clicks

    setError('');
    setLoading(true); // Start loading
    const id = typedId.trim();

    if (!validIdRegex.test(id)) {
      setError('Portfolio ID must be at least 3 letters/digits.');
      setLoading(false);
      return;
    }

    try {
      let portfolio;
      if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
        portfolio = await axios.get(`${API_BASE_URL}/api/portfolio/${id}`);
      } else {
        portfolio = await axios.get(`${API_BASE_URL}/api/portfolio/byUserId/${id}`);
      }
      if (rememberMe) {
        localStorage.setItem('portfolioId', id);
      } else {
        localStorage.removeItem('portfolioId');
      }
      onLogin(id);
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          await axios.post(`${API_BASE_URL}/api/portfolio/create`, { userId: id });
          if (rememberMe) {
            localStorage.setItem('portfolioId', id);
          }
          onLogin(id);
        } catch (createErr) {
          console.error('Error creating portfolio:', createErr);
          setError('Failed to create portfolio.');
        }
      } else {
        console.error('Error loading portfolio:', err);
        setError('Error loading portfolio.');
      }
    } finally {
      setLoading(false); // Stop loading after request completes
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Enter Portfolio ID</h2>
      <input
        type="text"
        value={typedId}
        onChange={(e) => setTypedId(e.target.value)}
        placeholder="Type your ID"
        style={{ padding: '8px', fontSize: '16px' }}
        disabled={loading} // Disable input when loading
      />
      <div style={{ margin: '10px' }}>
        <label>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading} // Disable checkbox when loading
          />{' '}
          Remember Me
        </label>
      </div>
      <button 
        onClick={handleLoadOrCreate} 
        style={{ padding: '8px 16px', fontSize: '16px' }} 
        disabled={loading} // Disable button when loading
      >
        {loading ? 'Loading...' : 'Login / Create'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default LoginView;
