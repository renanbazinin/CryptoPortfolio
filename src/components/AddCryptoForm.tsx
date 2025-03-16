import React, { useState } from 'react';
import axios from 'axios';


const API_BASE_URL = 'production' === 'production'
  ? 'https://antique-icy-finch.glitch.me'
  : 'http://localhost:3001';

interface AddCryptoFormProps {
  portfolioId: string;
  onAddSuccess: () => void;
}

const AddCryptoForm: React.FC<AddCryptoFormProps> = ({ portfolioId, onAddSuccess }) => {
  const [coinId, setCoinId] = useState('bitcoin');
  const [symbol, setSymbol] = useState('btc');
  const [name, setName] = useState('Bitcoin');
  const [quantity, setQuantity] = useState(0);
  const [buyPrice, setBuyPrice] = useState(0);

  const handleAddCrypto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinId || !symbol || !name) {
      alert('Please fill out coin info');
      return;
    }
    if (quantity <= 0 || buyPrice <= 0) {
      alert('Quantity and buy price must be > 0');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/portfolio/${portfolioId}/cryptos`, {
        coinId,
        symbol,
        name,
        quantity,
        buyPrice
      });
      onAddSuccess();
      // Reset form fields for quantity and buyPrice after submission
      setQuantity(0);
      setBuyPrice(0);
    } catch (error) {
      console.error('Error adding crypto:', error);
      alert('Failed to add crypto');
    }
  };

  return (
    <div className="add-crypto-form compact-form">
      <h3>Add a Crypto</h3>
      <form onSubmit={handleAddCrypto}>
        <div className="form-row">
          <div className="form-group">
            <label>Coin ID:</label>
            <input
              type="text"
              value={coinId}
              onChange={(e) => setCoinId(e.target.value)}
              placeholder="bitcoin"
            />
          </div>
          <div className="form-group">
            <label>Symbol:</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="btc"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bitcoin"
            />
          </div>
          <div className="form-group">
            <label>Quantity:</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={0}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group full-width">
            <label>Buy Price (USD):</label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(Number(e.target.value))}
              min={0}
            />
          </div>
        </div>
        <button type="submit" className="add-btn">
          Add
        </button>
      </form>
    </div>
  );
};

export default AddCryptoForm;
