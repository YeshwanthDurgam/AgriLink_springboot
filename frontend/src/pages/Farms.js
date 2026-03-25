import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch, FiFilter, FiMapPin, FiSquare, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { FaSeedling } from 'react-icons/fa';
import FarmService from '../services/farmService';
import './Farms.css';

const Farms = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 9;

  useEffect(() => {
    fetchFarms();
  }, [currentPage]);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const response = await FarmService.getMyFarms({
        page: currentPage,
        size: pageSize,
        sort: 'createdAt,desc',
      });
      
      if (response.success) {
        // Backend returns ApiResponse with data as array (not paginated)
        const farmsData = Array.isArray(response.data) ? response.data : (response.data?.content || []);
        setFarms(farmsData);
        // For non-paginated response, calculate pages from array length
        const total = farmsData.length;
        setTotalPages(Math.ceil(total / pageSize) || 1);
        setTotalElements(total);
      }
    } catch (error) {
      console.error('Error fetching farms:', error);
      toast.error('Failed to load farms. Please try again.');
      // Set empty state
      setFarms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (farmId, farmName) => {
    if (!window.confirm(`Are you sure you want to delete "${farmName}"?`)) {
      return;
    }

    try {
      await FarmService.deleteFarm(farmId);
      toast.success('Farm deleted successfully');
      fetchFarms();
    } catch (error) {
      console.error('Error deleting farm:', error);
      toast.error('Failed to delete farm. Please try again.');
    }
  };

  const filteredFarms = farms.filter(farm =>
    farm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farm.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="farms-page">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1>My Farms</h1>
            <p className="page-subtitle">{totalElements} farms registered</p>
          </div>
          <Link to="/farms/create" className="btn btn-primary">
            <FiPlus />
            Add Farm
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="toolbar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search farms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline filter-btn">
            <FiFilter />
            Filter
          </button>
        </div>

        {/* Farms Grid */}
        {filteredFarms.length > 0 ? (
          <>
            <div className="data-grid">
              {filteredFarms.map((farm) => (
                <div key={farm.id} className="farm-card">
                  <div className="farm-card-image">
                    {farm.farmImageUrl ? (
                      <img src={farm.farmImageUrl} alt={farm.name} className="farm-image" />
                    ) : (
                      <div className="farm-image-placeholder">🏡</div>
                    )}
                  </div>
                  <div className="farm-card-content">
                    <h3>{farm.name}</h3>
                    <div className="farm-details">
                      <p>
                        <FiMapPin className="detail-icon" />
                        {farm.location || 'Location not set'}
                      </p>
                      {farm.cropTypes && (
                        <p>
                          <FaSeedling className="detail-icon" />
                          {farm.cropTypes}
                        </p>
                      )}
                      <p>
                        <FiSquare className="detail-icon" />
                        {farm.totalArea ? `${farm.totalArea} ${farm.areaUnit || 'hectares'}` : 'Size not set'}
                      </p>
                    </div>
                    {farm.description && (
                      <p className="farm-description">{farm.description}</p>
                    )}
                  </div>
                  <div className="farm-card-footer">
                    <span className={`farm-status ${farm.status?.toLowerCase() || 'active'}`}>
                      {farm.status || 'Active'}
                    </span>
                    <div className="farm-actions">
                      <Link to={`/farms/${farm.id}`} className="action-btn view">
                        View
                      </Link>
                      <Link to={`/farms/${farm.id}/edit`} className="action-btn edit">
                        <FiEdit2 />
                      </Link>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(farm.id, farm.name)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🌾</div>
            <h3>No farms found</h3>
            {searchTerm ? (
              <p>No farms match your search. Try a different search term.</p>
            ) : (
              <>
                <p>You haven't added any farms yet. Start by creating your first farm.</p>
                <Link to="/farms/create" className="btn btn-primary">
                  <FiPlus />
                  Add Your First Farm
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Farms;
