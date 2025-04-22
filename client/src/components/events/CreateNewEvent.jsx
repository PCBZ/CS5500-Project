import React, { useState, useEffect, useRef } from 'react';
import './CreateNewEvent.css';
import { createEvent } from '../../services/eventService';

function CreateNewEvent({ onClose, onEventCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    date: '', // expecting format "YYYY-MM-DD"
    location: '',
    capacity: '',
    focus: '',
    ticketPrice: '',
    startDate: '',
    endDate: '',
    eventStage: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showCalendar, setShowCalendar] = useState({
    date: false,
    startDate: false,
    endDate: false
  });
  const [currentDate, setCurrentDate] = useState({
    date: new Date(),
    startDate: new Date(),
    endDate: new Date()
  });
  const [selectedDate, setSelectedDate] = useState({
    date: null,
    startDate: null,
    endDate: null
  });
  const calendarRefs = {
    date: useRef(null),
    startDate: useRef(null),
    endDate: useRef(null)
  };

  // 处理点击外部关闭日历
  useEffect(() => {
    function handleClickOutside(event) {
      Object.keys(calendarRefs).forEach(key => {
        if (calendarRefs[key].current && !calendarRefs[key].current.contains(event.target)) {
          setShowCalendar(prev => ({ ...prev, [key]: false }));
        }
      });
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 获取当前月份的日历数据
  const getCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // 添加上个月的日期
    const firstDayWeekday = firstDay.getDay();
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // 添加当前月的日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // 添加下个月的日期
    const remainingDays = 42 - days.length; // 保持6行
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  // 处理日期选择
  const handleDateSelect = (date, field) => {
    const formattedDate = date.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, [field]: formattedDate }));
    setSelectedDate(prev => ({ ...prev, [field]: date }));
    setShowCalendar(prev => ({ ...prev, [field]: false }));
  };

  // 处理月份导航
  const handlePrevMonth = (field) => {
    setCurrentDate(prev => ({
      ...prev,
      [field]: new Date(prev[field].getFullYear(), prev[field].getMonth() - 1)
    }));
  };

  const handleNextMonth = (field) => {
    setCurrentDate(prev => ({
      ...prev,
      [field]: new Date(prev[field].getFullYear(), prev[field].getMonth() + 1)
    }));
  };

  // 获取月份名称
  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long' });
  };

  // 获取星期名称
  const getWeekDays = () => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  };

  // 检查是否是今天
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 检查是否是选中日期
  const isSelected = (date, field) => {
    return selectedDate[field] && date.toDateString() === selectedDate[field].toDateString();
  };

  // 渲染日历组件
  const renderCalendar = (field) => {
    return (
      <div className="create-event-calendar" ref={calendarRefs[field]}>
        <div className="create-event-calendar-header">
          <button type="button" onClick={() => handlePrevMonth(field)} className="create-event-calendar-nav">←</button>
          <span>{getMonthName(currentDate[field])} {currentDate[field].getFullYear()}</span>
          <button type="button" onClick={() => handleNextMonth(field)} className="create-event-calendar-nav">→</button>
        </div>
        <div className="create-event-calendar-grid">
          {getWeekDays().map(day => (
            <div key={day} className="create-event-calendar-weekday">{day}</div>
          ))}
          {getCalendarDays(currentDate[field]).map(({ date, isCurrentMonth }, index) => (
            <div
              key={index}
              className={`create-event-calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday(date) ? 'today' : ''} ${isSelected(date, field) ? 'selected' : ''}`}
              onClick={() => handleDateSelect(date, field)}
            >
              {date.getDate()}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper function to validate date string
  const isValidDate = (dateString) => {
    const d = new Date(dateString);
    return d instanceof Date && !isNaN(d);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Check required fields
    if (!formData.name || !formData.type || !formData.date || !formData.location || !formData.focus ||!formData.capacity || !formData.eventStage) {
      setError('Name, type, date, location, focus, capacity and event stage are required');
      setLoading(false);
      return;
    }

    // Validate date field(s)
    if (!isValidDate(formData.date)) {
      setError('Please enter a valid date in YYYY-MM-DD format for the event date');
      setLoading(false);
      return;
    }
    // Optionally validate startDate and endDate if provided
    if (formData.startDate && !isValidDate(formData.startDate)) {
      setError('Please enter a valid date in YYYY-MM-DD format for the start date');
      setLoading(false);
      return;
    }
    if (formData.endDate && !isValidDate(formData.endDate)) {
      setError('Please enter a valid date in YYYY-MM-DD format for the end date');
      setLoading(false);
      return;
    }

    // Validate that start date is not after end date when both are provided
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate > endDate) {
        setError('Start date cannot be later than end date');
        setLoading(false);
        return;
      }
    }

      // Validate ticket price
    if (formData.ticketPrice && (isNaN(formData.ticketPrice) || Number(formData.ticketPrice) < 0)) {
      setError('Ticket price must be a positive number or zero');
      setLoading(false);
      return;
    }

    // New capacity validation
if (
  formData.capacity &&
  (isNaN(formData.capacity) || Number(formData.capacity) <= 0)
) {
  setError('Capacity must be a positive number');
  setLoading(false);
  return;
}

    try {
      // Convert date fields to Date objects before sending, if needed
      const payload = {
        name:        formData.name,
        type:        formData.type,
        date:        new Date(formData.date),
        location:    formData.location,
        capacity:    Number(formData.capacity),
        focus:       formData.focus,
        ticketPrice: formData.ticketPrice 
                      ? Number(formData.ticketPrice) 
                      : 0,
        startDate:   formData.startDate 
                      ? new Date(formData.startDate) 
                      : null,
        endDate:     formData.endDate 
                      ? new Date(formData.endDate) 
                      : null,
        eventStage:  formData.eventStage,
      };

      const result = await createEvent(payload);
      console.log("Event creation result:", result);
      
      // 检查是否成功创建
      if (result.message && result.message.toLowerCase().includes('successfully')) {
        // 在关闭组件前先更新所有状态
        setLoading(false);
        setMessage(result.message);
        
        const eventData = {
          ...payload,
          id: result.id,
          status: formData.eventStage,
        };
        
        // 准备要传递给父组件的数据
        const responseData = {
          success: true,
          data: eventData,
          message: result.message
        };
        
        // 先调用父组件的回调
        if (onEventCreated) {
          onEventCreated(responseData);
        }
        
        // 最后才关闭模态框
        if (onClose) {
          setTimeout(() => onClose(), 0); // 使用setTimeout确保状态更新完成
        }
      } else {
        setLoading(false);
        throw new Error(result.message || 'Failed to create event');
      }
    } catch (err) {
      setLoading(false);
      setError('Error creating event: ' + (err.message || 'Unknown error occurred'));
    }
  };

  // Handle cancel to reset form fields and close modal
  const handleCancel = () => {
    console.log("Cancel button clicked");
    setFormData({
      name: '',
      type: '',
      date: '',
      location: '',
      capacity: '',
      focus: '',
      ticketPrice: '',
      startDate: '',
      endDate: '',
      eventStage: '',
    });
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="create-event-container">
      <div className="create-event-header">
        <h2 className="create-event-subtitle">Create New Event</h2>
        <button onClick={handleCancel} className="create-event-close-button">×</button>
      </div>
      <form onSubmit={handleSubmit} className="create-event-form">
        <label className="create-event-label" htmlFor="name">Name <span className="required">*</span></label>
        <input
          className="create-event-input"
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label className="create-event-label" htmlFor="type">Type <span className="required">*</span></label>
        <input
          className="create-event-input"
          id="type"
          name="type"
          type="text"
          value={formData.type}
          onChange={handleChange}
          required
        />

        <label className="create-event-label" htmlFor="date">Date <span className="required">*</span></label>
        <div className="create-event-date-input">
          <input
            className="create-event-input"
            id="date"
            name="date"
            type="text"
            placeholder="YYYY-MM-DD"
            value={formData.date}
            onChange={handleChange}
            onClick={() => setShowCalendar(prev => ({ ...prev, date: true }))}
            readOnly
            required
          />
          {showCalendar.date && renderCalendar('date')}
        </div>

        <label className="create-event-label" htmlFor="location">Location <span className="required">*</span></label>
        <input
          className="create-event-input"
          id="location"
          name="location"
          type="text"
          value={formData.location}
          onChange={handleChange}
          required
        />

        <label className="create-event-label" htmlFor="capacity">Capacity <span className="required">*</span></label>
        <input
          className="create-event-input"
          id="capacity"
          name="capacity"
          type="number"
          min="1"
          step="1"
          value={formData.capacity}
          onChange={handleChange}
          required
        />

        <label className="create-event-label" htmlFor="focus">Focus <span className="required">*</span></label>
        <input
          className="create-event-input"
          id="focus"
          name="focus"
          type="text"
          value={formData.focus}
          onChange={handleChange}
          required
        />

        <label className="create-event-label" htmlFor="ticketPrice">Ticket Price</label>
        <input
          className="create-event-input"
          id="ticketPrice"
          name="ticketPrice"
          min="0"
          step="0.01"
          type="number"
          value={formData.ticketPrice}
          onChange={handleChange}
        />

        <label className="create-event-label" htmlFor="startDate">Start Date</label>
        <div className="create-event-date-input">
          <input
            className="create-event-input"
            id="startDate"
            name="startDate"
            type="text"
            placeholder="YYYY-MM-DD"
            value={formData.startDate}
            onChange={handleChange}
            onClick={() => setShowCalendar(prev => ({ ...prev, startDate: true }))}
            readOnly
          />
          {showCalendar.startDate && renderCalendar('startDate')}
        </div>

        <label className="create-event-label" htmlFor="endDate">End Date</label>
        <div className="create-event-date-input">
          <input
            className="create-event-input"
            id="endDate"
            name="endDate"
            type="text"
            placeholder="YYYY-MM-DD"
            value={formData.endDate}
            onChange={handleChange}
            onClick={() => setShowCalendar(prev => ({ ...prev, endDate: true }))}
            readOnly
          />
          {showCalendar.endDate && renderCalendar('endDate')}
        </div>

        <label className="create-event-label" htmlFor="eventStage">Event Stage <span className="required">*</span></label>
        <select
          className="create-event-input"
          id="eventStage"
          name="eventStage"
          value={formData.eventStage}
          onChange={handleChange}
          required
        >
          <option value="">Select a stage</option>
          <option value="Planning">Planning</option>
          <option value="ListGeneration">List Generation</option>
          <option value="Review">Review</option>
          <option value="Ready">Ready</option>
          <option value="Complete">Complete</option>
        </select>
        {/* Centered error message below submit button */}
        {error && <div className="centered-error-message">{error}</div>}
        {message && <div className="create-event-success">{message}</div>}
        <div className="create-event-button-container">
          <button
            type="button"
            onClick={handleCancel}
            className="create-event-button create-event-cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="create-event-button create-event-submit-button"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
        

      </form>

    </div>
  );
}

export default CreateNewEvent;
