import React, { useEffect, useState } from 'react';
import LoginView from './components/LoginView';
import PortfolioView from './components/PortfolioView';

function App() {
  const [portfolioId, setPortfolioId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('portfolioId');
    if (storedId) {
      setPortfolioId(storedId);
    }
  }, []);

  const handleLogin = (id: string) => {
    setPortfolioId(id);
  };

  const handleLogout = () => {
    setPortfolioId(null);
    localStorage.removeItem('portfolioId');
  };

  const handleChangeId = () => {
    setPortfolioId(null);
    localStorage.removeItem('portfolioId');
  };

  return (
    <div>
      {portfolioId ? (
        <PortfolioView
          portfolioId={portfolioId}
          onLogout={handleLogout}
          onChangeId={handleChangeId}
        />
      ) : (
        <LoginView onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
