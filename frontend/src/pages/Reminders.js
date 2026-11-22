import React, { useState, useEffect } from 'react';
import { useReminders } from '../hooks/useReminders';
import { useHotels } from '../hooks/useHotels';
import '../styles/Reminders.css';

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: '#90caf9' },
  { value: 'MEDIUM', label: 'Medium', color: '#ffb74d' },
  { value: 'HIGH', label: 'High', color: '#ef5350' },
  { value: 'URGENT', label: 'Urgent', color: '#d32f2f' }
];

const CATEGORIES = [
  'Rate Update',
  'Group Booking',
  'Maintenance',
  'Staff',
  'Marketing',
  'Other'
];

const formatDate = (dateString) => {
  // Parse the date string without timezone conversion
  // dateString is in ISO format like "2026-06-02T00:00:00.000Z" or "2026-06-02"
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);

  // Create date using local timezone by specifying year, month, day
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const isOverdue = (dueDate) => {
  // Parse the date string without timezone conversion
  const datePart = dueDate.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const dueDateLocal = new Date(year, month - 1, day);

  // Compare with today (start of day in local timezone)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDateLocal < today;
};

const getPriorityColor = (priority) => {
  const p = PRIORITIES.find(pr => pr.value === priority);
  return p ? p.color : '#90caf9';
};

const Reminders = () => {
  const { hotels, fetchHotels } = useHotels();
  const {
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
  } = useReminders();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterHotel, setFilterHotel] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM',
    category: '',
    hotelId: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchHotels();
    fetchReminders();
    fetchUpcomingReminders();
    fetchOverdueReminders();
  }, [fetchHotels, fetchReminders, fetchUpcomingReminders, fetchOverdueReminders]);

  useEffect(() => {
    fetchReminders({
      status: filterStatus || undefined,
      priority: filterPriority || undefined,
      hotelId: filterHotel || undefined
    });
  }, [filterStatus, filterPriority, filterHotel, fetchReminders]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.title || !formData.dueDate) {
      setFormError('Title and due date are required');
      return;
    }

    try {
      if (editingId) {
        await updateReminder(editingId, {
          title: formData.title,
          description: formData.description || null,
          dueDate: formData.dueDate,
          priority: formData.priority,
          category: formData.category || null,
          hotelId: formData.hotelId || null
        });
        setFormSuccess('Reminder updated successfully');
      } else {
        await createReminder({
          title: formData.title,
          description: formData.description || null,
          dueDate: formData.dueDate,
          priority: formData.priority,
          category: formData.category || null,
          hotelId: formData.hotelId || null
        });
        setFormSuccess('Reminder created successfully');
      }

      resetForm();
      fetchReminders();
      fetchUpcomingReminders();
      fetchOverdueReminders();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'MEDIUM',
      category: '',
      hotelId: ''
    });
    setShowForm(false);
    setEditingId(null);
    setFormError('');
    setFormSuccess('');
  };

  const handleEdit = (reminder) => {
    setEditingId(reminder.id);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      dueDate: reminder.dueDate.split('T')[0],
      priority: reminder.priority,
      category: reminder.category || '',
      hotelId: reminder.hotelId || ''
    });
    setShowForm(true);
    setFormError('');
    setFormSuccess('');
  };

  const handleComplete = async (id) => {
    try {
      await completeReminder(id);
      fetchReminders();
      fetchUpcomingReminders();
      fetchOverdueReminders();
    } catch (err) {
      console.error('Failed to complete reminder:', err);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissReminder(id);
      fetchReminders();
      fetchUpcomingReminders();
      fetchOverdueReminders();
    } catch (err) {
      console.error('Failed to dismiss reminder:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await deleteReminder(id);
        fetchReminders();
        fetchUpcomingReminders();
        fetchOverdueReminders();
      } catch (err) {
        console.error('Failed to delete reminder:', err);
      }
    }
  };

  const getDisplayReminders = () => {
    switch (activeTab) {
      case 'upcoming':
        return upcomingReminders;
      case 'overdue':
        return overdueReminders;
      default:
        return reminders;
    }
  };

  const displayReminders = getDisplayReminders();

  return (
    <div className="reminders-page">
      <div className="page-header">
        <h1>Reminders</h1>
        <p>Team reminders shared across your organization</p>
      </div>

      <div className="top-actions">
        <button
          className="add-btn primary-add-btn"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormError('');
            setFormSuccess('');
          }}
        >
          + Add Reminder
        </button>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Reminders ({reminders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({upcomingReminders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'overdue' ? 'active' : ''} ${overdueReminders.length > 0 ? 'has-overdue' : ''}`}
          onClick={() => setActiveTab('overdue')}
        >
          Overdue ({overdueReminders.length})
        </button>
      </div>

      {activeTab === 'all' && (
        <div className="filters-container">
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Priority</label>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Hotel</label>
            <select value={filterHotel} onChange={(e) => setFilterHotel(e.target.value)}>
              <option value="">All Hotels</option>
              {hotels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {showForm && (
        <div className="reminder-form-container">
          <div className="form-header">
            <h3>{editingId ? 'Edit Reminder' : 'Add Reminder'}</h3>
            <button type="button" className="close-btn" onClick={resetForm}>×</button>
          </div>
          {formError && <div className="error-message">{formError}</div>}
          {formSuccess && <div className="success-message">{formSuccess}</div>}

          <form onSubmit={handleSubmit} className="reminder-form">
            <div className="form-row">
              <div className="form-group full-width">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g., Update Q2 rates for standard rooms"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select name="priority" value={formData.priority} onChange={handleFormChange}>
                  {PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleFormChange}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Related Hotel</label>
                <select name="hotelId" value={formData.hotelId} onChange={handleFormChange}>
                  <option value="">None</option>
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Additional details..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Saving...' : (editingId ? 'Update Reminder' : 'Create Reminder')}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {loading && !showForm ? (
        <div className="loading">Loading reminders...</div>
      ) : displayReminders.length === 0 ? (
        <div className="no-reminders">
          <p>No reminders found.</p>
        </div>
      ) : (
        <div className="reminders-list">
          {displayReminders.map(reminder => (
            <div
              key={reminder.id}
              className={`reminder-card ${reminder.status.toLowerCase()} ${
                reminder.status === 'PENDING' && isOverdue(reminder.dueDate) ? 'overdue' : ''
              }`}
            >
              <div className="reminder-header">
                <div className="reminder-priority">
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(reminder.priority) }}
                  >
                    {reminder.priority}
                  </span>
                  {reminder.category && (
                    <span className="category-badge">{reminder.category}</span>
                  )}
                </div>
                <span className={`status-badge ${reminder.status.toLowerCase()}`}>
                  {reminder.status}
                </span>
              </div>

              <h4 className="reminder-title">{reminder.title}</h4>

              <div className="reminder-due">
                <span className={isOverdue(reminder.dueDate) && reminder.status === 'PENDING' ? 'overdue-text' : ''}>
                  Due: {formatDate(reminder.dueDate)}
                </span>
              </div>

              {reminder.hotel && (
                <div className="reminder-hotel">
                  Hotel: {reminder.hotel.name}
                </div>
              )}

              {reminder.description && (
                <p className="reminder-description">{reminder.description}</p>
              )}

              <div className="reminder-meta">
                <span>Created by {reminder.createdBy?.name || 'Unknown'}</span>
              </div>

              <div className="reminder-actions">
                {reminder.status === 'PENDING' && (
                  <>
                    <button
                      className="action-btn complete-btn"
                      onClick={() => handleComplete(reminder.id)}
                    >
                      Complete
                    </button>
                    <button
                      className="action-btn dismiss-btn"
                      onClick={() => handleDismiss(reminder.id)}
                    >
                      Dismiss
                    </button>
                  </>
                )}
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleEdit(reminder)}
                >
                  Edit
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(reminder.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reminders;
