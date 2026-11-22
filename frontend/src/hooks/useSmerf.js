import { useState, useCallback } from 'react';
import apiClient from '../api/client';

export function useSmerf() {
  const [smerfRates, setSmerfRates] = useState([]);
  const [hotelSmerfRates, setHotelSmerfRates] = useState([]);
  const [allSmerfRates, setAllSmerfRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSmerfRates = useCallback(async (hotelId, roomTypeId, startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/pricing/smerf/${hotelId}/${roomTypeId}`, {
        params: { startDate, endDate }
      });
      setSmerfRates(response.data.data.smerfRates);
      return response.data.data.smerfRates;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch SMERF rates');
      console.error('Error fetching SMERF rates:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllSmerfRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/pricing/smerf/all');
      setAllSmerfRates(response.data.data.smerfRates);
      return response.data.data.smerfRates;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch all SMERF rates');
      console.error('Error fetching all SMERF rates:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSmerfRatesByHotel = useCallback(async (hotelId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/pricing/smerf/hotel/${hotelId}`);
      setHotelSmerfRates(response.data.data.smerfRates);
      return response.data.data.smerfRates;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hotel SMERF rates');
      console.error('Error fetching hotel SMERF rates:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createSmerfRate = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/pricing/smerf', data);
      const newRate = response.data.data.smerfRate;
      // Update all state arrays to include new rate
      setSmerfRates(prev => [...prev, newRate]);
      setHotelSmerfRates(prev => [...prev, newRate]);
      setAllSmerfRates(prev => [...prev, newRate]);
      return newRate;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create SMERF rate');
      console.error('Error creating SMERF rate:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSmerfRate = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put(`/pricing/smerf/${id}`, data);
      const updatedRate = response.data.data.smerfRate;
      // Update all state arrays
      setSmerfRates(prev =>
        prev.map(rate => rate.id === id ? updatedRate : rate)
      );
      setHotelSmerfRates(prev =>
        prev.map(rate => rate.id === id ? updatedRate : rate)
      );
      setAllSmerfRates(prev =>
        prev.map(rate => rate.id === id ? updatedRate : rate)
      );
      return updatedRate;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update SMERF rate');
      console.error('Error updating SMERF rate:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSmerfRate = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/pricing/smerf/${id}`);
      // Update all state arrays that might contain this rate
      setSmerfRates(prev => prev.filter(rate => rate.id !== id));
      setHotelSmerfRates(prev => prev.filter(rate => rate.id !== id));
      setAllSmerfRates(prev => prev.filter(rate => rate.id !== id));
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete SMERF rate');
      console.error('Error deleting SMERF rate:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    smerfRates,
    hotelSmerfRates,
    allSmerfRates,
    loading,
    error,
    fetchSmerfRates,
    fetchSmerfRatesByHotel,
    fetchAllSmerfRates,
    createSmerfRate,
    updateSmerfRate,
    deleteSmerfRate
  };
}
