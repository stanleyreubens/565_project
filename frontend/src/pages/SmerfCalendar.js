import React, { useState, useEffect } from 'react';
import { useHotels } from '../hooks/useHotels';
import { useSmerf } from '../hooks/useSmerf';
import '../styles/SmerfCalendar.css';

const SEGMENTS = [
  { value: 'SOCIAL', label: 'Social' },
  { value: 'MILITARY', label: 'Military' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'RELIGIOUS', label: 'Religious' },
  { value: 'FRATERNAL', label: 'Fraternal' },
  { value: 'OTHER', label: 'Other' }
];

const SmerfCalendar = () => {
  const { hotels, fetchHotels } = useHotels();
  const { smerfRates, hotelSmerfRates, loading, error, fetchSmerfRates, fetchSmerfRatesByHotel, createSmerfRate, updateSmerfRate, deleteSmerfRate, fetchAllSmerfRates, allSmerfRates } = useSmerf();

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'filtered'
  const [searchQuery, setSearchQuery] = useState(''); // Search by group name

  // Date range for viewing
  const today = new Date();
  const threeMonthsLater = new Date(today);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

  const [viewRange, setViewRange] = useState({
    startDate: today.toISOString().split('T')[0],
    endDate: threeMonthsLater.toISOString().split('T')[0]
  });

  // Form state for adding/editing SMERF rate
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingGroupData, setEditingGroupData] = useState(null); // For group editing
  const [formData, setFormData] = useState({
    hotelId: '',
    roomTypeId: '',
    selectedRoomTypeIds: [], // For multiple room type selection
    roomTypeRates: {}, // Map of roomTypeId -> rate for individual rates
    formRoomTypes: [],
    startDate: '',
    endDate: '',
    rate: '', // Default rate (used when all rooms have same rate)
    groupName: '',
    segment: 'OTHER',
    notes: ''
  });
  const [useIndividualRates, setUseIndividualRates] = useState(false); // Toggle for individual vs same rate
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchHotels();
    fetchAllSmerfRates();
  }, [fetchHotels, fetchAllSmerfRates]);

  useEffect(() => {
    if (selectedHotel) {
      const hotel = hotels.find(h => h.id === selectedHotel);
      setRoomTypes(hotel?.roomTypes || []);
      setSelectedRoomType(null);
      fetchSmerfRatesByHotel(selectedHotel);
    }
  }, [selectedHotel, hotels, fetchSmerfRatesByHotel]);

  useEffect(() => {
    if (selectedHotel && selectedRoomType) {
      fetchSmerfRates(selectedHotel, selectedRoomType, viewRange.startDate, viewRange.endDate);
    }
  }, [selectedHotel, selectedRoomType, viewRange, fetchSmerfRates]);

  const handleHotelChange = (e) => {
    setSelectedHotel(e.target.value);
  };

  const handleRoomTypeChange = (e) => {
    setSelectedRoomType(e.target.value);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // For editing, use single roomTypeId; for creating, use selectedRoomTypeIds
    const roomTypesToCreate = editingId
      ? [formData.roomTypeId]
      : formData.selectedRoomTypeIds;

    if (!formData.hotelId) {
      setFormError('Please select a hotel');
      return;
    }

    if (!editingId && roomTypesToCreate.length === 0) {
      setFormError('Please select at least one room type');
      return;
    }

    if (editingId && !formData.roomTypeId) {
      setFormError('Please select a room type');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setFormError('Please fill in start date and end date');
      return;
    }

    // Validate rates
    if (useIndividualRates && !editingId) {
      // Check that all selected room types have rates
      const missingRates = roomTypesToCreate.filter(rtId => !formData.roomTypeRates[rtId]);
      if (missingRates.length > 0) {
        setFormError('Please enter rates for all selected room types');
        return;
      }
    } else if (!formData.rate) {
      setFormError('Please enter a rate');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date must be after start date');
      return;
    }

    try {
      if (editingId === 'group' && editingGroupData) {
        // Editing a group - handle add/update/delete of room types
        const existingRoomTypeIds = editingGroupData.existingRates.map(r => r.roomTypeId);
        const newRoomTypeIds = formData.selectedRoomTypeIds;

        // Find room types to delete (were in group but now unchecked)
        const toDelete = editingGroupData.existingRates.filter(
          r => !newRoomTypeIds.includes(r.roomTypeId)
        );

        // Find room types to create (newly checked)
        const toCreate = newRoomTypeIds.filter(
          rtId => !existingRoomTypeIds.includes(rtId)
        );

        // Find room types to update (still checked)
        const toUpdate = editingGroupData.existingRates.filter(
          r => newRoomTypeIds.includes(r.roomTypeId)
        );

        // Delete removed room types
        await Promise.all(toDelete.map(r => deleteSmerfRate(r.id)));

        // Update existing room types
        await Promise.all(toUpdate.map(r => {
          const rateValue = useIndividualRates
            ? parseFloat(formData.roomTypeRates[r.roomTypeId])
            : parseFloat(formData.rate);
          return updateSmerfRate(r.id, {
            startDate: formData.startDate,
            endDate: formData.endDate,
            rate: rateValue,
            groupName: formData.groupName || null,
            segment: formData.segment,
            notes: formData.notes || null
          });
        }));

        // Create new room types
        await Promise.all(toCreate.map(roomTypeId => {
          const rateValue = useIndividualRates
            ? parseFloat(formData.roomTypeRates[roomTypeId])
            : parseFloat(formData.rate);
          return createSmerfRate({
            hotelId: formData.hotelId,
            roomTypeId: roomTypeId,
            startDate: formData.startDate,
            endDate: formData.endDate,
            rate: rateValue,
            groupName: formData.groupName || null,
            segment: formData.segment,
            notes: formData.notes || null
          });
        }));

        setFormSuccess('SMERF group updated successfully');
      } else if (editingId && editingId !== 'group') {
        // Update single existing rate
        await updateSmerfRate(editingId, {
          startDate: formData.startDate,
          endDate: formData.endDate,
          rate: parseFloat(formData.rate),
          groupName: formData.groupName || null,
          segment: formData.segment,
          notes: formData.notes || null
        });
        setFormSuccess('SMERF rate updated successfully');
      } else {
        // Create new rates for all selected room types
        const createPromises = roomTypesToCreate.map(roomTypeId => {
          const rateValue = useIndividualRates
            ? parseFloat(formData.roomTypeRates[roomTypeId])
            : parseFloat(formData.rate);
          return createSmerfRate({
            hotelId: formData.hotelId,
            roomTypeId: roomTypeId,
            startDate: formData.startDate,
            endDate: formData.endDate,
            rate: rateValue,
            groupName: formData.groupName || null,
            segment: formData.segment,
            notes: formData.notes || null
          });
        });
        await Promise.all(createPromises);
        setFormSuccess(`SMERF rate added for ${roomTypesToCreate.length} room type(s) successfully`);
      }

      setFormData({
        hotelId: '',
        roomTypeId: '',
        selectedRoomTypeIds: [],
        roomTypeRates: {},
        formRoomTypes: [],
        startDate: '',
        endDate: '',
        rate: '',
        groupName: '',
        segment: 'OTHER',
        notes: ''
      });
      setUseIndividualRates(false);
      setShowForm(false);
      setEditingId(null);
      setEditingGroupData(null);

      // Refresh the lists
      fetchAllSmerfRates();
      if (selectedHotel) {
        fetchSmerfRatesByHotel(selectedHotel);
        if (selectedRoomType) {
          fetchSmerfRates(selectedHotel, selectedRoomType, viewRange.startDate, viewRange.endDate);
        }
      }
    } catch (err) {
      console.error('SMERF save error:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to save SMERF rate');
    }
  };

  const handleEdit = (rate) => {
    const hotel = hotels.find(h => h.id === rate.hotelId);
    setEditingId(rate.id);
    setFormData({
      hotelId: rate.hotelId,
      roomTypeId: rate.roomTypeId,
      selectedRoomTypeIds: [rate.roomTypeId],
      roomTypeRates: { [rate.roomTypeId]: rate.rate.toString() },
      formRoomTypes: hotel?.roomTypes || [],
      startDate: rate.startDate.split('T')[0],
      endDate: rate.endDate.split('T')[0],
      rate: rate.rate.toString(),
      groupName: rate.groupName || '',
      segment: rate.segment || 'OTHER',
      notes: rate.notes || ''
    });
    setUseIndividualRates(false);
    setShowForm(true);
    setFormError('');
    setFormSuccess('');
  };

  // Edit entire group - loads all room types from the group
  const handleEditGroup = (group) => {
    const hotel = hotels.find(h => h.id === group.hotelId);

    // Build selectedRoomTypeIds and roomTypeRates from all room types in the group
    const selectedIds = group.roomTypes.map(rt => rt.roomTypeId);
    const rates = {};
    group.roomTypes.forEach(rt => {
      rates[rt.roomTypeId] = rt.rate.toString();
    });

    // Store the group's rate IDs for updating/deleting
    setEditingId('group');
    setEditingGroupData({
      existingRates: group.roomTypes.map(rt => ({
        id: rt.id,
        roomTypeId: rt.roomTypeId
      }))
    });

    setFormData({
      hotelId: group.hotelId,
      roomTypeId: selectedIds[0] || '',
      selectedRoomTypeIds: selectedIds,
      roomTypeRates: rates,
      formRoomTypes: hotel?.roomTypes || [],
      startDate: group.startDate.split('T')[0],
      endDate: group.endDate.split('T')[0],
      rate: rates[selectedIds[0]] || '',
      groupName: group.groupName || '',
      segment: group.segment || 'OTHER',
      notes: group.notes || ''
    });
    setUseIndividualRates(true);
    setShowForm(true);
    setFormError('');
    setFormSuccess('');
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingGroupData(null);
    setFormData({
      hotelId: '',
      roomTypeId: '',
      selectedRoomTypeIds: [],
      roomTypeRates: {},
      formRoomTypes: [],
      startDate: '',
      endDate: '',
      rate: '',
      groupName: '',
      segment: 'OTHER',
      notes: ''
    });
    setUseIndividualRates(false);
    setFormError('');
    setFormSuccess('');
  };

  // Group SMERF rates by groupName + startDate + endDate for display
  const groupSmerfRates = (rates) => {
    const groups = {};
    rates.forEach(rate => {
      const key = `${rate.groupName || 'No Group'}_${rate.startDate}_${rate.endDate}_${rate.segment}`;
      if (!groups[key]) {
        groups[key] = {
          groupName: rate.groupName,
          startDate: rate.startDate,
          endDate: rate.endDate,
          segment: rate.segment,
          notes: rate.notes,
          hotel: rate.hotel,
          hotelId: rate.hotelId,
          roomTypes: []
        };
      }
      groups[key].roomTypes.push({
        id: rate.id,
        roomTypeId: rate.roomTypeId,
        roomType: rate.roomType,
        rate: rate.rate
      });
    });
    return Object.values(groups);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this SMERF rate?')) {
      try {
        await deleteSmerfRate(id);
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    }
  };

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

  const getSegmentColor = (segment) => {
    const colors = {
      SOCIAL: '#4a6fff',
      MILITARY: '#2e7d32',
      EDUCATION: '#ed6c02',
      RELIGIOUS: '#9c27b0',
      FRATERNAL: '#d32f2f',
      OTHER: '#757575'
    };
    return colors[segment] || colors.OTHER;
  };

  return (
    <div className="smerf-calendar">
      <div className="page-header">
        <h1>SMERF Calendar</h1>
        <p>Manage contracted group rates that act as floor prices</p>
      </div>

      <div className="top-actions">
        <button
          className="add-btn primary-add-btn"
          onClick={() => {
            // Refresh hotels to get latest room types
            fetchHotels();
            setShowForm(true);
            setEditingId(null);
            setEditingGroupData(null);
            setFormError('');
            setFormSuccess('');
          }}
        >
          + Add SMERF Rate
        </button>
      </div>

      <div className="search-container">
        <label className="filter-label">Filter Rates</label>
        <div className="search-row">
          <div className="search-group">
            <label>Hotel</label>
            <select value={selectedHotel || ''} onChange={handleHotelChange}>
              <option value="">All Hotels</option>
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
              ))}
            </select>
          </div>

          <div className="search-group">
            <label>Room Type</label>
            <select
              value={selectedRoomType || ''}
              onChange={handleRoomTypeChange}
              disabled={!selectedHotel}
            >
              <option value="">All Room Types</option>
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name} - ${rt.basePrice}/night</option>
              ))}
            </select>
          </div>

          <div className="search-group">
            <label>From</label>
            <input
              type="date"
              value={viewRange.startDate}
              onChange={(e) => setViewRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          <div className="search-group">
            <label>To</label>
            <input
              type="date"
              value={viewRange.endDate}
              onChange={(e) => setViewRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="smerf-form-container">
          <div className="form-header">
            <h3>{editingId === 'group' ? 'Edit SMERF Group' : editingId ? 'Edit SMERF Rate' : 'Add SMERF Rate'}</h3>
            <button type="button" className="close-btn" onClick={handleCancelForm}>×</button>
          </div>
          {formError && <div className="error-message">{formError}</div>}
          {formSuccess && <div className="success-message">{formSuccess}</div>}

          <form onSubmit={handleSubmit} className="smerf-form">
            <div className="form-row">
              <div className="form-group">
                <label>Hotel *</label>
                <select
                  name="formHotel"
                  value={formData.hotelId || ''}
                  onChange={(e) => {
                    const hotelId = e.target.value;
                    const hotel = hotels.find(h => h.id === hotelId);
                    setFormData(prev => ({
                      ...prev,
                      hotelId,
                      roomTypeId: '',
                      selectedRoomTypeIds: [],
                      roomTypeRates: {},
                      formRoomTypes: hotel?.roomTypes || []
                    }));
                  }}
                  required
                >
                  <option value="">Select a hotel</option>
                  {hotels.map(hotel => (
                    <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Room Type{(editingId && editingId !== 'group') ? ' *' : 's *'}</label>
                {editingId && editingId !== 'group' ? (
                  // Single select for editing a single rate
                  <select
                    name="roomTypeId"
                    value={formData.roomTypeId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomTypeId: e.target.value }))}
                    disabled={!formData.hotelId}
                    required
                  >
                    <option value="">Select a room type</option>
                    {(formData.formRoomTypes || []).map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.name} - ${rt.basePrice}/night</option>
                    ))}
                  </select>
                ) : (
                  // Multi-select checkboxes for creating or editing a group
                  <div className="room-type-checkboxes">
                    {!formData.hotelId ? (
                      <p className="select-hotel-hint">Select a hotel first</p>
                    ) : (formData.formRoomTypes || []).length === 0 ? (
                      <p className="no-room-types">No room types available for this hotel</p>
                    ) : (
                      <>
                        <div className="select-all-row">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.selectedRoomTypeIds.length === formData.formRoomTypes.length && formData.formRoomTypes.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedRoomTypeIds: formData.formRoomTypes.map(rt => rt.id)
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedRoomTypeIds: []
                                  }));
                                }
                              }}
                            />
                            <span className="select-all-text">Select All</span>
                          </label>
                        </div>
                        {(formData.formRoomTypes || []).map(rt => (
                          <label key={rt.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.selectedRoomTypeIds.includes(rt.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedRoomTypeIds: [...prev.selectedRoomTypeIds, rt.id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedRoomTypeIds: prev.selectedRoomTypeIds.filter(id => id !== rt.id)
                                  }));
                                }
                              }}
                            />
                            <span>{rt.name} - ${rt.basePrice}/night</span>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleFormChange}
                  required
                />
              </div>

              {/* Show single rate input for editing single rate OR when not using individual rates (but not for group editing) */}
              {((editingId && editingId !== 'group') || (!editingId && !useIndividualRates && formData.selectedRoomTypeIds.length !== 1)) && (
                <div className="form-group">
                  <label>Rate ($/night) {!editingId && formData.selectedRoomTypeIds.length > 1 ? '(Same for all)' : ''} *</label>
                  <input
                    type="number"
                    name="rate"
                    value={formData.rate}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="104.00"
                    required={!useIndividualRates && editingId !== 'group' && formData.selectedRoomTypeIds.length !== 1}
                  />
                </div>
              )}
            </div>

            {/* Option to set individual rates when multiple room types selected or editing a group */}
            {(editingId === 'group' || (!editingId && formData.selectedRoomTypeIds.length > 0)) && (
              <div className="individual-rates-section">
                {/* Show toggle only when creating new (not editing group) and multiple rooms selected */}
                {!editingId && formData.selectedRoomTypeIds.length > 1 && (
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={useIndividualRates}
                      onChange={(e) => setUseIndividualRates(e.target.checked)}
                    />
                    <span>Set different rates for each room type</span>
                  </label>
                )}

                {/* Always show rates grid when editing group, or when toggle is on for new rates */}
                {(editingId === 'group' || useIndividualRates || formData.selectedRoomTypeIds.length === 1) && formData.selectedRoomTypeIds.length > 0 && (
                  <div className="individual-rates-grid">
                    <h4 className="rates-grid-title">Room Type Rates</h4>
                    {formData.selectedRoomTypeIds.map(rtId => {
                      const rt = formData.formRoomTypes.find(r => r.id === rtId);
                      return (
                        <div key={rtId} className="individual-rate-item">
                          <label>{rt?.name || 'Room'}</label>
                          <div className="rate-input-wrapper">
                            <span className="currency-symbol">$</span>
                            <input
                              type="number"
                              value={formData.roomTypeRates[rtId] || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                roomTypeRates: {
                                  ...prev.roomTypeRates,
                                  [rtId]: e.target.value
                                }
                              }))}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              required
                            />
                            <span className="per-night">/night</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  name="groupName"
                  value={formData.groupName}
                  onChange={handleFormChange}
                  placeholder="e.g., State Teachers Conference"
                />
              </div>

              <div className="form-group">
                <label>Segment</label>
                <select
                  name="segment"
                  value={formData.segment}
                  onChange={handleFormChange}
                >
                  {SEGMENTS.map(seg => (
                    <option key={seg.value} value={seg.value}>{seg.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Additional details about this rate..."
                rows="2"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Saving...' : (editingId === 'group' ? 'Update Group' : editingId ? 'Update SMERF Rate' : 'Save SMERF Rate')}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedHotel && selectedRoomType && (
        <>
          {error && <div className="error-message">{error}</div>}

          {loading && !showForm ? (
            <div className="loading">Loading SMERF rates...</div>
          ) : (
            <div className="smerf-list">
              <h3>SMERF Rates for {hotels.find(h => h.id === selectedHotel)?.name} - {roomTypes.find(rt => rt.id === selectedRoomType)?.name}</h3>
              {smerfRates.length === 0 ? (
                <p className="no-rates">No SMERF rates found for this selection.</p>
              ) : (
                <div className="rates-grid">
                  {smerfRates.map(rate => (
                    <div key={rate.id} className="rate-card">
                      <div className="rate-header">
                        <span
                          className="segment-badge"
                          style={{ backgroundColor: getSegmentColor(rate.segment) }}
                        >
                          {rate.segment || 'OTHER'}
                        </span>
                        <span className="rate-amount">${rate.rate.toFixed(2)}/night</span>
                      </div>

                      <div className="rate-dates">
                        {formatDate(rate.startDate)} - {formatDate(rate.endDate)}
                      </div>

                      {rate.groupName && (
                        <div className="rate-group">{rate.groupName}</div>
                      )}

                      {rate.notes && (
                        <div className="rate-notes">{rate.notes}</div>
                      )}

                      <div className="rate-actions">
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(rate)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(rate.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!selectedHotel && (
        <div className="all-smerf-section">
          <div className="section-header-with-search">
            <h3>All SMERF Rates</h3>
            <div className="group-search">
              <input
                type="text"
                placeholder="Search by group name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="group-search-input"
              />
              {searchQuery && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <div className="loading">Loading all SMERF rates...</div>
          ) : allSmerfRates.length === 0 ? (
            <p className="no-rates">No SMERF rates found. Select a hotel and room type to add your first rate.</p>
          ) : (
            <div className="rates-grid">
              {groupSmerfRates(allSmerfRates)
                .filter(group => {
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    (group.groupName && group.groupName.toLowerCase().includes(query)) ||
                    (group.hotel?.name && group.hotel.name.toLowerCase().includes(query)) ||
                    (group.segment && group.segment.toLowerCase().includes(query))
                  );
                })
                .map((group, idx) => (
                <div key={idx} className="rate-card grouped-card">
                  <div className="rate-header">
                    <span
                      className="segment-badge"
                      style={{ backgroundColor: getSegmentColor(group.segment) }}
                    >
                      {group.segment || 'OTHER'}
                    </span>
                  </div>

                  <div className="rate-hotel-info">
                    <strong>{group.hotel?.name}</strong>
                  </div>

                  <div className="rate-dates">
                    {formatDate(group.startDate)} - {formatDate(group.endDate)}
                  </div>

                  {group.groupName && (
                    <div className="rate-group">{group.groupName}</div>
                  )}

                  {/* Room types with their rates */}
                  <div className="room-types-rates">
                    {group.roomTypes.map((rt, rtIdx) => (
                      <div key={rtIdx} className="room-type-rate-row">
                        <span className="room-type-name">{rt.roomType?.name || 'Room'}</span>
                        <span className="room-type-rate">${rt.rate.toFixed(2)}/night</span>
                        <button
                          className="delete-btn-small"
                          onClick={() => handleDelete(rt.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="group-actions">
                    <button
                      className="edit-group-btn"
                      onClick={() => {
                        setSelectedHotel(group.hotelId);
                        setTimeout(() => handleEditGroup(group), 100);
                      }}
                    >
                      Edit Group
                    </button>
                  </div>

                  {group.notes && (
                    <div className="rate-notes">{group.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedHotel && !selectedRoomType && (
        <div className="hotel-smerf-section">
          <h3>SMERF Rates for {hotels.find(h => h.id === selectedHotel)?.name}</h3>
          {loading ? (
            <div className="loading">Loading SMERF rates...</div>
          ) : hotelSmerfRates.length === 0 ? (
            <p className="no-rates">No SMERF rates found for this hotel. Click "+ Add SMERF Rate" to add your first rate.</p>
          ) : (
            <div className="rates-grid">
              {groupSmerfRates(hotelSmerfRates).map((group, idx) => (
                <div key={idx} className="rate-card grouped-card">
                  <div className="rate-header">
                    <span
                      className="segment-badge"
                      style={{ backgroundColor: getSegmentColor(group.segment) }}
                    >
                      {group.segment || 'OTHER'}
                    </span>
                  </div>

                  <div className="rate-dates">
                    {formatDate(group.startDate)} - {formatDate(group.endDate)}
                  </div>

                  {group.groupName && (
                    <div className="rate-group">{group.groupName}</div>
                  )}

                  {/* Room types with their rates */}
                  <div className="room-types-rates">
                    {group.roomTypes.map((rt, rtIdx) => (
                      <div key={rtIdx} className="room-type-rate-row">
                        <span className="room-type-name">{rt.roomType?.name || 'Room'}</span>
                        <span className="room-type-rate">${rt.rate.toFixed(2)}/night</span>
                        <button
                          className="delete-btn-small"
                          onClick={() => handleDelete(rt.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="group-actions">
                    <button
                      className="edit-group-btn"
                      onClick={() => handleEditGroup(group)}
                    >
                      Edit Group
                    </button>
                  </div>

                  {group.notes && (
                    <div className="rate-notes">{group.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmerfCalendar;
