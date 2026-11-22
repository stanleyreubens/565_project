// Location: frontend/src/hooks/usePricing.js

import { useState, useCallback } from 'react';
import apiClient from '../api/client';

export function usePricing() {
  const [pricingHistory, setPricingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPricingHistory = useCallback(async (hotelId, roomTypeId, startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/pricing/hotels/${hotelId}/rooms/${roomTypeId}/pricing`, {
        params: { startDate, endDate }
      });
      setPricingHistory(response.data.data.pricingHistory);
      return response.data.data.pricingHistory;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pricing history');
      console.error('Error fetching pricing history:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const calculatePrice = useCallback(async (hotelId, roomTypeId, date) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(`/pricing/hotels/${hotelId}/rooms/${roomTypeId}/calculate`, {
        date
      });
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate price');
      console.error('Error calculating price:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateActualPrice = useCallback(async (pricingId, actualPrice) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.patch(`/pricing/${pricingId}`, {
        actualPrice
      });
      setPricingHistory(prev => 
        prev.map(pricing => pricing.id === pricingId ? response.data.data.pricingHistory : pricing)
      );
      return response.data.data.pricingHistory;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update actual price');
      console.error('Error updating actual price:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    pricingHistory,
    loading,
    error,
    fetchPricingHistory,
    calculatePrice,
    updateActualPrice
  };
}