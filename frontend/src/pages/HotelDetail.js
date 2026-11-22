// Location: frontend/src/pages/HotelDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import '../styles/HotelDetail.css';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHotel();
  }, [id]);

  const fetchHotel = async () => {
    try {
      const response = await apiClient.get(`/hotels/${id}`);
      setHotel(response.data.data.hotel);
    } catch (err) {
      console.error('Error fetching hotel:', err);
      setError('Failed to load hotel details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHotel = async () => {
    if (!window.confirm(`Are you sure you want to delete "${hotel.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/hotels/${id}`);
      navigate('/hotels');
    } catch (err) {
      console.error('Error deleting hotel:', err);
      alert('Failed to delete hotel. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="hotel-detail-container">
        <div className="loading-state">Loading hotel details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hotel-detail-container">
        <div className="error-message">{error}</div>
        <Link to="/hotels" className="back-link">← Back to Hotels</Link>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="hotel-detail-container">
        <div className="error-message">Hotel not found.</div>
        <Link to="/hotels" className="back-link">← Back to Hotels</Link>
      </div>
    );
  }

  // Calculate average rate
  const avgRate = hotel.roomTypes && hotel.roomTypes.length > 0
    ? hotel.roomTypes.reduce((sum, rt) => sum + (rt.baseRate || 0), 0) / hotel.roomTypes.length
    : 0;

  return (
    <div className="hotel-detail-container">
      <div className="back-nav">
        <Link to="/hotels" className="back-link">← Back to Hotels</Link>
      </div>

      <div className="hotel-header">
        <div className="hotel-title">
          <h1>{hotel.name}</h1>
          {hotel.starRating > 0 && (
            <span className="star-badge">{hotel.starRating} ⭐</span>
          )}
        </div>
        <div className="hotel-actions">
          <Link to={`/hotels/${id}/edit`} className="btn btn-secondary">Edit Hotel</Link>
          <Link to={`/star-report`} className="btn btn-primary">Generate Market Report</Link>
          <button className="btn btn-danger" onClick={handleDeleteHotel}>Delete</button>
        </div>
      </div>

      <div className="hotel-content">
        {/* Overview Section */}
        <div className="detail-section overview-section">
          <h2>Overview</h2>
          <div className="overview-grid">
            <div className="overview-item">
              <span className="overview-label">Location</span>
              <span className="overview-value">
                {hotel.street && `${hotel.street}, `}
                {hotel.city}
                {hotel.state && `, ${hotel.state}`}
                {hotel.zipCode && ` ${hotel.zipCode}`}
                {hotel.country && `, ${hotel.country}`}
              </span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Room Types</span>
              <span className="overview-value">{hotel.roomTypes?.length || 0}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Average Rate</span>
              <span className="overview-value highlight">${avgRate.toFixed(2)}/night</span>
            </div>
          </div>
        </div>

        {/* Room Types Section */}
        <div className="detail-section">
          <div className="section-header">
            <h2>Room Types & Rates</h2>
          </div>

          {hotel.roomTypes && hotel.roomTypes.length > 0 ? (
            <div className="room-types-grid">
              {hotel.roomTypes.map((room) => (
                <div key={room.id} className="room-type-card">
                  <div className="room-type-header">
                    <h3>{room.name}</h3>
                    <span className="room-rate">${room.baseRate}/night</span>
                  </div>
                  <div className="room-type-details">
                    <p><strong>Max Occupancy:</strong> {room.maxOccupancy || 2} guests</p>
                    {room.description && <p>{room.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-rooms">
              <p>No room types defined yet.</p>
              <Link to={`/hotels/${id}/edit`} className="btn btn-primary">Add Room Types</Link>
            </div>
          )}
        </div>

        {/* Amenities Section */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="detail-section">
            <h2>Amenities</h2>
            <div className="amenities-list">
              {hotel.amenities.map((amenity, index) => (
                <span key={index} className="amenity-tag">{amenity}</span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="detail-section quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/competitors" className="action-card">
              <span className="action-icon">🔍</span>
              <span className="action-title">Competitor Analysis</span>
              <span className="action-desc">Search for competitor hotels in {hotel.city}</span>
            </Link>
            <Link to="/star-report" className="action-card">
              <span className="action-icon">📊</span>
              <span className="action-title">Market Report</span>
              <span className="action-desc">Compare your rates against the market</span>
            </Link>
            <Link to="/pricing" className="action-card">
              <span className="action-icon">💰</span>
              <span className="action-title">Pricing Recommendations</span>
              <span className="action-desc">Get AI-powered pricing suggestions</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetail;
