import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

/**
 * @module EventAPI
 * @category Routes
 */

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Helper function to handle Int serialization in event objects
 * @param {Object} event - The event object to format
 * @returns {Object} Formatted event object with stringified ID
 * @private
 */
const formatEvent = (event) => {
  if (!event) return null;
  
  // Handle single event
  if (!Array.isArray(event)) {
    return {
      ...event,
      id: event.id.toString(),
      createdBy: event.createdBy.toString(),
      criteriaMinGivingLevel: event.criteriaMinGivingLevel ? parseFloat(event.criteriaMinGivingLevel.toString()) : 0
    };
  }
  
  // Handle array of events
  return event.map(e => ({
    ...e,
    id: e.id.toString(),
    createdBy: e.createdBy.toString(),
    criteriaMinGivingLevel: e.criteriaMinGivingLevel ? parseFloat(e.criteriaMinGivingLevel.toString()) : 0
  }));
};

/**
 * Get events list with optional filtering and pagination
 * 
 * @name GET /api/events
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.query.page - Page number for pagination (default: 1)
 * @param {string} req.query.limit - Number of events per page (default: 20)
 * @param {string} req.query.sort - Field to sort by (e.g., "name", "date")
 * @param {string} req.query.order - Sort order ("asc" or "desc")
 * @param {string} req.query.status - Filter by event status
 * @param {string} req.query.location - Filter by location
 * @param {string} req.query.type - Filter by event type
 * @param {string} req.query.search - Search term for event name or focus
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - List of events with pagination info
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * GET /api/events?page=1&limit=10&status=Planning
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "events": [
 *     {
 *       "id": "1",
 *       "name": "Spring Gala 2025",
 *       "type": "Major Donor Event",
 *       "date": "2025-03-15T00:00:00.000Z",
 *       "location": "Vancouver",
 *       "capacity": 200,
 *       "status": "Planning",
 *       ...
 *     },
 *     ...
 *   ],
 *   "total": 12,
 *   "page": 1,
 *   "limit": 10,
 *   "pages": 2
 * }
 */
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      sort = 'date',
      order = 'desc',
      status,
      location,
      type,
      search
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where conditions based on filters
    const where = {};

    if (status) where.status = status;
    if (location) where.location = location;
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { focus: { contains: search} }
      ];
    }

    // Get total count for pagination
    const total = await prisma.event.count({ where });

    // Get events with pagination, sorting, and filtering
    const events = await prisma.event.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sort]: order.toLowerCase()
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        donorLists: {
          select: {
            id: true,
            name: true,
            totalDonors: true,
            approved: true,
            excluded: true,
            pending: true,
            autoExcluded: true,
            reviewStatus: true
          }
        }
      }
    });

    res.json({
      events: formatEvent(events),
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Create a new event
 * 
 * @name POST /api/events
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {Object} req.body - Event data
 * @param {string} req.body.name - Event name
 * @param {string} req.body.type - Event type
 * @param {string} req.body.date - Event date (ISO string)
 * @param {string} req.body.location - Event location
 * @param {number} req.body.capacity - Event capacity
 * @param {string} req.body.focus - Event focus area (optional)
 * @param {number} req.body.criteriaMinGivingLevel - Minimum giving level criteria (optional)
 * @param {string} req.body.timelineListGenerationDate - List generation date (ISO string, optional)
 * @param {string} req.body.timelineReviewDeadline - Review deadline date (ISO string, optional)
 * @param {string} req.body.timelineInvitationDate - Invitation date (ISO string, optional)
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 201 - Created event
 * @returns {Error} 400 - Missing required fields
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * POST /api/events
 * Authorization: Bearer <token>
 * {
 *   "name": "Spring Gala 2025",
 *   "type": "Major Donor Event",
 *   "date": "2025-03-15T18:00:00.000Z",
 *   "location": "Vancouver",
 *   "capacity": 200,
 *   "focus": "Cancer Research",
 *   "criteriaMinGivingLevel": 25000,
 *   "timelineListGenerationDate": "2025-01-15T00:00:00.000Z",
 *   "timelineReviewDeadline": "2025-02-01T00:00:00.000Z",
 *   "timelineInvitationDate": "2025-02-15T00:00:00.000Z"
 * }
 * 
 * // Success Response
 * {
 *   "message": "Event created successfully",
 *   "event": {
 *     "id": "1",
 *     "name": "Spring Gala 2025",
 *     ...
 *   }
 * }
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      type,
      date,
      location,
      capacity,
      focus,
      criteriaMinGivingLevel,
      timelineListGenerationDate,
      timelineReviewDeadline,
      timelineInvitationDate,
      status = 'Planning'
    } = req.body;

    // Validate required fields
    if (!name || !type || !date || !location) {
      return res.status(400).json({ message: 'Name, type, date, and location are required' });
    }

    // Get user ID from auth middleware
    const userId = req.user.id;

    // Create event
    const event = await prisma.event.create({
      data: {
        name,
        type,
        date: new Date(date),
        location,
        capacity: capacity ? parseInt(capacity) : 0,
        focus,
        criteriaMinGivingLevel: criteriaMinGivingLevel ? parseFloat(criteriaMinGivingLevel) : 0,
        timelineListGenerationDate: timelineListGenerationDate ? new Date(timelineListGenerationDate) : null,
        timelineReviewDeadline: timelineReviewDeadline ? new Date(timelineReviewDeadline) : null,
        timelineInvitationDate: timelineInvitationDate ? new Date(timelineInvitationDate) : null,
        status,
        creator: {
          connect: { id: userId }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Event created successfully',
      event: formatEvent(event)
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// 在event.js路由文件中添加
router.get('/types', protect, async (req, res) => {
  try {
    // 获取所有不同的事件类型
    const types = await prisma.event.findMany({
      select: {
        type: true,
      },
      distinct: ['type'],
    });
    
    res.json(types.map(t => t.type));
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/locations', protect, async (req, res) => {
  try {
    // 获取所有不同的地点
    const locations = await prisma.event.findMany({
      select: {
        location: true,
      },
      distinct: ['location'],
    });
    
    res.json(locations.map(l => l.location));
  } catch (error) {
    console.error('Error fetching event locations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get event by ID
 * 
 * @name GET /api/events/:id
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.params.id - Event ID
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Event details
 * @returns {Error} 400 - Invalid event ID format
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Event not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * GET /api/events/1
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "id": "1",
 *   "name": "Spring Gala 2025",
 *   "type": "Major Donor Event",
 *   "date": "2025-03-15T18:00:00.000Z",
 *   "location": "Vancouver",
 *   "capacity": 200,
 *   "status": "Planning",
 *   ...
 * }
 */
router.get('/:id', protect, async (req, res) => {
  try {
    let eventId;
    try {
      eventId = parseInt(req.params.id); 
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        donorLists: {
          select: {
            id: true,
            name: true,
            totalDonors: true,
            approved: true,
            excluded: true,
            pending: true,
            autoExcluded: true,
            reviewStatus: true,
            createdAt: true,
            updatedAt: true,
            eventDonors: {
              select: {
                id: true,
                donorId: true,
                status: true,
                excludeReason: true,
                reviewerId: true,
                reviewDate: true,
                comments: true,
                autoExcluded: true,
                donor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    organizationName: true,
                    totalDonations: true,
                    city: true,
                    tags: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(formatEvent(event));
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Update event information
 * 
 * @name PUT /api/events/:id
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.params.id - Event ID
 * @param {Object} req.body - Updated event data
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Updated event
 * @returns {Error} 400 - Invalid event ID format
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Event not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * PUT /api/events/1
 * Authorization: Bearer <token>
 * {
 *   "name": "Spring Gala 2025 - Updated",
 *   "capacity": 250
 * }
 * 
 * // Success Response
 * {
 *   "message": "Event updated successfully",
 *   "event": {
 *     "id": "1",
 *     "name": "Spring Gala 2025 - Updated",
 *     "capacity": 250,
 *     ...
 *   }
 * }
 */
router.put('/:id', protect, async (req, res) => {
  try {
    let eventId;
    try {
      eventId = parseInt(req.params.id); 
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update event with provided fields
    const updateData = {};
    
    // Handle string fields
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.focus !== undefined) updateData.focus = req.body.focus;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    
    // Handle numeric fields
    if (req.body.capacity !== undefined) updateData.capacity = parseInt(req.body.capacity);
    if (req.body.criteriaMinGivingLevel !== undefined) {
      updateData.criteriaMinGivingLevel = parseFloat(req.body.criteriaMinGivingLevel);
    }
    
    // Handle date fields
    if (req.body.date !== undefined) updateData.date = new Date(req.body.date);
    if (req.body.timelineListGenerationDate !== undefined) {
      updateData.timelineListGenerationDate = req.body.timelineListGenerationDate ? 
        new Date(req.body.timelineListGenerationDate) : null;
    }
    if (req.body.timelineReviewDeadline !== undefined) {
      updateData.timelineReviewDeadline = req.body.timelineReviewDeadline ? 
        new Date(req.body.timelineReviewDeadline) : null;
    }
    if (req.body.timelineInvitationDate !== undefined) {
      updateData.timelineInvitationDate = req.body.timelineInvitationDate ? 
        new Date(req.body.timelineInvitationDate) : null;
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Event updated successfully',
      event: formatEvent(updatedEvent)
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Delete an event (soft delete)
 * 
 * @name DELETE /api/events/:id
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.params.id - Event ID
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Success message
 * @returns {Error} 400 - Invalid event ID format
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Event not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * DELETE /api/events/1
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "message": "Event deleted successfully"
 * }
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    let eventId;
    try {
      eventId = parseInt(req.params.id); 
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // For a soft delete, we could add a 'deleted' field to the Event model
    // Here, we're actually deleting the event, but in production you might want to implement soft delete
    await prisma.event.delete({
      where: { id: eventId }
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Update event status
 * 
 * @name PUT /api/events/:id/status
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.params.id - Event ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.status - New event status (Planning|ListGeneration|Review|Ready|Complete)
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Updated event with new status
 * @returns {Error} 400 - Invalid event ID format or missing/invalid status
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Event not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * PUT /api/events/1/status
 * Authorization: Bearer <token>
 * {
 *   "status": "ListGeneration"
 * }
 * 
 * // Success Response
 * {
 *   "message": "Event status updated successfully",
 *   "event": {
 *     "id": "1",
 *     "status": "ListGeneration",
 *     ...
 *   }
 * }
 */
router.put('/:id/status', protect, async (req, res) => {
  try {
    let eventId;
    try {
      eventId = parseInt(req.params.id); 
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const { status } = req.body;

    // Validate status
    const validStatuses = ['Planning', 'ListGeneration', 'Review', 'Ready', 'Complete'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Valid status is required', 
        validStatuses 
      });
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update event status
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Event status updated successfully',
      event: formatEvent(updatedEvent)
    });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Get events by status
 * 
 * @name GET /api/events/status/:status
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.params.status - Event status to filter by
 * @param {string} req.query.page - Page number for pagination (default: 1)
 * @param {string} req.query.limit - Number of events per page (default: 20)
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - List of events with the specified status
 * @returns {Error} 400 - Invalid status
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * GET /api/events/status/Planning?page=1&limit=10
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "events": [
 *     {
 *       "id": "1",
 *       "name": "Spring Gala 2025",
 *       "status": "Planning",
 *       ...
 *     },
 *     ...
 *   ],
 *   "total": 5,
 *   "page": 1,
 *   "limit": 10,
 *   "pages": 1
 * }
 */
router.get('/status/:status', protect, async (req, res) => {
  try {
    const { status } = req.params;
    const {
      page = '1',
      limit = '20',
      sort = 'date',
      order = 'desc'
    } = req.query;

    // Validate status
    const validStatuses = ['Planning', 'ListGeneration', 'Review', 'Ready', 'Complete'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status', 
        validStatuses 
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await prisma.event.count({
      where: { status }
    });

    // Get events with the specified status
    const events = await prisma.event.findMany({
      where: { status },
      skip,
      take: limitNum,
      orderBy: {
        [sort]: order.toLowerCase()
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        donorLists: {
          select: {
            id: true,
            name: true,
            totalDonors: true,
            approved: true,
            excluded: true,
            pending: true,
            autoExcluded: true,
            reviewStatus: true
          }
        }
      }
    });

    res.json({
      events: formatEvent(events),
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching events by status:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

export default router;