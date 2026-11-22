// Location: frontend/src/pages/HotelList.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import '../styles/HotelList.css';

const HotelList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await apiClient.get('/hotels');
      setHotels(response.data.data.hotels || []);
    } catch (err) {
      console.error('Error fetching hotels:', err);
      setError('Failed to load hotels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHotel = async (hotelId, hotelName) => {
    if (!window.confirm(`Are you sure you want to delete "${hotelName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/hotels/${hotelId}`);
      setHotels(hotels.filter(h => h.id !== hotelId));
    } catch (err) {
      console.error('Error deleting hotel:', err);
      alert('Failed to delete hotel. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="hotel-list-container">
        <div className="loading-state">Loading your hotels...</div>
      </div>
    );
  }

  return (
    <div className="hotel-list-container">
      <div className="page-header">
        <div>
          <h1>Your Hotels</h1>
          <p className="header-description">Manage your hotel properties and their room types</p>
        </div>
        <Link to="/hotels/new" className="add-hotel-btn">+ Add New Hotel</Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {hotels.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏨</div>
          <h2>No Hotels Yet</h2>
          <p>Add your first hotel to start tracking competitor prices and generating market reports.</p>
          <Link to="/hotels/new" className="add-hotel-btn">+ Add Your First Hotel</Link>
        </div>
      ) : (
        <div className="hotel-grid">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="hotel-card">
              <div className="hotel-card-header">
                <h2>{hotel.name}</h2>
                {hotel.starRating > 0 && (
                  <span className="star-rating">{hotel.starRating} ⭐</span>
                )}
              </div>

              <div className="hotel-card-body">
                <p className="hotel-location">
                  📍 {hotel.city}{hotel.state ? `, ${hotel.state}` : ''}{hotel.country ? `, ${hotel.country}` : ''}
                </p>

                <div className="hotel-stats">
                  <div className="stat">
                    <span className="stat-value">{hotel.roomTypes?.length || 0}</span>
                    <span className="stat-label">Room Types</span>
                  </div>
                  {hotel.roomTypes && hotel.roomTypes.length > 0 && (
                    <div className="stat">
                      <span className="stat-value">
                        ${(hotel.roomTypes.reduce((sum, rt) => sum + (rt.baseRate || 0), 0) / hotel.roomTypes.length).toFixed(0)}
                      </span>
                      <span className="stat-label">Avg. Rate</span>
                    </div>
                  )}
                </div>

                {hotel.roomTypes && hotel.roomTypes.length > 0 && (
                  <div className="room-types-preview">
                    {hotel.roomTypes.slice(0, 3).map((room, idx) => (
                      <span key={idx} className="room-tag">
                        {room.name}: ${room.baseRate}
                      </span>
                    ))}
                    {hotel.roomTypes.length > 3 && (
                      <span className="more-rooms">+{hotel.roomTypes.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>

              <div className="hotel-card-actions">
                <Link to={`/hotels/${hotel.id}`} className="btn btn-primary">View Details</Link>
                <Link to={`/hotels/${hotel.id}/edit`} className="btn btn-secondary">Edit</Link>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteHotel(hotel.id, hotel.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HotelList;
