import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaUsers, FaTractor, FaShoppingCart, FaChartLine, FaExclamationTriangle,
  FaCog, FaBan, FaCheckCircle, FaEye, FaTrash, FaBell,
  FaComments, FaFileAlt, FaDollarSign, FaClipboardList, FaArrowUp,
  FaSearch, FaCalendarAlt, FaUserTie, FaIdCard, FaPlus, FaDownload,
  FaEllipsisV, FaLock, FaCheck
} from 'react-icons/fa';
import { FiFileText, FiExternalLink, FiAlertTriangle } from 'react-icons/fi';
import { userApi, orderApi, marketplaceApi, notificationApi } from '../services/api';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const SECTIONS = {
  overview: 'overview',
  users: 'users',
  farmers: 'farmers',
  approvals: 'approvals',
  managers: 'managers',
  orders: 'orders',
  fraud: 'fraud',
  analytics: 'analytics',
  content: 'content',
  messages: 'messages',
  settings: 'settings'
};

const unwrapApiData = (response) => {
  if (!response) return null;
  return response.data?.data ?? response.data ?? null;
};

const extractContentArray = (response) => {
  const payload = unwrapApiData(response);
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const asArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const MARKETPLACE_API_URL = process.env.REACT_APP_MARKETPLACE_API_URL || 'http://localhost:8084/api/v1';

const toAbsoluteImageUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const baseOrigin = MARKETPLACE_API_URL.replace(/\/api\/v\d+\/?$/, '');
  if (trimmed.startsWith('/')) {
    return `${baseOrigin}${trimmed}`;
  }
  return `${baseOrigin}/${trimmed}`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFarmers: 0,
    totalBuyers: 0,
    activeOrders: 0,
    totalRevenue: 0,
    fraudReports: 0,
    pendingApprovals: 0,
    pendingManagers: 0,
    monthlyGrowth: 0
  });

  const [users, setUsers] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [fraudCases, setFraudCases] = useState([]);
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [pendingManagers, setPendingManagers] = useState([]);
  const [listings, setListings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [dataHealth, setDataHealth] = useState({ failed: [] });
  const [lastUpdated, setLastUpdated] = useState(null);

  const [activeSection, setActiveSection] = useState(SECTIONS.overview);
  const [loading, setLoading] = useState(true);

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [farmerSearch, setFarmerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [analyticsWindow, setAnalyticsWindow] = useState(7);
  const [overviewTab, setOverviewTab] = useState('farmers');
  const [overviewSearch, setOverviewSearch] = useState('');

  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('admin.compactMode') === 'true');
  const [autoRefreshMinutes, setAutoRefreshMinutes] = useState(() => Number(localStorage.getItem('admin.autoRefreshMinutes') || 0));
  const [selectedOrderProduct, setSelectedOrderProduct] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const requests = await Promise.allSettled([
        userApi.get('/admin/users?page=0&size=200'),
        userApi.get('/profiles/farmer/approved'),
        marketplaceApi.get('/listings/sellers'),
        marketplaceApi.get('/listings?page=0&size=200'),
        userApi.get('/profiles/manager/pending?page=0&size=200'),
        userApi.get('/profiles/farmer/pending?page=0&size=200'),
        orderApi.get('/fraud/cases?page=0&size=200'),
        notificationApi.get('/notifications?page=0&size=20'),
        notificationApi.get('/notifications/count')
      ]);

      const failed = [];

      const readResponse = (result, label) => {
        if (result.status === 'fulfilled') return result.value;
        console.error(`Dashboard endpoint failed: ${label}`, result.reason);
        failed.push(label);
        return null;
      };

      const usersRes = readResponse(requests[0], 'admin users');
      const approvedFarmersRes = readResponse(requests[1], 'approved farmers');
      const sellersRes = readResponse(requests[2], 'listing sellers');
      const listingsRes = readResponse(requests[3], 'listings');
      const pendingManagersRes = readResponse(requests[4], 'pending managers');
      const pendingFarmersRes = readResponse(requests[5], 'pending farmers');
      const fraudRes = readResponse(requests[6], 'fraud cases');
      const notificationsRes = readResponse(requests[7], 'notifications');
      const unreadCountRes = readResponse(requests[8], 'notifications count');

      const usersData = extractContentArray(usersRes);
      const approvedFarmersData = extractContentArray(approvedFarmersRes);
      const sellers = asArray(unwrapApiData(sellersRes));
      const listingsData = extractContentArray(listingsRes);
      const managers = extractContentArray(pendingManagersRes);
      const farmersPendingData = extractContentArray(pendingFarmersRes);
      const fraudCasesData = extractContentArray(fraudRes);
      const notificationsData = extractContentArray(notificationsRes);
      const unreadCountData = unwrapApiData(unreadCountRes);

      const normalizedUsers = usersData.map((u, index) => ({
        id: u.id || u.userId || `user-${index}`,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.fullName || 'Unknown',
        email: u.email || 'N/A',
        role: (u.role || 'CUSTOMER').toUpperCase(),
        status: u.isActive === false ? 'SUSPENDED' : 'ACTIVE',
        joined: u.createdAt || new Date().toISOString(),
        orders: 0
      }));

      const activeListings = listingsData.filter(l => String(l.status || '').toUpperCase() === 'ACTIVE').length;
      const totalRevenue = listingsData.reduce((sum, l) => {
        const soldCount = Number(l.soldCount || 0);
        const price = Number(l.pricePerUnit || l.price || 0);
        return sum + (soldCount * price);
      }, 0);

      const totalFarmers = Math.max(normalizedUsers.filter(u => u.role === 'FARMER').length, approvedFarmersData.length, sellers.length);
      const totalBuyers = normalizedUsers.filter(u => ['BUYER', 'CUSTOMER'].includes(u.role)).length;

      setStats({
        totalUsers: normalizedUsers.length,
        totalFarmers,
        totalBuyers,
        activeOrders: activeListings,
        totalRevenue,
        fraudReports: fraudCasesData.length,
        pendingApprovals: farmersPendingData.length,
        pendingManagers: managers.length,
        monthlyGrowth: calculateMonthlyGrowth(listingsData)
      });

      setUsers(normalizedUsers);
      setListings(listingsData);

      setFarmers(approvedFarmersData.map((f, index) => ({
        id: f.id || f.userId || `farmer-${index}`,
        userId: f.userId || f.id,
        farmName: f.farmName || 'Unknown Farm',
        ownerName: f.name || f.username || 'Unknown',
        location: [f.city, f.state].filter(Boolean).join(', ') || 'Unknown',
        cropTypes: f.cropTypes || 'N/A',
        status: String(f.status || 'APPROVED'),
        createdAt: f.createdAt || null
      })));

      setFraudCases(fraudCasesData.map(f => ({
        id: f.id,
        type: f.fraudType || 'UNKNOWN',
        priority: f.priority || 'MEDIUM',
        reporter: f.reporterId || 'Unknown',
        accused: f.accusedId || 'Unknown',
        status: f.status || 'OPEN',
        date: f.createdAt || new Date().toISOString(),
        caseNumber: f.caseNumber
      })));

      setPendingManagers(managers.map(m => ({
        id: m.id,
        name: m.name || 'Unknown',
        username: m.username || '',
        city: m.city || 'Unknown',
        state: m.state || '',
        createdAt: m.createdAt,
        status: m.status
      })));

      setPendingFarmers(farmersPendingData.map(f => ({
        id: f.id,
        name: f.farmName || f.name || 'Unknown',
        owner: f.name || 'Unknown',
        location: f.city ? `${f.city}, ${f.state}` : 'Unknown',
        applied: f.createdAt,
        verificationDocument: f.verificationDocument || null,
        documentType: f.documentType || null,
        hasDocument: !!f.verificationDocument
      })));

      setNotifications(notificationsData.map((n) => ({
        id: n.id,
        title: n.title || 'Notification',
        message: n.message || '',
        type: String(n.notificationType || 'GENERAL'),
        read: !!n.read,
        createdAt: n.createdAt || n.sentAt || new Date().toISOString()
      })));

      setUnreadNotifications(Number(unreadCountData || 0));
      setDataHealth({ failed });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load admin dashboard data');
      setUsers([]);
      setFarmers([]);
      setFraudCases([]);
      setPendingFarmers([]);
      setPendingManagers([]);
      setListings([]);
      setNotifications([]);
      setUnreadNotifications(0);
      setDataHealth({ failed: ['dashboard load'] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    localStorage.setItem('admin.compactMode', compactMode ? 'true' : 'false');
    localStorage.setItem('admin.autoRefreshMinutes', String(autoRefreshMinutes));
  }, [compactMode, autoRefreshMinutes]);

  useEffect(() => {
    if (!autoRefreshMinutes || autoRefreshMinutes < 1) return undefined;

    const interval = window.setInterval(() => {
      fetchDashboardData();
    }, autoRefreshMinutes * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [autoRefreshMinutes, fetchDashboardData]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const roleMatch = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      const text = `${u.name} ${u.email} ${u.role}`.toLowerCase();
      const searchMatch = !userSearch || text.includes(userSearch.toLowerCase());
      return roleMatch && searchMatch;
    });
  }, [users, userRoleFilter, userSearch]);

  const filteredFarmers = useMemo(() => {
    return farmers.filter(f => {
      const text = `${f.farmName} ${f.ownerName} ${f.location} ${f.cropTypes}`.toLowerCase();
      return !farmerSearch || text.includes(farmerSearch.toLowerCase());
    });
  }, [farmers, farmerSearch]);

  const filteredProducts = useMemo(() => {
    return listings.filter((item) => {
      const status = String(item.status || 'UNKNOWN').toUpperCase();
      const statusMatch = productStatusFilter === 'ALL' || status === productStatusFilter;
      const text = `${item.title || ''} ${item.cropType || ''} ${item.categoryName || ''} ${item.sellerName || ''}`.toLowerCase();
      const searchMatch = !productSearch || text.includes(productSearch.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [listings, productSearch, productStatusFilter]);

  const filteredOrderRows = useMemo(() => {
    return listings.filter((item) => {
      const status = String(item.status || 'UNKNOWN').toUpperCase();
      return orderStatusFilter === 'ALL' || status === orderStatusFilter;
    });
  }, [listings, orderStatusFilter]);

  const userSummary = useMemo(() => {
    const active = users.filter((u) => String(u.status).toUpperCase() === 'ACTIVE').length;
    const suspended = users.filter((u) => String(u.status).toUpperCase() === 'SUSPENDED').length;
    const admins = users.filter((u) => String(u.role).toUpperCase() === 'ADMIN').length;
    return { total: users.length, active, suspended, admins };
  }, [users]);

  const productSummary = useMemo(() => {
    const active = listings.filter((l) => String(l.status || '').toUpperCase() === 'ACTIVE').length;
    const draft = listings.filter((l) => String(l.status || '').toUpperCase() === 'DRAFT').length;
    const revenue = listings.reduce((sum, l) => {
      const price = Number(l.pricePerUnit || l.price || 0);
      const sold = Number(l.soldCount || 0);
      return sum + (price * sold);
    }, 0);
    return { total: listings.length, active, draft, revenue };
  }, [listings]);

  const orderSummary = useMemo(() => {
    const active = filteredOrderRows.filter((l) => String(l.status || '').toUpperCase() === 'ACTIVE').length;
    const totalSold = filteredOrderRows.reduce((sum, l) => sum + Number(l.soldCount || 0), 0);
    const revenue = filteredOrderRows.reduce((sum, l) => {
      return sum + (Number(l.soldCount || 0) * Number(l.pricePerUnit || l.price || 0));
    }, 0);
    return { total: filteredOrderRows.length, active, totalSold, revenue };
  }, [filteredOrderRows]);

  const exportCsv = (rows, columns, filename) => {
    if (!rows || rows.length === 0) {
      toast.info('No data to export');
      return;
    }

    const escapeValue = (value) => {
      const text = String(value ?? '');
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const header = columns.map((c) => c.label).join(',');
    const body = rows.map((row) => columns.map((c) => escapeValue(c.value(row))).join(',')).join('\n');
    const csv = `${header}\n${body}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const recentNotifications = useMemo(() => {
    return notifications
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
  }, [notifications]);

  const analytics = useMemo(() => {
    const days = analyticsWindow;
    const now = new Date();
    const labels = [];
    const userSeries = [];
    const listingSeries = [];
    const fraudSeries = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      labels.push(day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

      const userCount = users.filter(u => (u.joined || '').slice(0, 10) === key).length;
      const listingCount = listings.filter(l => String(l.createdAt || '').slice(0, 10) === key).length;
      const fraudCount = fraudCases.filter(f => String(f.date || '').slice(0, 10) === key).length;

      userSeries.push(userCount);
      listingSeries.push(listingCount);
      fraudSeries.push(fraudCount);
    }

    const maxUsers = Math.max(1, ...userSeries);
    const maxListings = Math.max(1, ...listingSeries);
    const maxFraud = Math.max(1, ...fraudSeries);

    const resolvedCount = fraudCases.filter(f => ['RESOLVED', 'CLOSED'].includes(String(f.status || '').toUpperCase())).length;
    const resolutionRate = fraudCases.length === 0 ? 100 : Math.round((resolvedCount / fraudCases.length) * 100);

    return {
      labels,
      users: userSeries,
      listings: listingSeries,
      fraud: fraudSeries,
      userSeries,
      listingSeries,
      fraudSeries,
      totalUsersAdded: userSeries.reduce((sum, value) => sum + value, 0),
      totalListingsAdded: listingSeries.reduce((sum, value) => sum + value, 0),
      totalFraudReports: fraudSeries.reduce((sum, value) => sum + value, 0),
      maxUsers,
      maxListings,
      maxFraud,
      resolutionRate
    };
  }, [analyticsWindow, users, listings, fraudCases]);

  const overviewRows = useMemo(() => {
    const search = overviewSearch.trim().toLowerCase();

    const rowsByTab = {
      users: filteredUsers.slice(0, 8).map((u) => ({
        id: u.id,
        avatar: u.name,
        name: u.name,
        owner: u.email,
        location: 'Platform',
        crop: u.role,
        orders: 0,
        status: u.status
      })),
      farmers: filteredFarmers.slice(0, 8).map((f) => ({
        id: f.id,
        avatar: f.farmName,
        name: f.farmName,
        owner: f.ownerName,
        location: f.location,
        crop: f.cropTypes,
        orders: listings.filter((l) => String(l.sellerName || '').toLowerCase() === String(f.farmName || '').toLowerCase()).length,
        status: f.status
      })),
      orders: filteredOrderRows.slice(0, 8).map((o) => ({
        id: o.id,
        avatar: o.title || o.cropType,
        name: o.title || o.cropType || 'Untitled',
        owner: o.sellerName || 'N/A',
        location: o.location || 'N/A',
        crop: o.categoryName || 'N/A',
        orders: Number(o.soldCount || 0),
        status: o.status || 'UNKNOWN'
      }))
    };

    const selected = rowsByTab[overviewTab] || rowsByTab.farmers;
    if (!search) return selected;

    return selected.filter((r) => {
      const text = `${r.name} ${r.owner} ${r.location} ${r.crop} ${r.status}`.toLowerCase();
      return text.includes(search);
    });
  }, [filteredFarmers, filteredOrderRows, filteredUsers, listings, overviewSearch, overviewTab]);

  const getStatusColor = (status) => {
    switch (String(status || '').toUpperCase()) {
      case 'ACTIVE': return '#16a34a';
      case 'APPROVED': return '#16a34a';
      case 'SUSPENDED': return '#ef4444';
      case 'REJECTED': return '#ef4444';
      case 'PENDING': return '#f59e0b';
      case 'INVESTIGATING': return '#f59e0b';
      case 'RESOLVED': return '#16a34a';
      case 'CLOSED': return '#64748b';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (String(priority || '').toUpperCase()) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#16a34a';
      case 'CRITICAL': return '#991b1b';
      default: return '#6b7280';
    }
  };

  const getListingImage = (listing) => {
    if (!listing) return null;

    if (Array.isArray(listing.images) && listing.images.length > 0) {
      const primary = listing.images.find((img) => img.primary) || listing.images[0];
      const candidate =
        (typeof primary === 'string' ? primary : null) ||
        primary?.imageUrl ||
        primary?.url ||
        primary?.path ||
        null;
      const absolute = toAbsoluteImageUrl(candidate);
      if (absolute) return absolute;
    }

    return toAbsoluteImageUrl(listing.imageUrl || listing.image || listing.thumbnailUrl || null);
  };

  const getModerationStatus = (listing) => {
    if (!listing?.id) return 'PENDING_REVIEW';
    // Return actual listing status from backend
    const status = String(listing?.status || 'DRAFT').toUpperCase();
    if (status === 'ACTIVE') return 'APPROVED';
    if (status === 'CANCELLED') return 'SUSPENDED';
    return status;
  };

  const moderateListing = async (listing, action) => {
    if (!listing?.id) return;

    try {
      let endpoint = '';
      let statusLabel = '';
      let suspensionReason = '';
      
      if (action === 'approve') {
        endpoint = `/admin/${listing.id}/approve`;
        statusLabel = 'approved';
      } else if (action === 'suspend') {
        // Prompt for suspension reason
        suspensionReason = window.prompt('Enter suspension reason (required):', '');
        if (!suspensionReason || suspensionReason.trim() === '') {
          toast.error('Suspension reason is required');
          return;
        }
        endpoint = `/admin/${listing.id}/suspend?reason=${encodeURIComponent(suspensionReason.trim())}`;
        statusLabel = 'suspended';
      } else if (action === 'reject') {
        // Prompt for rejection reason
        suspensionReason = window.prompt('Enter rejection reason (required):', '');
        if (!suspensionReason || suspensionReason.trim() === '') {
          toast.error('Rejection reason is required');
          return;
        }
        endpoint = `/admin/${listing.id}/suspend?reason=${encodeURIComponent(suspensionReason.trim())}`;
        statusLabel = 'rejected';
      } else {
        return;
      }

      // Call backend API to update listing status
      await marketplaceApi.post(`/listings${endpoint}`);
      
      toast.success(`Listing ${statusLabel} successfully`);
      
      // If suspended, notify seller with reason
      if ((action === 'suspend' || action === 'reject') && suspensionReason) {
        await notifySellerForListing(listing, statusLabel, suspensionReason);
      }
      
      // Refetch dashboard data to get updated listing
      fetchDashboardData();
      
      // Clear detail panel to avoid stale data
      setSelectedOrderProduct(null);
    } catch (error) {
      console.error('Error moderating listing:', error);
      toast.error(`Failed to ${action} listing`);
    }
  };

  const notifySellerForListing = async (listing, actionLabel, reason = '') => {
    try {
      if (!listing?.sellerId) {
        toast.error('Seller ID missing for this listing');
        return;
      }

      // Format the message based on action
      let displayMessage = actionLabel;
      let fullMessage = '';
      
      if (actionLabel === 'approved') {
        displayMessage = 'approved';
        fullMessage = `Your listing "${listing.title || listing.cropType || 'Untitled'}" has been approved by admin.`;
      } else if (actionLabel === 'suspended' || actionLabel === 'rejected') {
        displayMessage = actionLabel;
        fullMessage = `Your listing "${listing.title || listing.cropType || 'Untitled'}" has been ${actionLabel} by admin.`;
        if (reason) {
          fullMessage += ` Reason: ${reason}`;
        }
      }

      await notificationApi.post('/notifications/send', {
        userId: listing.sellerId,
        notificationType: 'LISTING',
        channel: 'IN_APP',
        title: `Listing ${displayMessage.charAt(0).toUpperCase() + displayMessage.slice(1)}`,
        message: fullMessage,
        data: {
          listingId: listing.id,
          action: displayMessage,
          reason: reason || null,
          source: 'admin-dashboard'
        }
      });

      toast.success('Seller notified successfully');
    } catch (error) {
      console.error('Error notifying seller:', error);
      toast.error('Failed to notify seller');
    }
  };

  const handleUserAction = (userId, action) => {
    if (action === 'view') {
      const selected = users.find(u => u.id === userId);
      toast.info(`User: ${selected?.name || 'Unknown'} (${selected?.email || 'N/A'})`);
      return;
    }
    if (action === 'suspend') {
      toggleUserSuspension(userId, true);
      return;
    }
    if (action === 'activate') {
      toggleUserSuspension(userId, false);
      return;
    }
    if (action === 'delete') {
      deleteUserAccount(userId);
    }
  };

  const toggleUserSuspension = async (userId, suspend) => {
    try {
      const endpoint = suspend ? 'suspend' : 'activate';
      await userApi.put(`/admin/users/${userId}/${endpoint}`);
      toast.success(`User ${suspend ? 'suspended' : 'activated'} successfully`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const deleteUserAccount = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user account? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const reason = prompt('Enter reason for account deletion (optional):');
      await userApi.delete(`/admin/users/${userId}`, {
        params: { reason: reason || 'Admin initiated deletion' }
      });
      toast.success('User account deleted successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user account');
    }
  };

  const handleFraudAction = (caseId) => {
    updateFraudCaseStatus(caseId, 'INVESTIGATING');
  };

  const updateFraudCaseStatus = async (caseId, status) => {
    try {
      const notes = prompt('Add investigation notes (optional):');
      await orderApi.put(`/fraud/cases/${caseId}/status`, null, { params: { status } });
      if (notes) {
        await orderApi.post(`/fraud/cases/${caseId}/notes`, null, { params: { notes } });
      }
      toast.success('Fraud case updated successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating fraud case:', error);
      toast.error('Failed to update fraud case');
    }
  };

  const handleFarmerApproval = async (farmerId, approved) => {
    try {
      await userApi.post(`/profiles/farmer/${farmerId}/approve`, {
        approved,
        rejectionReason: approved ? null : 'Profile does not meet requirements'
      });
      toast.success(`Farmer ${approved ? 'approved' : 'rejected'} successfully`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error handling farmer approval:', error);
      toast.error('Failed to update farmer status');
    }
  };

  const handleManagerApproval = async (managerId, approved) => {
    try {
      await userApi.post(`/profiles/manager/${managerId}/approve`, {
        approved,
        rejectionReason: approved ? null : 'Profile does not meet requirements'
      });
      toast.success(`Manager ${approved ? 'approved' : 'rejected'} successfully`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error handling manager approval:', error);
      toast.error('Failed to update manager status');
    }
  };

  const calculateMonthlyGrowth = (items) => {
    if (!items || items.length === 0) return 0;

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonth = items.filter(x => {
      const d = new Date(x.createdAt);
      return d >= currentMonthStart;
    }).length;

    const lastMonth = items.filter(x => {
      const d = new Date(x.createdAt);
      return d >= prevMonthStart && d < currentMonthStart;
    }).length;

    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return Number((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1));
  };

  const renderUsersTable = () => {
    // Calculate user stats
    const userStats = {
      total: users.length,
      active: users.filter(u => u.status === 'ACTIVE').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      suspended: users.filter(u => u.status === 'SUSPENDED').length
    };

    // Registration trend (last 7 days)
    const now = new Date();
    const registrationTrend = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - i));
      const key = day.toISOString().slice(0, 10);
      const count = users.filter(u => (u.joined || '').slice(0, 10) === key).length;
      return count;
    });
    const totalNewUsers = registrationTrend.reduce((a, b) => a + b, 0);

    // Role distribution
    const roleDistribution = {
      admin: users.filter(u => u.role === 'ADMIN').length,
      customer: users.filter(u => ['BUYER', 'CUSTOMER'].includes(u.role)).length,
      manager: users.filter(u => u.role === 'MANAGER').length
    };

    return (
      <>
        <h1>Users</h1>
        
        {/* Top Stats */}
        <div className="users-top-stats">
          <div className="user-stat-card">
            <div className="stat-icon"><FaUsers /></div>
            <div className="stat-content">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{userStats.total}</div>
              <div className="stat-sub">▲ 2 this week</div>
            </div>
          </div>
          <div className="user-stat-card">
            <div className="stat-icon active"><FaCheck /></div>
            <div className="stat-content">
              <div className="stat-label">Active Users</div>
              <div className="stat-value">{userStats.active}</div>
              <div className="stat-sub">+ 0%</div>
            </div>
          </div>
          <div className="user-stat-card">
            <div className="stat-icon admin"><FaLock /></div>
            <div className="stat-content">
              <div className="stat-label">Admins</div>
              <div className="stat-value">{userStats.admins}</div>
              <div className="stat-sub">+ 0%</div>
            </div>
          </div>
          <div className="user-stat-card">
            <div className="stat-icon suspended"><FaBan /></div>
            <div className="stat-content">
              <div className="stat-label">Suspended Users</div>
              <div className="stat-value">{userStats.suspended}</div>
            </div>
          </div>
          <button className="add-new-btn"><FaPlus /> Add New</button>
        </div>

        {/* Main Layout */}
        <div className="users-main-grid">
          {/* Left: Table Section */}
          <div className="users-left-col">
            <div className="users-table-card">
              <div className="users-table-header">
                <div className="users-search-box">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="users-controls">
                  <select className="users-filter">
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                  <button
                    type="button"
                    className="users-export-btn"
                    onClick={() => exportCsv(filteredUsers, [
                      { label: 'Name', value: (r) => r.name },
                      { label: 'Email', value: (r) => r.email },
                      { label: 'Role', value: (r) => r.role },
                      { label: 'Status', value: (r) => r.status },
                      { label: 'Joined', value: (r) => r.joined }
                    ], 'admin-users.csv')}
                  >
                    <FaDownload /> Export
                  </button>
                </div>
              </div>

              <table className="users-data-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" /></th>
                    <th>USER</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan="7" className="no-data">No users found</td></tr>
                  ) : filteredUsers.slice(0, 5).map(user => (
                    <tr key={user.id}>
                      <td><input type="checkbox" /></td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-small">{(user.name || 'U').charAt(0)}</div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <span className="status-indicator" style={{ color: getStatusColor(user.status) }}>● {user.status}</span>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: `${getStatusColor(user.status)}20`, color: getStatusColor(user.status) }}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn view" title="View"><FaEye /></button>
                          <button className="action-btn" title="More"><FaEllipsisV /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="table-pagination">
                <span>Showing 1 to 6 of {filteredUsers.length} results</span>
                <div className="pagination-controls">
                  <button>1</button>
                  <button>2</button>
                  <button>3</button>
                  <button>4</button>
                  <button>5</button>
                  <button>...</button>
                  <button>14</button>
                  <button>›</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Insights Panel */}
          <aside className="users-right-col">
            <div className="insights-card">
              <h3>User Activity Insights</h3>
            </div>

            <div className="insights-card">
              <div className="insights-header">
                <h4>Registration Trend</h4>
                <select className="time-filter"><option>Last 7 Days</option></select>
              </div>
              <div className="trend-content">
                <div className="trend-number">{totalNewUsers} <span>New users</span></div>
                <div className="trend-chart">
                  <div className="trend-bars">
                    {registrationTrend.map((val, i) => (
                      <div key={i} className="trend-bar-wrapper">
                        <div className="trend-bar" style={{ height: `${Math.max(10, val * 8)}px` }} />
                      </div>
                    ))}
                  </div>
                  <div className="trend-labels">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="insights-card">
              <h4>Top Roles</h4>
              <div className="roles-content">
                <div className="roles-pie">
                  <svg viewBox="0 0 100 100" style={{ width: '140px', height: '140px' }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#2ea75f" strokeWidth="20" strokeDasharray="34 100" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#5eead4" strokeWidth="20" strokeDasharray="29 100" strokeDashoffset="-34" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#93c5fd" strokeWidth="20" strokeDasharray="37 100" strokeDashoffset="-63" />
                    <text x="50" y="50" textAnchor="middle" dy="0.3em" fontSize="18" fontWeight="bold">{userStats.total}</text>
                  </svg>
                </div>
                <div className="roles-legend">
                  <div className="role-item">
                    <span className="role-dot" style={{ backgroundColor: '#2ea75f' }} />
                    <span className="role-label">Admin</span>
                    <span className="role-count">{roleDistribution.admin}</span>
                  </div>
                  <div className="role-item">
                    <span className="role-dot" style={{ backgroundColor: '#5eead4' }} />
                    <span className="role-label">Customer</span>
                    <span className="role-count">{roleDistribution.customer}</span>
                  </div>
                  <div className="role-item">
                    <span className="role-dot" style={{ backgroundColor: '#93c5fd' }} />
                    <span className="role-label">Manager</span>
                    <span className="role-count">{roleDistribution.manager}</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="send-announcement-btn">Send Announcement</button>
          </aside>
        </div>
      </>
    );
  };

  const renderManagerApprovals = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2><FaUserTie /> Pending Manager Approvals</h2>
        <Link to="/admin/managers" className="view-all">View All</Link>
      </div>
      <div className="approvals-list">
        {pendingManagers.length === 0 ? (
          <p className="no-data">No pending manager approvals</p>
        ) : pendingManagers.map(manager => (
          <div key={manager.id} className="approval-item">
            <div className="approval-info">
              <span className="farm-name">{manager.name}</span>
              <span className="farm-owner">@{manager.username} • {manager.city}, {manager.state}</span>
              <span className="farm-date">Applied: {manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="approval-actions">
              <button className="approve-btn" onClick={() => handleManagerApproval(manager.id, true)}><FaCheckCircle /> Approve</button>
              <button className="reject-btn" onClick={() => handleManagerApproval(manager.id, false)}><FaBan /> Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFarmersTable = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2><FaTractor /> Farmers</h2>
        <div className="section-actions">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search farmers..."
              value={farmerSearch}
              onChange={(e) => setFarmerSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Farm</th>
              <th>Owner</th>
              <th>Location</th>
              <th>Crops</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredFarmers.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">No farmers found</td>
              </tr>
            ) : filteredFarmers.map(farmer => (
              <tr key={farmer.id}>
                <td>{farmer.farmName}</td>
                <td>{farmer.ownerName}</td>
                <td>{farmer.location}</td>
                <td>{farmer.cropTypes}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: `${getStatusColor(farmer.status)}20`, color: getStatusColor(farmer.status) }}
                  >
                    {farmer.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFarmerApprovals = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2><FaClipboardList /> Pending Farmer Approvals</h2>
        <Link to="/admin/approvals" className="view-all">View All</Link>
      </div>
      <div className="approvals-list">
        {pendingFarmers.length === 0 ? (
          <p className="no-data">No pending farmer approvals</p>
        ) : pendingFarmers.map(farmer => (
          <div key={farmer.id} className="approval-item">
            <div className="approval-info">
              <span className="farm-name">{farmer.name}</span>
              <span className="farm-owner">{farmer.owner} • {farmer.location}</span>
              <span className="farm-date">Applied: {farmer.applied ? new Date(farmer.applied).toLocaleDateString() : 'N/A'}</span>

              <div className="document-verification-section">
                <span className="doc-label"><FaIdCard /> Verification Document:</span>
                {farmer.hasDocument ? (
                  <div className="doc-preview-inline">
                    <span className="doc-type-badge">{farmer.documentType?.replace('_', ' ') || 'Document'}</span>
                    {String(farmer.verificationDocument).includes('application/pdf') || String(farmer.verificationDocument).endsWith('.pdf') ? (
                      <a href={farmer.verificationDocument} target="_blank" rel="noopener noreferrer" className="doc-link"><FiFileText /> View PDF</a>
                    ) : (
                      <a href={farmer.verificationDocument} target="_blank" rel="noopener noreferrer" className="doc-link"><FiExternalLink /> View Image</a>
                    )}
                  </div>
                ) : (
                  <span className="no-doc-warning"><FiAlertTriangle /> Not uploaded</span>
                )}
              </div>
            </div>
            <div className="approval-status">
              <span className={`docs-status ${farmer.hasDocument ? 'complete' : 'incomplete'}`}>
                {farmer.hasDocument ? 'Document Uploaded' : 'No Document'}
              </span>
            </div>
            <div className="approval-actions">
              <button className="approve-btn" onClick={() => handleFarmerApproval(farmer.id, true)} disabled={!farmer.hasDocument}>
                <FaCheckCircle /> Approve
              </button>
              <button className="reject-btn" onClick={() => handleFarmerApproval(farmer.id, false)}><FaBan /> Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFraudCases = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2><FaExclamationTriangle /> Fraud Cases</h2>
        <Link to="/admin/fraud" className="view-all">View All</Link>
      </div>
      <div className="fraud-list">
        {fraudCases.length === 0 ? (
          <p className="no-data">No fraud cases reported</p>
        ) : fraudCases.map(fraudCase => (
          <div key={fraudCase.id} className="fraud-item">
            <div className="fraud-priority" style={{ backgroundColor: getPriorityColor(fraudCase.priority) }}></div>
            <div className="fraud-info">
              <span className="fraud-type">{fraudCase.type}</span>
              <span className="fraud-parties">
                <strong>{String(fraudCase.reporter).slice(0, 8)}</strong> reported <strong>{String(fraudCase.accused).slice(0, 8)}</strong>
              </span>
              <span className="fraud-date"><FaCalendarAlt /> {new Date(fraudCase.date).toLocaleDateString()}</span>
            </div>
            <div className="fraud-actions">
              <span className="status-badge" style={{ backgroundColor: `${getStatusColor(fraudCase.status)}20`, color: getStatusColor(fraudCase.status) }}>
                {fraudCase.status}
              </span>
              <button className="action-btn" onClick={() => handleFraudAction(fraudCase.id)}><FaEye /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="dashboard-section analytics-section">
      <div className="section-header">
        <h2><FaChartLine /> Platform Analytics</h2>
        <select className="chart-filter" value={analyticsWindow} onChange={(e) => setAnalyticsWindow(Number(e.target.value))}>
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>User Growth</h3>
          <div className="mini-chart">
            <div className="chart-bars">
              {analytics.users.map((value, index) => (
                <div key={index} className="mini-bar" style={{ height: `${(value / analytics.maxUsers) * 100 || 6}%` }}></div>
              ))}
            </div>
          </div>
          <div className="analytics-footer">
            <span className="analytics-value">+{analytics.users.reduce((a, b) => a + b, 0)}</span>
            <span className="analytics-label">New users in window</span>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Listing Activity</h3>
          <div className="mini-chart">
            <div className="chart-bars orders">
              {analytics.listings.map((value, index) => (
                <div key={index} className="mini-bar" style={{ height: `${(value / analytics.maxListings) * 100 || 6}%` }}></div>
              ))}
            </div>
          </div>
          <div className="analytics-footer">
            <span className="analytics-value">{analytics.listings.reduce((a, b) => a + b, 0)}</span>
            <span className="analytics-label">New listings in window</span>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Fraud Reports</h3>
          <div className="mini-chart">
            <div className="chart-bars revenue">
              {analytics.fraud.map((value, index) => (
                <div key={index} className="mini-bar" style={{ height: `${(value / analytics.maxFraud) * 100 || 6}%` }}></div>
              ))}
            </div>
          </div>
          <div className="analytics-footer">
            <span className="analytics-value">{analytics.fraud.reduce((a, b) => a + b, 0)}</span>
            <span className="analytics-label">Reports in window</span>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Resolution Rate</h3>
          <div className="resolution-ring">
            <svg viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#16a34a"
                strokeWidth="3"
                strokeDasharray={`${analytics.resolutionRate}, 100`}
              />
            </svg>
            <span className="ring-value">{analytics.resolutionRate}%</span>
          </div>
          <div className="analytics-footer">
            <span className="analytics-value">{analytics.resolutionRate}%</span>
            <span className="analytics-label">Cases resolved/closed</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => {
    const detailImageUrl = getListingImage(selectedOrderProduct);

    return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2><FaShoppingCart /> Order Management</h2>
        <div className="section-actions">
          <select className="filter-btn" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="DRAFT">Pending Approval</option>
            <option value="ACTIVE">Active/Approved</option>
            <option value="SOLD">Sold Out</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            type="button"
            className="filter-btn"
            onClick={() => exportCsv(filteredOrderRows, [
              { label: 'Product', value: (r) => r.title || r.cropType || 'Unknown' },
              { label: 'Farmer', value: (r) => r.sellerName || 'N/A' },
              { label: 'Category', value: (r) => r.categoryName || 'N/A' },
              { label: 'Price', value: (r) => Number(r.pricePerUnit || r.price || 0) },
              { label: 'Status', value: (r) => r.status || 'N/A' }
            ], 'order-management.csv')}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="management-kpis">
        <div className="kpi-chip"><span>Orders</span><strong>{orderSummary.total}</strong></div>
        <div className="kpi-chip"><span>Active Listings</span><strong>{orderSummary.active}</strong></div>
        <div className="kpi-chip"><span>Units Sold</span><strong>{orderSummary.totalSold}</strong></div>
        <div className="kpi-chip"><span>Revenue</span><strong>₹{orderSummary.revenue.toLocaleString()}</strong></div>
      </div>

      {filteredOrderRows.length === 0 ? (
        <p className="no-data">No listing/order activity available</p>
      ) : (
        <div className="order-management-layout">
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Farmer</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrderRows.slice(0, 100).map((item) => {
                  const price = Number(item.pricePerUnit || item.price || 0);
                  const imageUrl = getListingImage(item);

                  return (
                    <tr key={item.id} className="order-row">
                      <td className="product-cell">
                        <div className="product-info">
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.title || item.cropType} className="product-thumb" />
                          ) : (
                            <div className="product-thumb-placeholder">No Image</div>
                          )}
                          <div className="product-details">
                            <span className="product-name">{item.title || item.cropType || 'Untitled'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{item.sellerName || 'N/A'}</td>
                      <td>{item.categoryName || 'N/A'}</td>
                      <td className="price-cell">₹{price.toLocaleString()}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: `${getStatusColor(item.status)}20`, color: getStatusColor(item.status) }}
                        >
                          {item.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button
                          className="view-btn"
                          title="View Details"
                          onClick={() => setSelectedOrderProduct(item)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <aside className="order-detail-panel">
            {selectedOrderProduct ? (
              <div className="detail-content">
                <h3>{selectedOrderProduct.title || selectedOrderProduct.cropType || 'Listing Details'}</h3>
                
                <div className="detail-image">
                  {detailImageUrl ? (
                    <img src={detailImageUrl} alt={selectedOrderProduct.title || 'Product'} />
                  ) : (
                    <div className="detail-image-placeholder">No Image</div>
                  )}
                </div>

                <div className="detail-info">
                  <div className="info-row">
                    <span className="label">Farmer</span>
                    <span className="value">{selectedOrderProduct.sellerName || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Category</span>
                    <span className="value">{selectedOrderProduct.categoryName || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Price</span>
                    <span className="value">₹{Number(selectedOrderProduct.pricePerUnit || 0).toLocaleString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Status</span>
                    <span className="value" style={{ color: getStatusColor(selectedOrderProduct.status), fontWeight: 'bold' }}>
                      {selectedOrderProduct.status || 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Location</span>
                    <span className="value">{selectedOrderProduct.location || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Sold Units</span>
                    <span className="value">{Number(selectedOrderProduct.soldCount || 0)}</span>
                  </div>
                  {selectedOrderProduct.suspensionReason && (
                    <div className="info-row warning">
                      <span className="label">Suspension Reason</span>
                      <span className="value">{selectedOrderProduct.suspensionReason}</span>
                    </div>
                  )}
                  <div className="info-row full-width">
                    <span className="label">Description</span>
                    <span className="value description-text">{selectedOrderProduct.description || 'No description available'}</span>
                  </div>
                </div>

                <div className="detail-actions">
                  {selectedOrderProduct.status === 'DRAFT' && (
                    <button className="approve-btn" type="button" onClick={() => moderateListing(selectedOrderProduct, 'approve')}>
                      <FaCheckCircle /> Approve
                    </button>
                  )}
                  {selectedOrderProduct.status !== 'CANCELLED' && selectedOrderProduct.status !== 'SOLD' && (
                    <button className="reject-btn" type="button" onClick={() => moderateListing(selectedOrderProduct, 'suspend')}>
                      <FaBan /> Suspend
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="detail-empty">
                <FaEye size={48} />
                <p>Select a product row to view details and take action.</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
  };

  const renderOverviewRedesigned = () => (
    <>
      <div className="overview-top-stats">
        <div className="overview-stat-card revenue">
          <div className="overview-stat-label">Revenue</div>
          <div className="overview-stat-value">Rs {(stats.totalRevenue / 100000).toFixed(1)}L</div>
          <div className="overview-stat-sub">+ {stats.monthlyGrowth}%</div>
        </div>
        <div className="overview-stat-card">
          <div className="overview-stat-label">Users</div>
          <div className="overview-stat-value">{stats.totalUsers}</div>
          <div className="overview-stat-sub">+ 0%</div>
        </div>
        <div className="overview-stat-card">
          <div className="overview-stat-label">Orders</div>
          <div className="overview-stat-value">{stats.activeOrders}</div>
          <div className="overview-stat-sub">+ 4 this week</div>
        </div>
        <div className="overview-stat-card alert">
          <div className="overview-stat-label">Alerts</div>
          <div className="overview-stat-value">{stats.fraudReports}</div>
          <div className="overview-stat-sub">Live issues</div>
        </div>
      </div>

      <div className="overview-main-grid">
        <div className="overview-left-col">
          <div className="overview-growth-card">
            <div className="overview-card-head">
              <h3>User Growth</h3>
              <select className="overview-select" value={analyticsWindow} onChange={(e) => setAnalyticsWindow(Number(e.target.value))}>
                <option value={7}>Last 7 Days</option>
                <option value={14}>Last 14 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
            <div className="overview-growth-grid">
              <div className="mini-graph-card">
                <div className="mini-title">Users</div>
                <div className="mini-number">{analytics.totalUsersAdded}</div>
                <div className="mini-bars user-bars">
                  {(analytics.userSeries || []).slice(-7).map((point, i) => (
                    <span key={`${point}-${i}`} style={{ height: `${Math.max(8, point * 5 + 8)}px` }} />
                  ))}
                </div>
              </div>
              <div className="mini-graph-card">
                <div className="mini-title">Orders Trend</div>
                <div className="mini-number">{analytics.totalListingsAdded}</div>
                <div className="mini-bars">
                  {(analytics.listingSeries || []).slice(-7).map((point, i) => (
                    <span key={`${point}-${i}`} style={{ height: `${Math.max(10, point * 8 + 10)}px` }} />
                  ))}
                </div>
              </div>
              <div className="mini-graph-card">
                <div className="mini-title">Fraud Reports</div>
                <div className="mini-number">{analytics.totalFraudReports}</div>
                <div className="mini-bars warning">
                  {(analytics.fraudSeries || []).slice(-7).map((point, i) => (
                    <span key={`${point}-${i}`} style={{ height: `${Math.max(8, point * 10 + 8)}px` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="overview-table-card">
            <div className="overview-table-head">
              <div className="overview-tabs">
                <button className={overviewTab === 'users' ? 'active' : ''} onClick={() => setOverviewTab('users')}>Users</button>
                <button className={overviewTab === 'farmers' ? 'active' : ''} onClick={() => setOverviewTab('farmers')}>Farmers</button>
                <button className={overviewTab === 'orders' ? 'active' : ''} onClick={() => setOverviewTab('orders')}>Orders</button>
              </div>
              <div className="overview-search-inline">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search..."
                  value={overviewSearch}
                  onChange={(e) => setOverviewSearch(e.target.value)}
                />
              </div>
            </div>

            <table className="overview-table">
              <thead>
                <tr>
                  <th>{overviewTab === 'orders' ? 'Product' : 'Farmer'}</th>
                  <th>Owner</th>
                  <th>Location</th>
                  <th>{overviewTab === 'orders' ? 'Category' : 'Crop'}</th>
                  <th>Orders</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overviewRows.length === 0 ? (
                  <tr><td colSpan="7" className="no-data">No records found</td></tr>
                ) : overviewRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="overview-name-cell">
                        <div className="overview-avatar">{String(row.avatar || 'A').charAt(0).toUpperCase()}</div>
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td>{row.owner}</td>
                    <td>{row.location}</td>
                    <td>{row.crop}</td>
                    <td>{row.orders}</td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: `${getStatusColor(row.status)}20`, color: getStatusColor(row.status) }}>
                        {String(row.status || '').toUpperCase()}
                      </span>
                    </td>
                    <td>...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overview-quick-actions">
            <h3>Quick Actions</h3>
            <div className="overview-quick-grid">
              <button type="button" className="overview-quick-btn"><FaUsers /> Add User</button>
              <button type="button" className="overview-quick-btn"><FaTractor /> Add Farmer</button>
              <button type="button" className="overview-quick-btn"><FaFileAlt /> Generate Report</button>
              <button type="button" className="overview-quick-btn"><FaBell /> Broadcast Message</button>
              <button type="button" className="overview-quick-btn"><FaComments /> Briefcast Message</button>
            </div>
          </div>
        </div>

        <aside className="overview-right-col">
          <div className="overview-side-card">
            <div className="overview-side-head">Recent Activity</div>
            <div className="overview-side-list">
              {(recentNotifications || []).slice(0, 4).map((note) => (
                <div key={note.id} className="overview-side-item">
                  <div className="dot" />
                  <div>
                    <div className="title">{note.title}</div>
                    <div className="meta">{new Date(note.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="overview-side-card">
            <div className="overview-side-head">Pending Approvals</div>
            <div className="overview-side-list">
              {[...(pendingManagers || []).slice(0, 2), ...(pendingFarmers || []).slice(0, 2)].map((entry) => (
                <div key={entry.id} className="overview-side-item">
                  <div className="dot green" />
                  <div>
                    <div className="title">{entry.name}</div>
                    <div className="meta">{entry.location || entry.city || 'Pending review'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );

  const markNotificationRead = async (notificationId) => {
    try {
      await notificationApi.put(`/notifications/${notificationId}/read`);
      toast.success('Notification marked as read');
      fetchDashboardData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationApi.put('/notifications/read-all');
      toast.success('All notifications marked as read');
      fetchDashboardData();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const renderProductManagement = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2><FaFileAlt /> Product Management</h2>
        <div className="section-actions">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>
          <select className="filter-btn" value={productStatusFilter} onChange={(e) => setProductStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="SOLD_OUT">Sold Out</option>
          </select>
          <button
            type="button"
            className="filter-btn"
            onClick={() => exportCsv(filteredProducts, [
              { label: 'Title', value: (r) => r.title || r.cropType || 'Unknown' },
              { label: 'Seller', value: (r) => r.sellerName || '' },
              { label: 'Status', value: (r) => r.status || 'UNKNOWN' },
              { label: 'Price', value: (r) => Number(r.pricePerUnit || r.price || 0) },
              { label: 'CreatedAt', value: (r) => r.createdAt || '' }
            ], 'admin-products.csv')}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="management-kpis">
        <div className="kpi-chip"><span>Total Listings</span><strong>{productSummary.total}</strong></div>
        <div className="kpi-chip"><span>Active</span><strong>{productSummary.active}</strong></div>
        <div className="kpi-chip"><span>Draft</span><strong>{productSummary.draft}</strong></div>
        <div className="kpi-chip"><span>Revenue</span><strong>Rs {productSummary.revenue.toLocaleString()}</strong></div>
      </div>
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Seller</th>
              <th>Status</th>
              <th>Price</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan="5" className="no-data">No products found</td></tr>
            ) : filteredProducts.slice(0, 40).map((item) => (
              <tr key={item.id}>
                <td>{item.title || item.cropType || 'Unknown'}</td>
                <td>{item.sellerName || 'N/A'}</td>
                <td>
                  <span className="status-badge" style={{ backgroundColor: `${getStatusColor(item.status)}20`, color: getStatusColor(item.status) }}>
                    {item.status || 'UNKNOWN'}
                  </span>
                </td>
                <td>Rs {Number(item.pricePerUnit || 0).toLocaleString()}</td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMessagesCenter = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2><FaComments /> Messages & Notifications</h2>
        <div className="section-actions">
          <button className="filter-btn" type="button" onClick={markAllNotificationsRead}>Mark all read</button>
        </div>
      </div>
      <p className="section-subtext">Unread: {unreadNotifications}</p>
      <div className="approvals-list">
        {recentNotifications.length === 0 ? (
          <p className="no-data">No notifications available</p>
        ) : recentNotifications.map((note) => (
          <div key={note.id} className={`approval-item ${note.read ? 'note-read' : 'note-unread'}`}>
            <div className="approval-info">
              <span className="farm-name">{note.title}</span>
              <span className="farm-owner">{note.message}</span>
              <span className="farm-date">{new Date(note.createdAt).toLocaleString()} • {note.type}</span>
            </div>
            {!note.read && (
              <div className="approval-actions">
                <button className="approve-btn" type="button" onClick={() => markNotificationRead(note.id)}>Mark read</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettingsPanel = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2><FaCog /> Dashboard Settings</h2>
      </div>
      <div className="settings-grid">
        <label className="setting-item">
          <span>Compact mode</span>
          <input type="checkbox" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />
        </label>
        <label className="setting-item">
          <span>Auto refresh (minutes)</span>
          <select value={autoRefreshMinutes} onChange={(e) => setAutoRefreshMinutes(Number(e.target.value))}>
            <option value={0}>Off</option>
            <option value={1}>1 min</option>
            <option value={5}>5 min</option>
            <option value={15}>15 min</option>
          </select>
        </label>
      </div>
      <p className="section-subtext">Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Not synced yet'}</p>
      {dataHealth.failed.length > 0 && (
        <p className="section-warning">Unavailable modules: {dataHealth.failed.join(', ')}</p>
      )}
    </div>
  );

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className={`admin-dashboard ${compactMode ? 'compact' : ''}`}>
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
          </div>
          <div className="header-search-bar">
            <FaSearch />
            <input type="text" placeholder="Search..." value={overviewSearch} onChange={(e) => setOverviewSearch(e.target.value)} />
          </div>
          <div className="header-actions">
            <button className="header-btn notifications" onClick={fetchDashboardData} title="Refresh data">
              <FaBell />
              <span className="badge">{unreadNotifications}</span>
            </button>
            <button className="header-btn" onClick={() => setActiveSection(SECTIONS.settings)}>
              <FaCog />
            </button>
            <button className="header-profile-btn" type="button">Douglas</button>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          <div className="sidebar-menu">
            <button className={`menu-item ${activeSection === SECTIONS.overview ? 'active' : ''}`} onClick={() => setActiveSection(SECTIONS.overview)}><FaChartLine /> Overview</button>
            <button className={`menu-item ${activeSection === SECTIONS.users ? 'active' : ''}`} onClick={() => setActiveSection(SECTIONS.users)}><FaUsers /> Users</button>
            <button className={`menu-item ${activeSection === SECTIONS.farmers ? 'active' : ''}`} onClick={() => setActiveSection(SECTIONS.farmers)}><FaTractor /> Farmers</button>
            <button className={`menu-item ${activeSection === SECTIONS.approvals ? 'active' : ''}`} onClick={() => setActiveSection(SECTIONS.approvals)}><FaClipboardList /> Approvals</button>
            <button className={`menu-item ${activeSection === SECTIONS.managers ? 'active' : ''}`} onClick={() => setActiveSection(SECTIONS.managers)}><FaUserTie /> Managers</button>
            <button className={`menu-item ${activeSection === SECTIONS.orders ? 'active' : ''}`} onClick={() => setActiveSection(SECTIONS.orders)}><FaShoppingCart /> Orders <span className="menu-count">{stats.activeOrders}</span></button>
            <button className={`menu-item ${activeSection === SECTIONS.fraud ? 'active' : ''}`} onClick={() => setActiveSection(SECTIONS.fraud)}><FaExclamationTriangle /> Fraud Reports</button>
            <button className={`menu-item ${activeSection === SECTIONS.analytics ? 'active' : ''}`} onClick={() => setActiveSection(SECTIONS.analytics)}><FaChartLine /> Analytics</button>
            <button className={`menu-item ${activeSection === SECTIONS.messages ? 'active' : ''}`} onClick={() => setActiveSection(SECTIONS.messages)}><FaComments /> Messages</button>
            <button className={`menu-item ${activeSection === SECTIONS.settings ? 'active' : ''}`} onClick={() => setActiveSection(SECTIONS.settings)}><FaCog /> Settings</button>
          </div>
        </div>

        <div className="dashboard-main">
          {activeSection === SECTIONS.overview && renderOverviewRedesigned()}

          {activeSection === SECTIONS.analytics && (
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-header"><span className="stat-label">Total Revenue</span><FaDollarSign className="stat-icon" /></div>
                <span className="stat-value">Rs {(stats.totalRevenue / 100000).toFixed(1)}L</span>
                <span className="stat-change positive"><FaArrowUp /> {stats.monthlyGrowth}% this month</span>
              </div>
              <div className="stat-card">
                <div className="stat-header"><span className="stat-label">Total Users</span><FaUsers className="stat-icon" /></div>
                <span className="stat-value">{stats.totalUsers.toLocaleString()}</span>
                <span className="stat-change">{stats.totalBuyers.toLocaleString()} buyers, {stats.totalFarmers.toLocaleString()} farmers</span>
              </div>
              <div className="stat-card">
                <div className="stat-header"><span className="stat-label">Active Orders</span><FaShoppingCart className="stat-icon" /></div>
                <span className="stat-value">{stats.activeOrders.toLocaleString()}</span>
                <span className="stat-change positive"><FaArrowUp /> dynamic activity</span>
              </div>
              <div className="stat-card alert">
                <div className="stat-header"><span className="stat-label">Fraud Reports</span><FaExclamationTriangle className="stat-icon" /></div>
                <span className="stat-value">{stats.fraudReports}</span>
                <span className="stat-change">{stats.pendingApprovals} pending farmer approvals</span>
              </div>
            </div>
          )}

          {activeSection === SECTIONS.users && renderUsersTable()}
          {activeSection === SECTIONS.farmers && renderFarmersTable()}

          {(activeSection === SECTIONS.approvals || activeSection === SECTIONS.managers) && (
            <div className="two-column-row">
              {renderManagerApprovals()}
              {activeSection === SECTIONS.approvals && renderFraudCases()}
            </div>
          )}

          {(activeSection === SECTIONS.approvals || activeSection === SECTIONS.farmers) && renderFarmerApprovals()}
          {activeSection === SECTIONS.analytics && renderAnalytics()}
          {activeSection === SECTIONS.fraud && renderFraudCases()}
          {activeSection === SECTIONS.orders && renderOrders()}
          {activeSection === SECTIONS.content && renderProductManagement()}
          {activeSection === SECTIONS.messages && renderMessagesCenter()}
          {activeSection === SECTIONS.settings && renderSettingsPanel()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;