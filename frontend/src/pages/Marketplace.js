import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiShoppingBag, FiSearch, FiGrid, FiList, FiShoppingCart, FiHeart,
  FiChevronDown, FiChevronUp, FiX, FiStar, FiTruck, FiCheck,
  FiChevronLeft, FiChevronRight, FiFilter
} from 'react-icons/fi';
import marketplaceService from '../services/marketplaceService';
import wishlistService from '../services/wishlistService';
import guestService from '../services/guestService';
import cartService from '../services/cartService';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import './Marketplace.css';

// Category icons mapping
const CATEGORY_ICONS = {
  'Vegetables': '🥬',
  'Fruits': '🍎',
  'Grains': '🌾',
  'Dairy': '🥛',
  'Meat': '🥩',
  'Poultry': '🍗',
  'Seafood': '🐟',
  'Herbs': '🌿',
  'Spices': '🌶️',
  'Organic': '🌱',
  'Seeds': '🌻',
  'Nuts': '🥜',
  'Honey': '🍯',
  'Eggs': '🥚',
  'default': '📦'
};

// Price ranges for filter
const PRICE_RANGES = [
  { label: 'Under ₹100', min: 0, max: 100 },
  { label: '₹100 - ₹250', min: 100, max: 250 },
  { label: '₹250 - ₹500', min: 250, max: 500 },
  { label: '₹500 - ₹1000', min: 500, max: 1000 },
  { label: 'Over ₹1000', min: 1000, max: null }
];

// Rating options
const RATING_OPTIONS = [4, 3, 2, 1];

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Core state
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});
  const [cartLoading, setCartLoading] = useState({});

  // View state
  const [viewMode, setViewMode] = useState('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter sections collapse state
  const [collapsedSections, setCollapsedSections] = useState({
    categories: false,
    price: false,
    rating: false,
    availability: false
  });

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(24);

  // Initialize from URL params
  const initialCategoryId = searchParams.get('categoryId') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialRating = searchParams.get('rating') || '';
  const initialOrganic = searchParams.get('organic') === 'true';
  const initialInStock = searchParams.get('inStock') === 'true';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filters, setFilters] = useState({
    categoryId: initialCategoryId,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    rating: initialRating,
    organic: initialOrganic,
    inStock: initialInStock,
    sortBy: searchParams.get('sortBy') || 'createdAt,desc'
  });

  // Active filters for display
  const getActiveFilters = () => {
    const active = [];
    if (filters.categoryId) {
      const cat = categories.find(c => c.id === filters.categoryId || c.id === parseInt(filters.categoryId));
      if (cat) active.push({ key: 'categoryId', label: cat.name, value: filters.categoryId });
    }
    if (filters.minPrice || filters.maxPrice) {
      const priceLabel = filters.minPrice && filters.maxPrice
        ? `₹${filters.minPrice} - ₹${filters.maxPrice}`
        : filters.minPrice ? `Over ₹${filters.minPrice}` : `Under ₹${filters.maxPrice}`;
      active.push({ key: 'price', label: priceLabel });
    }
    if (filters.rating) {
      active.push({ key: 'rating', label: `${filters.rating}★ & above` });
    }
    if (filters.organic) {
      active.push({ key: 'organic', label: 'Organic' });
    }
    if (filters.inStock) {
      active.push({ key: 'inStock', label: 'In Stock' });
    }
    if (searchQuery) {
      active.push({ key: 'search', label: `"${searchQuery}"` });
    }
    return active;
  };

  const removeFilter = (key) => {
    if (key === 'search') {
      setSearchQuery('');
      searchParams.delete('search');
    } else if (key === 'price') {
      setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
      searchParams.delete('minPrice');
      searchParams.delete('maxPrice');
    } else {
      setFilters(prev => ({ ...prev, [key]: key === 'organic' || key === 'inStock' ? false : '' }));
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
    setPage(0);
  };

  const clearAllFilters = () => {
    setFilters({
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      organic: false,
      inStock: false,
      sortBy: 'createdAt,desc'
    });
    setSearchQuery('');
    setSearchParams({});
    setPage(0);
  };

  // Fetch functions
  const fetchCategories = useCallback(async () => {
    try {
      const data = await marketplaceService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  const fetchWishlistIds = useCallback(async () => {
    try {
      if (user) {
        const ids = await wishlistService.getWishlistIds();
        setWishlistIds(Array.isArray(ids) ? ids : []);
      } else {
        const guestWishlist = guestService.getGuestWishlist();
        setWishlistIds(guestWishlist.map(item => item.id || item.listingId));
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistIds([]);
    }
  }, [user]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
        ...filters,
        search: searchQuery || undefined,
        categoryId: filters.categoryId || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await marketplaceService.getListings(params);

      if (response.content) {
        setListings(response.content);
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || response.content.length);
      } else if (Array.isArray(response)) {
        setListings(response);
        setTotalPages(1);
        setTotalElements(response.length);
      } else {
        setListings([]);
        setTotalPages(1);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, searchQuery]);

  useEffect(() => {
    fetchCategories();
    fetchWishlistIds();
  }, [fetchCategories, fetchWishlistIds]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handlers
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    if (searchQuery) {
      searchParams.set('search', searchQuery);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);

    if (value && value !== '' && value !== false) {
      searchParams.set(key, value.toString());
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const handlePriceRangeSelect = (range) => {
    setFilters(prev => ({
      ...prev,
      minPrice: range.min.toString(),
      maxPrice: range.max ? range.max.toString() : ''
    }));
    setPage(0);

    if (range.min) searchParams.set('minPrice', range.min.toString());
    if (range.max) searchParams.set('maxPrice', range.max.toString());
    else searchParams.delete('maxPrice');
    setSearchParams(searchParams);
  };

  const handleToggleWishlist = async (e, listing) => {
    e.preventDefault();
    e.stopPropagation();

    const listingId = listing.id;

    if (!user) {
      const isInWishlist = wishlistIds.includes(listingId);
      if (isInWishlist) {
        guestService.removeFromGuestWishlist(listingId);
        setWishlistIds(prev => prev.filter(id => id !== listingId));
        toast.success('Removed from wishlist');
      } else {
        const wishlistItem = {
          id: listing.id,
          listingId: listing.id,
          title: listing.title,
          price: listing.price || listing.pricePerUnit,
          imageUrl: listing.images?.[0]?.imageUrl || listing.imageUrl,
          unit: listing.unit || listing.quantityUnit || 'kg',
          sellerId: listing.sellerId
        };
        guestService.addToGuestWishlist(wishlistItem);
        setWishlistIds(prev => [...prev, listingId]);
        toast.success('Added to wishlist');
      }
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

  const handleAddToCart = async (e, listing) => {
    e.preventDefault();
    e.stopPropagation();

    const listingId = listing.id;
    setCartLoading(prev => ({ ...prev, [listingId]: true }));

    try {
      if (!user) {
        const cartItem = {
          id: listing.id,
          listingId: listing.id,
          title: listing.title,
          price: listing.price || listing.pricePerUnit,
          imageUrl: listing.images?.[0]?.imageUrl || listing.imageUrl,
          unit: listing.unit || listing.quantityUnit || 'kg',
          quantity: 1,
          sellerId: listing.sellerId,
          sellerName: listing.sellerName || listing.farmerName
        };
        guestService.addToGuestCart(cartItem);
        toast.success('Added to cart!');
      } else {
        await cartService.addToCart({
          listingId: listing.id,
          sellerId: listing.sellerId || listing.farmerId,
          quantity: 1,
          unitPrice: listing.price || listing.pricePerUnit,
          listingTitle: listing.title,
          listingImageUrl: listing.images?.[0]?.imageUrl || listing.imageUrl,
          unit: listing.unit || listing.quantityUnit || 'kg',
          availableQuantity: listing.quantity
        });
        toast.success('Added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setCartLoading(prev => ({ ...prev, [listingId]: false }));
    }
  };

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Generate rating stars
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FiStar
          key={i}
          className={i < fullStars ? 'star filled' : 'star'}
        />
      );
    }
    return stars;
  };

  // Pagination numbers
  const getPaginationNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible);

    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="marketplace-page">
      {/* Top Bar with Search and Sort */}
      <div className="marketplace-top-bar">
        <div className="marketplace-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Marketplace</span>
          {filters.categoryId && categories.find(c => c.id === parseInt(filters.categoryId)) && (
            <>
              <span>/</span>
              <span>{categories.find(c => c.id === parseInt(filters.categoryId))?.name}</span>
            </>
          )}
        </div>

        <form onSubmit={handleSearch} className="marketplace-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search in Marketplace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {/* Results Bar */}
      <div className="marketplace-results-bar">
        <div className="results-info">
          <button
            className="mobile-filter-btn"
            onClick={() => setShowMobileFilters(true)}
          >
            <FiFilter /> Filters
          </button>
          <span className="results-count">
            {loading ? 'Loading...' : (
              <>
                <strong>{totalElements.toLocaleString()}</strong> results
                {searchQuery && <> for "<strong>{searchQuery}</strong>"</>}
              </>
            )}
          </span>
        </div>

        <div className="results-actions">
          <div className="sort-dropdown">
            <label>Sort by:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="createdAt,desc">Newest Arrivals</option>
              <option value="price,asc">Price: Low to High</option>
              <option value="price,desc">Price: High to Low</option>
              <option value="rating,desc">Avg. Customer Review</option>
              <option value="title,asc">Name: A to Z</option>
              <option value="quantity,desc">Best Availability</option>
            </select>
          </div>

          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <FiGrid />
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="active-filters">
          <span className="active-filters-label">Active Filters:</span>
          {activeFilters.map((filter, idx) => (
            <span key={idx} className="filter-tag">
              {filter.label}
              <button onClick={() => removeFilter(filter.key)}>
                <FiX />
              </button>
            </span>
          ))}
          <button className="clear-all-btn" onClick={clearAllFilters}>
            Clear All
          </button>
        </div>
      )}

      <div className="marketplace-content">
        {/* Sidebar Filters */}
        <aside className={`marketplace-sidebar ${showMobileFilters ? 'show' : ''}`}>
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button
              className="close-filters-btn"
              onClick={() => setShowMobileFilters(false)}
            >
              <FiX />
            </button>
          </div>

          {/* Categories Filter */}
          <div className="filter-section">
            <button
              className="filter-section-header"
              onClick={() => toggleSection('categories')}
            >
              <span>Category</span>
              {collapsedSections.categories ? <FiChevronDown /> : <FiChevronUp />}
            </button>
            {!collapsedSections.categories && (
              <div className="filter-section-content">
                <label className={`filter-option ${!filters.categoryId ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="category"
                    checked={!filters.categoryId}
                    onChange={() => handleFilterChange('categoryId', '')}
                  />
                  <span className="category-icon">📦</span>
                  <span>All Categories</span>
                </label>
                {categories.map(cat => (
                  <label
                    key={cat.id}
                    className={`filter-option ${filters.categoryId === cat.id.toString() ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={filters.categoryId === cat.id.toString()}
                      onChange={() => handleFilterChange('categoryId', cat.id.toString())}
                    />
                    <span className="category-icon">
                      {CATEGORY_ICONS[cat.name] || CATEGORY_ICONS.default}
                    </span>
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price Filter */}
          <div className="filter-section">
            <button
              className="filter-section-header"
              onClick={() => toggleSection('price')}
            >
              <span>Price</span>
              {collapsedSections.price ? <FiChevronDown /> : <FiChevronUp />}
            </button>
            {!collapsedSections.price && (
              <div className="filter-section-content">
                {PRICE_RANGES.map((range, idx) => (
                  <label key={idx} className="filter-option">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={
                        filters.minPrice === range.min.toString() &&
                        (range.max ? filters.maxPrice === range.max.toString() : !filters.maxPrice)
                      }
                      onChange={() => handlePriceRangeSelect(range)}
                    />
                    <span>{range.label}</span>
                  </label>
                ))}
                <div className="price-input-group">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                  <button
                    className="price-go-btn"
                    onClick={() => {
                      if (filters.minPrice) searchParams.set('minPrice', filters.minPrice);
                      if (filters.maxPrice) searchParams.set('maxPrice', filters.maxPrice);
                      setSearchParams(searchParams);
                    }}
                  >
                    Go
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Rating Filter */}
          <div className="filter-section">
            <button
              className="filter-section-header"
              onClick={() => toggleSection('rating')}
            >
              <span>Customer Rating</span>
              {collapsedSections.rating ? <FiChevronDown /> : <FiChevronUp />}
            </button>
            {!collapsedSections.rating && (
              <div className="filter-section-content">
                {RATING_OPTIONS.map(rating => (
                  <label key={rating} className="filter-option rating-option">
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.rating === rating.toString()}
                      onChange={() => handleFilterChange('rating', rating.toString())}
                    />
                    <span className="stars">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className={i < rating ? 'star filled' : 'star'} />
                      ))}
                    </span>
                    <span>& Up</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Availability Filter */}
          <div className="filter-section">
            <button
              className="filter-section-header"
              onClick={() => toggleSection('availability')}
            >
              <span>Availability</span>
              {collapsedSections.availability ? <FiChevronDown /> : <FiChevronUp />}
            </button>
            {!collapsedSections.availability && (
              <div className="filter-section-content">
                <label className="filter-option checkbox-option">
                  <input
                    type="checkbox"
                    checked={filters.organic}
                    onChange={(e) => handleFilterChange('organic', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span>🌱 Organic Only</span>
                </label>
                <label className="filter-option checkbox-option">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span>In Stock</span>
                </label>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Filter Overlay */}
        {showMobileFilters && (
          <div
            className="filter-overlay"
            onClick={() => setShowMobileFilters(false)}
          />
        )}

        {/* Main Content */}
        <main className="marketplace-main">
          {loading ? (
            <div className="marketplace-loading">
              <div className="loading-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-line wide"></div>
                      <div className="skeleton-line medium"></div>
                      <div className="skeleton-line short"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="marketplace-empty">
              <div className="empty-icon">
                <FiShoppingBag />
              </div>
              <h2>No products found</h2>
              <p>
                {searchQuery
                  ? `We couldn't find any products matching "${searchQuery}"`
                  : 'No products match your current filters'}
              </p>
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className={`products-grid ${viewMode}`}>
                {listings.map((listing) => (
                  <ProductCard
                    key={listing.id}
                    listing={listing}
                    viewMode={viewMode}
                    isWishlisted={wishlistIds.includes(listing.id)}
                    wishlistLoading={wishlistLoading[listing.id]}
                    cartLoading={cartLoading[listing.id]}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={handleAddToCart}
                    onQuickView={(listing) => {
                      // Navigate to product detail for now, can be enhanced with modal later
                      window.location.href = `/marketplace/${listing.id}`;
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="marketplace-pagination">
                  <button
                    className="pagination-btn prev"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <FiChevronLeft /> Previous
                  </button>

                  <div className="pagination-numbers">
                    {page > 2 && (
                      <>
                        <button onClick={() => setPage(0)}>1</button>
                        {page > 3 && <span className="pagination-ellipsis">...</span>}
                      </>
                    )}

                    {getPaginationNumbers().map(pageNum => (
                      <button
                        key={pageNum}
                        className={page === pageNum ? 'active' : ''}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    ))}

                    {page < totalPages - 3 && (
                      <>
                        {page < totalPages - 4 && <span className="pagination-ellipsis">...</span>}
                        <button onClick={() => setPage(totalPages - 1)}>{totalPages}</button>
                      </>
                    )}
                  </div>

                  <button
                    className="pagination-btn next"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              )}

              {/* Results per page */}
              <div className="results-per-page">
                <span>Show:</span>
                {[12, 24, 48].map(size => (
                  <button
                    key={size}
                    className={pageSize === size ? 'active' : ''}
                    onClick={() => {
                      setPageSize(size);
                      setPage(0);
                    }}
                  >
                    {size}
                  </button>
                ))}
                <span>per page</span>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Marketplace;
