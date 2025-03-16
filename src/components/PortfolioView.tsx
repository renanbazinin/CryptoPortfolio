import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AddCoinTransactionForm from './AddCoinTransactionForm';

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
  portfolioId: string; // can be a Mongo _id or a custom userId
  onLogout: () => void;
  onChangeId: () => void;
}

/** Renders the expanded transactions panel for a coin. */
const CoinTransactionsPanel: React.FC<{
  portfolioId: string;
  coin: Coin;
  onClose: () => void;
  onTransactionRemoved: () => void;
}> = ({ portfolioId, coin, onClose, onTransactionRemoved }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowWidth < 768;

  // Define dynamic styles with explicit type annotation.
  const thStyle: React.CSSProperties = {
    padding: '4px',
    textAlign: 'center',
    fontSize: isMobile ? '10px' : '14px'
  };
  const tdStyle: React.CSSProperties = {
    padding: '4px',
    textAlign: 'center',
    fontSize: isMobile ? '8px' : '14px'
  };
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const handleRemoveTransaction = async (transactionId: string) => {
    try {
      let endpoint = '';
      if (portfolioId.length === 24 && /^[0-9a-fA-F]{24}$/.test(portfolioId)) {
        endpoint = `http://localhost:3001/api/portfolio/${portfolioId}/coins/${coin.coinId}/transactions/${transactionId}`;
      } else {
        endpoint = `http://localhost:3001/api/portfolio/byUserId/${portfolioId}/coins/${coin.coinId}/transactions/${transactionId}`;
      }
      await axios.delete(endpoint);
      onTransactionRemoved();
    } catch (error) {
      console.error('Error removing transaction:', error);
      alert('Failed to remove transaction');
    }
  };

  return (
    <tr>
      <td colSpan={7}>
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: isMobile ? '14px' : '18px' }}>
            Transactions for {coin.name} ({coin.symbol.toUpperCase()})
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ ...tableStyle, margin: '0 auto' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Shares</th>
                  <th style={thStyle}>Cost/Share</th>
                  <th style={thStyle}>Commission</th>
                  <th style={thStyle}>Note</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {coin.transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td style={tdStyle}>{new Date(tx.date).toLocaleDateString()}</td>
                    <td style={tdStyle}>{tx.type}</td>
                    <td style={tdStyle}>{tx.shares}</td>
                    <td style={tdStyle}>${tx.costPerShare.toFixed(2)}</td>
                    <td style={tdStyle}>${tx.commission ? tx.commission.toFixed(2) : '0.00'}</td>
                    <td style={tdStyle}>{tx.note}</td>
                    <td style={tdStyle}>
                      <button onClick={() => handleRemoveTransaction(tx._id!)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={onClose}
            style={{
              marginTop: '10px',
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '12px' : '16px'
            }}
          >
            Close Transactions
          </button>
        </div>
      </td>
    </tr>
  );
};

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

  // Define dynamic styles.
  const containerStyle: React.CSSProperties = {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  const buttonStyle: React.CSSProperties = {
    padding: isMobile ? '6px 12px' : '8px 16px',
    fontSize: isMobile ? '12px' : '16px',
    marginRight: '10px'
  };

  // On mobile, force a fixed table width (700px) for horizontal scrolling.
  const tableWrapperStyle: React.CSSProperties = {
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    marginTop: '20px'
  };

  const tableStyle: React.CSSProperties = isMobile
    ? { width: '700px', borderCollapse: 'collapse', margin: '0 auto' }
    : { width: '80%', borderCollapse: 'collapse', margin: '0 auto' };

  const thStyle: React.CSSProperties = {
    padding: '8px',
    textAlign: 'center',
    fontSize: isMobile ? '12px' : '16px'
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px',
    textAlign: 'center',
    fontSize: isMobile ? '12px' : '16px'
  };

  const fetchPortfolio = async () => {
    setLoading(true);
    setError('');
    setPortfolio(null);
    try {
      let endpoint = '';
      if (portfolioId.length === 24 && /^[0-9a-fA-F]{24}$/.test(portfolioId)) {
        endpoint = `http://localhost:3001/api/portfolio/${portfolioId}`;
      } else {
        endpoint = `http://localhost:3001/api/portfolio/byUserId/${portfolioId}`;
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
        endpoint = `http://localhost:3001/api/portfolio/${portfolioId}/prices`;
      } else {
        endpoint = `http://localhost:3001/api/portfolio/byUserId/${portfolioId}/prices`;
      }
      const { data } = await axios.get(endpoint);
      setCurrentPrices(data);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const handleRemoveTransactionSuccess = () => {
    fetchPortfolio();
  };

  const handleRowClick = (coinId: string) => {
    setExpandedCoinId(expandedCoinId === coinId ? null : coinId);
  };

  if (loading) {
    return (
      <p style={{ fontSize: isMobile ? '14px' : '18px' }}>
        Loading portfolio...
      </p>
    );
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
          style={{ ...buttonStyle, marginTop: '10px' }}
        >
          Clear Cached Portfolio ID
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: isMobile ? '18px' : '24px' }}>
        Portfolio: {portfolioId}
      </h2>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={onLogout} style={buttonStyle}>
          Logout
        </button>
        <button onClick={onChangeId} style={buttonStyle}>
          Change ID
        </button>
        <button onClick={() => setShowAddCoinForm(true)} style={buttonStyle}>
          Add Coin
        </button>
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
        <>
          {portfolio.coins.length === 0 ? (
            <p style={{ fontSize: isMobile ? '14px' : '16px' }}>
              No coins yet. Add one above!
            </p>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead style={{ backgroundColor: '#0d6efd', color: '#fff' }}>
                  <tr>
                    <th style={thStyle}>Coin</th>
                    <th style={thStyle}>Quantity</th>
                    {!isMobile && <th style={thStyle}>Avg. Cost</th>}
                    <th style={thStyle}>Current Price</th>
                    {!isMobile && <th style={thStyle}>Total Cost</th>}
                    <th style={thStyle}>Market Value</th>
                    <th style={thStyle}>Unrealized Gain/Loss</th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: '#333', color: '#fff' }}>
                  {portfolio.coins.map((coin) => {
                    const coinPriceData = currentPrices[coin.coinId];
                    const currentPrice = coinPriceData?.usd ?? 0;
                    const totalCost = coin.quantity * coin.buyPrice;
                    const marketValue = coin.quantity * currentPrice;
                    const gainLoss = marketValue - totalCost;
                    const gainLossPercent = totalCost === 0 ? 0 : (gainLoss / totalCost) * 100;
                    return (
                      <React.Fragment key={coin.coinId}>
                        <tr
                          onClick={() => handleRowClick(coin.coinId)}
                          style={{ cursor: 'pointer', textAlign: 'center' }}
                          className="portfolio-row"
                        >
                          <td style={tdStyle}>
                            {coin.name} ({coin.symbol.toUpperCase()})
                          </td>
                          <td style={tdStyle}>{coin.quantity}</td>
                          {!isMobile && <td style={tdStyle}>${coin.buyPrice.toFixed(2)}</td>}
                          <td style={tdStyle}>${currentPrice.toFixed(2)}</td>
                          {!isMobile && <td style={tdStyle}>${totalCost.toFixed(2)}</td>}
                          <td style={tdStyle}>${marketValue.toFixed(2)}</td>
                          <td style={{ ...tdStyle, color: gainLoss >= 0 ? 'limegreen' : 'red' }}>
                            {gainLoss.toFixed(2)} ({gainLossPercent.toFixed(2)}%)
                          </td>
                        </tr>
                        {expandedCoinId === coin.coinId && (
                          <CoinTransactionsPanel
                            portfolioId={portfolioId}
                            coin={coin}
                            onClose={() => setExpandedCoinId(null)}
                            onTransactionRemoved={handleRemoveTransactionSuccess}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p style={{ fontSize: isMobile ? '14px' : '16px' }}>Portfolio not loaded.</p>
      )}
    </div>
  );
};

export default PortfolioView;
