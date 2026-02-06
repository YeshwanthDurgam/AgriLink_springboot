import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiMapPin, FiDollarSign, FiInfo, FiRefreshCw } from 'react-icons/fi';
import analyticsService from '../services/analyticsService';
import './DemandForecast.css';

const DemandForecast = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crops, setCrops] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [district, setDistrict] = useState('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const metadata = await analyticsService.getDemandMetadata();
      setCrops(metadata.crops || []);
      setStates(metadata.states || []);
      if (metadata.crops && metadata.crops.length > 0) {
        setSelectedCrop(metadata.crops[0]);
      }
      if (metadata.states && metadata.states.length > 0) {
        setSelectedState(metadata.states[0]);
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
      // Use fallback options
      setCrops(['RICE', 'WHEAT', 'TOMATO', 'ONION', 'POTATO', 'COTTON', 'MAIZE']);
      setStates(['MAHARASHTRA', 'PUNJAB', 'KARNATAKA', 'UTTAR PRADESH', 'GUJARAT']);
      setSelectedCrop('RICE');
      setSelectedState('MAHARASHTRA');
    }
  };

  const fetchForecast = async () => {
    if (!selectedCrop) {
      setError('Please select a crop');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await analyticsService.getDemandForecast(selectedCrop, district, selectedState);
      setForecast(data);
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError('Failed to fetch demand forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDemandLevelColor = (level) => {
    switch (level) {
      case 'HIGH': return '#22c55e';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'UP': return <FiTrendingUp className="trend-icon up" />;
      case 'DOWN': return <FiTrendingDown className="trend-icon down" />;
      default: return <FiMinus className="trend-icon stable" />;
    }
  };

  const formatCropName = (crop) => {
    return crop.charAt(0) + crop.slice(1).toLowerCase();
  };

  const formatStateName = (state) => {
    return state.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="demand-forecast-section">
      <div className="section-header">
        <h2><FiTrendingUp /> Demand Forecast (Area-wise)</h2>
        <p className="section-subtitle">Understand crop demand before planting</p>
      </div>

      <div className="forecast-controls">
        <div className="control-group">
          <label htmlFor="crop-select">Crop Type</label>
          <select
            id="crop-select"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="forecast-select"
          >
            <option value="">Select Crop</option>
            {crops.map(crop => (
              <option key={crop} value={crop}>{formatCropName(crop)}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="state-select">State</label>
          <select
            id="state-select"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="forecast-select"
          >
            <option value="">Select State</option>
            {states.map(state => (
              <option key={state} value={state}>{formatStateName(state)}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="district-input">District (Optional)</label>
          <input
            id="district-input"
            type="text"
            placeholder="Enter district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="forecast-input"
          />
        </div>

        <button 
          className="forecast-btn" 
          onClick={fetchForecast}
          disabled={loading || !selectedCrop}
        >
          {loading ? <FiRefreshCw className="spinning" /> : 'Get Forecast'}
        </button>
      </div>

      {error && <div className="forecast-error">{error}</div>}

      {forecast && (
        <div className="forecast-results">
          <div className="forecast-header">
            <div className="forecast-crop-info">
              <h3>{formatCropName(forecast.cropType)}</h3>
              <span className="forecast-location">
                <FiMapPin /> {forecast.district || ''} {forecast.state && formatStateName(forecast.state)}
              </span>
            </div>
            {forecast.isSimulated && (
              <span className="simulated-badge">
                <FiInfo /> Simulated Data
              </span>
            )}
          </div>

          <div className="forecast-cards">
            <div className="forecast-card demand-level">
              <span className="card-label">Demand Level</span>
              <span 
                className="demand-indicator"
                style={{ backgroundColor: getDemandLevelColor(forecast.demandLevel) }}
              >
                {forecast.demandLevel}
              </span>
              <span className="trend-info">
                {getTrendIcon(forecast.trendDirection)}
                <span className="trend-text">{forecast.trendDirection}</span>
              </span>
            </div>

            <div className="forecast-card price-range">
              <span className="card-label">Expected Price Range</span>
              <div className="price-values">
                <FiDollarSign />
                <span className="price-min">₹{forecast.minPricePerKg}</span>
                <span className="price-separator">-</span>
                <span className="price-max">₹{forecast.maxPricePerKg}</span>
                <span className="price-unit">{forecast.priceUnit}</span>
              </div>
            </div>

            <div className="forecast-card confidence">
              <span className="card-label">Confidence</span>
              <span className={`confidence-badge ${forecast.confidence?.toLowerCase()}`}>
                {forecast.confidence}
              </span>
            </div>
          </div>

          <div className="forecast-insights">
            <div className="insight-box trend-message">
              <h4>Market Trend</h4>
              <p>{forecast.trendMessage}</p>
            </div>

            <div className="insight-box season-recommendation">
              <h4>Season Recommendation</h4>
              <p>{forecast.seasonRecommendation}</p>
            </div>

            <div className="insight-box market-insight">
              <h4>Market Insight</h4>
              <p>{forecast.marketInsight}</p>
            </div>
          </div>
        </div>
      )}

      {!forecast && !loading && !error && (
        <div className="forecast-placeholder">
          <FiTrendingUp className="placeholder-icon" />
          <p>Select a crop and location to view demand forecast</p>
        </div>
      )}
    </div>
  );
};

export default DemandForecast;
