import './EventDetails.css';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock } from 'react-icons/fa';

const EventDetails = ({ event }) => {
  return (
    <div className="event-details-container">
      <div className="event-details-header">
        <FaCalendarAlt className="event-icon" />
        <h3>Event Details</h3>
      </div>
      
      <div className="event-main-info">
        <h2>{event.name}</h2>
        <p className="event-type">{event.type}</p>
      </div>
      
      <div className="event-details-grid">
        <div className="detail-item">
          <FaCalendarAlt className="detail-icon" />
          <span>{event.date}</span>
        </div>
        
        <div className="detail-item">
          <FaMapMarkerAlt className="detail-icon" />
          <span>{event.location}</span>
        </div>
        
        <div className="detail-item">
          <FaUsers className="detail-icon" />
          <span>Capacity: {event.capacity}</span>
        </div>
        
        <div className="detail-item">
          <FaClock className="detail-icon" />
          <span>Review deadline: {event.reviewDeadline}</span>
        </div>
      </div>
    </div>
  );
};

export default EventDetails; 