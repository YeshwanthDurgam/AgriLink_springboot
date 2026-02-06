import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiGrid, FiMaximize, FiTrendingUp, FiDollarSign, FiBarChart2, FiPackage, FiCalendar, FiTarget, FiDownload } from 'react-icons/fi';
import analyticsService from '../services/analyticsService';
import exportService from '../services/exportService';
import './Analytics.css';

// Lazy load the new insight components
const DemandForecast = lazy(() => import('./DemandForecast'));
const HarvestPlanning = lazy(() => import('./HarvestPlanning'));

const Analytics = () => {
  useAuth(); // Ensure user is authenticated
  const [activeTab, setActiveTab] = useState('insights');
  const [farmData, setFarmData] = useState(null);
  const [salesData, setSalesData] = useState(null);
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
          setFarmData(farmResponse.data || farmResponse);
          break;
        case 'sales':
          const salesResponse = await analyticsService.getSalesAnalytics();
          setSalesData(salesResponse.data || salesResponse);
          break;
        case 'insights':
        case 'demandForecast':
        case 'harvestPlanning':
          // These tabs load their own data
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
            <div className="stat-icon farms"><FiHome size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{farmData.totalFarms || 0}</span>
              <span className="stat-label">Total Farms</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon fields"><FiGrid size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{farmData.totalFields || 0}</span>
              <span className="stat-label">Total Fields</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon area"><FiMaximize size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{farmData.totalAreaManaged?.toFixed(1) || 0}</span>
              <span className="stat-label">Total Area ({farmData.areaUnit || 'HA'})</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon crops"><FiCalendar size={24} /></div>
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
                  <div className="harvest-icon"><FiGrid size={20} /></div>
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
            <div className="stat-icon revenue"><FiDollarSign size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">${salesData.totalRevenue?.toFixed(2) || '0.00'}</span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon monthly"><FiTrendingUp size={24} /></div>
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
            <div className="stat-icon orders"><FiPackage size={24} /></div>
            <div className="stat-content">
              <span className="stat-value">{salesData.totalOrders || 0}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon avg"><FiBarChart2 size={24} /></div>
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

  // Loading component for lazy loaded sections
  const SectionLoader = () => (
    <div className="section-loading">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );

  const renderFarmInsights = () => {
    return (
      <div className="analytics-section farm-insights">
        <div className="insights-intro">
          <h3>Welcome to Farm Insights</h3>
          <p>Get agriculture-specific intelligence to make informed decisions about your farming operations.</p>
        </div>
        
        <div className="insights-cards">
          <div 
            className="insight-card demand-forecast-card"
            onClick={() => setActiveTab('demandForecast')}
          >
            <div className="insight-icon"><FiTrendingUp size={32} /></div>
            <h4>Demand Forecast (Area-wise)</h4>
            <p>Understand crop demand before planting. Get location-based market trends and price insights.</p>
            <span className="explore-link">Explore →</span>
          </div>
          
          <div 
            className="insight-card harvest-planning-card"
            onClick={() => setActiveTab('harvestPlanning')}
          >
            <div className="insight-icon"><FiCalendar size={32} /></div>
            <h4>Harvesting & Crop Planning</h4>
            <p>Weather-informed guidance on cultivation, irrigation, fertilizers, and harvest timing.</p>
            <span className="explore-link">Explore →</span>
          </div>
        </div>
        
        <div className="quick-stats">
          <h4>Quick Overview</h4>
          <div className="stats-row">
            <div className="quick-stat">
              <span className="stat-emoji"><FiHome size={20} /></span>
              <span className="stat-label">Farm Analytics</span>
              <button className="stat-btn" onClick={() => setActiveTab('farm')}>View →</button>
            </div>
            <div className="quick-stat">
              <span className="stat-emoji"><FiDollarSign size={20} /></span>
              <span className="stat-label">Sales Reports</span>
              <button className="stat-btn" onClick={() => setActiveTab('sales')}>View →</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1><FiBarChart2 size={28} /> Farm Insights</h1>
        <p>Agriculture-focused analytics and intelligence for your farming operations</p>
      </div>

      <div className="analytics-tabs">
        <button 
          className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <FiTarget size={16} /> Overview
        </button>
        <button 
          className={`tab ${activeTab === 'demandForecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('demandForecast')}
        >
          <FiTrendingUp size={16} /> Demand Forecast
        </button>
        <button 
          className={`tab ${activeTab === 'harvestPlanning' ? 'active' : ''}`}
          onClick={() => setActiveTab('harvestPlanning')}
        >
          <FiCalendar size={16} /> Harvest Planning
        </button>
        <button 
          className={`tab ${activeTab === 'farm' ? 'active' : ''}`}
          onClick={() => setActiveTab('farm')}
        >
          <FiHome size={16} /> Farm Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <FiDollarSign size={16} /> Sales Reports
        </button>
      </div>

      {/* Export Buttons - only for farm and sales tabs */}
      {(activeTab === 'farm' || activeTab === 'sales') && (
        <div className="export-section">
          <span className="export-label"><FiDownload size={16} /> Export Data:</span>
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
      )}

      {error && <div className="error-message">{error}</div>}

      {loading && (activeTab === 'farm' || activeTab === 'sales') ? (
        <div className="loading">Loading analytics data...</div>
      ) : (
        <div className="analytics-content">
          {activeTab === 'insights' && renderFarmInsights()}
          {activeTab === 'demandForecast' && (
            <Suspense fallback={<SectionLoader />}>
              <DemandForecast />
            </Suspense>
          )}
          {activeTab === 'harvestPlanning' && (
            <Suspense fallback={<SectionLoader />}>
              <HarvestPlanning />
            </Suspense>
          )}
          {activeTab === 'farm' && renderFarmAnalytics()}
          {activeTab === 'sales' && renderSalesAnalytics()}
        </div>
      )}
    </div>
  );
};

export default Analytics;
