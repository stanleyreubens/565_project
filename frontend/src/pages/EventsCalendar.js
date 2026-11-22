// Location: frontend/src/pages/EventsCalendar.js

import React, { useState, useEffect } from 'react';
import { useEvents } from '../hooks/useEvents';
import '../styles/EventsCalendar.css';

const EventsCalendar = () => {
  const { events, loading, error, fetchEvents } = useEvents();
  
  // Get tomorrow's date for default check-in
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get date 10 days from tomorrow for default check-out
  const tenDaysLater = new Date(tomorrow);
  tenDaysLater.setDate(tenDaysLater.getDate() + 9);
  
  const [searchParams, setSearchParams] = useState({
    city: '',
    startDate: tomorrow.toISOString().split('T')[0],
    endDate: tenDaysLater.toISOString().split('T')[0]
  });
  
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState({
    category: 'all',
    impactScore: 0
  });
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchParams.city) return;
    
    await fetchEvents(
      searchParams.city,
      searchParams.startDate,
      searchParams.endDate
    );
  };
  
  useEffect(() => {
    let filtered = [...events];
    
    // Filter by category
    if (filterCriteria.category !== 'all') {
      filtered = filtered.filter(event => 
        event.category?.toLowerCase() === filterCriteria.category.toLowerCase()
      );
    }
    
    // Filter by impact score
    if (filterCriteria.impactScore > 0) {
      filtered = filtered.filter(event => 
        (event.impactScore || 0) >= filterCriteria.impactScore
      );
    }
    
    setFilteredEvents(filtered);
  }, [events, filterCriteria]);
  
  // Get unique categories
  const categories = ['all', ...new Set(events.map(event => event.category).filter(Boolean))];
  
  // Group events by date
  const groupedEvents = {};
  filteredEvents.forEach(event => {
    const date = new Date(event.startDate).toDateString();
    if (!groupedEvents[date]) {
      groupedEvents[date] = [];
    }
    groupedEvents[date].push(event);
  });
  
  const sortedDates = Object.keys(groupedEvents).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  
  // Function to determine the impact level class
  const getImpactClass = (score) => {
    if (!score) return 'impact-low';
    if (score >= 8) return 'impact-high';
    if (score >= 5) return 'impact-medium';
    return 'impact-low';
  };
  
  // Helper to get a more readable date format
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Format event date in a readable way
  const formatEventDate = (event) => {
    if (!event.startDate) return 'Date not available';
    
    const start = formatDate(event.startDate);
    if (!event.endDate) return start;
    
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    // If same day or end date looks incorrect (some APIs swap dates)
    if (startDate.toDateString() === endDate.toDateString() || 
        endDate < startDate) {
      return start;
    }
    
    // Return date range for multi-day events
    return `${start} - ${formatDate(event.endDate)}`;
  };
  
  // Truncate text with ellipsis
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text;
  };
  
  return (
    <div className="events-calendar-container">
      <h1>Events Calendar</h1>
      
      <div className="search-container">
        <form onSubmit={handleSearch}>
          <div className="search-group">
            <label>City</label>
            <input 
              type="text" 
              value={searchParams.city} 
              onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
              required
              placeholder="Enter city name"
            />
          </div>
          
          <div className="search-group">
            <label>Start Date</label>
            <input 
              type="date" 
              value={searchParams.startDate} 
              onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })}
              required
            />
          </div>
          
          <div className="search-group">
            <label>End Date</label>
            <input 
              type="date" 
              value={searchParams.endDate} 
              onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search Events'}
          </button>
        </form>
      </div>
      
      {events.length > 0 && (
        <div className="filter-bar">
          <div className="filter-group">
            <label>Category</label>
            <select 
              value={filterCriteria.category} 
              onChange={(e) => setFilterCriteria({ ...filterCriteria, category: e.target.value })}
            >
              {categories.map((category, index) => (
                <option key={index} value={category}>{category || 'Uncategorized'}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Min Impact Score</label>
            <select 
              value={filterCriteria.impactScore} 
              onChange={(e) => setFilterCriteria({ ...filterCriteria, impactScore: Number(e.target.value) })}
            >
              <option value={0}>All</option>
              <option value={3}>3+</option>
              <option value={5}>5+</option>
              <option value={7}>7+</option>
              <option value={9}>9+</option>
            </select>
          </div>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {filteredEvents.length > 0 ? (
        <div className="events-timeline">
          {sortedDates.map(date => (
            <div key={date} className="date-group">
              <h2 className="date-header">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
              <div className="events-grid">
                {groupedEvents[date].map(event => (
                  <div 
                    key={event.id || event.sourceId} 
                    className={`event-card ${getImpactClass(event.impactScore)}`}
                  >
                    <div className="event-header">
                      <h3>{event.name}</h3>
                      <div className="impact-badge" title="Higher impact score means the event may affect hotel prices more significantly">
                        Impact: {event.impactScore || 'N/A'}
                      </div>
                    </div>
                    
                    {event.imageUrl && (
                      <div className="event-image">
                        <img src={event.imageUrl} alt={event.name} loading="lazy" />
                      </div>
                    )}
                    
                    <div className="event-details">
                      <div className="event-detail">
                        <span className="event-detail-label">When:</span>
                        <span className="event-detail-value">{formatEventDate(event)}</span>
                      </div>
                      
                      <div className="event-detail">
                        <span className="event-detail-label">Where:</span>
                        <span className="event-detail-value">
                          {event.venue || event.location?.venue || 'N/A'}
                          {(event.address || event.location?.address) && 
                            <div className="event-address">{event.address || event.location?.address}</div>
                          }
                        </span>
                      </div>
                      
                      <div className="event-detail">
                        <span className="event-detail-label">Type:</span>
                        <span className="event-detail-value">
                          {event.category || 'Uncategorized'}
                          {event.subcategory && ` - ${event.subcategory}`}
                        </span>
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="no-results">
            <p>No events found. Try searching for a different city or date range.</p>
          </div>
        )
      )}
      
      {loading && (
        <div className="loading">
          <p>Loading events...</p>
        </div>
      )}
    </div>
  );
};

export default EventsCalendar;