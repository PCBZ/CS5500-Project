import React from 'react';
import './DonorCard.css';

const DonorCard = ({ donor }) => {
  return (
    <div className="donor-card">
      <div className={`donor-info ${donor.autoExcluded ? 'excluded' : ''}`}>
        <div className="donor-header">
          <h3 className="donor-name">{donor.name}</h3>
          {donor.autoExcluded && <span className="auto-excluded">Auto-Excluded</span>}
        </div>
        
        {donor.type === 'Corporate' && <span className="donor-type">{donor.type}</span>}
        
        {donor.priority && (
          <span className="priority-tag">{donor.priority}</span>
        )}
        
        {donor.interests && donor.interests.map((interest, index) => (
          <span key={index} className="interest-tag">{interest}</span>
        ))}
        
        {donor.flag && (
          <span className="flag-tag">{donor.flag}</span>
        )}
        
        {donor.relationships && (
          <div className="relationships">
            <span className="label">Relationships: </span>
            <span>{donor.relationships}</span>
          </div>
        )}
        
        {donor.previousEvents && donor.previousEvents.length > 0 && (
          <div className="previous-events">
            <span className="label">Previous Events: </span>
            <span>{donor.previousEvents.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorCard; 