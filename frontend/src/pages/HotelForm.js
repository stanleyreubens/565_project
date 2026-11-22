// Location: frontend/src/pages/HotelForm.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import '../styles/HotelForm.css';

const HotelForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // API Import state
  const [importMode, setImportMode] = useState(!isEditMode); // Start in import mode for new hotels
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [importingHotel, setImportingHotel] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    starRating: 3,
    amenities: [],
    roomTypes: []
  });

  const [newAmenity, setNewAmenity] = useState('');
  const [newRoomType, setNewRoomType] = useState({
    name: '',
    baseRate: '',
    maxOccupancy: 2,
    description: ''
  });

  // Common amenities for quick selection
  const commonAmenities = [
    'WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Room Service',
    'Parking', 'Business Center', 'Concierge', 'Laundry', 'Air Conditioning',
    'Pet Friendly', 'Beach Access', 'Airport Shuttle'
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchHotel();
    }
  }, [id]);

  const fetchHotel = async () => {
    try {
      const response = await apiClient.get(`/hotels/${id}`);
      const hotel = response.data.data.hotel;
      setFormData({
        name: hotel.name || '',
        street: hotel.street || '',
        city: hotel.city || '',
        state: hotel.state || '',
        zipCode: hotel.zipCode || '',
        country: hotel.country || 'USA',
        starRating: hotel.starRating || 3,
        amenities: hotel.amenities || [],
        roomTypes: hotel.roomTypes || []
      });
      setImportMode(false);
    } catch (err) {
      setError('Failed to load hotel data');
    } finally {
      setFetchLoading(false);
    }
  };

  // Search hotels from Booking.com API
  const handleSearchHotels = async (e) => {
    e.preventDefault();
    if (!searchCity.trim()) return;

    setSearchLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const response = await apiClient.get('/hotels/import/search', {
        params: { city: searchCity }
      });

      const data = response.data.data;
      if (data.status && data.hotels && data.hotels.length > 0) {
        setSearchResults(data.hotels);
      } else {
        setError(`No hotels found in "${searchCity}". Try a different city name.`);
      }
    } catch (err) {
      console.error('Error searching hotels:', err);
      setError(err.response?.data?.message || 'Failed to search hotels');
    } finally {
      setSearchLoading(false);
    }
  };

  // Import hotel from API
  const handleImportHotel = async (hotel) => {
    setImportingHotel(hotel.hotelId);
    setError('');

    try {
      // Get room types and rates for this hotel
      const response = await apiClient.get(`/hotels/import/${hotel.hotelId}`);
      const data = response.data.data;

      if (data.status && data.roomTypes && data.roomTypes.length > 0) {
        // Populate form with imported data
        setFormData({
          name: hotel.name,
          street: hotel.address || '',
          city: hotel.city || searchCity,
          state: '',
          zipCode: '',
          country: 'USA',
          starRating: hotel.starRating || 3,
          amenities: [],
          roomTypes: data.roomTypes.map(rt => ({
            name: rt.name,
            baseRate: parseFloat(rt.baseRate) || 0,
            maxOccupancy: rt.maxOccupancy || 2,
            description: rt.description || ''
          }))
        });
        setImportMode(false);
        setSuccess(`Imported "${hotel.name}" with ${data.roomTypes.length} room types. Review and save below.`);
      } else {
        setError('Could not fetch room details for this hotel. Try another hotel or enter details manually.');
      }
    } catch (err) {
      console.error('Error importing hotel:', err);
      setError(err.response?.data?.message || 'Failed to import hotel details');
    } finally {
      setImportingHotel(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleAddCustomAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleRoomTypeChange = (e) => {
    const { name, value } = e.target;
    setNewRoomType(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddRoomType = () => {
    if (newRoomType.name && newRoomType.baseRate) {
      setFormData(prev => ({
        ...prev,
        roomTypes: [...prev.roomTypes, {
          ...newRoomType,
          baseRate: parseFloat(newRoomType.baseRate),
          maxOccupancy: parseInt(newRoomType.maxOccupancy)
        }]
      }));
      setNewRoomType({
        name: '',
        baseRate: '',
        maxOccupancy: 2,
        description: ''
      });
    }
  };

  const handleRemoveRoomType = (index) => {
    setFormData(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name || !formData.city) {
      setError('Hotel name and city are required');
      setLoading(false);
      return;
    }

    if (formData.roomTypes.length === 0) {
      setError('Please add at least one room type with a base rate');
      setLoading(false);
      return;
    }

    try {
      if (isEditMode) {
        await apiClient.put(`/hotels/${id}`, formData);
        setSuccess('Hotel updated successfully!');
      } else {
        await apiClient.post('/hotels', formData);
        setSuccess('Hotel created successfully!');
      }

      setTimeout(() => {
        navigate('/hotels');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save hotel');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="loading-container">Loading hotel data...</div>;
  }

  return (
    <div className="hotel-form-container">
      <h1>{isEditMode ? 'Edit Hotel' : 'Add New Hotel'}</h1>

      {!isEditMode && (
        <div className="mode-toggle">
          <button
            type="button"
            className={`mode-btn ${importMode ? 'active' : ''}`}
            onClick={() => setImportMode(true)}
          >
            Import from Booking.com
          </button>
          <button
            type="button"
            className={`mode-btn ${!importMode ? 'active' : ''}`}
            onClick={() => setImportMode(false)}
          >
            Enter Manually
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Import Section */}
      {importMode && !isEditMode && (
        <div className="import-section">
          <div className="form-section">
            <h2>Search Hotels to Import</h2>
            <p className="section-description">
              Search for your hotel on Booking.com to automatically import room types and current rates.
            </p>

            <form onSubmit={handleSearchHotels} className="search-form">
              <div className="form-group">
                <label>City Name</label>
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="e.g., Miami, New York, Los Angeles"
                  required
                />
              </div>
              <button type="submit" className="search-btn" disabled={searchLoading}>
                {searchLoading ? 'Searching...' : 'Search Hotels'}
              </button>
            </form>
          </div>

          {searchResults.length > 0 && (
            <div className="form-section search-results">
              <h2>Select Your Hotel ({searchResults.length} found)</h2>
              <div className="hotel-results-grid">
                {searchResults.map((hotel) => (
                  <div key={hotel.hotelId} className="hotel-result-card">
                    <div className="hotel-result-info">
                      <h3>{hotel.name}</h3>
                      {hotel.starRating > 0 && (
                        <span className="star-rating">{hotel.starRating} ⭐</span>
                      )}
                      <p className="hotel-address">{hotel.address || hotel.city}</p>
                      {hotel.pricePerNight > 0 && (
                        <p className="hotel-price">~${hotel.pricePerNight.toFixed(0)}/night</p>
                      )}
                      {hotel.reviewScore > 0 && (
                        <p className="hotel-review">Rating: {hotel.reviewScore}/10</p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="import-btn"
                      onClick={() => handleImportHotel(hotel)}
                      disabled={importingHotel === hotel.hotelId}
                    >
                      {importingHotel === hotel.hotelId ? 'Importing...' : 'Import This Hotel'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="manual-entry-prompt">
            <p>Can't find your hotel? <button type="button" onClick={() => setImportMode(false)}>Enter details manually</button></p>
          </div>
        </div>
      )}

      {/* Manual Entry Form */}
      {!importMode && (
        <form onSubmit={handleSubmit}>
          <p className="form-description">
            {isEditMode
              ? 'Update your hotel information below.'
              : 'Enter your hotel details below. Make sure to add room types with base rates for accurate market comparison.'}
          </p>

          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="name">Hotel Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter hotel name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="starRating">Star Rating</label>
              <select
                id="starRating"
                name="starRating"
                value={formData.starRating}
                onChange={handleChange}
              >
                <option value={1}>1 Star</option>
                <option value={2}>2 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={5}>5 Stars</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="form-section">
            <h2>Address</h2>

            <div className="form-group">
              <label htmlFor="street">Street Address</label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="123 Main Street"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City name"
                  required
                />
                <small>This is used to find competitors in your market</small>
              </div>

              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="zipCode">Zip Code</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="12345"
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="USA"
                />
              </div>
            </div>
          </div>

          {/* Room Types - Most Important */}
          <div className="form-section room-types-section">
            <h2>Room Types & Rates *</h2>
            <p className="section-description">
              Add your room types with base rates. This is essential for calculating your ADR and comparing against competitors.
            </p>

            {formData.roomTypes.length > 0 && (
              <div className="room-types-list">
                {formData.roomTypes.map((room, index) => (
                  <div key={index} className="room-type-item">
                    <div className="room-type-info">
                      <strong>{room.name}</strong>
                      <span className="room-rate">${room.baseRate}/night</span>
                      <span className="room-occupancy">Max {room.maxOccupancy} guests</span>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveRoomType(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="add-room-type">
              <h4>Add Room Type</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Room Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newRoomType.name}
                    onChange={handleRoomTypeChange}
                    placeholder="e.g., Standard Room, Deluxe Suite"
                  />
                </div>
                <div className="form-group">
                  <label>Base Rate ($/night)</label>
                  <input
                    type="number"
                    name="baseRate"
                    value={newRoomType.baseRate}
                    onChange={handleRoomTypeChange}
                    placeholder="150"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Max Occupancy</label>
                  <input
                    type="number"
                    name="maxOccupancy"
                    value={newRoomType.maxOccupancy}
                    onChange={handleRoomTypeChange}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              <button
                type="button"
                className="add-btn"
                onClick={handleAddRoomType}
                disabled={!newRoomType.name || !newRoomType.baseRate}
              >
                + Add Room Type
              </button>
            </div>
          </div>

          {/* Amenities */}
          <div className="form-section">
            <h2>Amenities</h2>

            <div className="amenities-grid">
              {commonAmenities.map(amenity => (
                <label key={amenity} className="amenity-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                  />
                  {amenity}
                </label>
              ))}
            </div>

            <div className="custom-amenity">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add custom amenity"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomAmenity())}
              />
              <button type="button" onClick={handleAddCustomAmenity}>Add</button>
            </div>

            {formData.amenities.filter(a => !commonAmenities.includes(a)).length > 0 && (
              <div className="custom-amenities-list">
                <h4>Custom Amenities:</h4>
                {formData.amenities.filter(a => !commonAmenities.includes(a)).map(amenity => (
                  <span key={amenity} className="custom-amenity-tag">
                    {amenity}
                    <button type="button" onClick={() => handleRemoveAmenity(amenity)}>&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/hotels')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Hotel' : 'Create Hotel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HotelForm;
