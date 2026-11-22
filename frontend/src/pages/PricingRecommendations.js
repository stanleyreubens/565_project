// Location: frontend/src/pages/PricingRecommendations.js

import React, { useState } from 'react';
import { useHotels } from '../hooks/useHotels';
import { usePricing } from '../hooks/usePricing';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/PricingRecommendations.css';

// Parse date string without timezone conversion
const parseLocalDate = (dateString) => {
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper to get dates between two dates
const getDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const PricingRecommendations = () => {
  const { hotels } = useHotels();
  const { calculatePrice, updateActualPrice } = usePricing();

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [pricingResults, setPricingResults] = useState([]); // Array of results for date range
  const [selectedDateIndex, setSelectedDateIndex] = useState(0); // Currently viewed date
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState(null);
  const [calcProgress, setCalcProgress] = useState({ current: 0, total: 0 });

  // Get the currently selected result
  const pricingResult = pricingResults[selectedDateIndex] || null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!selectedHotel || !selectedRoomType) return;

    // Validate date range
    if (new Date(endDate) < new Date(startDate)) {
      setCalcError('End date must be after or equal to start date');
      return;
    }

    setIsCalculating(true);
    setCalcError(null);
    setPricingResults([]);
    setSelectedDateIndex(0);

    const dates = getDateRange(startDate, endDate);
    setCalcProgress({ current: 0, total: dates.length });

    try {
      const results = [];
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        setCalcProgress({ current: i + 1, total: dates.length });

        try {
          const result = await calculatePrice(
            selectedHotel.id,
            selectedRoomType.id,
            date
          );
          if (result) {
            results.push({ ...result, date });
          }
        } catch (dateError) {
          console.error(`Failed to calculate price for ${date}:`, dateError);
          // Continue with other dates even if one fails
          results.push({ date, error: dateError.message });
        }
      }

      setPricingResults(results);

      // Set strategy for first successful result
      const firstSuccess = results.find(r => r.pricingRecommendation);
      if (firstSuccess) {
        const balancedStrategy = firstSuccess.pricingRecommendation?.strategies?.find(s => s.name === 'Balanced');
        setSelectedStrategy(balancedStrategy || firstSuccess.pricingRecommendation?.strategies?.[0] || null);
      }
    } catch (error) {
      console.error('Failed to calculate prices:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setCalcError(`Failed to calculate prices: ${errorMessage}`);
    } finally {
      setIsCalculating(false);
      setCalcProgress({ current: 0, total: 0 });
    }
  };

  // Update strategy when switching dates
  const handleDateSelect = (index) => {
    setSelectedDateIndex(index);
    const result = pricingResults[index];
    if (result?.pricingRecommendation) {
      const balancedStrategy = result.pricingRecommendation.strategies?.find(s => s.name === 'Balanced');
      setSelectedStrategy(balancedStrategy || result.pricingRecommendation.strategies?.[0] || null);
    }
  };
  
  const handleApplyPrice = async () => {
    if (!pricingResult || !selectedStrategy) return;

    setIsUpdating(true);
    try {
      await updateActualPrice(pricingResult.pricingRecord.id, selectedStrategy.price);

      // Update the local state to reflect the change
      setPricingResults(prev => prev.map((result, idx) =>
        idx === selectedDateIndex
          ? {
              ...result,
              pricingRecord: {
                ...result.pricingRecord,
                actualPrice: selectedStrategy.price
              }
            }
          : result
      ));

      alert('Price updated successfully!');
    } catch (error) {
      console.error('Failed to update price:', error);
      alert('Failed to update price. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Format data for strategy comparison chart
  const strategyData = pricingResult?.pricingRecommendation.strategies.map(strategy => ({
    name: strategy.name,
    price: strategy.price
  })) || [];
  
  // Format data for competitor comparison chart
  const competitorData = pricingResult?.pricingRecord.competitorPrices.map(comp => ({
    name: comp.hotelName.substring(0, 15) + (comp.hotelName.length > 15 ? '...' : ''),
    price: comp.price
  })) || [];
  
  // Add our hotel to the competitor comparison
  if (pricingResult && selectedStrategy) {
    competitorData.push({
      name: 'Our Hotel (Recommended)',
      price: selectedStrategy.price
    });
  }
  
  // Sort competitor data by price
  competitorData.sort((a, b) => a.price - b.price);
  
  return (
    <div className="pricing-recommendations-container">
      <h1>Pricing Recommendations</h1>
      
      <div className="search-container">
        <form onSubmit={handleSearch}>
          <div className="search-group">
            <label>Hotel</label>
            <select 
              value={selectedHotel?.id || ''} 
              onChange={(e) => {
                const hotel = hotels.find(h => h.id === e.target.value);
                setSelectedHotel(hotel);
                setSelectedRoomType(null);
              }}
              required
            >
              <option value="">Select Hotel</option>
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
              ))}
            </select>
          </div>
          
          <div className="search-group">
            <label>Room Type</label>
            <select 
              value={selectedRoomType?.id || ''} 
              onChange={(e) => {
                const roomType = selectedHotel?.roomTypes.find(rt => rt.id === e.target.value);
                setSelectedRoomType(roomType);
              }}
              disabled={!selectedHotel}
              required
            >
              <option value="">Select Room Type</option>
              {selectedHotel?.roomTypes?.map(roomType => (
                <option key={roomType.id} value={roomType.id}>{roomType.name}</option>
              ))}
            </select>
          </div>
          
          <div className="search-group">
            <label>From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="search-group">
            <label>To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={isCalculating}>
            {isCalculating
              ? (calcProgress.total > 1
                  ? `Calculating ${calcProgress.current}/${calcProgress.total}...`
                  : 'Calculating...')
              : 'Calculate Prices'}
          </button>
        </form>
      </div>

      {calcError && (
        <div className="error-message" style={{ background: '#ffebee', color: '#c62828', padding: '12px 16px', borderRadius: '5px', marginBottom: '16px' }}>
          {calcError}
        </div>
      )}

      {isCalculating && (
        <div className="loading-message" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          {calcProgress.total > 1
            ? `Calculating pricing for day ${calcProgress.current} of ${calcProgress.total}...`
            : 'Calculating pricing recommendation...'}
        </div>
      )}

      {/* Date tabs when multiple dates */}
      {pricingResults.length > 1 && !isCalculating && (
        <div className="date-tabs-container">
          <div className="date-tabs">
            {pricingResults.map((result, idx) => (
              <button
                key={idx}
                className={`date-tab ${idx === selectedDateIndex ? 'active' : ''} ${result.error ? 'error' : ''}`}
                onClick={() => handleDateSelect(idx)}
              >
                {format(parseLocalDate(result.date), 'MMM d')}
                {result.error && <span className="error-dot">!</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error message for specific date */}
      {pricingResult && !isCalculating && pricingResult.error && (
        <div className="date-error-message">
          <h3>Unable to calculate pricing for {format(parseLocalDate(pricingResult.date), 'MMMM d, yyyy')}</h3>
          <p>{pricingResult.error}</p>
        </div>
      )}

      {pricingResult && !isCalculating && !pricingResult.error && (
        <div className="pricing-result">
          <div className="pricing-header">
            <h2>Pricing Analysis for {format(parseLocalDate(pricingResult.date || startDate), 'MMMM d, yyyy')}</h2>
            <div className="pricing-summary">
              <div className="summary-item">
                <h3>Recommended Price</h3>
                <p className="price-value">${pricingResult.pricingRecommendation.recommendedPrice}</p>
              </div>
              
              <div className="summary-item">
                <h3>Minimum Viable Price</h3>
                <p className="price-value">${pricingResult.pricingRecommendation.minimumViablePrice}</p>
              </div>
              
              <div className="summary-item">
                <h3>Competitor Average</h3>
                <p className="price-value">${pricingResult.pricingRecommendation.competitorAverage.toFixed(2)}</p>
              </div>
              
              <div className="summary-item">
                <h3>Event Impact</h3>
                <p className="price-value">
                  {(pricingResult.pricingRecommendation.eventImpact.demandMultiplier * 100).toFixed(0)}%
                </p>
              </div>

              {pricingResult.pricingRecommendation.smerfRate && (
                <div className="summary-item smerf-floor">
                  <h3>SMERF Floor (This Room)</h3>
                  <p className="price-value">${pricingResult.pricingRecommendation.smerfRate}</p>
                  {pricingResult.pricingRecommendation.smerfApplied && (
                    <span className="smerf-badge">Applied</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SMERF Rates Section - Always show if any SMERF rates exist for this hotel */}
          {pricingResult.allHotelSmerfRates && pricingResult.allHotelSmerfRates.length > 0 && (
            <div className="smerf-rates-section">
              <h3>SMERF Contracted Rates for This Date</h3>
              <p className="smerf-subtitle">These are your minimum floor prices - never sell below these rates</p>
              <div className="smerf-rates-grid">
                {/* Group SMERF rates by groupName + segment */}
                {(() => {
                  const groups = {};
                  pricingResult.allHotelSmerfRates.forEach(rate => {
                    const key = `${rate.groupName || 'No Group'}_${rate.segment}`;
                    if (!groups[key]) {
                      groups[key] = {
                        groupName: rate.groupName,
                        segment: rate.segment,
                        roomTypes: []
                      };
                    }
                    groups[key].roomTypes.push({
                      roomTypeId: rate.roomTypeId,
                      roomType: rate.roomType,
                      rate: rate.rate
                    });
                  });
                  return Object.values(groups).map((group, idx) => (
                    <div key={idx} className="smerf-rate-card smerf-grouped-card">
                      {group.groupName && (
                        <div className="smerf-group-title">{group.groupName}</div>
                      )}
                      {group.segment && (
                        <div className="smerf-segment">{group.segment}</div>
                      )}
                      <div className="smerf-room-list">
                        {group.roomTypes.map((rt, rtIdx) => (
                          <div
                            key={rtIdx}
                            className={`smerf-room-row ${rt.roomTypeId === selectedRoomType?.id ? 'current-room-row' : ''}`}
                          >
                            <span className="smerf-room-name">
                              {rt.roomType?.name || 'Room'}
                              {rt.roomTypeId === selectedRoomType?.id && (
                                <span className="current-badge-small">Current</span>
                              )}
                            </span>
                            <span className="smerf-room-rate">${rt.rate.toFixed(2)}/night</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          <div className="charts-container">
            <div className="chart-box">
              <h3>Pricing Strategies</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={strategyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Price']} />
                  <Legend />
                  <Bar dataKey="price" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-box">
              <h3>Market Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={competitorData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Price']} />
                  <Legend />
                  <Bar 
                    dataKey="price" 
                    fill={(entry) => entry.name === 'Our Hotel (Recommended)' ? '#4CAF50' : '#8884d8'}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="pricing-strategies">
            <h3>Available Pricing Strategies</h3>
            <div className="strategies-list">
              {pricingResult.pricingRecommendation.strategies.map((strategy, index) => (
                <div 
                  key={index} 
                  className={`strategy-card ${selectedStrategy?.name === strategy.name ? 'selected' : ''}`}
                  onClick={() => setSelectedStrategy(strategy)}
                >
                  <div className="strategy-header">
                    <h4>{strategy.name}</h4>
                    <span className="strategy-price">${strategy.price}</span>
                  </div>
                  <p className="strategy-description">{strategy.description}</p>
                </div>
              ))}
            </div>
            
            <div className="strategy-action">
              {selectedStrategy && (
                <>
                  <p>
                    Selected Strategy: <strong>{selectedStrategy.name}</strong> at <strong>${selectedStrategy.price}</strong>
                  </p>
                  <button 
                    className="apply-button"
                    onClick={handleApplyPrice}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Apply This Price'}
                  </button>
                </>
              )}
            </div>
          </div>
          
          {pricingResult.pricingRecommendation.eventImpact.significantEvents.length > 0 && (
            <div className="event-impact">
              <h3>Significant Events Affecting Price</h3>
              <div className="events-list">
                {pricingResult.pricingRecommendation.eventImpact.significantEvents.map((event, index) => (
                  <div key={index} className="event-item">
                    <h4>{event.name}</h4>
                    <p><strong>Impact Score:</strong> {event.impactScore}</p>
                    <p><strong>Location:</strong> {event.venue || 'N/A'}</p>
                    <p><strong>Expected Attendance:</strong> {event.expectedAttendance?.toLocaleString() || 'Unknown'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PricingRecommendations;