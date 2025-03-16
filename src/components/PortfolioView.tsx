import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AddCoinTransactionForm from './AddCoinTransactionForm';

const API_BASE_URL = 'production' === 'production' 
  ? 'https://antique-icy-finch.glitch.me' 
  : 'http://localhost:3001';

interface Transaction {
  _id?: string;
  date: string;
  type: 'Buy' | 'Sell';
  shares: number;
  costPerShare: number;
  commission?: number;
  note?: string;
}

interface Coin {
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  transactions: Transaction[];
}

interface Portfolio {
  _id: string;
  userId?: string;
  coins: Coin[];
}

interface PortfolioViewProps {
  portfolioId: string;
  onLogout: () => void;
  onChangeId: () => void;
}

const PortfolioView: React.FC<PortfolioViewProps> = ({ portfolioId, onLogout, onChangeId }) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPrices, setCurrentPrices] = useState<any>({});
  const [error, setError] = useState('');
  const [showAddCoinForm, setShowAddCoinForm] = useState(false);
  const [expandedCoinId, setExpandedCoinId] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    fetchPortfolio();
  }, [portfolioId]);

  useEffect(() => {
    if (portfolio && portfolio.coins.length > 0) {
      fetchPrices();
    }
  }, [portfolio]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const fetchPortfolio = async () => {
    setLoading(true);
    setError('');
    setPortfolio(null);
    try {
      let endpoint = '';
      if (portfolioId.length === 24 && /^[0-9a-fA-F]{24}$/.test(portfolioId)) {
        endpoint = `${API_BASE_URL}/api/portfolio/${portfolioId}`;
      } else {
        endpoint = `${API_BASE_URL}/api/portfolio/byUserId/${portfolioId}`;
      }
      const { data } = await axios.get(endpoint);
      setPortfolio(data);
    } catch (err: any) {
      console.error('Error fetching portfolio:', err);
      setError('Could not load portfolio.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      let endpoint = '';
      if (portfolioId.length === 24 && /^[0-9a-fA-F]{24}$/.test(portfolioId)) {
        endpoint = `${API_BASE_URL}/api/portfolio/${portfolioId}/prices`;
      } else {
        endpoint = `${API_BASE_URL}/api/portfolio/byUserId/${portfolioId}/prices`;
      }
      const { data } = await axios.get(endpoint);
      setCurrentPrices(data);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const handleRowClick = (coinId: string) => {
    setExpandedCoinId(expandedCoinId === coinId ? null : coinId);
  };

  if (loading) {
    return <p>Loading portfolio...</p>;
  }

  if (error) {
    return (
      <div style={{ color: 'red', textAlign: 'center' }}>
        <p>{error}</p>
        <button
          onClick={() => {
            localStorage.removeItem('portfolioId');
            onChangeId();
          }}
        >
          Clear Cached Portfolio ID
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Portfolio: {portfolioId}</h2>
      <div>
        <button onClick={onLogout}>Logout</button>
        <button onClick={onChangeId}>Change ID</button>
        <button onClick={() => setShowAddCoinForm(true)}>Add Coin</button>
      </div>
      {showAddCoinForm && (
        <AddCoinTransactionForm
          portfolioId={portfolioId}
          onSuccess={() => {
            setShowAddCoinForm(false);
            fetchPortfolio();
          }}
          onCancel={() => setShowAddCoinForm(false)}
        />
      )}
      {portfolio ? (
        portfolio.coins.length === 0 ? (
          <p>No coins yet. Add one above!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Coin</th>
                <th>Quantity</th>
                <th>Avg. Cost</th>
                <th>Current Price</th>
                <th>Market Value</th>
                <th>Unrealized Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.coins.map((coin) => {
                const coinPriceData = currentPrices[coin.coinId];
                const currentPrice = coinPriceData?.usd ?? 0;
                const totalCost = coin.quantity * coin.buyPrice;
                const marketValue = coin.quantity * currentPrice;
                const gainLoss = marketValue - totalCost;
                const gainLossPercent = totalCost === 0 ? 0 : (gainLoss / totalCost) * 100;
                return (
                  <React.Fragment key={coin.coinId}>
                    <tr onClick={() => handleRowClick(coin.coinId)} style={{ cursor: 'pointer' }}>
                      <td>{coin.name} ({coin.symbol.toUpperCase()})</td>
                      <td>{coin.quantity}</td>
                      <td>${coin.buyPrice.toFixed(2)}</td>
                      <td>${currentPrice.toFixed(2)}</td>
                      <td>${marketValue.toFixed(2)}</td>
                      <td style={{ color: gainLoss >= 0 ? 'limegreen' : 'red' }}>
                        {gainLoss.toFixed(2)} ({gainLossPercent.toFixed(2)}%)
                      </td>
                    </tr>
                    {expandedCoinId === coin.coinId && (
                      <tr>
                        <td colSpan={6}>
                          <h4>Transactions for {coin.name}</h4>
                          <table>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Shares</th>
                                <th>Cost/Share</th>
                                <th>Commission</th>
                                <th>Note</th>
                              </tr>
                            </thead>
                            <tbody>
                              {coin.transactions.map((tx) => (
                                <tr key={tx._id}>
                                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                                  <td>{tx.type}</td>
                                  <td>{tx.shares}</td>
                                  <td>${tx.costPerShare.toFixed(2)}</td>
                                  <td>${tx.commission ? tx.commission.toFixed(2) : '0.00'}</td>
                                  <td>{tx.note}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )
      ) : (
        <p>Portfolio not loaded.</p>
      )}
    </div>
  );
};

export default PortfolioView;
