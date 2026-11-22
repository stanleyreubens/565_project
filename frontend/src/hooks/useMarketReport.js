// Location: frontend/src/hooks/useMarketReport.js

import { useState, useCallback } from 'react';
import apiClient from '../api/client';

export function useMarketReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMarketReport = useCallback(async (hotelId, checkInDate, checkOutDate) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching market report for hotel ${hotelId} from ${checkInDate} to ${checkOutDate}`);

      const response = await apiClient.get(`/hotels/market-report/${hotelId}`, {
        params: { checkInDate, checkOutDate }
      });

      const data = response.data.data;
      console.log('Market report data received:', data);

      setReportData(data);
      return data;
    } catch (err) {
      console.error('Error fetching market report:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch market report';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearReport = useCallback(() => {
    setReportData(null);
    setError(null);
  }, []);

  return {
    reportData,
    loading,
    error,
    fetchMarketReport,
    clearReport
  };
}
