// Location: frontend/src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useHotels } from '../hooks/useHotels';
import { usePricing } from '../hooks/usePricing';
import { useEvents } from '../hooks/useEvents';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { hotels } = useHotels();
  const { pricingHistory, fetchPricingHistory } = usePricing();
  const { events, fetchEvents } = useEvents();
  
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  
  useEffect(() => {
    if (hotels.length > 0 && !selectedHotel) {
      setSelectedHotel(hotels[0]);
      if (hotels[0].roomTypes && hotels[0].roomTypes.length > 0) {
        setSelectedRoomType(hotels[0].roomTypes[0]);
      }
    }
  }, [hotels, selectedHotel]);
  
  useEffect(() => {
    if (selectedHotel && selectedRoomType) {
      fetchPricingHistory(
        selectedHotel.id,
        selectedRoomType.id,
        dateRange.startDate,
        dateRange.endDate
      );
      
      fetchEvents(
        selectedHotel.city,
        dateRange.startDate,
        dateRange.endDate
      );
    }
  }, [selectedHotel, selectedRoomType, dateRange, fetchPricingHistory, fetchEvents]);
  
  // Format data for price history chart
  const priceHistoryData = pricingHistory.map(record => ({
    date: new Date(record.date).toLocaleDateString(),
    recommendedPrice: record.recommendedPrice || 0,
    actualPrice: record.actualPrice || record.price,
    competitorAvg: record.competitorPrices.reduce((sum, cp) => sum + cp.price, 0) / 
                   (record.competitorPrices.length || 1)
  }));
  
  // Format data for event impact chart
  const eventsByImpact = {};
  events.forEach(event => {
    const score = event.impactScore || 5;
    eventsByImpact[score] = (eventsByImpact[score] || 0) + 1;
  });
  
  const eventImpactData = Object.keys(eventsByImpact).map(score => ({
    score: `Impact ${score}`,
    count: eventsByImpact[score]
  }));
  
  // Format data for room type distribution
  const roomTypeData = selectedHotel?.roomTypes.map(rt => ({
    name: rt.name,
    basePrice: rt.basePrice
  })) || [];
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  return (
    <div className="dashboard-container">
      <h1>Revenue Management Dashboard</h1>
      
      <div className="dashboard-filters">
        <div className="filter-group">
          <label>Hotel</label>
          <select 
            value={selectedHotel?.id || ''} 
            onChange={(e) => {
              const hotel = hotels.find(h => h.id === e.target.value);
              setSelectedHotel(hotel);
              if (hotel?.roomTypes && hotel.roomTypes.length > 0) {
                setSelectedRoomType(hotel.roomTypes[0]);
              }
            }}
          >
            {hotels.map(hotel => (
              <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Room Type</label>
          <select 
            value={selectedRoomType?.id || ''} 
            onChange={(e) => {
              const roomType = selectedHotel?.roomTypes.find(rt => rt.id === e.target.value);
              setSelectedRoomType(roomType);
            }}
            disabled={!selectedHotel?.roomTypes?.length}
          >
            {selectedHotel?.roomTypes?.map(roomType => (
              <option key={roomType.id} value={roomType.id}>{roomType.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Start Date</label>
          <input 
            type="date" 
            value={dateRange.startDate} 
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
        </div>
        
        <div className="filter-group">
          <label>End Date</label>
          <input 
            type="date" 
            value={dateRange.endDate} 
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
        </div>
      </div>
      
      <div className="dashboard-metrics">
        <div className="metric-card">
          <h3>Average Recommended Price</h3>
          <p className="metric-value">
            ${pricingHistory.reduce((sum, record) => sum + (record.recommendedPrice || 0), 0) / 
              (pricingHistory.length || 1)}
          </p>
        </div>
        
        <div className="metric-card">
          <h3>Average Competitor Price</h3>
          <p className="metric-value">
            ${pricingHistory.reduce((sum, record) => {
              const avgCompPrice = record.competitorPrices.reduce((s, cp) => s + cp.price, 0) / 
                                  (record.competitorPrices.length || 1);
              return sum + avgCompPrice;
            }, 0) / (pricingHistory.length || 1)}
          </p>
        </div>
        
        <div className="metric-card">
          <h3>Total Events</h3>
          <p className="metric-value">{events.length}</p>
        </div>
        
        <div className="metric-card">
          <h3>High Impact Events</h3>
          <p className="metric-value">{events.filter(e => (e.impactScore || 0) >= 7).length}</p>
        </div>
      </div>
      
      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Price History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={priceHistoryData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="recommendedPrice" stroke="#8884d8" name="Recommended" />
              <Line type="monotone" dataKey="actualPrice" stroke="#82ca9d" name="Actual" />
              <Line type="monotone" dataKey="competitorAvg" stroke="#ffc658" name="Competitor Avg" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <h3>Room Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={roomTypeData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="basePrice" fill="#8884d8" name="Base Price" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <h3>Events by Impact Score</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventImpactData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="score"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {eventImpactData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;