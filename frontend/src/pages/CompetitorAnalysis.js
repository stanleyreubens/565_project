// Location: frontend/src/pages/CompetitorAnalysis.js

import React, { useState } from 'react';
import { useCompetitors } from '../hooks/useCompetitors';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/CompetitorAnalysis.css';

const CompetitorAnalysis = () => {
  const {
    competitors,
    loading,
    error,
    cityName,
    nights,
    provider,
    fetchCompetitors,
    selectedHotelAvailability,
    availabilityLoading,
    fetchRoomAvailability,
    priceComparison,
    priceComparisonLoading,
    fetchPriceComparison,
    clearAvailability
  } = useCompetitors();

  const isMultiOta = provider?.supportsOtaBreakdown === true;

  const [selectedHotel, setSelectedHotel] = useState(null);
  
  // Get tomorrow's date for default check-in
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get date 10 days from tomorrow for default check-out
  const tenDaysLater = new Date(tomorrow);
  tenDaysLater.setDate(tenDaysLater.getDate() + 9);
  
  const [searchParams, setSearchParams] = useState({
    city: '',
    checkInDate: tomorrow.toISOString().split('T')[0],
    checkOutDate: tenDaysLater.toISOString().split('T')[0]
  });
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchParams.city) return;
    setSelectedHotel(null);
    clearAvailability();

    await fetchCompetitors(
      searchParams.city,
      searchParams.checkInDate,
      searchParams.checkOutDate
    );
  };

  const handleViewAvailability = async (hotel) => {
    setSelectedHotel(hotel);
    if (isMultiOta) {
      await fetchPriceComparison(
        hotel.googleEntityUrl || hotel.hotelId,
        searchParams.checkInDate,
        searchParams.checkOutDate,
        searchParams.city
      );
    } else {
      await fetchRoomAvailability(
        hotel.hotelId,
        searchParams.checkInDate,
        searchParams.checkOutDate
      );
    }
  };

  const handleCloseAvailability = () => {
    setSelectedHotel(null);
    clearAvailability();
  };
  
  // Format data for competitor price chart - limit to top 20 hotels by price
  const competitorPriceData = competitors
    .filter(comp => comp.pricePerNight > 0) // Filter out hotels with no price
    .sort((a, b) => a.pricePerNight - b.pricePerNight)
    .slice(0, 20) // Show only the first 20 hotels for better visualization
    .map(comp => ({
      name: comp.name.substring(0, 15) + (comp.name.length > 15 ? '...' : ''),
      price: parseFloat(comp.pricePerNight),
      rating: comp.starRating || 0
    }));
  
  // Calculate average, min, max prices (only for hotels with prices)
  const hotelsWithPrices = competitors.filter(comp => comp.pricePerNight > 0);
  const avgPrice = hotelsWithPrices.length ? 
    hotelsWithPrices.reduce((sum, comp) => sum + parseFloat(comp.pricePerNight), 0) / hotelsWithPrices.length : 0;
  
  const minPrice = hotelsWithPrices.length ? 
    Math.min(...hotelsWithPrices.map(comp => parseFloat(comp.pricePerNight))) : 0;
  
  const maxPrice = hotelsWithPrices.length ? 
    Math.max(...hotelsWithPrices.map(comp => parseFloat(comp.pricePerNight))) : 0;
  
  return (
    <div className="competitor-analysis-container">
      <h1>Hotel Market Analysis</h1>
      {provider && (
        <div className="provider-badge" style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: 12,
          fontSize: 12,
          background: isMultiOta ? '#e7f0ff' : '#eef7ee',
          color: isMultiOta ? '#1857c4' : '#1e7a3b',
          marginBottom: 12
        }}>
          Data source: {provider.label}
        </div>
      )}

      <div className="search-container">
        <form onSubmit={handleSearch}>
          <div className="search-group">
            <label>City</label>
            <input 
              type="text" 
              value={searchParams.city} 
              onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
              required
              placeholder="Enter city name (e.g., Bowie, Maryland)"
            />
          </div>
          
          <div className="search-group">
            <label>Check-In Date</label>
            <input 
              type="date" 
              value={searchParams.checkInDate} 
              onChange={(e) => setSearchParams({ ...searchParams, checkInDate: e.target.value })}
              required
            />
          </div>
          
          <div className="search-group">
            <label>Check-Out Date</label>
            <input 
              type="date" 
              value={searchParams.checkOutDate} 
              onChange={(e) => setSearchParams({ ...searchParams, checkOutDate: e.target.value })}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search Hotels'}
          </button>
        </form>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {competitors.length > 0 && (
        <>
          <h2>Hotel Prices in {cityName}</h2>
          <p className="stay-info">Showing prices for {nights} night{nights !== 1 ? 's' : ''} ({searchParams.checkInDate} to {searchParams.checkOutDate})</p>
          
          <div className="price-metrics">
            <div className="metric-box">
              <h3>Average Price/Night</h3>
              <p>${avgPrice.toFixed(2)}</p>
            </div>
            <div className="metric-box">
              <h3>Lowest Price/Night</h3>
              <p>${minPrice.toFixed(2)}</p>
            </div>
            <div className="metric-box">
              <h3>Highest Price/Night</h3>
              <p>${maxPrice.toFixed(2)}</p>
            </div>
            <div className="metric-box">
              <h3>Hotels Found</h3>
              <p>{competitors.length}</p>
            </div>
          </div>
          
          <div className="chart-container">
            <h3>Hotel Price Comparison (Per Night)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={competitorPriceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [`$${value.toFixed(2)}`, name]}
                  labelFormatter={(value) => `Hotel: ${value}`}
                />
                <Legend />
                <Bar dataKey="price" fill="#8884d8" name="Price/Night ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="competitors-table">
            <h3>Detailed Hotel Information</h3>
            <table>
              <thead>
                <tr>
                  <th>Hotel Name</th>
                  <th>Star Rating</th>
                  <th>Price/Night</th>
                  <th>Total Price</th>
                  <th>Room Types</th>
                  <th>Amenities</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((hotel, index) => (
                  <tr key={index}>
                    <td>{hotel.name}</td>
                    <td>{hotel.starRating > 0 ? `${hotel.starRating} ⭐` : 'N/A'}</td>
                    <td>${parseFloat(hotel.pricePerNight).toFixed(2)}</td>
                    <td>${parseFloat(hotel.totalPrice).toFixed(2)}</td>
                    <td>
                      <div className="room-types">
                        {hotel.roomTypes && hotel.roomTypes.length > 0
                          ? hotel.roomTypes.join(', ')
                          : 'Standard Room'}
                      </div>
                    </td>
                    <td>
                      <div className="amenities">
                        {hotel.amenities && hotel.amenities.length > 0
                          ? hotel.amenities.join(', ')
                          : 'Information not available'}
                      </div>
                    </td>
                    <td>
                      <button
                        className="view-availability-btn"
                        onClick={() => handleViewAvailability(hotel)}
                        disabled={
                          (isMultiOta
                            ? priceComparisonLoading
                            : availabilityLoading) &&
                          selectedHotel?.hotelId === hotel.hotelId
                        }
                      >
                        {(isMultiOta ? priceComparisonLoading : availabilityLoading) &&
                        selectedHotel?.hotelId === hotel.hotelId
                          ? 'Loading...'
                          : isMultiOta
                          ? 'View OTA Prices'
                          : 'View Rooms'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* OTA Price Comparison Modal (HotelLens) */}
          {selectedHotel && priceComparison && (
            <div className="availability-modal-overlay" onClick={handleCloseAvailability}>
              <div className="availability-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>OTA Price Comparison - {priceComparison.hotelName || selectedHotel.name}</h3>
                  <button className="close-btn" onClick={handleCloseAvailability}>&times;</button>
                </div>

                {priceComparison.error ? (
                  <div className="error-message">{priceComparison.error}</div>
                ) : (
                  <div className="modal-content">
                    <div className="availability-summary">
                      <div className="summary-item available">
                        <span className="count">{priceComparison.offers?.length || 0}</span>
                        <span className="label">Vendors</span>
                      </div>
                      <div className="summary-item available">
                        <span className="count">
                          ${priceComparison.headlinePrice?.toFixed?.(2) || priceComparison.headlinePrice || 0}
                        </span>
                        <span className="label">Best Price</span>
                      </div>
                      <div className="summary-item">
                        <span className="count">{priceComparison.nights || nights}</span>
                        <span className="label">Night{(priceComparison.nights || nights) !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {priceComparison.address && (
                      <p style={{ color: '#666', marginBottom: 12 }}>{priceComparison.address}</p>
                    )}

                    {priceComparison.offers?.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                            <th style={{ padding: 8 }}>Provider</th>
                            <th style={{ padding: 8 }}>Nightly</th>
                            <th style={{ padding: 8 }}>Total</th>
                            <th style={{ padding: 8 }}>Cancellation</th>
                            <th style={{ padding: 8 }}>Book</th>
                          </tr>
                        </thead>
                        <tbody>
                          {priceComparison.offers
                            .slice()
                            .sort((a, b) => (a.nightlyPrice || 0) - (b.nightlyPrice || 0))
                            .map((offer, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {offer.providerIconUrl && (
                                    <img
                                      src={offer.providerIconUrl}
                                      alt=""
                                      style={{ width: 20, height: 20, borderRadius: 3 }}
                                    />
                                  )}
                                  {offer.provider}
                                </td>
                                <td style={{ padding: 8 }}>
                                  ${Number(offer.nightlyPrice).toFixed(2)} {offer.currency}
                                </td>
                                <td style={{ padding: 8 }}>
                                  ${Number(offer.totalPrice).toFixed(2)} {offer.currency}
                                </td>
                                <td style={{ padding: 8, fontSize: 12 }}>
                                  {offer.freeCancellation
                                    ? <span style={{ color: '#1e7a3b' }}>Free</span>
                                    : offer.cancellationDeadline
                                    ? `By ${offer.cancellationDeadline}`
                                    : '—'}
                                </td>
                                <td style={{ padding: 8 }}>
                                  <a
                                    href={offer.bookingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#1857c4', textDecoration: 'none' }}
                                  >
                                    Open →
                                  </a>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="no-rooms">No OTA offers returned for this hotel.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Room Availability Modal */}
          {selectedHotel && selectedHotelAvailability && (
            <div className="availability-modal-overlay" onClick={handleCloseAvailability}>
              <div className="availability-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Room Availability - {selectedHotel.name}</h3>
                  <button className="close-btn" onClick={handleCloseAvailability}>&times;</button>
                </div>

                {selectedHotelAvailability.error ? (
                  <div className="error-message">{selectedHotelAvailability.error}</div>
                ) : (
                  <div className="modal-content">
                    <div className="availability-summary">
                      <div className="summary-item available">
                        <span className="count">{selectedHotelAvailability.totalAvailableRooms || 0}</span>
                        <span className="label">Rooms Available</span>
                      </div>
                      <div className="summary-item unavailable">
                        <span className="count">{selectedHotelAvailability.totalUnavailableRooms || 0}</span>
                        <span className="label">Rooms Unavailable</span>
                      </div>
                    </div>

                    {/* Available Rooms */}
                    {selectedHotelAvailability.available?.length > 0 && (
                      <div className="rooms-section">
                        <h4>Available Rooms</h4>
                        <div className="rooms-grid">
                          {selectedHotelAvailability.available.map((room, idx) => (
                            <div key={idx} className="room-card available">
                              <div className="room-header">
                                <h5>{room.name}</h5>
                                <span className="room-count">{room.roomCount} rooms</span>
                              </div>
                              <div className="room-details">
                                <p><strong>Price:</strong> ${room.pricePerNight?.toFixed(2) || 'N/A'}/night</p>
                                <p><strong>Total:</strong> ${room.price?.toFixed(2) || 'N/A'}</p>
                                <p><strong>Max Occupancy:</strong> {room.maxOccupancy} guests</p>
                                <p><strong>Size:</strong> {room.roomSize} m² ({room.roomSizeFt?.toFixed(0)} ft²)</p>
                                <p><strong>Rate:</strong> {room.rateLabel || 'Standard'}</p>
                                <div className="room-features">
                                  {room.breakfastIncluded && <span className="feature">Breakfast Included</span>}
                                  {room.halfBoard && <span className="feature">Half Board</span>}
                                  {room.fullBoard && <span className="feature">Full Board</span>}
                                  {room.freeCancellation && <span className="feature green">Free Cancellation</span>}
                                  {room.refundable && <span className="feature green">Refundable</span>}
                                </div>
                                {room.cancellationDeadline && (
                                  <p className="cancellation-info">Cancel by: {room.cancellationDeadline}</p>
                                )}
                                {room.extras?.length > 0 && (
                                  <p><strong>Extras:</strong> {room.extras.join(', ')}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unavailable Rooms */}
                    {selectedHotelAvailability.unavailable?.length > 0 && (
                      <div className="rooms-section">
                        <h4>Unavailable Rooms (Sold Out)</h4>
                        <div className="rooms-grid">
                          {selectedHotelAvailability.unavailable.map((room, idx) => (
                            <div key={idx} className="room-card unavailable">
                              <div className="room-header">
                                <h5>{room.name}</h5>
                                <span className="room-count sold-out">Sold Out</span>
                              </div>
                              <div className="room-details">
                                <p><strong>Max Occupancy:</strong> {room.maxOccupancy} guests</p>
                                <p><strong>Size:</strong> {room.roomSize} m² ({room.roomSizeFt?.toFixed(0)} ft²)</p>
                                <p><strong>Rate:</strong> {room.rateLabel || 'Standard'}</p>
                                <div className="room-features">
                                  {room.breakfastIncluded && <span className="feature">Breakfast Included</span>}
                                  {room.halfBoard && <span className="feature">Half Board</span>}
                                  {room.freeCancellation && <span className="feature">Free Cancellation</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedHotelAvailability.available?.length === 0 &&
                     selectedHotelAvailability.unavailable?.length === 0 && (
                      <p className="no-rooms">No room information available for this hotel.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
      
      {!loading && competitors.length === 0 && !error && (
        <div className="no-results">
          <p>No hotel data found. Try searching for hotels in a different city or date range.</p>
        </div>
      )}
    </div>
  );
};

export default CompetitorAnalysis;