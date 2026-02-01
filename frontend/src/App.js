import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/ToastNotification';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthLayout from './components/AuthLayout';
import './App.css';

// ============================================
// CODE SPLITTING: Lazy load all page components
// This reduces initial bundle from ~1.9MB to ~200KB
// ============================================

// Auth pages (small, load on demand)
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Main public pages (prioritize these)
const Home = lazy(() => import('./pages/Home'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const ListingDetail = lazy(() => import('./pages/ListingDetail'));
const Farmers = lazy(() => import('./pages/Farmers'));
const FarmerProfile = lazy(() => import('./pages/FarmerProfile'));
const Deals = lazy(() => import('./pages/Deals'));

// Cart & Checkout (load when needed)
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Checkout = lazy(() => import('./pages/Checkout'));

// Orders (load when needed)
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));

// Dashboard pages (load when user navigates)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard'));
const FarmerDashboard = lazy(() => import('./pages/FarmerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));

// Farm pages
const Farms = lazy(() => import('./pages/Farms'));
const FarmDetail = lazy(() => import('./pages/FarmDetail'));
const CreateFarm = lazy(() => import('./pages/CreateFarm'));

// Farmer management pages
const CreateListing = lazy(() => import('./pages/CreateListing'));
const EditListing = lazy(() => import('./pages/EditListing'));
const FarmerProducts = lazy(() => import('./pages/FarmerProducts'));
const FarmerFollowers = lazy(() => import('./pages/FarmerFollowers'));
const FarmerOrders = lazy(() => import('./pages/FarmerOrders'));

// Other pages
const Devices = lazy(() => import('./pages/Devices'));
const Messages = lazy(() => import('./pages/Messages'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfileOnboarding = lazy(() => import('./pages/ProfileOnboarding'));

// Loading fallback component - lightweight
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh',
    flexDirection: 'column',
    gap: '12px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #e5e7eb',
      borderTopColor: '#16a34a',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <ToastProvider>
        <Router>
          <div className="app">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Auth Routes - with AuthLayout */}
                <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
                <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
                <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
                <Route path="/reset-password" element={<AuthLayout><ResetPassword /></AuthLayout>} />
                
                {/* All other routes wrapped with Navbar */}
                <Route path="/*" element={<AppContent />} />
              </Routes>
            </Suspense>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </div>
        </Router>
      </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

// Separate component for routes with Navbar
const AppContent = () => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<ListingDetail />} />
              <Route path="/marketplace/listing/:id" element={<ListingDetail />} />
              <Route path="/farmers" element={<Farmers />} />
              <Route path="/farmers/:farmerId" element={<FarmerProfile />} />
              <Route path="/deals" element={<Deals />} />
              {/* Cart and Wishlist - Public with guest support */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/buyer/dashboard" element={
                <PrivateRoute>
                  <BuyerDashboard />
                </PrivateRoute>
              } />
              <Route path="/farmer/dashboard" element={
                <PrivateRoute>
                  <FarmerDashboard />
                </PrivateRoute>
              } />
              <Route path="/admin/dashboard" element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/farms" element={
                <PrivateRoute>
                  <Farms />
                </PrivateRoute>
              } />
              <Route path="/farms/create" element={
                <PrivateRoute>
                  <CreateFarm />
                </PrivateRoute>
              } />
              <Route path="/farms/:id" element={
                <PrivateRoute>
                  <FarmDetail />
                </PrivateRoute>
              } />
              <Route path="/orders" element={
                <PrivateRoute>
                  <Orders />
                </PrivateRoute>
              } />
              <Route path="/orders/:orderId" element={
                <PrivateRoute>
                  <OrderDetail />
                </PrivateRoute>
              } />
              <Route path="/order-confirmation/:orderId" element={
                <PrivateRoute>
                  <OrderConfirmation />
                </PrivateRoute>
              } />
              <Route path="/marketplace/create" element={
                <PrivateRoute>
                  <CreateListing />
                </PrivateRoute>
              } />
              <Route path="/marketplace/edit/:id" element={
                <PrivateRoute>
                  <EditListing />
                </PrivateRoute>
              } />
              <Route path="/farmer/products" element={
                <PrivateRoute>
                  <FarmerProducts />
                </PrivateRoute>
              } />
              <Route path="/farmer/followers" element={
                <PrivateRoute>
                  <FarmerFollowers />
                </PrivateRoute>
              } />
              <Route path="/farmer/orders" element={
                <PrivateRoute>
                  <FarmerOrders />
                </PrivateRoute>
              } />
              <Route path="/checkout" element={
                <PrivateRoute>
                  <Checkout />
                </PrivateRoute>
              } />
              <Route path="/devices" element={
                <PrivateRoute>
                  <Devices />
                </PrivateRoute>
              } />
              <Route path="/messages" element={
                <PrivateRoute>
                  <Messages />
                </PrivateRoute>
              } />
              <Route path="/messages/:conversationId" element={
                <PrivateRoute>
                  <Messages />
                </PrivateRoute>
              } />
              <Route path="/analytics" element={
                <PrivateRoute>
                  <Analytics />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/profile/onboarding" element={
                <PrivateRoute>
                  <ProfileOnboarding />
                </PrivateRoute>
              } />
              <Route path="/manager/dashboard" element={
                <PrivateRoute>
                  <ManagerDashboard />
                </PrivateRoute>
              } />
              
              {/* Default Routes */}
              <Route path="/" element={<Home />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      <Footer />
    </>
  );
};

export default App;
