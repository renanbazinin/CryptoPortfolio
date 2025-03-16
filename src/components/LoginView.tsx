import React, { useState } from 'react';
import axios from 'axios';

interface LoginViewProps {
  onLogin: (portfolioId: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [typedId, setTypedId] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  // Regex: letters/digits only, at least 3 characters
  const validIdRegex = /^[A-Za-z0-9]{3,}$/;

  const handleLoadOrCreate = async () => {
    setError('');
    const id = typedId.trim();
    if (!validIdRegex.test(id)) {
      setError('Portfolio ID must be at least 3 letters/digits.');
      return;
    }

    try {
      let portfolio;
      if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
        portfolio = await axios.get(`http://localhost:3001/api/portfolio/${id}`);
      } else {
        portfolio = await axios.get(`http://localhost:3001/api/portfolio/byUserId/${id}`);
      }
      // If found, store in localStorage if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem('portfolioId', id);
      } else {
        localStorage.removeItem('portfolioId');
      }
      onLogin(id);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Not found: Create it
        try {
          await axios.post('http://localhost:3001/api/portfolio/create', { userId: id });
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
      />
      <div style={{ margin: '10px' }}>
        <label>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />{' '}
          Remember Me
        </label>
      </div>
      <button onClick={handleLoadOrCreate} style={{ padding: '8px 16px', fontSize: '16px' }}>
        Login / Create
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default LoginView;
