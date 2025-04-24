import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTag, FaAngleRight, FaInfoCircle } from 'react-icons/fa';
import { findSimilarEvents, getCategoryDisplayName } from './EventKeywordAnalyzer';
import './RelatedEvents.css';

/**
 * Related Events Component
 * Displays events similar to the current event based on keyword analysis
 * 
 * @param {Object} props
 * @param {Object} props.currentEvent - Current event object
 * @param {Array} props.allEvents - Array of all events
 * @param {Function} props.formatDate - Date formatting function
 * @param {Function} props.onEventSelect - Event selection callback function
 * @param {number} props.maxEvents - Maximum number of events to display, default is 3
 * @param {boolean} props.loading - Loading state
 */
const RelatedEvents = ({ 
  currentEvent, 
  allEvents = [], 
  formatDate, 
  onEventSelect,
  maxEvents = 3,
  loading = false
}) => {
  const [similarEvents, setSimilarEvents] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);

  // Recalculate similar events when current event or all events change
  useEffect(() => {
    if (currentEvent && allEvents && allEvents.length > 0) {
      const similar = findSimilarEvents(currentEvent, allEvents, maxEvents);
      setSimilarEvents(similar);
    } else {
      setSimilarEvents([]);
    }
  }, [currentEvent, allEvents, maxEvents]);

  // Don't display component if there are no similar events
  if (similarEvents.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="related-events-container">
      <div className="related-events-header">
        <h3>
          <span>Related Events</span>
          <div className="info-tooltip-container">
            <FaInfoCircle 
              className="info-icon"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div className="info-tooltip">
                These events are related based on similar themes, locations, or event types.
              </div>
            )}
          </div>
        </h3>
      </div>
      
      <div className="related-events-content">
        {loading ? (
          <div className="related-events-loading">
            <div className="loading-spinner"></div>
            <p>Finding related events...</p>
          </div>
        ) : (
          <div className="related-events-list">
            {similarEvents.map(({ event, details }) => (
              <div 
                key={event.id} 
                className="related-event-item" 
                onClick={() => onEventSelect && onEventSelect(event)}
              >
                <div className="related-event-body">
                  <h4 className="related-event-title">{event.name}</h4>
                  
                  <div className="related-event-details">
                    {event.date && (
                      <div className="related-event-detail">
                        <FaCalendarAlt className="detail-icon" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                    )}
                    
                    {event.location && (
                      <div className="related-event-detail">
                        <FaMapMarkerAlt className="detail-icon" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    {event.capacity && (
                      <div className="related-event-detail">
                        <FaUsers className="detail-icon" />
                        <span>Capacity: {event.capacity}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="related-event-categories">
                    {details.matchedCategories.slice(0, 3).map(category => (
                      <div key={category} className="category-tag">
                        <FaTag className="tag-icon" />
                        <span>{getCategoryDisplayName(category)}</span>
                      </div>
                    ))}
                    
                    {details.matchedCategories.length > 3 && (
                      <div className="more-categories">+{details.matchedCategories.length - 3} more</div>
                    )}
                  </div>
                </div>
                
                <div className="related-event-action">
                  <FaAngleRight className="action-icon" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedEvents;