// Location: frontend/src/hooks/useCompetitors.js

import { useState, useCallback } from 'react';
import apiClient from '../api/client';

export function useCompetitors() {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cityName, setCityName] = useState('');
  const [nights, setNights] = useState(0);
  const [provider, setProvider] = useState(null);
  const [selectedHotelAvailability, setSelectedHotelAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [priceComparison, setPriceComparison] = useState(null);
  const [priceComparisonLoading, setPriceComparisonLoading] = useState(false);

  const fetchCompetitors = useCallback(async (city, checkInDate, checkOutDate) => {
    setLoading(true);
    setError(null);
    setSelectedHotelAvailability(null);
    setPriceComparison(null);
    try {
      const response = await apiClient.get('/hotels/search', {
        params: { city, checkInDate, checkOutDate }
      });

      const hotels = response.data.data.hotels || [];
      setCityName(response.data.data.cityName || city);
      setNights(response.data.data.nights || 0);
      setProvider(response.data.data.provider || null);
      setCompetitors(hotels);
      return hotels;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hotels');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoomAvailability = useCallback(async (hotelId, checkInDate, checkOutDate) => {
    setAvailabilityLoading(true);
    try {
      const response = await apiClient.get(`/hotels/competitor/${hotelId}/availability`, {
        params: { checkInDate, checkOutDate }
      });
      const availabilityData = response.data.data || {};
      setSelectedHotelAvailability(availabilityData);
      return availabilityData;
    } catch (err) {
      setSelectedHotelAvailability({ error: err.response?.data?.message || 'Failed to fetch availability' });
      return null;
    } finally {
      setAvailabilityLoading(false);
    }
  }, []);

  const fetchPriceComparison = useCallback(async (googleEntityUrl, checkInDate, checkOutDate, q) => {
    setPriceComparisonLoading(true);
    try {
      const response = await apiClient.get('/hotels/price-comparison', {
        params: { url: googleEntityUrl, limit: 30, checkInDate, checkOutDate, q }
      });
      const data = response.data.data || {};
      setPriceComparison(data);
      return data;
    } catch (err) {
      setPriceComparison({ error: err.response?.data?.message || 'Failed to fetch price comparison' });
      return null;
    } finally {
      setPriceComparisonLoading(false);
    }
  }, []);

  const clearAvailability = useCallback(() => {
    setSelectedHotelAvailability(null);
    setPriceComparison(null);
  }, []);

  return {
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
  };
}
