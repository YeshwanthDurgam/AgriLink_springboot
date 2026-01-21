import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiShoppingBag, FiSearch, FiFilter, FiGrid, FiList, FiShoppingCart, FiHeart } from 'react-icons/fi';
import marketplaceService from '../services/marketplaceService';
import wishlistService from '../services/wishlistService';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import './Marketplace.css';

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});
  
  // Initialize search and filters from URL params
  const initialCategoryId = searchParams.get('categoryId') || '';
  const initialSearch = searchParams.get('search') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filters, setFilters] = useState({
    categoryId: initialCategoryId,
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt,desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchCategories();
    if (user) {
      fetchWishlistIds();
    }
  }, [user]);

  useEffect(() => {
    fetchListings();
  }, [page, filters]);

  const fetchWishlistIds = async () => {
    try {
      const ids = await wishlistService.getWishlistIds();
      setWishlistIds(Array.isArray(ids) ? ids : []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistIds([]);
    }
  };

  const handleToggleWishlist = async (e, listingId) => {
    e.preventDefault(); // Prevent navigating to listing detail
    e.stopPropagation();
    
    if (!user) {
      navigate('/login', { state: { from: '/marketplace' } });
      return;
    }

    setWishlistLoading(prev => ({ ...prev, [listingId]: true }));
    try {
      const isInWishlist = wishlistIds.includes(listingId);
      if (isInWishlist) {
        await wishlistService.removeFromWishlist(listingId);
        setWishlistIds(prev => prev.filter(id => id !== listingId));
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.addToWishlist(listingId);
        setWishlistIds(prev => [...prev, listingId]);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(prev => ({ ...prev, [listingId]: false }));
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await marketplaceService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // No fallback - only use real data from backend
      setCategories([]);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: 12,
        ...filters,
        search: searchQuery || undefined
      };
      
      const response = await marketplaceService.getListings(params);
      
      if (response.content) {
        setListings(response.content);
        setTotalPages(response.totalPages || 1);
      } else if (Array.isArray(response)) {
        setListings(response);
        setTotalPages(1);
      } else {
        setListings([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    // Update URL with search query
    if (searchQuery) {
      searchParams.set('search', searchQuery);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
    // Don't call fetchListings() here - useEffect will handle it when page changes
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
    
    // Update URL when category changes
    if (key === 'categoryId') {
      if (value) {
        searchParams.set('categoryId', value);
      } else {
        searchParams.delete('categoryId');
      }
      setSearchParams(searchParams);
    }
  };

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'createdAt,desc'
    });
    setSearchQuery('');
    // Clear URL params
    setSearchParams({});
    setPage(0);
  };

  return (
    <div className="marketplace-page">
      <div className="marketplace-header">
        <h1><FiShoppingBag /> Marketplace</h1>
        <p className="subtitle">Browse fresh produce from local farmers</p>
      </div>

      <div className="search-filter-bar">
        <form onSubmit={handleSearch} className="search-form">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="filter-controls">
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> Filters
          </button>

          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <FiGrid />
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Min Price</label>
            <input
              type="number"
              placeholder="$0"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Max Price</label>
            <input
              type="number"
              placeholder="$1000"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="createdAt,desc">Newest First</option>
              <option value="createdAt,asc">Oldest First</option>
              <option value="price,asc">Price: Low to High</option>
              <option value="price,desc">Price: High to Low</option>
              <option value="title,asc">Name: A-Z</option>
            </select>
          </div>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading marketplace...</p>
        </div>
      ) : listings.length === 0 ? (
        <EmptyState 
          type={searchQuery ? 'search' : 'products'}
          title={searchQuery ? 'No Results Found' : 'No Products Available'}
          message={searchQuery 
            ? `We couldn't find any products matching "${searchQuery}". Try different keywords or browse our categories.`
            : 'There are no products matching your criteria. Try adjusting your filters.'
          }
          actionText="Clear Filters"
          onAction={clearFilters}
          secondaryActionText="Browse All"
          secondaryActionLink="/marketplace"
        />
      ) : (
        <>
          <div className={`listings-container ${viewMode}`}>
            {listings.map((listing) => (
              <div key={listing.id} className="listing-card">
                <div className="listing-image">
                  {listing.imageUrl ? (
                    <img src={listing.imageUrl} alt={listing.title} />
                  ) : listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0]?.imageUrl || listing.images[0]} alt={listing.title} />
                  ) : (
                    <div className="no-image">
                      <FiShoppingBag />
                    </div>
                  )}
                  {listing.categoryName && (
                    <span className="category-badge">{listing.categoryName}</span>
                  )}
                  {listing.isOrganic && (
                    <span className="organic-badge">Organic</span>
                  )}
                  <button 
                    className={`wishlist-icon-btn ${wishlistIds.includes(listing.id) ? 'active' : ''}`}
                    onClick={(e) => handleToggleWishlist(e, listing.id)}
                    disabled={wishlistLoading[listing.id]}
                    title={wishlistIds.includes(listing.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <FiHeart className={wishlistIds.includes(listing.id) ? 'filled' : ''} />
                  </button>
                </div>

                <div className="listing-content">
                  <h3 className="listing-title">{listing.title}</h3>
                  <p className="listing-description">
                    {listing.description?.substring(0, 100)}
                    {listing.description?.length > 100 ? '...' : ''}
                  </p>
                  
                  <div className="listing-meta">
                    {(listing.sellerName || listing.farmerName) && (
                      <span className="farm-name">By: {listing.sellerName || listing.farmerName}</span>
                    )}
                    <span className="quantity">
                      {listing.quantity} {listing.unit || listing.quantityUnit || 'kg'} available
                    </span>
                  </div>

                  <div className="listing-footer">
                    <span className="price">
                      ₹{listing.price || listing.pricePerUnit}
                      <span className="unit">/{listing.unit || listing.quantityUnit || 'kg'}</span>
                    </span>
                    <Link to={`/marketplace/${listing.id}`} className="view-btn">
                      <FiShoppingCart /> View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Marketplace;
