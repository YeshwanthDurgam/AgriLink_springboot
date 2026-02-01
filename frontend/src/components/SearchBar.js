import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Tree-shakeable individual icon imports
import { FiSearch } from '@react-icons/all-files/fi/FiSearch';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import { FiTrendingUp } from '@react-icons/all-files/fi/FiTrendingUp';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { FiArrowRight } from '@react-icons/all-files/fi/FiArrowRight';
import { marketplaceApi } from '../services/api';
import './SearchBar.css';

const RECENT_SEARCHES_KEY = 'agrilink_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const SearchBar = ({ 
  placeholder = "Search for fresh produce, grains, dairy...",
  onSearch,
  compact = false,
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches] = useState([
    'Organic Tomatoes',
    'Fresh Spinach',
    'Basmati Rice',
    'Farm Eggs',
    'Local Honey'
  ]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await marketplaceApi.get(`/listings/search?keyword=${encodeURIComponent(searchQuery)}&size=5`);
      const listings = response.data?.data?.content || [];
      setSuggestions(listings.map(l => ({
        id: l.id,
        title: l.title,
        price: l.price,
        category: l.categoryName,
        imageUrl: l.imageUrl
      })));
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  const saveRecentSearch = (searchQuery) => {
    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s.toLowerCase() !== searchQuery.toLowerCase())
    ].slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/marketplace?search=${encodeURIComponent(query.trim())}`);
      }
      setIsFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    navigate(`/marketplace/${suggestion.id}`);
    setIsFocused(false);
    setQuery('');
  };

  const handleRecentClick = (search) => {
    setQuery(search);
    saveRecentSearch(search);
    if (onSearch) {
      onSearch(search);
    } else {
      navigate(`/marketplace?search=${encodeURIComponent(search)}`);
    }
    setIsFocused(false);
  };

  const handleTrendingClick = (search) => {
    setQuery(search);
    saveRecentSearch(search);
    if (onSearch) {
      onSearch(search);
    } else {
      navigate(`/marketplace?search=${encodeURIComponent(search)}`);
    }
    setIsFocused(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const removeRecentSearch = (e, search) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== search);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const showDropdown = isFocused && (query.length > 0 || recentSearches.length > 0 || trendingSearches.length > 0);

  return (
    <div 
      ref={containerRef} 
      className={`search-bar-container ${compact ? 'compact' : ''} ${isFocused ? 'focused' : ''}`}
    >
      <form onSubmit={handleSubmit} className="search-bar-form">
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="search-input"
          />
          {query && (
            <button 
              type="button" 
              className="clear-btn"
              onClick={() => setQuery('')}
            >
              <FiX />
            </button>
          )}
          <button type="submit" className="search-submit">
            <FiArrowRight />
          </button>
        </div>
      </form>

      {showDropdown && (
        <div className="search-dropdown">
          {/* Suggestions from API */}
          {query.length >= 2 && (
            <div className="dropdown-section">
              <div className="section-header">
                <span>Products</span>
                {loading && <span className="loading-indicator">Searching...</span>}
              </div>
              {suggestions.length > 0 ? (
                <div className="suggestions-list">
                  {suggestions.map(suggestion => (
                    <div 
                      key={suggestion.id}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.imageUrl ? (
                        <img src={suggestion.imageUrl} alt="" className="suggestion-image" />
                      ) : (
                        <div className="suggestion-image placeholder">🌾</div>
                      )}
                      <div className="suggestion-info">
                        <span className="suggestion-title">{suggestion.title}</span>
                        <span className="suggestion-meta">
                          {suggestion.category && <span>{suggestion.category}</span>}
                          {suggestion.price && <span>₹{suggestion.price}</span>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !loading && query.length >= 2 ? (
                <div className="no-suggestions">
                  No products found for "{query}"
                </div>
              ) : null}
            </div>
          )}

          {/* Recent Searches */}
          {query.length < 2 && recentSearches.length > 0 && (
            <div className="dropdown-section">
              <div className="section-header">
                <span><FiClock /> Recent Searches</span>
                <button className="clear-link" onClick={clearRecentSearches}>Clear</button>
              </div>
              <div className="recent-list">
                {recentSearches.map((search, index) => (
                  <div 
                    key={index}
                    className="recent-item"
                    onClick={() => handleRecentClick(search)}
                  >
                    <FiClock />
                    <span>{search}</span>
                    <button 
                      className="remove-btn"
                      onClick={(e) => removeRecentSearch(e, search)}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          {query.length < 2 && (
            <div className="dropdown-section">
              <div className="section-header">
                <span><FiTrendingUp /> Trending</span>
              </div>
              <div className="trending-list">
                {trendingSearches.map((search, index) => (
                  <button 
                    key={index}
                    className="trending-chip"
                    onClick={() => handleTrendingClick(search)}
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
