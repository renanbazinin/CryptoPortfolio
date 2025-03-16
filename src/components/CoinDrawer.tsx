import React, { useState } from 'react';
import axios from 'axios';

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
  transactions: Transaction[];
}

interface CoinDrawerProps {
  coin: Coin;
  portfolioId: string;
  onClose: () => void;
  onChange: () => void; // callback to refresh portfolio data
}

const CoinDrawer: React.FC<CoinDrawerProps> = ({
  coin,
  portfolioId,
  onClose,
  onChange
}) => {
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    date: new Date().toISOString().slice(0, 10),
    type: 'Buy',
    shares: 0,
    costPerShare: 0,
    commission: 0,
    note: ''
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.date || !newTx.type || !newTx.shares || !newTx.costPerShare) {
      alert('Please fill in required fields.');
      return;
    }
    try {
      await axios.post(
        `http://localhost:3001/api/portfolio/${portfolioId}/coins/${coin.coinId}/transactions`,
        {
          date: newTx.date,
          type: newTx.type,
          shares: newTx.shares,
          costPerShare: newTx.costPerShare,
          commission: newTx.commission || 0,
          note: newTx.note || '',
          symbol: coin.symbol,
          name: coin.name
        }
      );
      onChange(); // refresh portfolio
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  return (
    <div className="coin-drawer">
      <div className="drawer-header">
        <h3>{coin.name} ({coin.symbol.toUpperCase()}) Transactions</h3>
        <button onClick={onClose}>Close</button>
      </div>

      <table className="transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Shares</th>
            <th>Cost/Share</th>
            <th>Comm.</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {coin.transactions.map((t, idx) => (
            <tr key={idx}>
              <td>{t.date.slice(0, 10)}</td>
              <td>{t.type}</td>
              <td>{t.shares}</td>
              <td>${t.costPerShare}</td>
              <td>${t.commission || 0}</td>
              <td>{t.note || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Add Transaction</h4>
      <form onSubmit={handleAddTransaction} className="add-transaction-form">
        <label>
          Date:
          <input
            type="date"
            value={newTx.date as string}
            onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
          />
        </label>
        <label>
          Type:
          <select
            value={newTx.type}
            onChange={(e) =>
              setNewTx({ ...newTx, type: e.target.value as 'Buy' | 'Sell' })
            }
          >
            <option value="Buy">Buy</option>
            <option value="Sell">Sell</option>
          </select>
        </label>
        <label>
          Shares:
          <input
            type="number"
            value={newTx.shares}
            onChange={(e) => setNewTx({ ...newTx, shares: Number(e.target.value) })}
          />
        </label>
        <label>
          Cost/Share ($):
          <input
            type="number"
            value={newTx.costPerShare}
            onChange={(e) => setNewTx({ ...newTx, costPerShare: Number(e.target.value) })}
          />
        </label>
        <label>
          Commission ($):
          <input
            type="number"
            value={newTx.commission}
            onChange={(e) => setNewTx({ ...newTx, commission: Number(e.target.value) })}
          />
        </label>
        <label>
          Note:
          <input
            type="text"
            value={newTx.note}
            onChange={(e) => setNewTx({ ...newTx, note: e.target.value })}
          />
        </label>
        <button type="submit">Add</button>
      </form>
    </div>
  );
};

export default CoinDrawer;
