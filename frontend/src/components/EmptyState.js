import React from 'react';
import { Link } from 'react-router-dom';
// Tree-shakeable individual icon imports
import { FiPackage } from '@react-icons/all-files/fi/FiPackage';
import { FiShoppingCart } from '@react-icons/all-files/fi/FiShoppingCart';
import { FiHeart } from '@react-icons/all-files/fi/FiHeart';
import { FiSearch } from '@react-icons/all-files/fi/FiSearch';
import { FiShoppingBag } from '@react-icons/all-files/fi/FiShoppingBag';
import { FiMessageSquare } from '@react-icons/all-files/fi/FiMessageSquare';
import { FiBell } from '@react-icons/all-files/fi/FiBell';
import { FiUsers } from '@react-icons/all-files/fi/FiUsers';
import { FiMap } from '@react-icons/all-files/fi/FiMap';
import { FiTruck } from '@react-icons/all-files/fi/FiTruck';
import { FiAlertCircle } from '@react-icons/all-files/fi/FiAlertCircle';
import { FiInbox } from '@react-icons/all-files/fi/FiInbox';
import { FiTrendingUp } from '@react-icons/all-files/fi/FiTrendingUp';
import { FiGrid } from '@react-icons/all-files/fi/FiGrid';
import './EmptyState.css';

const EmptyState = ({ 
  type = 'default',
  title,
  message,
  icon,
  actionText,
  actionLink,
  onAction,
  secondaryActionText,
  secondaryActionLink,
  onSecondaryAction
}) => {
  // Predefined configurations for common empty states
  const presets = {
    orders: {
      icon: <FiPackage />,
      title: 'No Orders Yet',
      message: "You haven't placed any orders yet. Start shopping to see your orders here!",
      actionText: 'Browse Products',
      actionLink: '/marketplace'
    },
    'seller-orders': {
      icon: <FiTruck />,
      title: 'No Sales Yet',
      message: "You don't have any orders to fulfill. Keep your listings updated to attract buyers!",
      actionText: 'Manage Listings',
      actionLink: '/farmer/products'
    },
    cart: {
      icon: <FiShoppingCart />,
      title: 'Your Cart is Empty',
      message: "Looks like you haven't added any items to your cart yet.",
      actionText: 'Browse Marketplace',
      actionLink: '/marketplace'
    },
    wishlist: {
      icon: <FiHeart />,
      title: 'Your Wishlist is Empty',
      message: 'Save items you love by clicking the heart icon on any product.',
      actionText: 'Explore Products',
      actionLink: '/marketplace'
    },
    products: {
      icon: <FiShoppingBag />,
      title: 'No Products Listed',
      message: "You haven't created any product listings yet. Start selling today!",
      actionText: 'Add Product',
      actionLink: '/marketplace/create'
    },
    search: {
      icon: <FiSearch />,
      title: 'No Results Found',
      message: "We couldn't find any products matching your search. Try different keywords or filters.",
      actionText: 'Clear Filters',
      actionLink: null
    },
    deals: {
      icon: <FiTrendingUp />,
      title: 'No Deals Available',
      message: 'Check back soon for exciting deals and discounts on fresh produce!',
      actionText: 'Browse All Products',
      actionLink: '/marketplace'
    },
    messages: {
      icon: <FiMessageSquare />,
      title: 'No Messages',
      message: 'Start a conversation by messaging a seller about their products.',
      actionText: 'Browse Marketplace',
      actionLink: '/marketplace'
    },
    notifications: {
      icon: <FiBell />,
      title: 'No Notifications',
      message: "You're all caught up! We'll notify you when there's something new.",
      actionText: null,
      actionLink: null
    },
    farmers: {
      icon: <FiUsers />,
      title: 'No Farmers Found',
      message: "No farmers match your criteria. Try adjusting your search or filters.",
      actionText: 'View All Farmers',
      actionLink: '/farmers'
    },
    farms: {
      icon: <FiMap />,
      title: 'No Farms Yet',
      message: "You haven't registered any farms. Add your first farm to start managing it.",
      actionText: 'Add Farm',
      actionLink: '/farms/create'
    },
    categories: {
      icon: <FiGrid />,
      title: 'No Categories',
      message: 'Categories are not available at the moment.',
      actionText: 'Browse All',
      actionLink: '/marketplace'
    },
    error: {
      icon: <FiAlertCircle />,
      title: 'Something Went Wrong',
      message: "We couldn't load the data. Please try again.",
      actionText: 'Retry',
      actionLink: null
    },
    default: {
      icon: <FiInbox />,
      title: 'Nothing Here',
      message: 'This section is empty.',
      actionText: null,
      actionLink: null
    }
  };

  const preset = presets[type] || presets.default;
  
  const displayIcon = icon || preset.icon;
  const displayTitle = title || preset.title;
  const displayMessage = message || preset.message;
  const displayActionText = actionText !== undefined ? actionText : preset.actionText;
  const displayActionLink = actionLink !== undefined ? actionLink : preset.actionLink;

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {displayIcon}
      </div>
      <h3 className="empty-state-title">{displayTitle}</h3>
      <p className="empty-state-message">{displayMessage}</p>
      
      <div className="empty-state-actions">
        {displayActionText && displayActionLink && (
          <Link to={displayActionLink} className="empty-state-btn primary">
            {displayActionText}
          </Link>
        )}
        {displayActionText && !displayActionLink && onAction && (
          <button onClick={onAction} className="empty-state-btn primary">
            {displayActionText}
          </button>
        )}
        {secondaryActionText && secondaryActionLink && (
          <Link to={secondaryActionLink} className="empty-state-btn secondary">
            {secondaryActionText}
          </Link>
        )}
        {secondaryActionText && !secondaryActionLink && onSecondaryAction && (
          <button onClick={onSecondaryAction} className="empty-state-btn secondary">
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
