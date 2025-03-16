import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://antique-icy-finch.glitch.me';

interface AddCoinTransactionFormProps {
  portfolioId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface CoinInfo {
  id: string;       // e.g. 'bitcoin'
  symbol: string;   // e.g. 'btc'
  name: string;     // e.g. 'Bitcoin'
}

const AddCoinTransactionForm: React.FC<AddCoinTransactionFormProps> = ({
  portfolioId,
  onSuccess,
  onCancel,
}) => {
  // Transaction state variables
  const [coinId, setCoinId] = useState('');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'Buy' | 'Sell'>('Buy');
  const [shares, setShares] = useState<number>(0);
  const [costPerShare, setCostPerShare] = useState<number>(0);
  const [commission, setCommission] = useState<number>(0);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // State for coin list
  const [allCoins, setAllCoins] = useState<CoinInfo[]>([]);

  useEffect(() => {
    // Try to get the coin list from localStorage.
    const cachedCoins = localStorage.getItem('coinList');
    const cachedTimestamp = localStorage.getItem('coinListTimestamp');
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in ms

    if (cachedCoins && cachedTimestamp && Date.now() - Number(cachedTimestamp) < oneDay) {
      setAllCoins(JSON.parse(cachedCoins));
    } else {
      axios
        .get<CoinInfo[]>('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100,
            page: 1,
            sparkline: false,
          },
        })
        .then(({ data }) => {
          setAllCoins(data);
          localStorage.setItem('coinList', JSON.stringify(data));
          localStorage.setItem('coinListTimestamp', Date.now().toString());
        })
        .catch((err) => console.error('Error fetching coins:', err));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate coin selection
    if (!coinId) {
      alert('Please select a coin.');
      return;
    }

    let endpoint = '';
    if (portfolioId.length === 24 && /^[0-9a-fA-F]{24}$/.test(portfolioId)) {
      endpoint = `${API_BASE_URL}/api/portfolio/${portfolioId}/coins/${coinId}/transactions`;
    } else {
      endpoint = `${API_BASE_URL}/api/portfolio/byUserId/${portfolioId}/coins/${coinId}/transactions`;
    }
    console.log(`Submitting transaction to: ${endpoint}`);
    console.log(`Transaction details: date=${date}, type=${type}, shares=${shares}, costPerShare=${costPerShare}, commission=${commission}, note=${note}, symbol=${symbol}, name=${name}`);

    try {
      await axios.post(endpoint, {
        date,
        type,
        shares,
        costPerShare,
        commission,
        note,
        symbol,
        name,
      });
      onSuccess();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9998,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          background: '#222',
          color: 'white',
          padding: '20px',
          border: '2px solid #0d6efd',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        <h3 style={{ textAlign: 'center' }}>Add Coin Transaction</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>
            Coin:
            <select
              value={coinId}
              onChange={(e) => {
                const chosenId = e.target.value;
                setCoinId(chosenId);
                const selectedCoin = allCoins.find((x) => x.id === chosenId);
                if (selectedCoin) {
                  setSymbol(selectedCoin.symbol);
                  setName(selectedCoin.name);
                  console.log(`Selected coin: ${selectedCoin.name} (${selectedCoin.symbol}), id: ${selectedCoin.id}`);
                }
              }}
              style={{ padding: '8px', fontSize: '16px', width: '100%' }}
            >
              <option value="">-- Select a Coin --</option>
              {allCoins.map((coin) => (
                <option key={coin.id} value={coin.id}>
                  {coin.name} ({coin.symbol.toUpperCase()})
                </option>
              ))}
            </select>
          </label>
          <label>
            Date:
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: '8px', fontSize: '16px', width: '100%' }}
            />
          </label>
          <label>
            Transaction Type:
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'Buy' | 'Sell')}
              style={{ padding: '8px', fontSize: '16px', width: '100%' }}
            >
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
            </select>
          </label>
          <label>
            Shares:
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(Number(e.target.value))}
              style={{ padding: '8px', fontSize: '16px', width: '100%' }}
            />
          </label>
          <label>
            Cost/Share ($):
            <input
              type="number"
              value={costPerShare}
              onChange={(e) => setCostPerShare(Number(e.target.value))}
              style={{ padding: '8px', fontSize: '16px', width: '100%' }}
            />
          </label>
          <label>
            Commission ($):
            <input
              type="number"
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
              style={{ padding: '8px', fontSize: '16px', width: '100%' }}
            />
          </label>
          <label>
            Note:
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ padding: '8px', fontSize: '16px', width: '100%' }}
            />
          </label>
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button type="submit" style={{ marginRight: '10px', padding: '8px 16px' }}>
              Add
            </button>
            <button type="button" onClick={onCancel} style={{ backgroundColor: 'gray', padding: '8px 16px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCoinTransactionForm;
