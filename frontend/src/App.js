// Location: frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import HotelList from './pages/HotelList';
import HotelDetail from './pages/HotelDetail';
import HotelForm from './pages/HotelForm';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
import EventsCalendar from './pages/EventsCalendar';
import PricingRecommendations from './pages/PricingRecommendations';
import StarReport from './pages/StarReport';
import SmerfCalendar from './pages/SmerfCalendar';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} /> {/* Keep this as a fallback */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes directly under root as in your original working version */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="hotels" element={<HotelList />} />
            <Route path="hotels/new" element={<HotelForm />} />
            <Route path="hotels/:id" element={<HotelDetail />} />
            <Route path="hotels/:id/edit" element={<HotelForm />} />
            <Route path="competitors" element={<CompetitorAnalysis />} />
            <Route path="events" element={<EventsCalendar />} />
            <Route path="pricing" element={<PricingRecommendations />} />
            <Route path="star-report" element={<StarReport />} />
            <Route path="smerf" element={<SmerfCalendar />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;