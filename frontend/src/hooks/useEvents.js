// Location: frontend/src/hooks/useEvents.js

import { useState, useCallback } from 'react';
import apiClient from '../api/client';

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async (city, startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/events', {
        params: { city, startDate, endDate }
      });
      
      // Process events to handle both API and database formats
      const eventData = response.data.data.events || [];
      const processedEvents = eventData.map(event => {
        // Handle both API and database response formats
        return {
          id: event.id || event.sourceId,
          name: event.name,
          description: event.description,
          venue: event.venue || event.location?.venue,
          address: event.address || (event.location ? event.location.address : ''),
          city: event.city || event.location?.city,
          state: event.state || event.location?.state,
          country: event.country || event.location?.country,
          startDate: event.startDate,
          endDate: event.endDate,
          category: event.category,
          subcategory: event.subcategory,
          impactScore: event.impactScore,
          imageUrl: event.imageUrl,
          url: event.url,
          source: event.source
        };
      });
      
      setEvents(processedEvents);
      return processedEvents;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch events');
      console.error('Error fetching events:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (eventData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/events', eventData);
      setEvents(prev => [...prev, response.data.data.event]);
      return response.data.data.event;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
      console.error('Error creating event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent
  };
}