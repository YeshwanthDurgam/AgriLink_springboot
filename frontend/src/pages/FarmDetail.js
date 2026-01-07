import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiEdit2, FiTrash2, FiPlus, FiMapPin, FiSquare, FiCalendar } from 'react-icons/fi';
import FarmService from '../services/farmService';
import './FarmDetail.css';

const FarmDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarmDetails();
  }, [id]);

  const fetchFarmDetails = async () => {
    try {
      setLoading(true);
      const [farmResponse, cropsResponse] = await Promise.all([
        FarmService.getFarmById(id),
        FarmService.getFarmCrops(id).catch(() => ({ success: true, data: [] })),
      ]);

      if (farmResponse.success) {
        setFarm(farmResponse.data);
      } else {
        toast.error('Farm not found');
        navigate('/farms');
      }

      if (cropsResponse.success) {
        setCrops(cropsResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching farm details:', error);
      toast.error('Failed to load farm details');
      navigate('/farms');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${farm.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await FarmService.deleteFarm(id);
      toast.success('Farm deleted successfully');
      navigate('/farms');
    } catch (error) {
      console.error('Error deleting farm:', error);
      toast.error('Failed to delete farm');
    }
  };

  const handleDeleteCrop = async (cropId, cropName) => {
    if (!window.confirm(`Delete crop "${cropName}"?`)) {
      return;
    }

    try {
      await FarmService.deleteCrop(cropId);
      toast.success('Crop deleted');
      setCrops(crops.filter(c => c.id !== cropId));
    } catch (error) {
      toast.error('Failed to delete crop');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!farm) {
    return null;
  }

  return (
    <div className="container">
      <div className="farm-detail">
        {/* Back Button */}
        <Link to="/farms" className="back-link">
          <FiArrowLeft />
          Back to Farms
        </Link>

        {/* Farm Header */}
        <div className="farm-header">
          <div className="farm-header-content">
            <div className="farm-icon">🏡</div>
            <div className="farm-header-info">
              <h1>{farm.name}</h1>
              <div className="farm-meta">
                <span><FiMapPin /> {farm.location || 'Location not set'}</span>
                <span><FiSquare /> {farm.size ? `${farm.size} acres` : 'Size not set'}</span>
                <span><FiCalendar /> Added {new Date(farm.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="farm-header-actions">
            <Link to={`/farms/${id}/edit`} className="btn btn-outline">
              <FiEdit2 />
              Edit
            </Link>
            <button className="btn btn-danger" onClick={handleDelete}>
              <FiTrash2 />
              Delete
            </button>
          </div>
        </div>

        {/* Farm Status */}
        <div className="info-cards">
          <div className="info-card">
            <h3>Status</h3>
            <span className={`status-badge ${farm.status?.toLowerCase() || 'active'}`}>
              {farm.status || 'Active'}
            </span>
          </div>
          <div className="info-card">
            <h3>Crops</h3>
            <p className="info-value">{crops.length}</p>
          </div>
          <div className="info-card">
            <h3>Farm Type</h3>
            <p className="info-value">{farm.farmType || 'Mixed'}</p>
          </div>
          <div className="info-card">
            <h3>Soil Type</h3>
            <p className="info-value">{farm.soilType || 'Not specified'}</p>
          </div>
        </div>

        {/* Description */}
        {farm.description && (
          <div className="section">
            <h2>Description</h2>
            <p className="description-text">{farm.description}</p>
          </div>
        )}

        {/* Crops Section */}
        <div className="section">
          <div className="section-header">
            <h2>Crops</h2>
            <button className="btn btn-primary btn-sm">
              <FiPlus />
              Add Crop
            </button>
          </div>

          {crops.length > 0 ? (
            <div className="crops-grid">
              {crops.map((crop) => (
                <div key={crop.id} className="crop-card">
                  <div className="crop-icon">🌱</div>
                  <div className="crop-info">
                    <h4>{crop.name}</h4>
                    <p>{crop.variety || 'Standard variety'}</p>
                    <div className="crop-details">
                      <span>Area: {crop.area || 'N/A'} acres</span>
                      <span>Planted: {crop.plantedDate ? new Date(crop.plantedDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="crop-actions">
                    <button className="icon-btn edit"><FiEdit2 /></button>
                    <button 
                      className="icon-btn delete"
                      onClick={() => handleDeleteCrop(crop.id, crop.name)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-small">
              <p>No crops added yet. Add your first crop to start tracking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmDetail;
