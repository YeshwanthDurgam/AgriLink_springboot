import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import analyticsService from '../services/analyticsService';
import exportService from '../services/exportService';
import './Analytics.css';

const Analytics = () => {
  useAuth(); // Ensure user is authenticated
  const [activeTab, setActiveTab] = useState('farm');
  const [farmData, setFarmData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      switch (activeTab) {
        case 'farm':
          const farmResponse = await analyticsService.getDashboardSummary();
          setFarmData(farmResponse.data);
          break;
        case 'sales':
          const salesResponse = await analyticsService.getSalesAnalytics();
          setSalesData(salesResponse.data);
          break;
        case 'sensors':
          const sensorResponse = await analyticsService.getSensorAnalytics();
          setSensorData(sensorResponse.data);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const handleExport = async (exportType) => {
    setExporting(true);
    try {
      let response;
      let filename;
      
      switch (exportType) {
        case 'farms':
          response = await exportService.exportFarms();
          filename = `farms_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'fields':
          response = await exportService.exportFields();
          filename = `fields_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'crops':
          response = await exportService.exportCropPlans();
          filename = `crop_plans_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'farmAnalytics':
          response = await exportService.exportFarmAnalytics();
          filename = `farm_analytics_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'orders':
          response = await exportService.exportOrders();
          filename = `orders_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'salesAnalytics':
          response = await exportService.exportSalesAnalytics();
          filename = `sales_analytics_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          return;
      }
      
      exportService.downloadBlob(response.data, filename);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const renderFarmAnalytics = () => {
    if (!farmData) return <div className="no-data">No farm data available</div>;

    return (
      <div className="analytics-section">
        {/* Overview Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon farms">🏠</div>
            <div className="stat-content">
              <span className="stat-value">{farmData.totalFarms || 0}</span>
              <span className="stat-label">Total Farms</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon fields">🌾</div>
            <div className="stat-content">
              <span className="stat-value">{farmData.totalFields || 0}</span>
              <span className="stat-label">Total Fields</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon area">📐</div>
            <div className="stat-content">
              <span className="stat-value">{farmData.totalAreaManaged?.toFixed(1) || 0}</span>
              <span className="stat-label">Total Area ({farmData.areaUnit || 'HA'})</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon crops">🌱</div>
            <div className="stat-content">
              <span className="stat-value">{farmData.activeCrops || 0}</span>
              <span className="stat-label">Active Crops</span>
            </div>
          </div>
        </div>

        {/* Crop Status */}
        <div className="analytics-row">
          <div className="analytics-card">
            <h3>Crop Status</h3>
            <div className="crop-status-grid">
              <div className="status-item planned">
                <span className="status-count">{farmData.plannedCrops || 0}</span>
                <span className="status-label">Planned</span>
              </div>
              <div className="status-item active">
                <span className="status-count">{farmData.activeCrops || 0}</span>
                <span className="status-label">Growing</span>
              </div>
              <div className="status-item harvested">
                <span className="status-count">{farmData.harvestedCrops || 0}</span>
                <span className="status-label">Harvested</span>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Yield Performance</h3>
            <div className="yield-stats">
              <div className="yield-stat">
                <span className="yield-value">{farmData.totalYieldThisYear?.toFixed(0) || 0}</span>
                <span className="yield-label">{farmData.yieldUnit || 'KG'} This Year</span>
              </div>
              <div className="yield-stat">
                <span className="yield-value efficiency">{farmData.averageYieldEfficiency?.toFixed(1) || 0}%</span>
                <span className="yield-label">Avg Efficiency</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Crops */}
        {farmData.topCrops?.length > 0 && (
          <div className="analytics-card full-width">
            <h3>Top Crops</h3>
            <div className="top-crops-list">
              {farmData.topCrops.map((crop, index) => (
                <div key={index} className="crop-item">
                  <div className="crop-rank">{index + 1}</div>
                  <div className="crop-info">
                    <span className="crop-name">{crop.cropName}</span>
                    <span className="crop-details">
                      {crop.count} plantings • {crop.totalArea?.toFixed(1)} HA
                    </span>
                  </div>
                  <div className="crop-yield">
                    {crop.totalYield?.toFixed(0)} KG
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Activities */}
        {farmData.upcomingActivities?.length > 0 && (
          <div className="analytics-card full-width">
            <h3>Upcoming Activities</h3>
            <div className="activities-list">
              {farmData.upcomingActivities.map((activity, index) => (
                <div key={index} className={`activity-item ${activity.activityType?.toLowerCase()}`}>
                  <div className="activity-icon">
                    {activity.activityType === 'PLANTING' ? '🌱' : '🌾'}
                  </div>
                  <div className="activity-info">
                    <span className="activity-title">
                      {activity.activityType} - {activity.cropName}
                    </span>
                    <span className="activity-details">
                      {activity.farmName} • {activity.fieldName}
                    </span>
                  </div>
                  <div className="activity-date">
                    <span className="days-until">{activity.daysUntil} days</span>
                    <span className="scheduled-date">{activity.scheduledDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Harvests */}
        {farmData.recentHarvests?.length > 0 && (
          <div className="analytics-card full-width">
            <h3>Recent Harvests</h3>
            <div className="harvests-list">
              {farmData.recentHarvests.map((harvest, index) => (
                <div key={index} className="harvest-item">
                  <div className="harvest-icon">🌾</div>
                  <div className="harvest-info">
                    <span className="harvest-crop">{harvest.cropName}</span>
                    <span className="harvest-farm">{harvest.farmName}</span>
                  </div>
                  <div className="harvest-yield">
                    {harvest.yield?.toFixed(0)} {harvest.yieldUnit}
                  </div>
                  <div className="harvest-date">{harvest.harvestDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSalesAnalytics = () => {
    if (!salesData) return <div className="no-data">No sales data available</div>;

    return (
      <div className="analytics-section">
        {/* Revenue Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon revenue">💰</div>
            <div className="stat-content">
              <span className="stat-value">${salesData.totalRevenue?.toFixed(2) || '0.00'}</span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon monthly">📈</div>
            <div className="stat-content">
              <span className="stat-value">${salesData.totalRevenueThisMonth?.toFixed(2) || '0.00'}</span>
              <span className="stat-label">This Month</span>
              {salesData.revenueGrowthPercent !== 0 && (
                <span className={`growth ${salesData.revenueGrowthPercent > 0 ? 'positive' : 'negative'}`}>
                  {salesData.revenueGrowthPercent > 0 ? '+' : ''}{salesData.revenueGrowthPercent?.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orders">📦</div>
            <div className="stat-content">
              <span className="stat-value">{salesData.totalOrders || 0}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon avg">💵</div>
            <div className="stat-content">
              <span className="stat-value">${salesData.averageOrderValue?.toFixed(2) || '0.00'}</span>
              <span className="stat-label">Avg Order Value</span>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="analytics-row">
          <div className="analytics-card">
            <h3>Order Status</h3>
            <div className="order-status-grid">
              <div className="status-item pending">
                <span className="status-count">{salesData.pendingOrders || 0}</span>
                <span className="status-label">Pending</span>
              </div>
              <div className="status-item processing">
                <span className="status-count">{salesData.ordersThisMonth || 0}</span>
                <span className="status-label">This Month</span>
              </div>
              <div className="status-item completed">
                <span className="status-count">{salesData.completedOrders || 0}</span>
                <span className="status-label">Completed</span>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Performance</h3>
            <div className="performance-stats">
              <div className="perf-stat">
                <span className="perf-value">{salesData.orderCompletionRate?.toFixed(1) || 0}%</span>
                <span className="perf-label">Completion Rate</span>
              </div>
              <div className="perf-stat">
                <span className="perf-value">{salesData.repeatCustomers || 0}</span>
                <span className="perf-label">Repeat Customers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart (Simple Bar) */}
        {salesData.revenueByMonth?.length > 0 && (
          <div className="analytics-card full-width">
            <h3>Monthly Revenue</h3>
            <div className="revenue-chart">
              {salesData.revenueByMonth.map((month, index) => {
                const maxRevenue = Math.max(...salesData.revenueByMonth.map(m => m.revenue || 0));
                const height = maxRevenue > 0 ? ((month.revenue || 0) / maxRevenue * 100) : 0;
                return (
                  <div key={index} className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ height: `${height}%` }}
                      title={`$${month.revenue?.toFixed(2)}`}
                    >
                      <span className="bar-value">${month.revenue?.toFixed(0)}</span>
                    </div>
                    <span className="bar-label">{month.period?.substring(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Products */}
        {salesData.topProducts?.length > 0 && (
          <div className="analytics-card">
            <h3>Top Products</h3>
            <div className="products-list">
              {salesData.topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="product-item">
                  <div className="product-rank">{index + 1}</div>
                  <div className="product-info">
                    <span className="product-name">{product.productName}</span>
                    <span className="product-orders">{product.orderCount} orders</span>
                  </div>
                  <div className="product-revenue">${product.totalRevenue?.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Buyers */}
        {salesData.topBuyers?.length > 0 && (
          <div className="analytics-card">
            <h3>Top Buyers</h3>
            <div className="buyers-list">
              {salesData.topBuyers.slice(0, 5).map((buyer, index) => (
                <div key={index} className="buyer-item">
                  <div className="buyer-rank">{index + 1}</div>
                  <div className="buyer-info">
                    <span className="buyer-name">{buyer.buyerName}</span>
                    <span className="buyer-orders">{buyer.orderCount} orders</span>
                  </div>
                  <div className="buyer-spent">${buyer.totalSpent?.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSensorAnalytics = () => {
    if (!sensorData) return <div className="no-data">No sensor data available</div>;

    return (
      <div className="analytics-section">
        {/* Device Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon devices">📡</div>
            <div className="stat-content">
              <span className="stat-value">{sensorData.totalDevices || 0}</span>
              <span className="stat-label">Total Devices</span>
            </div>
          </div>
          <div className="stat-card online">
            <div className="stat-icon online">✅</div>
            <div className="stat-content">
              <span className="stat-value">{sensorData.onlineDevices || 0}</span>
              <span className="stat-label">Online</span>
            </div>
          </div>
          <div className="stat-card offline">
            <div className="stat-icon offline">⚠️</div>
            <div className="stat-content">
              <span className="stat-value">{sensorData.offlineDevices || 0}</span>
              <span className="stat-label">Offline</span>
            </div>
          </div>
          <div className="stat-card alerts">
            <div className="stat-icon alerts">🚨</div>
            <div className="stat-content">
              <span className="stat-value">{sensorData.totalAlertsToday || 0}</span>
              <span className="stat-label">Alerts Today</span>
            </div>
          </div>
        </div>

        {/* Current Conditions */}
        {sensorData.currentConditions && (
          <div className="analytics-card full-width">
            <h3>Current Conditions</h3>
            <div className={`conditions-status ${sensorData.currentConditions.overallStatus?.toLowerCase()}`}>
              {sensorData.currentConditions.overallStatus}
            </div>
            <div className="conditions-grid">
              {sensorData.currentConditions.temperature && (
                <div className="condition-item">
                  <span className="condition-icon">🌡️</span>
                  <span className="condition-value">
                    {sensorData.currentConditions.temperature}°C
                  </span>
                  <span className="condition-label">Temperature</span>
                </div>
              )}
              {sensorData.currentConditions.humidity && (
                <div className="condition-item">
                  <span className="condition-icon">💧</span>
                  <span className="condition-value">
                    {sensorData.currentConditions.humidity}%
                  </span>
                  <span className="condition-label">Humidity</span>
                </div>
              )}
              {sensorData.currentConditions.soilMoisture && (
                <div className="condition-item">
                  <span className="condition-icon">🌱</span>
                  <span className="condition-value">
                    {sensorData.currentConditions.soilMoisture}%
                  </span>
                  <span className="condition-label">Soil Moisture</span>
                </div>
              )}
              {sensorData.currentConditions.soilPh && (
                <div className="condition-item">
                  <span className="condition-icon">🧪</span>
                  <span className="condition-value">
                    {sensorData.currentConditions.soilPh}
                  </span>
                  <span className="condition-label">Soil pH</span>
                </div>
              )}
              {sensorData.currentConditions.rainfall && (
                <div className="condition-item">
                  <span className="condition-icon">🌧️</span>
                  <span className="condition-value">
                    {sensorData.currentConditions.rainfall} mm
                  </span>
                  <span className="condition-label">Rainfall</span>
                </div>
              )}
              {sensorData.currentConditions.windSpeed && (
                <div className="condition-item">
                  <span className="condition-icon">💨</span>
                  <span className="condition-value">
                    {sensorData.currentConditions.windSpeed} km/h
                  </span>
                  <span className="condition-label">Wind Speed</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Temperature History Chart */}
        {sensorData.temperatureHistory?.length > 0 && (
          <div className="analytics-card full-width">
            <h3>Temperature (24h)</h3>
            <div className="line-chart">
              {sensorData.temperatureHistory.map((point, index) => {
                const maxTemp = Math.max(...sensorData.temperatureHistory.map(p => p.value || 0));
                const minTemp = Math.min(...sensorData.temperatureHistory.map(p => p.value || 0));
                const range = maxTemp - minTemp || 1;
                const height = ((point.value - minTemp) / range * 80) + 10;
                return (
                  <div key={index} className="chart-point-container">
                    <div 
                      className="chart-point" 
                      style={{ bottom: `${height}%` }}
                      title={`${point.value}°C at ${point.timestamp}`}
                    />
                    {index < sensorData.temperatureHistory.length - 1 && (
                      <div className="chart-line" />
                    )}
                    <span className="point-label">{point.timestamp}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Device List */}
        {sensorData.sensorSummaries?.length > 0 && (
          <div className="analytics-card full-width">
            <h3>Devices</h3>
            <div className="devices-list">
              {sensorData.sensorSummaries.map((device, index) => (
                <div key={index} className={`device-item ${device.status?.toLowerCase()}`}>
                  <div className="device-icon">
                    {device.deviceType === 'TEMPERATURE_SENSOR' && '🌡️'}
                    {device.deviceType === 'HUMIDITY_SENSOR' && '💧'}
                    {device.deviceType === 'SOIL_SENSOR' && '🌱'}
                    {device.deviceType === 'WEATHER_STATION' && '🌤️'}
                    {!['TEMPERATURE_SENSOR', 'HUMIDITY_SENSOR', 'SOIL_SENSOR', 'WEATHER_STATION'].includes(device.deviceType) && '📡'}
                  </div>
                  <div className="device-info">
                    <span className="device-name">{device.deviceName}</span>
                    <span className="device-type">{device.deviceType?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="device-reading">
                    {device.lastReading && (
                      <span className="reading-value">
                        {device.lastReading} {device.unit}
                      </span>
                    )}
                    <span className="reading-time">{device.lastUpdated}</span>
                  </div>
                  <div className={`device-status ${device.status?.toLowerCase()}`}>
                    {device.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Alerts */}
        {sensorData.activeAlerts?.length > 0 && (
          <div className="analytics-card full-width">
            <h3>Active Alerts</h3>
            <div className="alerts-list">
              {sensorData.activeAlerts.map((alert, index) => (
                <div key={index} className={`alert-item ${alert.severity?.toLowerCase()}`}>
                  <div className="alert-icon">
                    {alert.severity === 'CRITICAL' && '🚨'}
                    {alert.severity === 'WARNING' && '⚠️'}
                    {alert.severity === 'INFO' && 'ℹ️'}
                  </div>
                  <div className="alert-info">
                    <span className="alert-message">{alert.message}</span>
                    <span className="alert-device">{alert.deviceName}</span>
                  </div>
                  <div className="alert-time">{alert.triggeredAt}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p>Monitor your farm performance, sales, and IoT sensors</p>
      </div>

      <div className="analytics-tabs">
        <button 
          className={`tab ${activeTab === 'farm' ? 'active' : ''}`}
          onClick={() => setActiveTab('farm')}
        >
          🏠 Farm Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          💰 Sales Reports
        </button>
        <button 
          className={`tab ${activeTab === 'sensors' ? 'active' : ''}`}
          onClick={() => setActiveTab('sensors')}
        >
          📡 IoT Sensors
        </button>
      </div>

      {/* Export Buttons */}
      <div className="export-section">
        <span className="export-label">📥 Export Data:</span>
        {activeTab === 'farm' && (
          <>
            <button 
              className="export-btn" 
              onClick={() => handleExport('farms')}
              disabled={exporting}
            >
              Farms CSV
            </button>
            <button 
              className="export-btn" 
              onClick={() => handleExport('fields')}
              disabled={exporting}
            >
              Fields CSV
            </button>
            <button 
              className="export-btn" 
              onClick={() => handleExport('crops')}
              disabled={exporting}
            >
              Crops CSV
            </button>
            <button 
              className="export-btn primary" 
              onClick={() => handleExport('farmAnalytics')}
              disabled={exporting}
            >
              Full Report
            </button>
          </>
        )}
        {activeTab === 'sales' && (
          <>
            <button 
              className="export-btn" 
              onClick={() => handleExport('orders')}
              disabled={exporting}
            >
              Orders CSV
            </button>
            <button 
              className="export-btn primary" 
              onClick={() => handleExport('salesAnalytics')}
              disabled={exporting}
            >
              Sales Report
            </button>
          </>
        )}
        {exporting && <span className="export-loading">Exporting...</span>}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading analytics data...</div>
      ) : (
        <div className="analytics-content">
          {activeTab === 'farm' && renderFarmAnalytics()}
          {activeTab === 'sales' && renderSalesAnalytics()}
          {activeTab === 'sensors' && renderSensorAnalytics()}
        </div>
      )}
    </div>
  );
};

export default Analytics;
