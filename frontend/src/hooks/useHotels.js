// Location: frontend/src/hooks/useHotels.js

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

export function useHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/hotels');
      setHotels(response.data.data.hotels);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hotels');
      console.error('Error fetching hotels:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getHotel = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/hotels/${id}`);
      return response.data.data.hotel;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hotel');
      console.error('Error fetching hotel:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createHotel = useCallback(async (hotelData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/hotels', hotelData);
      setHotels(prev => [...prev, response.data.data.hotel]);
      return response.data.data.hotel;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create hotel');
      console.error('Error creating hotel:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateHotel = useCallback(async (id, hotelData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put(`/hotels/${id}`, hotelData);
      setHotels(prev => 
        prev.map(hotel => hotel.id === id ? response.data.data.hotel : hotel)
      );
      return response.data.data.hotel;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update hotel');
      console.error('Error updating hotel:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteHotel = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/hotels/${id}`);
      setHotels(prev => prev.filter(hotel => hotel.id !== id));
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete hotel');
      console.error('Error deleting hotel:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  return {
    hotels,
    loading,
    error,
    fetchHotels,
    getHotel,
    createHotel,
    updateHotel,
    deleteHotel
  };
}