import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ToastNotification';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthLayout from './components/AuthLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import FarmDetail from './pages/FarmDetail';
import CreateFarm from './pages/CreateFarm';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderConfirmation from './pages/OrderConfirmation';
import Marketplace from './pages/Marketplace';
import Devices from './pages/Devices';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import ListingDetail from './pages/ListingDetail';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Farmers from './pages/Farmers';
import FarmerProfile from './pages/FarmerProfile';
import Deals from './pages/Deals';
import BuyerDashboard from './pages/BuyerDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import CreateListing from './pages/CreateListing';
import FarmerProducts from './pages/FarmerProducts';
import FarmerFollowers from './pages/FarmerFollowers';
import FarmerOrders from './pages/FarmerOrders';
import EditListing from './pages/EditListing';
import ProfileOnboarding from './pages/ProfileOnboarding';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Auth Routes - with AuthLayout */}
              <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
              <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
              <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
              <Route path="/reset-password" element={<AuthLayout><ResetPassword /></AuthLayout>} />
              
              {/* All other routes wrapped with Navbar */}
              <Route path="/*" element={<AppContent />} />
            </Routes>
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
    </AuthProvider>
  );
}

// Separate component for routes with Navbar
const AppContent = () => {
  return (
    <>
      <Navbar />
      <main className="main-content">
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
          </main>
      <Footer />
    </>
  );
};

export default App;
