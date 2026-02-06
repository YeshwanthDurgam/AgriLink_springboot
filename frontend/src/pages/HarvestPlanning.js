import React, { useState, useEffect } from 'react';
import { 
  FiCloud, FiDroplet, FiSun, FiThermometer, FiTool, FiInfo, 
  FiRefreshCw, FiCheckCircle, FiAlertCircle, FiClock, FiMapPin
} from 'react-icons/fi';
import analyticsService from '../services/analyticsService';
import FarmService from '../services/farmService';
import './HarvestPlanning.css';

const HarvestPlanning = () => {
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedFarm, setSelectedFarm] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchCrops();
    fetchFarms();
  }, []);

  const fetchCrops = async () => {
    try {
      const data = await analyticsService.getHarvestGuidanceCrops();
      setCrops(data || []);
      if (data && data.length > 0) {
        setSelectedCrop(data[0]);
      }
    } catch (err) {
      console.error('Error fetching crops:', err);
      setCrops(['RICE', 'WHEAT', 'TOMATO', 'ONION', 'POTATO', 'COTTON', 'MAIZE', 'SUGARCANE']);
      setSelectedCrop('RICE');
    }
  };

  const fetchFarms = async () => {
    try {
      const response = await FarmService.getMyFarms();
      let farmsList = [];
      if (Array.isArray(response)) {
        farmsList = response;
      } else if (response && Array.isArray(response.content)) {
        farmsList = response.content;
      }
      setFarms(farmsList);
      if (farmsList.length > 0) {
        setSelectedFarm(farmsList[0].id);
        setLocation(farmsList[0].location || '');
      }
    } catch (err) {
      console.error('Error fetching farms:', err);
      setFarms([]);
    }
  };

  const fetchGuidance = async () => {
    if (!selectedCrop) {
      setError('Please select a crop');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await analyticsService.getHarvestGuidance(
        selectedCrop, 
        location, 
        selectedFarm || null
      );
      setGuidance(data);
    } catch (err) {
      console.error('Error fetching guidance:', err);
      setError('Failed to fetch harvest guidance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCropName = (crop) => {
    return crop.charAt(0) + crop.slice(1).toLowerCase();
  };

  const getReadinessColor = (status) => {
    switch (status) {
      case 'READY': return '#22c55e';
      case 'APPROACHING': return '#f59e0b';
      case 'NOT_READY': return '#6b7280';
      case 'OVERDUE': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getReadinessIcon = (status) => {
    switch (status) {
      case 'READY': return <FiCheckCircle />;
      case 'APPROACHING': return <FiClock />;
      case 'OVERDUE': return <FiAlertCircle />;
      default: return <FiClock />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'ESSENTIAL': return '#dc2626';
      case 'RECOMMENDED': return '#f59e0b';
      case 'OPTIONAL': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'ORGANIC': return '#22c55e';
      case 'BIO': return '#10b981';
      case 'CHEMICAL': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="harvest-planning-section">
      <div className="section-header">
        <h2><FiSun /> Harvesting & Crop Planning</h2>
        <p className="section-subtitle">Get weather-informed cultivation and harvesting guidance</p>
      </div>

      <div className="harvest-controls">
        <div className="control-group">
          <label htmlFor="harvest-crop-select">Crop Name</label>
          <select
            id="harvest-crop-select"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="harvest-select"
          >
            <option value="">Select Crop</option>
            {crops.map(crop => (
              <option key={crop} value={crop}>{formatCropName(crop)}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="farm-select">Farm (for weather data)</label>
          <select
            id="farm-select"
            value={selectedFarm}
            onChange={(e) => {
              setSelectedFarm(e.target.value);
              const farm = farms.find(f => f.id === e.target.value);
              if (farm) setLocation(farm.location || '');
            }}
            className="harvest-select"
          >
            <option value="">Select Farm</option>
            {farms.map(farm => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="location-input">Location</label>
          <input
            id="location-input"
            type="text"
            placeholder="Auto from farm or enter manually"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="harvest-input"
          />
        </div>

        <button 
          className="harvest-btn" 
          onClick={fetchGuidance}
          disabled={loading || !selectedCrop}
        >
          {loading ? <FiRefreshCw className="spinning" /> : 'Get Guidance'}
        </button>
      </div>

      {error && <div className="harvest-error">{error}</div>}

      {guidance && (
        <div className="guidance-results">
          <div className="guidance-header">
            <div className="guidance-crop-info">
              <h3>{formatCropName(guidance.cropName)}</h3>
              <span className="guidance-location">
                <FiMapPin /> {guidance.location}
              </span>
            </div>
            {guidance.isSimulated && (
              <span className="simulated-badge">
                <FiInfo /> Backend-driven data
              </span>
            )}
          </div>

          {/* Weather Summary */}
          {guidance.weatherSummary && (
            <div className="weather-section">
              <h4><FiCloud /> Weather Forecast</h4>
              <div className="weather-cards">
                <div className="weather-card current">
                  <div className="weather-main">
                    <FiThermometer className="weather-icon" />
                    <span className="temp-value">{guidance.weatherSummary.temperature}°C</span>
                  </div>
                  <span className="weather-condition">{guidance.weatherSummary.condition}</span>
                  <div className="weather-details">
                    <span><FiDroplet /> {guidance.weatherSummary.humidity}% humidity</span>
                  </div>
                </div>
                
                {guidance.weatherSummary.dailyForecast && (
                  <div className="forecast-strip">
                    {guidance.weatherSummary.dailyForecast.map((day, index) => (
                      <div key={index} className="forecast-day">
                        <span className="day-name">{day.day}</span>
                        <span className="day-temp">{day.minTemp}°-{day.maxTemp}°</span>
                        <span className="day-rain">{day.rainChance}% rain</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="weather-advisory">
                <FiInfo /> {guidance.weatherSummary.advisoryMessage}
              </div>
            </div>
          )}

          {/* Harvest Readiness */}
          {guidance.harvestReadiness && (
            <div className="readiness-section">
              <h4>Harvest Readiness</h4>
              <div className="readiness-content">
                <div className="readiness-meter">
                  <div className="meter-fill" style={{ 
                    width: `${guidance.harvestReadiness.readinessPercentage}%`,
                    backgroundColor: getReadinessColor(guidance.harvestReadiness.status)
                  }}></div>
                </div>
                <div className="readiness-info">
                  <span className="readiness-status" style={{ color: getReadinessColor(guidance.harvestReadiness.status) }}>
                    {getReadinessIcon(guidance.harvestReadiness.status)}
                    {guidance.harvestReadiness.status?.replace('_', ' ')}
                  </span>
                  <span className="readiness-days">Est. {guidance.harvestReadiness.estimatedDays}</span>
                </div>
                <div className="readiness-indicators">
                  <strong>Readiness Indicators:</strong>
                  <ul>
                    {guidance.harvestReadiness.readinessIndicators?.map((indicator, idx) => (
                      <li key={idx}>{indicator}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tools & Equipment */}
          {guidance.recommendedTools && guidance.recommendedTools.length > 0 && (
            <div className="tools-section">
              <h4><FiTool /> Recommended Tools & Equipment</h4>
              <div className="tools-grid">
                {guidance.recommendedTools.map((tool, idx) => (
                  <div key={idx} className="tool-card">
                    <div className="tool-header">
                      <span className="tool-name">{tool.name}</span>
                      <span 
                        className="tool-priority"
                        style={{ backgroundColor: getPriorityColor(tool.priority) }}
                      >
                        {tool.priority}
                      </span>
                    </div>
                    <span className="tool-category">{tool.category}</span>
                    <span className="tool-purpose">{tool.purpose}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fertilizer Suggestions */}
          {guidance.fertilizerSuggestions && guidance.fertilizerSuggestions.length > 0 && (
            <div className="fertilizer-section">
              <h4>Fertilizer & Nutrient Recommendations</h4>
              <div className="fertilizer-table">
                <div className="fertilizer-header">
                  <span>Name</span>
                  <span>Type</span>
                  <span>Dosage</span>
                  <span>Timing</span>
                  <span>Benefit</span>
                </div>
                {guidance.fertilizerSuggestions.map((fert, idx) => (
                  <div key={idx} className="fertilizer-row">
                    <span className="fert-name">{fert.name}</span>
                    <span className="fert-type" style={{ color: getTypeColor(fert.type) }}>{fert.type}</span>
                    <span className="fert-dosage">{fert.dosage}</span>
                    <span className="fert-timing">{fert.timing}</span>
                    <span className="fert-benefit">{fert.benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Irrigation Guidance */}
          {guidance.irrigationGuidance && (
            <div className="irrigation-section">
              <h4><FiDroplet /> Irrigation Guidance</h4>
              <div className="irrigation-content">
                <div className="irrigation-cards">
                  <div className="irrigation-card">
                    <span className="irr-label">Method</span>
                    <span className="irr-value">{guidance.irrigationGuidance.method}</span>
                  </div>
                  <div className="irrigation-card">
                    <span className="irr-label">Frequency</span>
                    <span className="irr-value">{guidance.irrigationGuidance.frequency}</span>
                  </div>
                  <div className="irrigation-card">
                    <span className="irr-label">Water Requirement</span>
                    <span className="irr-value">{guidance.irrigationGuidance.waterRequirement} L/acre</span>
                  </div>
                  <div className="irrigation-card">
                    <span className="irr-label">Best Time</span>
                    <span className="irr-value">{guidance.irrigationGuidance.bestTime}</span>
                  </div>
                </div>
                <div className="irrigation-advice">
                  <strong>Current Advice:</strong> {guidance.irrigationGuidance.currentAdvice}
                </div>
                <div className="irrigation-tips">
                  <strong>Tips:</strong>
                  <ul>
                    {guidance.irrigationGuidance.tips?.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Cultivation Tips */}
          {guidance.cultivationTips && guidance.cultivationTips.length > 0 && (
            <div className="tips-section">
              <h4>Cultivation Tips</h4>
              <ul className="tips-list">
                {guidance.cultivationTips.map((tip, idx) => (
                  <li key={idx}><FiCheckCircle /> {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!guidance && !loading && !error && (
        <div className="guidance-placeholder">
          <FiSun className="placeholder-icon" />
          <p>Select a crop and location to view harvest guidance</p>
        </div>
      )}
    </div>
  );
};

export default HarvestPlanning;
