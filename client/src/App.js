import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import QRScan from './pages/QRScan';
import ProductDetail from './pages/ProductDetail';
import AdminDashboard from './pages/AdminDashboard';
import AddProduct from './pages/AddProduct';
import UpdateProduct from './pages/UpdateProduct';
import AuthLogin from './pages/AuthLogin';
import AuthRegister from './pages/AuthRegister';
import Layout from './components/Layout';
import Landing from './pages/Landing';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/scan" element={<QRScan />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/add" element={<AddProduct />} />
        <Route path="/admin/update" element={<UpdateProduct />} />
        <Route path="/auth/login" element={<AuthLogin />} />
        <Route path="/auth/register" element={<AuthRegister />} />
      </Routes>
    </Layout>
  );
}

export default App;
 