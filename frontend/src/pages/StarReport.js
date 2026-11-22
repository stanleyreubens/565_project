// Location: frontend/src/pages/StarReport.js

import React, { useState } from 'react';
import { useHotels } from '../hooks/useHotels';
import { useMarketReport } from '../hooks/useMarketReport';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import '../styles/StarReport.css';

const StarReport = () => {
  const { hotels } = useHotels();
  const { reportData, loading, error, fetchMarketReport, clearReport } = useMarketReport();
  const [selectedHotel, setSelectedHotel] = useState(null);

  // Get tomorrow's date for default check-in
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get date 7 days from tomorrow for default check-out
  const weekLater = new Date(tomorrow);
  weekLater.setDate(weekLater.getDate() + 6);

  const [searchParams, setSearchParams] = useState({
    checkInDate: tomorrow.toISOString().split('T')[0],
    checkOutDate: weekLater.toISOString().split('T')[0]
  });

  const handleHotelSelect = (hotelId) => {
    const hotel = hotels.find(h => h.id === hotelId);
    setSelectedHotel(hotel);
    clearReport();
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!selectedHotel) return;

    await fetchMarketReport(
      selectedHotel.id,
      searchParams.checkInDate,
      searchParams.checkOutDate
    );
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Index performance status
  const getPerformanceStatus = (index) => {
    if (index >= 110) return 'excellent';
    if (index >= 100) return 'good';
    if (index >= 90) return 'fair';
    return 'poor';
  };

  // Prepare chart data from real report data
  const getCompetitorPriceData = () => {
    if (!reportData || !reportData.priceDistribution) return [];
    return reportData.priceDistribution;
  };

  // Prepare competitive positioning data for radar chart
  const getCompetitivePositioning = () => {
    if (!reportData || !reportData.yourHotel || !reportData.compSet) return [];
    return [
      { metric: 'ADR', you: reportData.yourHotel.adr, compSet: reportData.compSet.adr },
      { metric: 'Occupancy', you: reportData.yourHotel.occupancy, compSet: reportData.compSet.occupancy },
      { metric: 'RevPAR', you: reportData.yourHotel.revpar, compSet: reportData.compSet.revpar }
    ];
  };

  // Check if we have valid report data with metrics
  const hasValidReportData = reportData && reportData.yourHotel && reportData.compSet && reportData.indices;

  return (
    <div className="star-report-container">
      <h1>Market Performance Report</h1>
      <p className="report-description">
        Compare your hotel's performance metrics against competitors in your market using real-time data from Booking.com.
      </p>

      <div className="report-filters">
        <form onSubmit={handleGenerateReport}>
          <div className="filter-group">
            <label>Hotel</label>
            <select
              value={selectedHotel?.id || ''}
              onChange={(e) => handleHotelSelect(e.target.value)}
              required
            >
              <option value="">Select Hotel</option>
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Check-In Date</label>
            <input
              type="date"
              value={searchParams.checkInDate}
              onChange={(e) => setSearchParams({ ...searchParams, checkInDate: e.target.value })}
              required
            />
          </div>

          <div className="filter-group">
            <label>Check-Out Date</label>
            <input
              type="date"
              value={searchParams.checkOutDate}
              onChange={(e) => setSearchParams({ ...searchParams, checkOutDate: e.target.value })}
              required
            />
          </div>

          <button type="submit" disabled={loading || !selectedHotel}>
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </form>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-message">
          <p>Fetching market data from competitors... This may take a moment.</p>
        </div>
      )}

      {!selectedHotel && !loading && (
        <div className="select-hotel-message">
          <p>Please select a hotel and date range to generate a market performance report</p>
        </div>
      )}

      {/* Show message if report returned but no competitor data */}
      {reportData && reportData.message && !hasValidReportData && !loading && (
        <div className="select-hotel-message">
          <p>{reportData.message}</p>
        </div>
      )}

      {hasValidReportData && selectedHotel && !loading && (
        <div className="report-content">
          {/* Report Header */}
          <div className="report-header-info">
            <h2>Market Report: {reportData.hotelName}</h2>
            <p className="report-meta">
              {reportData.city} | {reportData.checkInDate} to {reportData.checkOutDate} ({reportData.nights} nights) |
              {reportData.competitorCount} competitors analyzed
            </p>
          </div>

          {/* Performance Highlights */}
          <div className="performance-highlights">
            <h2>Performance Highlights</h2>

            <div className="highlights-grid">
              <div className="highlight-card">
                <h3>ADR (Average Daily Rate)</h3>
                <div className="metric-values">
                  <div className="metric-value">
                    <span className="label">Your Hotel:</span>
                    <span className="value">${reportData.yourHotel.adr}</span>
                  </div>
                  <div className="metric-value">
                    <span className="label">Comp Set:</span>
                    <span className="value">${reportData.compSet.adr}</span>
                  </div>
                </div>
                <div className={`index-value ${getPerformanceStatus(reportData.indices.ari)}`}>
                  <span className="label">ARI:</span>
                  <span className="value">{reportData.indices.ari}</span>
                </div>
                <p className="index-explanation">
                  {reportData.indices.ari >= 100
                    ? 'Your rates are above market average'
                    : 'Your rates are below market average'}
                </p>
              </div>

              <div className="highlight-card">
                <h3>Occupancy</h3>
                <div className="metric-values">
                  <div className="metric-value">
                    <span className="label">Your Hotel:</span>
                    <span className="value">{reportData.yourHotel.occupancy}%</span>
                  </div>
                  <div className="metric-value">
                    <span className="label">Comp Set:</span>
                    <span className="value">{reportData.compSet.occupancy}%</span>
                  </div>
                </div>
                <div className={`index-value ${getPerformanceStatus(reportData.indices.mpi)}`}>
                  <span className="label">MPI:</span>
                  <span className="value">{reportData.indices.mpi}</span>
                </div>
                <p className="index-explanation">
                  Market occupancy estimated from room availability
                </p>
              </div>

              <div className="highlight-card">
                <h3>RevPAR</h3>
                <div className="metric-values">
                  <div className="metric-value">
                    <span className="label">Your Hotel:</span>
                    <span className="value">${reportData.yourHotel.revpar}</span>
                  </div>
                  <div className="metric-value">
                    <span className="label">Comp Set:</span>
                    <span className="value">${reportData.compSet.revpar}</span>
                  </div>
                </div>
                <div className={`index-value ${getPerformanceStatus(reportData.indices.rgi)}`}>
                  <span className="label">RGI:</span>
                  <span className="value">{reportData.indices.rgi}</span>
                </div>
                <p className="index-explanation">
                  {reportData.indices.rgi >= 100
                    ? 'Revenue generation above market'
                    : 'Revenue generation below market'}
                </p>
              </div>
            </div>
          </div>

          {/* Market Price Range */}
          <div className="price-range-section">
            <h2>Market Price Range</h2>
            <div className="price-range-cards">
              <div className="price-card min">
                <span className="price-label">Lowest</span>
                <span className="price-value">${reportData.compSet.minAdr}</span>
              </div>
              <div className="price-card avg">
                <span className="price-label">Average</span>
                <span className="price-value">${reportData.compSet.adr}</span>
              </div>
              <div className="price-card max">
                <span className="price-label">Highest</span>
                <span className="price-value">${reportData.compSet.maxAdr}</span>
              </div>
              <div className="price-card yours">
                <span className="price-label">Your ADR</span>
                <span className="price-value">${reportData.yourHotel.adr}</span>
              </div>
            </div>
          </div>

          {/* Competitor Price Chart */}
          <div className="chart-container">
            <h3>Competitor Price Comparison (Per Night)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={getCompetitorPriceData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
                  labelFormatter={(value) => `Hotel: ${value}`}
                />
                <Legend />
                <Bar dataKey="price" fill="#8884d8" name="Price/Night ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Index Performance */}
          <div className="index-charts">
            <h2>Index Performance</h2>
            <p className="index-info">An index of 100 means you're performing equal to the market. Above 100 is outperforming.</p>

            <div className="index-bars">
              <div className="index-bar-container">
                <span className="index-label">ARI (Rate Index)</span>
                <div className="index-bar-wrapper">
                  <div
                    className={`index-bar ${reportData.indices.ari >= 100 ? 'positive' : 'negative'}`}
                    style={{ width: `${Math.min(reportData.indices.ari, 150)}%` }}
                  >
                    <span className="index-value-label">{reportData.indices.ari}</span>
                  </div>
                  <div className="baseline-marker" style={{ left: '100%' }}></div>
                </div>
              </div>

              <div className="index-bar-container">
                <span className="index-label">MPI (Occupancy Index)</span>
                <div className="index-bar-wrapper">
                  <div
                    className={`index-bar ${reportData.indices.mpi >= 100 ? 'positive' : 'negative'}`}
                    style={{ width: `${Math.min(reportData.indices.mpi, 150)}%` }}
                  >
                    <span className="index-value-label">{reportData.indices.mpi}</span>
                  </div>
                  <div className="baseline-marker" style={{ left: '100%' }}></div>
                </div>
              </div>

              <div className="index-bar-container">
                <span className="index-label">RGI (Revenue Index)</span>
                <div className="index-bar-wrapper">
                  <div
                    className={`index-bar ${reportData.indices.rgi >= 100 ? 'positive' : 'negative'}`}
                    style={{ width: `${Math.min(reportData.indices.rgi, 150)}%` }}
                  >
                    <span className="index-value-label">{reportData.indices.rgi}</span>
                  </div>
                  <div className="baseline-marker" style={{ left: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Competitive Positioning Radar */}
          <div className="positioning-charts">
            <h2>Competitive Positioning</h2>

            <div className="chart-container">
              <h3>Your Hotel vs. Competitive Set</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart outerRadius={150} data={getCompetitivePositioning()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                  <Radar
                    name="Your Hotel"
                    dataKey="you"
                    stroke="#0088FE"
                    fill="#0088FE"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Competitive Set"
                    dataKey="compSet"
                    stroke="#00C49F"
                    fill="#00C49F"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Competitor Details Table */}
          <div className="competitors-table">
            <h2>Competitor Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Hotel Name</th>
                  <th>Star Rating</th>
                  <th>Price/Night</th>
                  <th>Total ({reportData.nights} nights)</th>
                  <th>Review Score</th>
                </tr>
              </thead>
              <tbody>
                {reportData.competitors.map((competitor, index) => (
                  <tr key={index}>
                    <td>{competitor.name}</td>
                    <td>{competitor.starRating > 0 ? `${competitor.starRating} ⭐` : 'N/A'}</td>
                    <td>${competitor.pricePerNight}</td>
                    <td>${competitor.totalPrice}</td>
                    <td>{competitor.reviewScore > 0 ? competitor.reviewScore.toFixed(1) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Analysis and Recommendations */}
          <div className="analysis-section">
            <h2>Analysis & Recommendations</h2>

            <div className="analysis-content">
              <div className="analysis-card">
                <h3>Performance Analysis</h3>
                <p>
                  {reportData.indices.ari >= 100 ?
                    `Your ADR of $${reportData.yourHotel.adr} is ${(reportData.indices.ari - 100).toFixed(1)}% above the market average of $${reportData.compSet.adr}. ` :
                    `Your ADR of $${reportData.yourHotel.adr} is ${(100 - reportData.indices.ari).toFixed(1)}% below the market average of $${reportData.compSet.adr}. `
                  }
                  {reportData.indices.rgi >= 100 ?
                    "Your RevPAR performance indicates effective revenue management." :
                    "There may be opportunities to improve your RevPAR through rate optimization or occupancy improvements."
                  }
                </p>
              </div>

              <div className="analysis-card">
                <h3>Key Opportunities</h3>
                <ul>
                  {reportData.indices.ari < 100 && (
                    <li>
                      Consider increasing rates - the market average is ${reportData.compSet.adr}/night,
                      while you're at ${reportData.yourHotel.adr}/night.
                    </li>
                  )}
                  {reportData.indices.ari > 110 && (
                    <li>
                      Your rates are significantly above market. Monitor booking pace to ensure
                      you're not losing occupancy to lower-priced competitors.
                    </li>
                  )}
                  {reportData.yourHotel.adr < reportData.compSet.minAdr && (
                    <li>
                      You're priced below the lowest competitor (${reportData.compSet.minAdr}).
                      There's room to increase rates without becoming the most expensive option.
                    </li>
                  )}
                  {reportData.yourHotel.adr > reportData.compSet.maxAdr && (
                    <li>
                      You're the highest-priced hotel in the market. Ensure your value proposition
                      justifies the premium pricing.
                    </li>
                  )}
                  <li>
                    Monitor competitor pricing regularly - market rates range from
                    ${reportData.compSet.minAdr} to ${reportData.compSet.maxAdr}/night.
                  </li>
                </ul>
              </div>

              <div className="analysis-card">
                <h3>Recommended Actions</h3>
                <ol>
                  {reportData.indices.ari < 95 ? (
                    <li>Increase base rates by ${(reportData.compSet.adr - reportData.yourHotel.adr).toFixed(2)} to match market average.</li>
                  ) : reportData.indices.ari < 100 ? (
                    <li>Consider a moderate rate increase to align with market positioning.</li>
                  ) : (
                    <li>Maintain current pricing strategy while monitoring competitor responses.</li>
                  )}
                  <li>Set up rate alerts to monitor when competitors change their pricing.</li>
                  <li>Review your competitive set regularly using the Competitor Analysis tool.</li>
                  <li>Track these metrics over time to identify trends and seasonal patterns.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StarReport;
