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
 * Get events list with pagination, filtering, and sorting
 * 
 * @name GET /api/events
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.query.page - Page number for pagination (default: 1)
 * @param {string} req.query.limit - Number of events per page (default: 20)
 * @param {string} req.query.sort - Field to sort by (e.g., "name", "date")
 * @param {string} req.query.order - Sort order ("asc" or "desc")
 * @param {string} req.query.type - Filter by event type
 * @param {string} req.query.location - Filter by location
 * @param {string} req.query.status - Filter by status
 * @param {string} req.query.dateFrom - Filter by date range (start)
 * @param {string} req.query.dateTo - Filter by date range (end)
 * @param {string} req.query.search - Search term for event name
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - List of events with pagination info
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 500 - Server error
 */
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      sort = 'date',
      order = 'asc',
      type,
      location,
      status,
      dateFrom,
      dateTo,
      search
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where conditions based on filters
    const where = {};

    if (type) where.type = type;
    if (location) where.location = location;
    if (status) where.status = status;

    // Date range filtering
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    // Search by name
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } }
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
            email: true,
            role: true
          }
        }
      }
    });

    res.json({
      events,
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
 * @param {string} req.body.date - Event date
 * @param {string} req.body.location - Event location
 * @param {number} req.body.capacity - Event capacity
 * @param {string} req.body.focus - Event focus
 * @param {number} req.body.criteriaMinGivingLevel - Minimum giving level for donors
 * @param {string} req.body.timelineListGenerationDate - Date for list generation
 * @param {string} req.body.timelineReviewDeadline - Deadline for PMM reviews
 * @param {string} req.body.timelineInvitationDate - Date for sending invitations
 * @param {string} req.body.status - Event status
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 201 - Created event
 * @returns {Error} 400 - Missing required fields
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 500 - Server error
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
      status
    } = req.body;

    // Validate required fields
    if (!name || !type || !date || !location) {
      return res.status(400).json({ message: 'Name, type, date, and location are required fields' });
    }

    // Create new event
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
        status: status || undefined, // Use the default from schema if not provided
        createdBy: req.user.userId, // Get user ID from auth middleware
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
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
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        donorLists: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
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
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Prepare updateData based on request body
    const updateData = { ...req.body };
    
    // Convert date strings to Date objects if provided
    if (updateData.date) updateData.date = new Date(updateData.date);
    if (updateData.timelineListGenerationDate) updateData.timelineListGenerationDate = new Date(updateData.timelineListGenerationDate);
    if (updateData.timelineReviewDeadline) updateData.timelineReviewDeadline = new Date(updateData.timelineReviewDeadline);
    if (updateData.timelineInvitationDate) updateData.timelineInvitationDate = new Date(updateData.timelineInvitationDate);
    
    // Convert numeric fields if provided
    if (updateData.capacity !== undefined) updateData.capacity = parseInt(updateData.capacity);
    if (updateData.criteriaMinGivingLevel !== undefined) updateData.criteriaMinGivingLevel = parseFloat(updateData.criteriaMinGivingLevel);

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Delete an event
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
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete event
    // Note: This will cascade to delete related donor lists if you've set up cascade delete in Prisma
    await prisma.event.delete({
      where: { id: eventId }
    });

    res.json({
      message: 'Event deleted successfully'
    });
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
 * @param {Object} req.body - Status update data
 * @param {string} req.body.status - New status
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Updated event
 * @returns {Error} 400 - Invalid event ID format or invalid status
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Event not found
 * @returns {Error} 500 - Server error
 */
router.put('/:id/status', protect, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
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
      data: { status }
    });

    res.json({
      message: 'Event status updated successfully',
      event: updatedEvent
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
 */
router.get('/status/:status', protect, async (req, res) => {
  try {
    const { status } = req.params;
    const {
      page = '1',
      limit = '20',
      sort = 'date',
      order = 'asc'
    } = req.query;

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
            email: true,
            role: true
          }
        }
      }
    });

    res.json({
      events,
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