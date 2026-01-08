import React, { useState, useEffect } from 'react';
import { FiSun, FiCloud, FiCloudRain, FiWind, FiDroplet, FiThermometer, FiAlertTriangle } from 'react-icons/fi';
import weatherService from '../services/weatherService';
import './WeatherWidget.css';

const WeatherWidget = ({ farmId }) => {
  const [weather, setWeather] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForecast, setShowForecast] = useState(false);

  useEffect(() => {
    if (farmId) {
      fetchWeatherData();
    }
  }, [farmId]);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const [weatherResponse, recsResponse] = await Promise.all([
        weatherService.getWeatherForFarm(farmId),
        weatherService.getFarmingRecommendations(farmId)
      ]);
      setWeather(weatherResponse.data.data);
      setRecommendations(recsResponse.data.data || []);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    if (!condition) return <FiSun />;
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return <FiCloudRain />;
    if (lowerCondition.includes('cloud')) return <FiCloud />;
    return <FiSun />;
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  if (loading) {
    return (
      <div className="weather-widget loading">
        <div className="loading-spinner-small"></div>
        <span>Loading weather...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="weather-widget error">
        <FiAlertTriangle />
        <span>{error || 'Weather unavailable'}</span>
      </div>
    );
  }

  const { current, forecast } = weather;

  return (
    <div className="weather-widget">
      {/* Current Weather */}
      <div className="weather-current">
        <div className="weather-main">
          <span className="weather-icon-large">{current?.conditionIcon || '☀️'}</span>
          <div className="weather-temp">
            <span className="temp-value">{Math.round(current?.temperature || 0)}°</span>
            <span className="temp-feels">Feels like {Math.round(current?.feelsLike || 0)}°</span>
          </div>
        </div>
        <div className="weather-condition">{current?.condition || 'Clear'}</div>
        <div className="weather-location">{weather.location}</div>
      </div>

      {/* Weather Details */}
      <div className="weather-details">
        <div className="weather-detail">
          <FiDroplet />
          <span>{current?.humidity || 0}%</span>
          <small>Humidity</small>
        </div>
        <div className="weather-detail">
          <FiWind />
          <span>{Math.round(current?.windSpeed || 0)} km/h</span>
          <small>Wind</small>
        </div>
        <div className="weather-detail">
          <FiThermometer />
          <span>{current?.pressure || 0} hPa</span>
          <small>Pressure</small>
        </div>
      </div>

      {/* Forecast Toggle */}
      <button 
        className="forecast-toggle"
        onClick={() => setShowForecast(!showForecast)}
      >
        {showForecast ? 'Hide Forecast' : 'Show 7-Day Forecast'}
      </button>

      {/* Forecast */}
      {showForecast && forecast && (
        <div className="weather-forecast">
          {forecast.slice(0, 7).map((day, index) => (
            <div key={index} className="forecast-day">
              <span className="forecast-date">
                {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="forecast-icon">{day.conditionIcon || '☀️'}</span>
              <span className="forecast-temps">
                <span className="temp-high">{Math.round(day.tempMax)}°</span>
                <span className="temp-low">{Math.round(day.tempMin)}°</span>
              </span>
              <span className="forecast-precip">
                <FiDroplet size={12} /> {Math.round(day.precipitationChance || 0)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Farming Recommendations */}
      {recommendations.length > 0 && (
        <div className="weather-recommendations">
          <h4>Farming Recommendations</h4>
          {recommendations.map((rec, index) => (
            <div key={index} className={`recommendation ${getPriorityClass(rec.priority)}`}>
              <div className="rec-header">
                <span className="rec-category">{rec.category}</span>
                <span className={`rec-priority ${getPriorityClass(rec.priority)}`}>{rec.priority}</span>
              </div>
              <p className="rec-text">{rec.recommendation}</p>
              <small className="rec-reason">{rec.reason}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
