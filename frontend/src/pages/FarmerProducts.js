import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import marketplaceService from '../services/marketplaceService';
import './FarmerProducts.css';

const FarmerProducts = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, draft, sold_out

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [isAuthenticated, navigate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.getMyListings();
      setProducts(Array.isArray(data) ? data : data.content || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load your products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, productTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${productTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(productId);
      await marketplaceService.deleteListing(productId);
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const handlePublish = async (productId) => {
    try {
      await marketplaceService.publishListing(productId);
      // Update local state
      setProducts(products.map(p => 
        p.id === productId ? { ...p, status: 'ACTIVE' } : p
      ));
      toast.success('Product published successfully');
    } catch (error) {
      console.error('Error publishing product:', error);
      toast.error('Failed to publish product');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { className: 'status-active', label: 'Active' },
      DRAFT: { className: 'status-draft', label: 'Draft' },
      SOLD_OUT: { className: 'status-sold-out', label: 'Sold Out' },
      INACTIVE: { className: 'status-inactive', label: 'Inactive' }
    };
    const config = statusConfig[status] || { className: 'status-draft', label: status };
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    return product.status?.toLowerCase() === filter.toLowerCase();
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'ACTIVE').length,
    draft: products.filter(p => p.status === 'DRAFT').length,
    soldOut: products.filter(p => p.status === 'SOLD_OUT').length
  };

  if (loading) {
    return (
      <div className="farmer-products">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="farmer-products">
      <div className="products-header">
        <div className="header-content">
          <h1>My Products</h1>
          <p>Manage your product listings</p>
        </div>
        <Link to="/marketplace/create" className="add-product-btn">
          <span className="btn-icon">+</span>
          Add New Product
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card active">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">Active Listings</div>
        </div>
        <div className="stat-card draft">
          <div className="stat-number">{stats.draft}</div>
          <div className="stat-label">Drafts</div>
        </div>
        <div className="stat-card sold-out">
          <div className="stat-number">{stats.soldOut}</div>
          <div className="stat-label">Sold Out</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({stats.total})
        </button>
        <button 
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({stats.active})
        </button>
        <button 
          className={`filter-tab ${filter === 'draft' ? 'active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          Drafts ({stats.draft})
        </button>
        <button 
          className={`filter-tab ${filter === 'sold_out' ? 'active' : ''}`}
          onClick={() => setFilter('sold_out')}
        >
          Sold Out ({stats.soldOut})
        </button>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>
            {filter === 'all' 
              ? 'No products yet' 
              : `No ${filter.replace('_', ' ')} products`}
          </h3>
          <p>
            {filter === 'all' 
              ? 'Start selling by adding your first product!' 
              : 'Products will appear here when you have some.'}
          </p>
          {filter === 'all' && (
            <Link to="/marketplace/create" className="add-first-product-btn">
              Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td className="product-cell">
                    <div className="product-info">
                      <img 
                        src={product.imageUrl || product.images?.[0] || 'https://via.placeholder.com/60x60?text=No+Image'} 
                        alt={product.title}
                        className="product-thumb"
                      />
                      <div className="product-details">
                        <span className="product-title">{product.title}</span>
                        <span className="product-date">
                          Added {new Date(product.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      {product.categoryName || product.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="price-cell">
                    ₹{product.price?.toLocaleString() || '0'}/{product.unit || 'kg'}
                  </td>
                  <td>
                    <span className={`stock-badge ${product.quantity <= 10 ? 'low-stock' : ''}`}>
                      {product.quantity || 0} {product.unit || 'kg'}
                    </span>
                  </td>
                  <td>{getStatusBadge(product.status)}</td>
                  <td>{product.views || 0}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <Link 
                        to={`/marketplace/${product.id}`}
                        className="action-btn view"
                        title="View"
                      >
                        👁️
                      </Link>
                      <Link 
                        to={`/marketplace/edit/${product.id}`}
                        className="action-btn edit"
                        title="Edit"
                      >
                        ✏️
                      </Link>
                      {product.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(product.id)}
                          className="action-btn publish"
                          title="Publish"
                        >
                          🚀
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(product.id, product.title)}
                        className="action-btn delete"
                        disabled={deleting === product.id}
                        title="Delete"
                      >
                        {deleting === product.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FarmerProducts;
