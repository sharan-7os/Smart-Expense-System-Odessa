import React, { useState } from 'react';

export default function ParticipantManager({ participants, onAddParticipant, onDeleteParticipant }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError('');
    setSubmitting(true);
    try {
      await onAddParticipant(name.trim());
      setName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card participant-manager">
      <div className="card-header">
        <h3>Group Members ({participants.length})</h3>
        <span className="card-subtext">Add everyone who is part of this event</span>
      </div>

      <form onSubmit={handleSubmit} className="participant-form">
        <div className="input-with-button">
          <input
            type="text"
            className="text-input"
            placeholder="e.g. Asha, Bala, Charan..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            disabled={submitting}
          />
          <button type="submit" className="btn btn-secondary" disabled={submitting || !name.trim()}>
            {submitting ? 'Adding...' : '+ Add Member'}
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>

      <div className="participant-chips">
        {participants.length === 0 ? (
          <div className="empty-state-inline">
            No members added yet. Add at least 2 participants to start tracking expenses.
          </div>
        ) : (
          participants.map((p) => (
            <div key={p._id} className="participant-chip">
              <span className="chip-avatar">{p.name.charAt(0).toUpperCase()}</span>
              <span className="chip-name">{p.name}</span>
              <button
                type="button"
                className="chip-remove"
                title={`Remove ${p.name}`}
                onClick={() => onDeleteParticipant(p._id, p.name)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
