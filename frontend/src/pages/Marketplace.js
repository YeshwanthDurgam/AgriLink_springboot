import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
// Tree-shakeable individual icon imports
import { FiShoppingBag } from '@react-icons/all-files/fi/FiShoppingBag';
import { FiSearch } from '@react-icons/all-files/fi/FiSearch';
import { FiGrid } from '@react-icons/all-files/fi/FiGrid';
import { FiList } from '@react-icons/all-files/fi/FiList';
import { FiChevronDown } from '@react-icons/all-files/fi/FiChevronDown';
import { FiChevronUp } from '@react-icons/all-files/fi/FiChevronUp';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { FiStar } from '@react-icons/all-files/fi/FiStar';
import { FiChevronLeft } from '@react-icons/all-files/fi/FiChevronLeft';
import { FiChevronRight } from '@react-icons/all-files/fi/FiChevronRight';
import { FiFilter } from '@react-icons/all-files/fi/FiFilter';
import marketplaceService from '../services/marketplaceService';
import wishlistService from '../services/wishlistService';
import guestService from '../services/guestService';
import cartService from '../services/cartService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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
const RECENT_SEARCHES_KEY = 'marketplace_recent_searches';
const MAX_RECENT_SEARCHES = 6;

const isPlatformApprovedListing = (listing) => {
  const status = String(listing?.status || '').toUpperCase();
  return status === 'APPROVED' || status === 'ACTIVE';
};

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { incrementCartCount } = useCart();

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
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Filter sections collapse state
  const [collapsedSections, setCollapsedSections] = useState({
    categories: false,
    price: false,
    rating: false,
    availability: false
  });

  // Pagination - reduced default size for faster initial render
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  // Initialize from URL params
  const initialCategoryId = searchParams.get('categoryId') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialRating = searchParams.get('minRating') || '';
  const initialOrganic = searchParams.get('organicOnly') === 'true';
  const initialInStock = searchParams.get('availableOnly') === 'true';

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(initialSearch);
  const [filters, setFilters] = useState({
    categoryId: initialCategoryId,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    minRating: initialRating,
    organicOnly: initialOrganic,
    availableOnly: initialInStock,
    sortBy: searchParams.get('sortBy') || 'createdAt,desc'
  });

  // Active filters for display - memoized
  const getActiveFilters = useCallback(() => {
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
    if (filters.minRating) {
      active.push({ key: 'minRating', label: `${filters.minRating}★ & above` });
    }
    if (filters.organicOnly) {
      active.push({ key: 'organicOnly', label: 'Organic' });
    }
    if (filters.availableOnly) {
      active.push({ key: 'availableOnly', label: 'In Stock' });
    }
    if (appliedSearchTerm) {
      active.push({ key: 'search', label: `"${appliedSearchTerm}"` });
    }
    return active;
  }, [filters, appliedSearchTerm, categories]);

  const updateSearchParams = useCallback((updater) => {
    const next = new URLSearchParams(searchParams);
    updater(next);
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const removeFilter = (key) => {
    if (key === 'search') {
      setSearchInput('');
      setAppliedSearchTerm('');
      updateSearchParams((next) => {
        next.delete('search');
      });
    } else if (key === 'price') {
      setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
      updateSearchParams((next) => {
        next.delete('minPrice');
        next.delete('maxPrice');
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: key === 'organicOnly' || key === 'availableOnly' ? false : '' }));
      updateSearchParams((next) => {
        next.delete(key);
      });
    }
    setPage(0);
  };

  const clearAllFilters = () => {
    setFilters({
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      organicOnly: false,
      availableOnly: false,
      sortBy: 'createdAt,desc'
    });
    setSearchInput('');
    setAppliedSearchTerm('');
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
        keyword: appliedSearchTerm || undefined,
        categoryId: filters.categoryId || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await marketplaceService.getListings(params);

      if (response.content) {
        const approvedListings = response.content.filter(isPlatformApprovedListing);
        setListings(approvedListings);
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || approvedListings.length);
      } else if (Array.isArray(response)) {
        const approvedListings = response.filter(isPlatformApprovedListing);
        setListings(approvedListings);
        setTotalPages(1);
        setTotalElements(approvedListings.length);
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
  }, [page, pageSize, filters, appliedSearchTerm]);

  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || '';
    setSearchInput(searchFromUrl);
    setAppliedSearchTerm(searchFromUrl);
  }, [searchParams]);

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
    applySearch(searchInput);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);

    updateSearchParams((next) => {
      if (value && value !== '' && value !== false) {
        next.set(key, value.toString());
      } else {
        next.delete(key);
      }
    });
  };

  const handlePriceRangeSelect = (range) => {
    setFilters(prev => ({
      ...prev,
      minPrice: range.min.toString(),
      maxPrice: range.max ? range.max.toString() : ''
    }));
    setPage(0);

    updateSearchParams((next) => {
      if (range.min) next.set('minPrice', range.min.toString());
      if (range.max) next.set('maxPrice', range.max.toString());
      else next.delete('maxPrice');
    });
  };

  // Memoized wishlist handler to prevent unnecessary re-renders
  const handleToggleWishlist = useCallback(async (e, listing) => {
    e.preventDefault();
    e.stopPropagation();

    const listingId = listing.id;

    if (!user) {
      const isInWishlist = wishlistIds.includes(listingId);
      if (isInWishlist) {
        guestService.removeFromGuestWishlist(listingId);
        setWishlistIds(prev => prev.filter(id => id !== listingId));
      } else {
        const wishlistItem = {
          id: listing.id,
          listingId: listing.id,
          title: listing.title,
          price: parseFloat(listing.pricePerUnit) || parseFloat(listing.price) || 0,
          imageUrl: listing.images?.[0]?.imageUrl || listing.imageUrl,
          unit: listing.unit || listing.quantityUnit || 'kg',
          sellerId: listing.sellerId
        };
        guestService.addToGuestWishlist(wishlistItem);
        setWishlistIds(prev => [...prev, listingId]);
      }
      return;
    }

    setWishlistLoading(prev => ({ ...prev, [listingId]: true }));
    try {
      const isInWishlist = wishlistIds.includes(listingId);
      if (isInWishlist) {
        await wishlistService.removeFromWishlist(listingId);
        setWishlistIds(prev => prev.filter(id => id !== listingId));
      } else {
        await wishlistService.addToWishlist(listingId);
        setWishlistIds(prev => [...prev, listingId]);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setWishlistLoading(prev => ({ ...prev, [listingId]: false }));
    }
  }, [user, wishlistIds]);

  // Cart handler - NOT using useCallback to avoid stale closure issues
  const handleAddToCart = async (e, listing) => {
    e.preventDefault();
    e.stopPropagation();

    const listingId = listing.id;
    setCartLoading(prev => ({ ...prev, [listingId]: true }));

    try {
      if (!user) {
        // Guest cart - format listing correctly for guestService
        const cartItem = {
          id: listing.id,
          listingId: listing.id,
          title: listing.title,
          productName: listing.title,
          price: parseFloat(listing.pricePerUnit) || parseFloat(listing.price) || 0,
          imageUrl: listing.images?.[0]?.imageUrl || listing.imageUrl,
          images: listing.images,
          unit: listing.unit || listing.quantityUnit || 'kg',
          quantity: listing.quantity,
          sellerId: listing.sellerId,
          sellerName: listing.sellerName || listing.farmerName
        };
        guestService.addToGuestCart(cartItem);
        // guestService dispatches event which updates cart count
      } else {
        // Authenticated - API call
        await cartService.addToCart({
          listingId: listing.id,
          sellerId: listing.sellerId || listing.farmerId,
          quantity: 1,
          unitPrice: parseFloat(listing.pricePerUnit) || parseFloat(listing.price) || 0,
          listingTitle: listing.title,
          listingImageUrl: listing.images?.[0]?.imageUrl || listing.imageUrl,
          unit: listing.unit || listing.quantityUnit || 'kg',
          availableQuantity: listing.quantity
        });
        // Update cart count after successful add
        incrementCartCount(1);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setCartLoading(prev => ({ ...prev, [listingId]: false }));
    }
  };

  // Memoized quick view handler to prevent re-renders
  const handleQuickView = useCallback((listing) => {
    window.location.href = `/marketplace/${listing.id}`;
  }, []);

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Pagination numbers - memoized
  const getPaginationNumbers = useCallback(() => {
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
  }, [page, totalPages]);

  // Memoize active filters to prevent recalculation
  const activeFilters = useMemo(() => getActiveFilters(), [getActiveFilters]);

  const filteredRecentSearches = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) {
      return recentSearches;
    }
    return recentSearches.filter(item => item.toLowerCase().includes(query));
  }, [recentSearches, searchInput]);

  const suggestionQuery = useMemo(() => searchInput.trim(), [searchInput]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter(item => typeof item === 'string'));
      }
    } catch (error) {
      console.warn('Unable to load recent marketplace searches:', error);
    }
  }, []);

  useEffect(() => {
    if (!showSearchSuggestions || suggestionQuery.length < 2) {
      setProductSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const response = await marketplaceService.getListings({
          keyword: suggestionQuery,
          page: 0,
          size: 6,
          sortBy: 'createdAt,desc'
        });
        const rawSuggestions = response?.content || (Array.isArray(response) ? response : []);
        const approvedSuggestions = rawSuggestions.filter(isPlatformApprovedListing);
        const dedupedSuggestions = [];
        const seenIds = new Set();
        for (const item of approvedSuggestions) {
          if (item?.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            dedupedSuggestions.push(item);
          }
        }
        if (!cancelled) {
          setProductSuggestions(dedupedSuggestions.slice(0, 6));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching product suggestions:', error);
          setProductSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [suggestionQuery, showSearchSuggestions]);

  const saveRecentSearch = useCallback((term) => {
    if (!term) {
      return;
    }
    setRecentSearches(prev => {
      const next = [term, ...prev.filter(item => item.toLowerCase() !== term.toLowerCase())]
        .slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const formatSuggestionPrice = useCallback((listing) => {
    const value = parseFloat(listing?.pricePerUnit) || parseFloat(listing?.price) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const openSuggestedProduct = useCallback((listing) => {
    setShowSearchSuggestions(false);
    if (suggestionQuery) {
      saveRecentSearch(suggestionQuery);
    }
    window.location.href = `/marketplace/${listing.id}`;
  }, [saveRecentSearch, suggestionQuery]);

  const applySearch = useCallback((rawTerm) => {
    const normalizedSearch = rawTerm.trim();
    setSearchInput(normalizedSearch);
    setAppliedSearchTerm(normalizedSearch);
    setPage(0);
    updateSearchParams((next) => {
      if (normalizedSearch) {
        next.set('search', normalizedSearch);
      } else {
        next.delete('search');
      }
    });
    saveRecentSearch(normalizedSearch);
    setShowSearchSuggestions(false);
  }, [saveRecentSearch, updateSearchParams]);

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

        <div className="marketplace-search-wrapper">
          <form onSubmit={handleSearch} className="marketplace-search">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search in Marketplace..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 150)}
            />
            <button type="submit">Search</button>
          </form>

          {showSearchSuggestions && (
            <div className="search-suggestions" role="listbox" aria-label="Recent searches">
              {suggestionQuery.length >= 2 && (
                <>
                  <div className="search-suggestions-header">
                    <span>Suggested Products</span>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applySearch(suggestionQuery)}>
                      Search "{suggestionQuery}"
                    </button>
                  </div>

                  {suggestionsLoading ? (
                    <div className="search-suggestion-loading">Finding products...</div>
                  ) : productSuggestions.length > 0 ? (
                    productSuggestions.map((listing) => (
                      <button
                        key={listing.id}
                        type="button"
                        className="search-suggestion-item product"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => openSuggestedProduct(listing)}
                      >
                        <FiSearch />
                        <span className="suggestion-title">{listing.title}</span>
                        <span className="suggestion-price">{formatSuggestionPrice(listing)}</span>
                      </button>
                    ))
                  ) : (
                    <div className="search-suggestion-empty">No related products found</div>
                  )}
                </>
              )}

              {filteredRecentSearches.length > 0 && (
                <>
                  <div className="search-suggestions-header recent">
                    <span>Recent Searches</span>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={clearRecentSearches}>Clear</button>
                  </div>
                  {filteredRecentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="search-suggestion-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applySearch(term)}
                    >
                      <FiSearch />
                      <span>{term}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
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
                {appliedSearchTerm && <> for "<strong>{appliedSearchTerm}</strong>"</>}
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
              <option value="pricePerUnit,asc">Price: Low to High</option>
              <option value="pricePerUnit,desc">Price: High to Low</option>
              <option value="averageRating,desc">Avg. Customer Review</option>
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
                      updateSearchParams((next) => {
                        if (filters.minPrice) next.set('minPrice', filters.minPrice);
                        else next.delete('minPrice');
                        if (filters.maxPrice) next.set('maxPrice', filters.maxPrice);
                        else next.delete('maxPrice');
                      });
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
                      checked={filters.minRating === rating.toString()}
                      onChange={() => handleFilterChange('minRating', rating.toString())}
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
                    checked={filters.organicOnly}
                    onChange={(e) => handleFilterChange('organicOnly', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span>🌱 Organic Only</span>
                </label>
                <label className="filter-option checkbox-option">
                  <input
                    type="checkbox"
                    checked={filters.availableOnly}
                    onChange={(e) => handleFilterChange('availableOnly', e.target.checked)}
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
                {[...Array(pageSize || 12)].map((_, i) => (
                  <div key={i} className="skeleton-card skeleton-shimmer">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-line wide"></div>
                      <div className="skeleton-line medium"></div>
                      <div className="skeleton-line short"></div>
                      <div className="skeleton-price-line"></div>
                      <div className="skeleton-button"></div>
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
                {appliedSearchTerm
                  ? `We couldn't find any products matching "${appliedSearchTerm}"`
                  : 'No products match your current filters'}
              </p>
              {(appliedSearchTerm || activeFilters.length > 0) && (
                <button className="clear-filters-btn" onClick={clearAllFilters}>
                  Clear All Filters
                </button>
              )}
              <p style={{marginTop: '20px', fontSize: '14px', color: '#666'}}>
                Try adjusting your search or filters to find what you're looking for.
              </p>
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
                    onQuickView={handleQuickView}
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
