import React from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaSpinner } from 'react-icons/fa';
import './EventDetail.css';
import RelatedEvents from './RelatedEvents'; // Import related events component

const EventDetail = ({ 
  selectedEvent, 
  loading, 
  error, 
  fetchEvents, 
  formatDate,
  events, // Add events parameter to receive all event data
  onEventSelect // Add onEventSelect parameter to receive event selection handler
}) => {
  return (
    <div className="donor-details-container">
      <div className="event-details">
        <h2><FaCalendarAlt className="icon" /> Event Details</h2>
        {loading.events ? (
          <div className="event-details-loading">
            <FaSpinner className="spinner" /> Loading event details...
          </div>
        ) : error.events ? (
          <div className="event-details-error">
            {error.events}
            <button onClick={fetchEvents} className="retry-button-small">Retry</button>
          </div>
        ) : !selectedEvent ? (
          <p>Please select an event</p>
        ) : (
          <>
            <h3>{selectedEvent.name}</h3>
            <p className="event-type">{selectedEvent.type}</p>
            
            <div className="event-detail-item">
              <FaCalendarAlt className="icon" />
              <span>{formatDate(selectedEvent.date)}</span>
            </div>
            
            <div className="event-detail-item">
              <FaMapMarkerAlt className="icon" />
              <span>{selectedEvent.location}</span>
            </div>
            
            <div className="event-detail-item">
              <FaUsers className="icon" />
              <span>Capacity: {selectedEvent.capacity || 'Not specified'}</span>
            </div>
            
            <div className="event-detail-item">
              <FaClock className="icon" />
              <span>Review deadline: {formatDate(selectedEvent.review_deadline)}</span>
            </div>
          </>
        )}
      </div>
      
      {/* Related events component - Added below Event Details section */}
      {selectedEvent && events && events.length > 0 && (
        <RelatedEvents 
          currentEvent={selectedEvent}
          allEvents={events}
          formatDate={formatDate}
          onEventSelect={onEventSelect}
          maxEvents={3}
          loading={loading.events}
        />
      )}
    </div>
  );
};

export default EventDetail;