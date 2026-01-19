import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import FarmDetail from './pages/FarmDetail';
import CreateFarm from './pages/CreateFarm';
import Orders from './pages/Orders';
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
import Deals from './pages/Deals';
import BuyerDashboard from './pages/BuyerDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateListing from './pages/CreateListing';
import FarmerProducts from './pages/FarmerProducts';
import EditListing from './pages/EditListing';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<ListingDetail />} />
              <Route path="/farmers" element={<Farmers />} />
              <Route path="/deals" element={<Deals />} />
              
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
              <Route path="/marketplace/listing/:id" element={
                <PrivateRoute>
                  <ListingDetail />
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
              <Route path="/cart" element={
                <PrivateRoute>
                  <Cart />
                </PrivateRoute>
              } />
              <Route path="/wishlist" element={
                <PrivateRoute>
                  <Wishlist />
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
              
              {/* Default Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
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
    </AuthProvider>
  );
}

export default App;
