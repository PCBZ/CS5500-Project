import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTag, FaAngleRight, FaInfoCircle } from 'react-icons/fa';
import { findSimilarEvents, getCategoryDisplayName } from './EventKeywordAnalyzer';
import './RelatedEvents.css';

/**
 * 相关活动组件
 * 根据关键词分析显示与当前活动相似的其他活动
 * 
 * @param {Object} props
 * @param {Object} props.currentEvent - 当前活动对象
 * @param {Array} props.allEvents - 所有活动的数组
 * @param {Function} props.formatDate - 日期格式化函数
 * @param {Function} props.onEventSelect - 活动选择回调函数
 * @param {number} props.maxEvents - 最大显示活动数量，默认为3
 * @param {boolean} props.loading - 加载状态
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

  // 当当前活动或所有活动改变时，重新计算相似活动
  useEffect(() => {
    if (currentEvent && allEvents && allEvents.length > 0) {
      const similar = findSimilarEvents(currentEvent, allEvents, maxEvents);
      setSimilarEvents(similar);
    } else {
      setSimilarEvents([]);
    }
  }, [currentEvent, allEvents, maxEvents]);

  // 如果没有相似活动，不显示组件
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
        ) : similarEvents.length === 0 ? (
          <div className="no-related-events">
            <p>No related events found</p>
          </div>
        ) : (
          <div className="related-events-list">
            {similarEvents.map(({ event, commonCategories }) => (
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
                    {commonCategories.slice(0, 3).map(category => (
                      <div key={category} className="category-tag">
                        <FaTag className="tag-icon" />
                        <span>{getCategoryDisplayName(category)}</span>
                      </div>
                    ))}
                    
                    {commonCategories.length > 3 && (
                      <div className="more-categories">+{commonCategories.length - 3} more</div>
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