import { useState, useCallback } from 'react';
import apiClient from '../api/client';

export function useReminders() {
  const [reminders, setReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [overdueReminders, setOverdueReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReminders = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.hotelId) params.append('hotelId', filters.hotelId);

      const response = await apiClient.get(`/reminders?${params.toString()}`);
      setReminders(response.data.data.reminders);
      return response.data.data.reminders;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reminders');
      console.error('Error fetching reminders:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUpcomingReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/reminders/upcoming');
      setUpcomingReminders(response.data.data.reminders);
      return response.data.data.reminders;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch upcoming reminders');
      console.error('Error fetching upcoming reminders:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOverdueReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/reminders/overdue');
      setOverdueReminders(response.data.data.reminders);
      return response.data.data.reminders;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch overdue reminders');
      console.error('Error fetching overdue reminders:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createReminder = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/reminders', data);
      setReminders(prev => [...prev, response.data.data.reminder]);
      return response.data.data.reminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create reminder');
      console.error('Error creating reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReminder = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put(`/reminders/${id}`, data);
      setReminders(prev =>
        prev.map(r => r.id === id ? response.data.data.reminder : r)
      );
      return response.data.data.reminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reminder');
      console.error('Error updating reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeReminder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.patch(`/reminders/${id}/complete`);
      setReminders(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'COMPLETED' } : r)
      );
      return response.data.data.reminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete reminder');
      console.error('Error completing reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissReminder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.patch(`/reminders/${id}/dismiss`);
      setReminders(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'DISMISSED' } : r)
      );
      return response.data.data.reminder;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dismiss reminder');
      console.error('Error dismissing reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReminder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/reminders/${id}`);
      setReminders(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete reminder');
      console.error('Error deleting reminder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    reminders,
    upcomingReminders,
    overdueReminders,
    loading,
    error,
    fetchReminders,
    fetchUpcomingReminders,
    fetchOverdueReminders,
    createReminder,
    updateReminder,
    completeReminder,
    dismissReminder,
    deleteReminder
  };
}
