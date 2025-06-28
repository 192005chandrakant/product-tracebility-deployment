import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Home from './pages/Home';
import QRScan from './pages/QRScan';
import ProductDetail from './pages/ProductDetail';
import AdminDashboard from './pages/AdminDashboard';
import AddProduct from './pages/AddProduct';
import UpdateProduct from './pages/UpdateProduct';
import AuthLogin from './pages/AuthLogin';
import AuthRegister from './pages/AuthRegister';
import UserProfile from './pages/UserProfile';
import Layout from './components/Layout';
import Landing from './pages/Landing';

function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/auth/login" />;
  
  try {
    // Use jwtDecode instead of manual parsing
    const decoded = jwtDecode(token);
    const { role } = decoded;
    
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return <Navigate to="/auth/login" />;
    }
    
    // Check if user role is allowed
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/auth/login" />;
    }
    
    return children;
  } catch (error) {
    console.error('Token parsing error:', error);
    localStorage.removeItem('token');
    return <Navigate to="/auth/login" />;
  }
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<PrivateRoute allowedRoles={['admin', 'producer', 'consumer']}><Home /></PrivateRoute>} />
        <Route path="/scan" element={<QRScan />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/profile" element={<PrivateRoute allowedRoles={['admin', 'producer', 'consumer', 'customer', 'user']}><UserProfile /></PrivateRoute>} />
        <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['admin','producer']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/add" element={<PrivateRoute allowedRoles={['producer']}><AddProduct /></PrivateRoute>} />
        <Route path="/admin/update" element={<PrivateRoute allowedRoles={['producer']}><UpdateProduct /></PrivateRoute>} />
        <Route path="/auth/login" element={<AuthLogin />} />
        <Route path="/auth/register" element={<AuthRegister />} />
      </Routes>
    </Layout>
  );
}

export default App;
 