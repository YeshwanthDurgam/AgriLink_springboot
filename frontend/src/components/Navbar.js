import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
// Tree-shakeable individual icon imports
import { FiMenu } from '@react-icons/all-files/fi/FiMenu';
import { FiX } from '@react-icons/all-files/fi/FiX';
import { FiUser } from '@react-icons/all-files/fi/FiUser';
import { FiLogOut } from '@react-icons/all-files/fi/FiLogOut';
import { FiSearch } from '@react-icons/all-files/fi/FiSearch';
import { FiShoppingCart } from '@react-icons/all-files/fi/FiShoppingCart';
import { FiHeart } from '@react-icons/all-files/fi/FiHeart';
import { FiMessageSquare } from '@react-icons/all-files/fi/FiMessageSquare';
import { FiBell } from '@react-icons/all-files/fi/FiBell';
import { FiChevronDown } from '@react-icons/all-files/fi/FiChevronDown';
import { FiShoppingBag } from '@react-icons/all-files/fi/FiShoppingBag';
import { FiUsers } from '@react-icons/all-files/fi/FiUsers';
import { FiPackage } from '@react-icons/all-files/fi/FiPackage';
import { FiBarChart2 } from '@react-icons/all-files/fi/FiBarChart2';
import { FiMap } from '@react-icons/all-files/fi/FiMap';
import { FiMapPin } from '@react-icons/all-files/fi/FiMapPin';
import { FiHome } from '@react-icons/all-files/fi/FiHome';
import { FiPercent } from '@react-icons/all-files/fi/FiPercent';
import { FiShield } from '@react-icons/all-files/fi/FiShield';
import { FiHelpCircle } from '@react-icons/all-files/fi/FiHelpCircle';
import { FiDollarSign } from '@react-icons/all-files/fi/FiDollarSign';
import { FiChevronRight } from '@react-icons/all-files/fi/FiChevronRight';
import { FiTruck } from '@react-icons/all-files/fi/FiTruck';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import { FiAlertCircle } from '@react-icons/all-files/fi/FiAlertCircle';
import { FiSettings } from '@react-icons/all-files/fi/FiSettings';
import wishlistService from '../services/wishlistService';
import guestService from '../services/guestService';
import messagingService from '../services/messagingService';
import notificationService from '../services/notificationService';
import { marketplaceApi, userApi } from '../services/api';
import NotificationCenter from './NotificationCenter';
import './Navbar.css';

// Category Icons mapping
const CATEGORY_ICONS = {
  'Vegetables': '🥬',
  'Fruits': '🍎',
  'Grains': '🌾',
  'Dairy': '🥛',
  'Spices': '🌶️',
  'Pulses': '🫘',
  'Organic': '🌿',
  'Seeds': '🌱',
  'Nuts': '🥜',
  'Herbs': '🌿'
};

const SEARCH_SCOPES = [
  { key: 'all', label: 'All' },
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'farmers', label: 'Farmers' }
];

const POPULAR_SEARCHES = ['Fresh Vegetables', 'Organic Fruits', 'Farm Fresh Milk', 'Rice', 'Tomatoes', 'Potatoes'];
const SEARCH_BEHAVIOR_KEY = 'navbarSearchSuggestionMetrics';
const MAX_SEARCH_BEHAVIOR_ENTRIES = 250;
const SEARCH_TELEMETRY_KEY = 'navbarSearchTelemetryEvents';
const MAX_SEARCH_TELEMETRY_EVENTS = 500;

const normalizeSearchText = (value) => (value || '')
  .toString()
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

const getBoundedLevenshteinDistance = (a, b, maxDistance = 2) => {
  if (a === b) {
    return 0;
  }
  if (!a || !b) {
    return Math.max(a?.length || 0, b?.length || 0);
  }
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > maxDistance) {
    return maxDistance + 1;
  }

  let prev = new Array(lenB + 1);
  let curr = new Array(lenB + 1);
  for (let j = 0; j <= lenB; j += 1) {
    prev[j] = j;
  }

  for (let i = 1; i <= lenA; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= lenB; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
      rowMin = Math.min(rowMin, curr[j]);
    }

    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    [prev, curr] = [curr, prev];
  }

  return prev[lenB];
};

const getSuggestionScore = (sourceText, queryText) => {
  const text = normalizeSearchText(sourceText);
  const query = normalizeSearchText(queryText);
  if (!text || !query) {
    return 0;
  }

  const queryTokens = query.split(' ').filter(Boolean);
  const textTokens = text.split(' ').filter(Boolean);
  let score = 0;

  if (text === query) {
    score += 500;
  }
  if (text.startsWith(query)) {
    score += 280;
  }
  if (text.includes(query)) {
    score += 120;
  }

  queryTokens.forEach((token) => {
    if (textTokens.some(textToken => textToken === token)) {
      score += 80;
    }
    if (textTokens.some(textToken => textToken.startsWith(token))) {
      score += 45;
    }
    if (text.includes(token)) {
      score += 20;
    }

    // Typo tolerance: reward close token matches (e.g., "tomtoes" -> "tomatoes").
    if (token.length >= 4) {
      const bestDistance = textTokens.reduce((best, textToken) => {
        const distance = getBoundedLevenshteinDistance(token, textToken, 2);
        return Math.min(best, distance);
      }, 3);

      if (bestDistance === 1) {
        score += 35;
      } else if (bestDistance === 2) {
        score += 15;
      }
    }
  });

  // Slightly prefer concise matches when relevance is similar.
  score += Math.max(0, 40 - text.length);
  return score;
};

const loadSearchBehaviorMetrics = () => {
  try {
    const raw = localStorage.getItem(SEARCH_BEHAVIOR_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
};

const saveSearchBehaviorMetrics = (metrics) => {
  try {
    localStorage.setItem(SEARCH_BEHAVIOR_KEY, JSON.stringify(metrics));
  } catch (error) {
    // Ignore storage write errors (e.g., private mode quota limits).
  }
};

const getSearchBehaviorKey = (scopeKey, label) => `${scopeKey}::${normalizeSearchText(label)}`;

const getBehaviorBoost = (metrics, scopeKey, label) => {
  const behaviorKey = getSearchBehaviorKey(scopeKey, label);
  const entry = metrics?.[behaviorKey];
  if (!entry) {
    return 0;
  }

  const now = Date.now();
  const ageMs = Math.max(0, now - (entry.lastSelectedAt || 0));
  const ageHours = ageMs / (1000 * 60 * 60);
  const countBoost = Math.min((entry.count || 0) * 18, 180);

  let recencyBoost = 8;
  if (ageHours <= 1) recencyBoost = 160;
  else if (ageHours <= 24) recencyBoost = 100;
  else if (ageHours <= 72) recencyBoost = 55;
  else if (ageHours <= 168) recencyBoost = 25;

  return countBoost + recencyBoost;
};

const trimBehaviorMetrics = (metrics) => {
  const entries = Object.entries(metrics || {});
  if (entries.length <= MAX_SEARCH_BEHAVIOR_ENTRIES) {
    return metrics;
  }

  const sorted = entries
    .sort((a, b) => (b[1]?.lastSelectedAt || 0) - (a[1]?.lastSelectedAt || 0))
    .slice(0, MAX_SEARCH_BEHAVIOR_ENTRIES);

  return Object.fromEntries(sorted);
};

const rankSuggestions = (items, queryText, textSelector, maxItems, metrics = {}, scopeKey = 'all') => {
  return items
    .map((item, index) => ({
      item,
      index,
      score: getSuggestionScore(textSelector(item), queryText)
        + getBehaviorBoost(metrics, scopeKey, textSelector(item))
    }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.index - b.index;
    })
    .slice(0, maxItems)
    .map(entry => entry.item);
};

const trackSearchTelemetryEvent = (eventName, payload = {}) => {
  try {
    const raw = localStorage.getItem(SEARCH_TELEMETRY_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const safeCurrent = Array.isArray(current) ? current : [];
    const next = [
      ...safeCurrent,
      {
        eventName,
        timestamp: Date.now(),
        ...payload
      }
    ];
    const trimmed = next.length > MAX_SEARCH_TELEMETRY_EVENTS
      ? next.slice(next.length - MAX_SEARCH_TELEMETRY_EVENTS)
      : next;
    localStorage.setItem(SEARCH_TELEMETRY_KEY, JSON.stringify(trimmed));

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('navbarSearchTelemetry', {
        detail: {
          eventName,
          timestamp: Date.now(),
          ...payload
        }
      }));
    }
  } catch (error) {
    // Ignore telemetry storage errors to avoid impacting UX flows.
  }
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  // UI State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchScopeOpen, setSearchScopeOpen] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchBehaviorMetrics, setSearchBehaviorMetrics] = useState(() => loadSearchBehaviorMetrics());
  const [liveProductSuggestions, setLiveProductSuggestions] = useState([]);
  const [liveCategorySuggestions, setLiveCategorySuggestions] = useState([]);
  const [liveFarmerSuggestions, setLiveFarmerSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Data State
  const [categories, setCategories] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Profile Completion State
  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 100,
    isComplete: true,
    missingFields: []
  });
  
  // Profile Photo State
  const [profilePhoto, setProfilePhoto] = useState(null);
  
  // Location State
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    return localStorage.getItem('deliveryLocation') || 'Select Location';
  });
  const [pincode, setPincode] = useState(() => {
    return localStorage.getItem('deliveryPincode') || '';
  });
  
  // Dropdown position state for fixed positioning
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 20 });

  // Refs
  const userMenuRef = useRef(null);
  const accountBtnRef = useRef(null);
  const categoriesRef = useRef(null);
  const locationRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const navbarRef = useRef(null);
  const lastImpressionSignatureRef = useRef('');

  const trackSearchTelemetry = useCallback((eventName, payload = {}) => {
    trackSearchTelemetryEvent(eventName, payload);
  }, []);

  // Keep global navbar height in sync so sticky offsets remain correct on all pages.
  useEffect(() => {
    const setNavbarHeight = () => {
      const height = navbarRef.current?.offsetHeight || 80;
      document.documentElement.style.setProperty('--app-nav-height', `${height}px`);
    };

    setNavbarHeight();
    window.addEventListener('resize', setNavbarHeight);

    let observer;
    if (navbarRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => setNavbarHeight());
      observer.observe(navbarRef.current);
    }

    return () => {
      window.removeEventListener('resize', setNavbarHeight);
      if (observer) observer.disconnect();
    };
  }, []);


  // Get user role
  const getUserRole = () => {
    if (!user?.roles) return null;
    if (user.roles.includes('ADMIN')) return 'ADMIN';
    if (user.roles.includes('MANAGER')) return 'MANAGER';
    if (user.roles.includes('FARMER')) return 'FARMER';
    return 'CUSTOMER';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const userRole = getUserRole();
  const displayName = getUserDisplayName();

  // ============= DATA FETCHING =============
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await marketplaceApi.get('/categories');
        if (response?.data?.data) {
          setCategories(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  // Fetch counts for authenticated users (excluding cart - handled by CartContext)
  const fetchCounts = useCallback(async () => {
    try {
      const [wishlistData, unreadData, notifData] = await Promise.all([
        wishlistService.getWishlistCount().catch(() => 0),
        messagingService.getUnreadCount().catch(() => 0),
        notificationService.getUnreadCount().catch(() => ({ count: 0 }))
      ]);
      setWishlistCount(typeof wishlistData === 'number' ? wishlistData : (wishlistData?.count || 0));
      setUnreadMessages(typeof unreadData === 'number' ? unreadData : (unreadData?.count || 0));
      const notifCount = notifData?.data?.count || notifData?.count || notifData?.data || (typeof notifData === 'number' ? notifData : 0);
      setNotificationCount(notifCount);
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  }, []);

  // Fetch guest wishlist count from localStorage (cart handled by CartContext)
  const fetchGuestCounts = useCallback(() => {
    setWishlistCount(guestService.getGuestWishlistCount());
  }, []);

  // Fetch profile completion status for customers
  const fetchProfileCompletion = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    // Determine user role
    const role = user.roles?.includes('ADMIN') ? 'ADMIN' : 
                 user.roles?.includes('FARMER') ? 'FARMER' : 'CUSTOMER';
    
    // For farmers, try to get their profile photo
    if (role === 'FARMER') {
      setProfileCompletion({ percentage: 100, isComplete: true, missingFields: [] });
      try {
        const response = await userApi.get('/profiles/farmer');
        const profile = response?.data?.data || response?.data || {};
        if (profile.profilePhoto) {
          setProfilePhoto(profile.profilePhoto);
        }
      } catch (err) {
        console.error('Error fetching farmer profile:', err);
      }
      return;
    }
    
    // Admins don't need profile completion
    if (role === 'ADMIN' || role === 'MANAGER') {
      setProfileCompletion({ percentage: 100, isComplete: true, missingFields: [] });
      return;
    }

    try {
      const response = await userApi.get('/profiles/customer');
      const profile = response?.data?.data || response?.data || {};
      
      // Calculate profile completion - must match ProfileOnboarding required fields
      const requiredFields = [
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'address', label: 'Address' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'pincode', label: 'Pincode' }
      ];
      
      const missingFields = [];
      let filledCount = 0;
      
      requiredFields.forEach(field => {
        const value = profile[field.key];
        if (value && value.toString().trim() !== '') {
          filledCount++;
        } else {
          missingFields.push(field.label);
        }
      });
      
      const percentage = Math.round((filledCount / requiredFields.length) * 100);
      
      setProfileCompletion({
        percentage,
        isComplete: percentage === 100,
        missingFields
      });
      
      // Store profile photo if available
      if (profile.profilePhoto) {
        setProfilePhoto(profile.profilePhoto);
      }
    } catch (err) {
      console.error('Error fetching profile completion:', err);
      // Default to complete to avoid showing indicator on error
      setProfileCompletion({ percentage: 100, isComplete: true, missingFields: [] });
    }
  }, [isAuthenticated, user]);

  // Fetch counts on mount only (not on every navigation to reduce API calls)
  useEffect(() => {
    if (isAuthenticated) {
      fetchCounts();
      fetchProfileCompletion();
    } else {
      fetchGuestCounts();
    }
  }, [isAuthenticated, fetchCounts, fetchGuestCounts, fetchProfileCompletion]);

  // Listen for profile updates to refresh avatar photo
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      const newPhoto = event.detail?.profilePhoto;
      if (newPhoto) {
        setProfilePhoto(newPhoto);
      }
      // Also refresh profile completion
      fetchProfileCompletion();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [fetchProfileCompletion]);

  // Listen for guest wishlist updates (cart handled by CartContext)
  useEffect(() => {
    if (!isAuthenticated) {
      const handleGuestWishlistUpdate = (event) => {
        setWishlistCount(event.detail?.length || 0);
      };
      
      window.addEventListener('guestWishlistUpdated', handleGuestWishlistUpdate);
      
      return () => {
        window.removeEventListener('guestWishlistUpdated', handleGuestWishlistUpdate);
      };
    }
  }, [isAuthenticated]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      console.log('[DEBUG] Click outside detected, target:', event.target.className);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        console.log('[DEBUG] Closing user menu - clicked outside');
        setUserMenuOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setCategoriesOpen(false);
        setSearchScopeOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setLocationMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    };
    
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        console.log('[DEBUG] Escape key pressed, closing all menus');
        setUserMenuOpen(false);
        setCategoriesOpen(false);
        setSearchScopeOpen(false);
        setLocationMenuOpen(false);
        setSearchFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Calculate dropdown position when menu opens
  useEffect(() => {
    if (userMenuOpen && accountBtnRef.current) {
      const rect = accountBtnRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: Math.max(20, window.innerWidth - rect.right)
      });
    }
  }, [userMenuOpen]);

  // ============= HANDLERS =============

  const handleSearch = (e, source = 'submit') => {
    e.preventDefault();
    const normalizedQuery = searchQuery.trim();
    if (normalizedQuery) {
      // Save to recent searches
      const newSearches = [normalizedQuery, ...recentSearches.filter(s => s !== normalizedQuery)].slice(0, 5);
      setRecentSearches(newSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
      trackSuggestionSelection(searchScope, normalizedQuery);
      trackSearchTelemetry('search_submit', {
        source,
        scope: searchScope,
        query: normalizedQuery,
        queryLength: normalizedQuery.length
      });

      if (searchScope === 'farmers') {
        navigate(`/farmers?search=${encodeURIComponent(normalizedQuery)}`);
      } else {
        navigate(`/marketplace?search=${encodeURIComponent(normalizedQuery)}`);
      }
      setSearchQuery('');
      setSearchFocused(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleSearchSuggestionClick = (suggestion, source = 'mouse') => {
    setSearchQuery(suggestion);
    trackSuggestionSelection(searchScope, suggestion);
    trackSearchTelemetry('suggestion_click', {
      source,
      scope: searchScope,
      suggestionType: searchQuery.trim().length >= 2 ? 'query' : 'recent_or_popular',
      label: suggestion
    });
    if (searchScope === 'farmers') {
      navigate(`/farmers?search=${encodeURIComponent(suggestion)}`);
    } else {
      navigate(`/marketplace?search=${encodeURIComponent(suggestion)}`);
    }
    setSearchFocused(false);
    setActiveSuggestionIndex(-1);
  };

  const handleScopeSelect = (scope) => {
    setSearchScope(scope);
    setSearchScopeOpen(false);
    setActiveSuggestionIndex(-1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleProductSuggestionClick = (listing, source = 'mouse') => {
    const keyword = listing?.title || searchQuery.trim();
    if (keyword) {
      const newSearches = [keyword, ...recentSearches.filter(s => s !== keyword)].slice(0, 5);
      setRecentSearches(newSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
    }
    trackSuggestionSelection('products', keyword);
    trackSearchTelemetry('suggestion_click', {
      source,
      scope: searchScope,
      suggestionType: 'product',
      suggestionId: listing?.id,
      label: listing?.title || ''
    });
    navigate(`/marketplace/${listing.id}`);
    setSearchFocused(false);
  };

  const handleCategorySuggestionClick = (category, source = 'mouse') => {
    trackSuggestionSelection('categories', category?.name || '');
    trackSearchTelemetry('suggestion_click', {
      source,
      scope: searchScope,
      suggestionType: 'category',
      suggestionId: category?.id,
      label: category?.name || ''
    });
    navigate(`/marketplace?categoryId=${category.id}`);
    setSearchFocused(false);
  };

  const handleFarmerSuggestionClick = (farmer, source = 'mouse') => {
    trackSuggestionSelection('farmers', farmer?.name || '');
    trackSearchTelemetry('suggestion_click', {
      source,
      scope: searchScope,
      suggestionType: 'farmer',
      suggestionId: farmer?.id,
      label: farmer?.name || ''
    });
    navigate(`/farmers?search=${encodeURIComponent(farmer.name || '')}`);
    setSearchFocused(false);
  };

  const trackSuggestionSelection = (scopeKey, label) => {
    const normalizedLabel = normalizeSearchText(label);
    if (!normalizedLabel) {
      return;
    }

    setSearchBehaviorMetrics((previous) => {
      const behaviorKey = getSearchBehaviorKey(scopeKey, normalizedLabel);
      const existing = previous?.[behaviorKey] || { count: 0, lastSelectedAt: 0, label: normalizedLabel };
      const nextMetrics = {
        ...(previous || {}),
        [behaviorKey]: {
          count: (existing.count || 0) + 1,
          lastSelectedAt: Date.now(),
          label: label || existing.label
        }
      };

      const trimmed = trimBehaviorMetrics(nextMetrics);
      saveSearchBehaviorMetrics(trimmed);
      return trimmed;
    });
  };

  const renderHighlightedText = useCallback((text, query) => {
    const safeText = text || '';
    const safeQuery = query?.trim();
    if (!safeQuery) {
      return safeText;
    }

    const tokens = [...new Set(safeQuery
      .toLowerCase()
      .split(/\s+/)
      .map(token => token.trim())
      .filter(Boolean))];

    if (tokens.length === 0) {
      return safeText;
    }

    const escapedTokens = tokens
      .map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length);

    const regex = new RegExp(`(${escapedTokens.join('|')})`, 'ig');
    const parts = safeText.split(regex);

    return parts.map((part, idx) => (
      tokens.includes(part.toLowerCase()) ? (
        <mark key={`${part}-${idx}`} className="suggestion-highlight">{part}</mark>
      ) : (
        <React.Fragment key={`${part}-${idx}`}>{part}</React.Fragment>
      )
    ));
  }, []);

  const handleCategoryClick = (categoryId) => {
    navigate(`/marketplace?categoryId=${categoryId}`);
    setCategoriesOpen(false);
  };

  useEffect(() => {
    const query = searchQuery.trim();
    if (!searchFocused || query.length < 2) {
      setLiveProductSuggestions([]);
      setLiveCategorySuggestions([]);
      setLiveFarmerSuggestions([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const shouldFetchProducts = searchScope === 'all' || searchScope === 'products';
        const shouldFetchFarmers = searchScope === 'all' || searchScope === 'farmers';
        const shouldFetchCategories = searchScope === 'all' || searchScope === 'categories';

        const [productsResponse, sellersResponse] = await Promise.all([
          shouldFetchProducts
            ? marketplaceApi.get('/listings/search', {
                params: {
                  keyword: query,
                  page: 0,
                  size: 6,
                  sortBy: 'createdAt',
                  sortDir: 'desc'
                }
              }).catch(() => null)
            : Promise.resolve(null),
          shouldFetchFarmers
            ? marketplaceApi.get('/listings/sellers').catch(() => null)
            : Promise.resolve(null)
        ]);

        const productContent = productsResponse?.data?.data?.content || [];
        const sellerContent = sellersResponse?.data?.data || [];

        const rankedProducts = shouldFetchProducts
          ? rankSuggestions(
              Array.isArray(productContent) ? productContent : [],
              query,
              (listing) => `${listing?.title || ''} ${listing?.cropType || ''} ${listing?.description || ''}`,
              6,
              searchBehaviorMetrics,
              'products'
            )
          : [];

        const categoryMatches = shouldFetchCategories
          ? rankSuggestions(categories, query, (category) => category?.name || '', 4, searchBehaviorMetrics, 'categories')
          : [];

        const farmerMatches = shouldFetchFarmers
          ? rankSuggestions(sellerContent, query, (seller) => seller?.name || '', 4, searchBehaviorMetrics, 'farmers')
          : [];

        if (!cancelled) {
          setLiveProductSuggestions(rankedProducts);
          setLiveCategorySuggestions(categoryMatches);
          setLiveFarmerSuggestions(farmerMatches);
        }
      } catch (err) {
        if (!cancelled) {
          setLiveProductSuggestions([]);
          setLiveCategorySuggestions([]);
          setLiveFarmerSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, searchFocused, categories, searchScope, searchBehaviorMetrics]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!searchFocused || query.length < 2) {
      lastImpressionSignatureRef.current = '';
      return;
    }

    const impressionItems = [
      ...liveProductSuggestions.slice(0, 6).map((item) => ({ type: 'product', id: item?.id, label: item?.title || '' })),
      ...liveCategorySuggestions.slice(0, 4).map((item) => ({ type: 'category', id: item?.id, label: item?.name || '' })),
      ...liveFarmerSuggestions.slice(0, 4).map((item) => ({ type: 'farmer', id: item?.id, label: item?.name || '' }))
    ];

    if (impressionItems.length === 0) {
      return;
    }

    const signature = JSON.stringify({
      scope: searchScope,
      query,
      keys: impressionItems.map((item) => `${item.type}:${item.id || item.label}`)
    });

    if (lastImpressionSignatureRef.current === signature) {
      return;
    }
    lastImpressionSignatureRef.current = signature;

    trackSearchTelemetry('suggestion_impression', {
      scope: searchScope,
      query,
      productCount: liveProductSuggestions.length,
      categoryCount: liveCategorySuggestions.length,
      farmerCount: liveFarmerSuggestions.length,
      topSuggestions: impressionItems.slice(0, 8)
    });
  }, [
    searchQuery,
    searchScope,
    searchFocused,
    liveProductSuggestions,
    liveCategorySuggestions,
    liveFarmerSuggestions,
    trackSearchTelemetry
  ]);

  const handleLocationSave = () => {
    if (pincode.length === 6) {
      // Simple location lookup (in real app, use API)
      const locationMap = {
        '400001': 'Mumbai, MH',
        '110001': 'New Delhi, DL',
        '560001': 'Bangalore, KA',
        '600001': 'Chennai, TN',
        '700001': 'Kolkata, WB',
        '500001': 'Hyderabad, TS',
        '380001': 'Ahmedabad, GJ',
        '411001': 'Pune, MH'
      };
      const location = locationMap[pincode] || `PIN: ${pincode}`;
      setDeliveryLocation(location);
      localStorage.setItem('deliveryLocation', location);
      localStorage.setItem('deliveryPincode', pincode);
      setLocationMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Dynamic dashboard link based on role
  const getDashboardLink = () => {
    switch(userRole) {
      case 'ADMIN': return '/admin/dashboard';
      case 'MANAGER': return '/manager/dashboard';
      case 'FARMER': return '/farmer/dashboard';
      default: return '/buyer/dashboard';
    }
  };

  const keyboardSuggestions = useMemo(() => {
    if (!searchFocused) {
      return [];
    }

    const query = searchQuery.trim();
    const items = [];

    if (query.length >= 2) {
      if (liveProductSuggestions.length > 0) {
        liveProductSuggestions.forEach((listing) => {
          items.push({ type: 'product', key: `product-${listing.id}`, label: listing.title, payload: listing });
        });
      }
      if (liveCategorySuggestions.length > 0) {
        liveCategorySuggestions.forEach((category) => {
          items.push({ type: 'category', key: `category-${category.id}`, label: category.name, payload: category });
        });
      }
      if (liveFarmerSuggestions.length > 0) {
        liveFarmerSuggestions.forEach((farmer) => {
          items.push({ type: 'farmer', key: `farmer-${farmer.id}`, label: farmer.name, payload: farmer });
        });
      }
    } else {
      recentSearches.forEach((search, idx) => {
        items.push({ type: 'recent', key: `recent-${idx}-${search}`, label: search, payload: search });
      });
      POPULAR_SEARCHES.forEach((search, idx) => {
        items.push({ type: 'popular', key: `popular-${idx}-${search}`, label: search, payload: search });
      });
    }

    return items;
  }, [
    searchFocused,
    searchQuery,
    liveProductSuggestions,
    liveCategorySuggestions,
    liveFarmerSuggestions,
    recentSearches
  ]);

  const suggestionIndexMap = useMemo(() => {
    const map = new Map();
    keyboardSuggestions.forEach((item, idx) => {
      map.set(item.key, idx);
    });
    return map;
  }, [keyboardSuggestions]);

  const executeKeyboardSuggestion = (item) => {
    if (!item) {
      return;
    }
    if (item.type === 'product') {
      handleProductSuggestionClick(item.payload, 'keyboard');
      return;
    }
    if (item.type === 'category') {
      handleCategorySuggestionClick(item.payload, 'keyboard');
      return;
    }
    if (item.type === 'farmer') {
      handleFarmerSuggestionClick(item.payload, 'keyboard');
      return;
    }
    handleSearchSuggestionClick(item.payload, 'keyboard');
  };

  const handleSearchInputKeyDown = (event) => {
    if (!searchFocused) {
      return;
    }

    if (event.key === 'Escape') {
      setSearchFocused(false);
      setSearchScopeOpen(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (!keyboardSuggestions.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestionIndex(prev => (prev + 1) % keyboardSuggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestionIndex(prev => (prev <= 0 ? keyboardSuggestions.length - 1 : prev - 1));
      return;
    }

    if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
      event.preventDefault();
      executeKeyboardSuggestion(keyboardSuggestions[activeSuggestionIndex]);
    }
  };

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [searchQuery, searchFocused, searchScope]);

  return (
    <>
      <nav className="navbar" ref={navbarRef}>
        {/* Top Bar - Announcement */}
        <div className="navbar-topbar">
          <div className="topbar-content">
            <span>🎉</span>
            <span>Free delivery on orders over ₹500</span>
            <span className="topbar-highlight">FRESH20</span>
            <span>for 20% off</span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="navbar-main">
          <div className="navbar-container">
            {/* Left: Logo + Location */}
            <div className="navbar-left">
              <Link to="/" className="navbar-logo">
                <span className="logo-icon">🌾</span>
                <span className="logo-text">AgriLink</span>
              </Link>

              {/* Delivery Location - Amazon Style */}
              <div className="location-selector" ref={locationRef}>
                <button 
                  className="location-btn"
                  onClick={() => setLocationMenuOpen(!locationMenuOpen)}
                  aria-label="Select delivery location"
                >
                  <FiMapPin className="location-icon" />
                  <div className="location-text">
                    <span className="location-label">Deliver to</span>
                    <span className="location-value">{deliveryLocation}</span>
                  </div>
                </button>

                {locationMenuOpen && (
                  <div className="location-dropdown">
                    <h4>Choose your location</h4>
                    <p>Delivery options and speeds may vary based on location</p>
                    
                    {isAuthenticated && (
                      <Link to="/profile" className="location-option" onClick={() => setLocationMenuOpen(false)}>
                        <FiUser />
                        <span>Use saved address</span>
                      </Link>
                    )}
                    
                    <div className="location-pincode">
                      <input
                        type="text"
                        placeholder="Enter 6-digit pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                      />
                      <button onClick={handleLocationSave} disabled={pincode.length !== 6}>
                        Apply
                      </button>
                    </div>
                    
                    {!isAuthenticated && (
                      <Link to="/login" className="location-signin" onClick={() => setLocationMenuOpen(false)}>
                        Sign in to see your addresses
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Center: Search Bar - Amazon Style */}
            <div className="navbar-search" ref={searchRef}>
              <form className="search-form" onSubmit={handleSearch}>
                {/* Category Selector in Search */}
                <div className="search-category-select" ref={categoriesRef}>
                  <button 
                    type="button"
                    className="category-select-btn"
                    onClick={() => setSearchScopeOpen(!searchScopeOpen)}
                  >
                    <span>{SEARCH_SCOPES.find(scope => scope.key === searchScope)?.label || 'All'}</span>
                    <FiChevronDown />
                  </button>
                  
                  {searchScopeOpen && (
                    <div className="search-scope-menu">
                      {SEARCH_SCOPES.map((scope) => (
                        <button
                          key={scope.key}
                          type="button"
                          className={`search-scope-item ${searchScope === scope.key ? 'active' : ''}`}
                          onClick={() => handleScopeSelect(scope.key)}
                        >
                          {scope.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <div className="search-input-container">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search for vegetables, fruits, farmers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onKeyDown={handleSearchInputKeyDown}
                    className="search-input"
                  />
                  <button type="submit" className="search-submit-btn">
                    <FiSearch />
                  </button>
                </div>

                {/* Search Suggestions Dropdown */}
                {searchFocused && (
                  <div className="search-suggestions">
                    {searchQuery.trim().length >= 2 ? (
                      <>
                        <div className="suggestions-section">
                          <h5><FiSearch /> Suggested Products</h5>
                          {searchLoading ? (
                            <div className="suggestion-item suggestion-empty">Finding products...</div>
                          ) : liveProductSuggestions.length > 0 ? (
                            liveProductSuggestions.map((listing) => (
                              <button
                                key={listing.id}
                                className={`suggestion-item ${activeSuggestionIndex === suggestionIndexMap.get(`product-${listing.id}`) ? 'active' : ''}`}
                                onClick={() => handleProductSuggestionClick(listing)}
                              >
                                <FiSearch className="suggestion-icon" />
                                <span>{renderHighlightedText(listing.title, searchQuery)}</span>
                              </button>
                            ))
                          ) : (
                            <div className="suggestion-item suggestion-empty">No related products found</div>
                          )}
                        </div>

                        {liveCategorySuggestions.length > 0 && (
                          <div className="suggestions-section">
                            <h5>📦 Matching Categories</h5>
                            {liveCategorySuggestions.map((category) => (
                              <button
                                key={category.id}
                                className={`suggestion-item ${activeSuggestionIndex === suggestionIndexMap.get(`category-${category.id}`) ? 'active' : ''}`}
                                onClick={() => handleCategorySuggestionClick(category)}
                              >
                                <FiChevronRight className="suggestion-icon" />
                                <span>{renderHighlightedText(category.name, searchQuery)}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {liveFarmerSuggestions.length > 0 && (
                          <div className="suggestions-section">
                            <h5><FiUsers /> Matching Farmers</h5>
                            {liveFarmerSuggestions.map((farmer) => (
                              <button
                                key={farmer.id}
                                className={`suggestion-item ${activeSuggestionIndex === suggestionIndexMap.get(`farmer-${farmer.id}`) ? 'active' : ''}`}
                                onClick={() => handleFarmerSuggestionClick(farmer)}
                              >
                                <FiUsers className="suggestion-icon" />
                                <span>{renderHighlightedText(farmer.name, searchQuery)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {recentSearches.length > 0 && (
                          <div className="suggestions-section">
                            <h5><FiClock /> Recent Searches</h5>
                            {recentSearches.map((search, idx) => (
                              <button
                                key={idx}
                                className={`suggestion-item ${activeSuggestionIndex === suggestionIndexMap.get(`recent-${idx}-${search}`) ? 'active' : ''}`}
                                onClick={() => handleSearchSuggestionClick(search)}
                              >
                                <FiClock className="suggestion-icon" />
                                {renderHighlightedText(search, searchQuery)}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="suggestions-section">
                          <h5>🔥 Popular Searches</h5>
                          {POPULAR_SEARCHES.map((search, idx) => (
                            <button
                              key={idx}
                              className={`suggestion-item ${activeSuggestionIndex === suggestionIndexMap.get(`popular-${idx}-${search}`) ? 'active' : ''}`}
                              onClick={() => handleSearchSuggestionClick(search)}
                            >
                              <FiSearch className="suggestion-icon" />
                              {renderHighlightedText(search, searchQuery)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Right: Orders, Messages, Notifications, Wishlist, Cart, Account (Account at extreme right) */}
            <div className="navbar-right">
              {/* Returns & Orders - Amazon Style */}
              {isAuthenticated && (
                <Link to="/orders" className="orders-btn">
                  <span className="orders-label">Returns</span>
                  <span className="orders-title">& Orders</span>
                </Link>
              )}

              {/* Messages - Only for authenticated */}
              {isAuthenticated && (
                <Link to="/messages" className="navbar-icon-btn messages-btn" title="Messages">
                  <FiMessageSquare />
                  {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
                </Link>
              )}

              {/* Profile Completion Indicator - Circular with Progress Ring */}
              {isAuthenticated && !profileCompletion.isComplete && (
                <Link 
                  to="/profile/onboarding" 
                  className="profile-progress-indicator"
                  title={`Complete your profile (${profileCompletion.percentage}%)`}
                >
                  <div className="profile-ring-wrapper">
                    <svg className="progress-ring" viewBox="0 0 44 44">
                      <circle 
                        className="progress-ring-bg"
                        cx="22" 
                        cy="22" 
                        r="18"
                        fill="none"
                        strokeWidth="3"
                      />
                      <circle 
                        className="progress-ring-fill"
                        cx="22" 
                        cy="22" 
                        r="18"
                        fill="none"
                        strokeWidth="3"
                        strokeDasharray={`${(profileCompletion.percentage / 100) * 113.1} 113.1`}
                        strokeLinecap="round"
                        transform="rotate(-90 22 22)"
                      />
                    </svg>
                    <div className="profile-avatar-small">
                      {user?.name?.charAt(0)?.toUpperCase() || displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  <span className="profile-completion-label">{profileCompletion.percentage}%</span>
                </Link>
              )}

              {/* Notifications - Only for authenticated */}
              {isAuthenticated && (
                <button 
                  className="navbar-icon-btn"
                  onClick={() => setShowNotifications(true)}
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <FiBell />
                  {notificationCount > 0 && (
                    <span className="badge">{notificationCount > 9 ? '9+' : notificationCount}</span>
                  )}
                </button>
              )}

              {/* Wishlist */}
              {isAuthenticated && (
                <Link to="/wishlist" className="navbar-icon-btn" title="Wishlist" aria-label="Wishlist">
                  <FiHeart />
                  {wishlistCount > 0 && <span className="badge wishlist">{wishlistCount}</span>}
                </Link>
              )}

              {/* Cart - Amazon Style */}
              <Link to="/cart" className="cart-btn" aria-label="Cart">
                <div className="cart-icon-wrapper">
                  <FiShoppingCart className="cart-icon" />
                  <span className="cart-count">{cartCount}</span>
                </div>
                <span className="cart-text">Cart</span>
              </Link>

              {/* Account Section - Extreme Right */}
              {isAuthenticated ? (
                <div 
                  className="user-menu-container account-section-right" 
                  ref={userMenuRef}
                >
                  <button 
                    type="button"
                    ref={accountBtnRef}
                    className="account-avatar-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[DEBUG] Profile button clicked, current state:', userMenuOpen);
                      setUserMenuOpen(prev => !prev);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[DEBUG] Profile button keydown:', e.key);
                        setUserMenuOpen(prev => !prev);
                      }
                      if (e.key === 'Escape') {
                        setUserMenuOpen(false);
                      }
                    }}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    aria-label={`Account menu for ${displayName}`}
                  >
                    <div className="navbar-avatar">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt={displayName} className="navbar-avatar-img" />
                      ) : (
                        <span className="navbar-avatar-letter">{displayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="account-user-name">{displayName}</span>
                    <FiChevronDown className={`avatar-chevron ${userMenuOpen ? 'open' : ''}`} />
                  </button>
                  
                  {userMenuOpen && (
                    <div 
                      className="account-dropdown"
                      role="menu"
                      aria-label="Account menu"
                      style={{
                        top: `${dropdownPosition.top}px`,
                        right: `${dropdownPosition.right}px`
                      }}
                    >
                      <div className="dropdown-header">
                        <div className="user-avatar large">
                          {profilePhoto ? (
                            <img src={profilePhoto} alt={displayName} className="dropdown-avatar-img" />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="user-info">
                          <span className="user-name">{displayName}</span>
                          <span className="user-email">{user?.email}</span>
                          <span className={`user-role-badge ${userRole?.toLowerCase()}`}>
                            {userRole || 'Customer'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Primary Actions */}
                      <div className="dropdown-section">
                        <Link 
                          to={getDashboardLink()} 
                          onClick={() => setUserMenuOpen(false)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <FiHome /> Dashboard
                        </Link>
                        <Link 
                          to="/profile" 
                          onClick={() => setUserMenuOpen(false)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <FiUser /> Profile
                        </Link>
                        <Link 
                          to="/settings" 
                          onClick={() => setUserMenuOpen(false)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <FiSettings /> Settings
                        </Link>
                      </div>

                      {/* Role-specific links */}
                      <div className="dropdown-section">
                        <>
                          <Link to="/orders" onClick={() => setUserMenuOpen(false)} role="menuitem">
                            <FiPackage /> Your Orders
                          </Link>
                          <Link to="/wishlist" onClick={() => setUserMenuOpen(false)} role="menuitem">
                            <FiHeart /> Your Wishlist
                          </Link>
                        </>
                        {userRole === 'FARMER' && (
                          <>
                            <Link to="/farmer/products" onClick={() => setUserMenuOpen(false)} role="menuitem">
                              <FiShoppingBag /> My Products
                            </Link>
                            <Link to="/farmer/orders" onClick={() => setUserMenuOpen(false)} role="menuitem">
                              <FiDollarSign /> My Sales
                            </Link>
                            <Link to="/farms" onClick={() => setUserMenuOpen(false)} role="menuitem">
                              <FiMap /> My Farms
                            </Link>
                          </>
                        )}
                      </div>

                      {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                        <div className="dropdown-section admin-section">
                          <Link 
                            to={userRole === 'ADMIN' ? '/admin/dashboard' : '/manager/dashboard'} 
                            onClick={() => setUserMenuOpen(false)}
                            role="menuitem"
                          >
                            <FiShield /> {userRole === 'ADMIN' ? 'Admin Panel' : 'Manager Panel'}
                          </Link>
                        </div>
                      )}
                      
                      <div className="dropdown-divider"></div>
                      <button 
                        className="dropdown-logout" 
                        onClick={handleLogout}
                        role="menuitem"
                        tabIndex={0}
                      >
                        <FiLogOut /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="login-btn" aria-label="Sign in">
                  <FiUser className="login-icon" />
                  <span className="login-text">Login</span>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button 
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Bar */}
        <div className="navbar-secondary">
          <div className="secondary-container">
            {/* All Categories Button */}
            <button 
              className="all-categories-btn"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              <FiMenu />
              <span>All Categories</span>
            </button>

            {/* Quick Links */}
            <div className="secondary-links">
              <Link to="/deals" className="secondary-link highlight">
                <FiPercent /> Today's Deals
              </Link>
              <Link to="/marketplace?organic=true" className="secondary-link">
                🌿 Organic
              </Link>
              <Link to="/farmers" className="secondary-link">
                👨‍🌾 Our Farmers
              </Link>
              <Link to="/marketplace?sort=newest" className="secondary-link">
                ✨ New Arrivals
              </Link>
              {isAuthenticated && userRole === 'FARMER' && (
                <Link to="/marketplace/create" className="secondary-link sell">
                  + Sell Products
                </Link>
              )}
              {!isAuthenticated && (
                <Link to="/register?role=FARMER" className="secondary-link sell">
                  Become a Seller
                </Link>
              )}
            </div>

            {/* Delivery Promise */}
            <div className="delivery-promise">
              <FiTruck />
              <span>Free delivery on ₹500+</span>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          {/* Mobile Search */}
          <form className="mobile-search" onSubmit={handleSearch}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Mobile Location */}
          <div className="mobile-location">
            <FiMapPin />
            <span>Deliver to: {deliveryLocation}</span>
          </div>

          <div className="mobile-nav-links">
            <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiHome /> Home
            </Link>
            <Link to="/marketplace" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiShoppingBag /> Shop All
            </Link>
            <Link to="/deals" className="mobile-nav-link highlight" onClick={closeMobileMenu}>
              <FiPercent /> Today's Deals
            </Link>
            <Link to="/farmers" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiUsers /> Farmers
            </Link>
          </div>

          {/* Mobile Categories */}
          <div className="mobile-categories">
            <h4>Categories</h4>
            <div className="mobile-category-grid">
              {categories.slice(0, 8).map(category => (
                <Link 
                  key={category.id}
                  to={`/marketplace?categoryId=${category.id}`}
                  className="mobile-category-item"
                  onClick={closeMobileMenu}
                >
                  <span className="category-emoji">{CATEGORY_ICONS[category.name] || '📦'}</span>
                  <span>{category.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Cart & Wishlist for all users in mobile */}
          <div className="mobile-cart-wishlist">
            <Link to="/wishlist" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiHeart /> Wishlist
              {wishlistCount > 0 && <span className="mobile-badge">{wishlistCount}</span>}
            </Link>
            <Link to="/cart" className="mobile-nav-link" onClick={closeMobileMenu}>
              <FiShoppingCart /> Cart
              {cartCount > 0 && <span className="mobile-badge">{cartCount}</span>}
            </Link>
          </div>

          {isAuthenticated ? (
            <div className="mobile-user-section">
              <div className="mobile-user-info">
                <div className="user-avatar">{displayName.charAt(0).toUpperCase()}</div>
                <div>
                  <span className="user-name">{displayName}</span>
                  <span className="user-role">{userRole}</span>
                </div>
              </div>
              
              {/* Mobile Profile Completion Alert */}
              {!profileCompletion.isComplete && (
                <Link 
                  to="/profile/onboarding" 
                  className="mobile-profile-completion"
                  onClick={closeMobileMenu}
                >
                  <div className="completion-content">
                    <div className="completion-info">
                      <div className="completion-title">
                        <FiAlertCircle /> Complete Your Profile
                      </div>
                      <div className="completion-subtitle">
                        {profileCompletion.missingFields.length > 0 
                          ? `Missing: ${profileCompletion.missingFields.join(', ')}`
                          : 'Finish setting up your account'}
                      </div>
                    </div>
                    <div className="completion-progress">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        <path 
                          className="circle-bg"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path 
                          className="circle"
                          strokeDasharray={`${profileCompletion.percentage}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className="percentage">{profileCompletion.percentage}%</text>
                      </svg>
                    </div>
                  </div>
                </Link>
              )}
              
              <div className="mobile-user-links">
                <Link to={getDashboardLink()} onClick={closeMobileMenu}>
                  <FiHome /> Dashboard
                </Link>
                <Link to="/orders" onClick={closeMobileMenu}>
                  <FiPackage /> Your Orders
                </Link>
                {userRole === 'FARMER' && (
                  <>
                    <Link to="/farmer/products" onClick={closeMobileMenu}>
                      <FiShoppingBag /> My Products
                    </Link>
                    <Link to="/farmer/orders" onClick={closeMobileMenu}>
                      <FiDollarSign /> My Sales
                    </Link>
                  </>
                )}
                <Link to="/profile" onClick={closeMobileMenu}>
                  <FiUser /> Account Settings
                </Link>
                {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                  <Link to={userRole === 'ADMIN' ? '/admin/dashboard' : '/manager/dashboard'} onClick={closeMobileMenu}>
                    <FiShield /> {userRole} Panel
                  </Link>
                )}
                <button onClick={handleLogout}>
                  <FiLogOut /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="mobile-auth">
              <Link to="/login" className="mobile-login" onClick={closeMobileMenu}>
                Sign In
              </Link>
              <Link to="/register" className="mobile-register" onClick={closeMobileMenu}>
                Create Account
              </Link>
            </div>
          )}
        </div>

        {/* Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-overlay" onClick={closeMobileMenu}></div>
        )}
      </nav>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false);
          fetchCounts();
        }} 
      />
    </>
  );
};

export default Navbar;
