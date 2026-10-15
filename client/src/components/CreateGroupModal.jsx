import React, { useState } from 'react';

export default function CreateGroupModal({ isOpen, onClose, onCreateGroup }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onCreateGroup(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Trip / Event Group</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="group-name-input">Event / Trip Name *</label>
            <input
              id="group-name-input"
              type="text"
              className="text-input"
              placeholder="e.g. Odessa Tech Fest 2026, Goa Weekend"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="group-desc-input">Description (Optional)</label>
            <input
              id="group-desc-input"
              type="text"
              className="text-input"
              placeholder="e.g. Hackathon travel, hotel and food expenses"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          {error && <div className="error-alert">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline-sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !name.trim()}
            >
              {submitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
