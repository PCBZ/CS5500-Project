import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';
import { formatDonor } from './donor.js';

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
    const where = {
      isDeleted: false
    };

    // Convert status string value to Prisma EventStatus enum
    // Valid values: Planning, ListGeneration, Review, Ready, Complete
    if (status) {
      // Special case: 'active' can map to multiple "active" states
      if (status === 'active') {
        where.status = { in: ['Planning', 'ListGeneration', 'Review', 'Ready'] };
      } else {
        where.status = status;
      }
    }
    
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

    // Create event with a donor list in a transaction
    const result = await prisma.$transaction(async (prisma) => {
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

      // Create donor list for this event
      const donorList = await prisma.eventDonorList.create({
        data: {
          eventId: event.id,
          name: `${event.name} - Donor List`,
          totalDonors: 0,
          approved: 0,
          excluded: 0,
          pending: 0,
          autoExcluded: 0,
          reviewStatus: 'pending',
          generatedBy: userId
        }
      });

      return { event, donorList };
    });

    res.status(201).json({
      message: 'Event created successfully',
      event: formatEvent(result.event),
      donorList: {
        id: result.donorList.id,
        name: result.donorList.name,
        totalDonors: result.donorList.totalDonors
      }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// 在event.js路由文件中添加
router.get('/types', protect, async (req, res) => {
  try {
    const types = await prisma.event.findMany({
      where: {
        isDeleted: false 
      },
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
    const locations = await prisma.event.findMany({
      where: {
        isDeleted: false 
      },
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
      where: { id: eventId,  isDeleted: false  },
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

    // Implementing soft delete instead of actual delete
    await prisma.event.update({
      where: { id: eventId },
      data: { isDeleted: true }
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
      where: { status, isDeleted: false  }
    });

    // Get events with the specified status
    const events = await prisma.event.findMany({
      where: { status, isDeleted: false },
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

/**
 * Get donors for a specific event with pagination and filtering
 * 
 * @name GET /api/events/:id/donors
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.params.id - Event ID
 * @param {string} [req.query.page=1] - Page number for pagination
 * @param {string} [req.query.limit=20] - Number of items per page
 * @param {string} [req.query.search] - Search term for donor name or attributes
 * @param {string} [req.query.status] - Filter by donor status (approved, pending, excluded, etc.)
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Donors associated with the event with pagination info
 * @returns {Error} 400 - Invalid event ID format
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Event not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * GET /api/events/1/donors?page=1&limit=10&status=Approved
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "donors": [
 *     {
 *       "id": 201,
 *       "donor_id": 301,
 *       "status": "Approved",
 *       "comments": "Important donor",
 *       "donor": {
 *         "id": 301,
 *         "first_name": "John",
 *         "last_name": "Doe",
 *         "organization_name": null,
 *         "total_donations": 5000
 *       }
 *     }
 *   ],
 *   "total": 1,
 *   "page": 1,
 *   "limit": 10,
 *   "pages": 1
 * }
 */
router.get('/:id/donors', protect, async (req, res) => {
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
      where: { id: eventId, isDeleted: false },
      include: {
        donorLists: {
          select: {
            id: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Set pagination parameters
    const {
      page = '1',
      limit = '20',
      search = '',
      status = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // If event has no donor list, return empty result
    if (!event.donorLists || event.donorLists.length === 0) {
      return res.json({
        donors: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        pages: 0,
        message: 'Event has no donor list',
        needsListCreation: true
      });
    }

    // Get the first donor list ID of the event
    const donorListId = event.donorLists[0].id;
    
    // Build query conditions
    const where = {
      donorListId: donorListId
    };
    
    // Add status filter
    if (status) {
      where.status = status;
    }
    
    // Add name search filter
    if (search) {
      const searchLower = search.toLowerCase();
      where.donor = {
        OR: [
          { firstName: { contains: searchLower } },
          { lastName: { contains: searchLower } },
          { organizationName: { contains: searchLower } }
        ]
      };
    }

    // Get total record count
    const total = await prisma.eventDonor.count({ where });

    // Get donors already in the event
    const eventDonors = await prisma.eventDonor.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            organizationName: true,
            totalDonations: true,
            largestGift: true,
            firstGiftDate: true,
            lastGiftDate: true,
            lastGiftAmount: true,
            city: true,
            tags: true
          }
        }
      }
    });

    // Format response
    const formattedDonors = eventDonors.map(ed => ({
      id: ed.id,
      donor_id: ed.donorId,
      status: ed.status,
      exclude_reason: ed.excludeReason,
      reviewer_id: ed.reviewerId,
      review_date: ed.reviewDate,
      comments: ed.comments,
      auto_excluded: ed.autoExcluded,
      created_at: ed.createdAt,
      updated_at: ed.updatedAt,
      donor: {
        id: ed.donor.id,
        first_name: ed.donor.firstName,
        last_name: ed.donor.lastName,
        organization_name: ed.donor.organizationName,
        total_donations: ed.donor.totalDonations,
        largest_gift: ed.donor.largestGift,
        first_gift_date: ed.donor.firstGiftDate,
        last_gift_date: ed.donor.lastGiftDate,
        last_gift_amount: ed.donor.lastGiftAmount,
        city: ed.donor.city,
        tags: ed.donor.tags
      }
    }));

    res.json({
      donors: formattedDonors,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching event donors:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Add a donor to an event
 * 
 * @name POST /api/events/:id/donors
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.params.id - Event ID
 * @param {Object} req.body - Donor data
 * @param {string} req.body.donorId - ID of the donor to add
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Success message and donor list info
 * @returns {Error} 400 - Invalid event ID format or missing donor ID
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Event or donor not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * POST /api/events/1/donors
 * Authorization: Bearer <token>
 * {
 *   "donorId": "123"
 * }
 * 
 * // Success Response
 * {
 *   "message": "Donor added to event successfully",
 *   "donorList": {
 *     "id": 45,
 *     "name": "Spring Gala 2025 - Donor List",
 *     "totalDonors": 86
 *   },
 *   "eventDonor": {
 *     "id": 345,
 *     "donorId": 123,
 *     "status": "Pending"
 *   }
 * }
 */
router.post('/:id/donors', protect, async (req, res) => {
  try {
    // Validate event ID
    let eventId;
    try {
      eventId = parseInt(req.params.id); 
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    // Validate donor ID
    const { donorId } = req.body;
    if (!donorId) {
      return res.status(400).json({ message: 'Donor ID is required' });
    }

    const donorIdInt = parseInt(donorId);
    if (isNaN(donorIdInt)) {
      return res.status(400).json({ message: 'Invalid donor ID format' });
    }

    // Validate if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        donorLists: {
          select: {
            id: true,
            name: true,
            totalDonors: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Validate if donor exists
    const donor = await prisma.donor.findUnique({
      where: { id: donorIdInt }
    });

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Get or create event's donor list
    let donorList = event.donorLists && event.donorLists.length > 0 
      ? event.donorLists[0] 
      : null;

    if (!donorList) {
      // Create donor list
      donorList = await prisma.eventDonorList.create({
        data: {
          name: `${event.name} - Donor List`,
          eventId: eventId,
          generatedBy: req.user.id,
          totalDonors: 0,
          pending: 0,
          approved: 0,
          excluded: 0,
          autoExcluded: 0,
          reviewStatus: 'Pending'
        }
      });
    }

    // Check if donor is already in the list
    const existingEventDonor = await prisma.eventDonor.findFirst({
      where: {
        donorListId: donorList.id,
        donorId: donorIdInt
      }
    });

    if (existingEventDonor) {
      return res.status(400).json({ 
        message: 'Donor is already in this event',
        donorList,
        eventDonor: existingEventDonor
      });
    }

    // Add donor to list
    const eventDonor = await prisma.eventDonor.create({
      data: {
        donorListId: donorList.id,
        donorId: donorIdInt,
        status: 'Pending',
        comments: 'Added via API'
      }
    });

    // Update list statistics
    await prisma.eventDonorList.update({
      where: { id: donorList.id },
      data: {
        totalDonors: { increment: 1 },
        pending: { increment: 1 }
      }
    });

    // Get updated donor list
    const updatedDonorList = await prisma.eventDonorList.findUnique({
      where: { id: donorList.id },
      select: {
        id: true,
        name: true,
        totalDonors: true,
        pending: true,
        approved: true,
        excluded: true
      }
    });

    res.json({
      message: 'Donor added to event successfully',
      donorList: updatedDonorList,
      eventDonor: {
        id: eventDonor.id,
        donorId: eventDonor.donorId,
        status: eventDonor.status
      }
    });
  } catch (error) {
    console.error('Error adding donor to event:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Remove a donor from an event
 * 
 * @name DELETE /api/events/:id/donors/:donorId
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.params.id - Event ID
 * @param {string} req.params.donorId - Donor ID to remove
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Success message
 * @returns {Error} 400 - Invalid event ID or donor ID format
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Event, donor list or donor not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * DELETE /api/events/1/donors/123
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "message": "Donor removed from event successfully",
 *   "donorList": {
 *     "id": 45,
 *     "name": "Spring Gala 2025 - Donor List",
 *     "totalDonors": 85
 *   }
 * }
 */
router.delete('/:id/donors/:donorId', protect, async (req, res) => {
  try {
    // Validate event ID
    let eventId;
    try {
      eventId = parseInt(req.params.id); 
      if (isNaN(eventId)) {
        return res.status(400).json({ message: 'Invalid event ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    // Validate donor ID
    let donorId;
    try {
      donorId = parseInt(req.params.donorId);
      if (isNaN(donorId)) {
        return res.status(400).json({ message: 'Invalid donor ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid donor ID format' });
    }

    // Validate if event exists and get donor list ID
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        donorLists: {
          select: {
            id: true,
            name: true,
            totalDonors: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event has donor list
    if (!event.donorLists || event.donorLists.length === 0) {
      return res.status(404).json({ message: 'Event has no donor list' });
    }

    const donorListId = event.donorLists[0].id;

    // Find donor record in the list
    const eventDonor = await prisma.eventDonor.findFirst({
      where: {
        donorListId: donorListId,
        donorId: donorId
      }
    });

    if (!eventDonor) {
      return res.status(404).json({ message: 'Donor not found in this event' });
    }

    // Get donor status for updating statistics
    const donorStatus = eventDonor.status;

    // Delete donor record
    await prisma.eventDonor.delete({
      where: {
        id: eventDonor.id
      }
    });

    // Update list statistics
    const updateData = {
      totalDonors: { decrement: 1 }
    };

    // Update corresponding count based on donor status
    if (donorStatus === 'Pending') {
      updateData.pending = { decrement: 1 };
    } else if (donorStatus === 'Approved') {
      updateData.approved = { decrement: 1 };
    } else if (donorStatus === 'Excluded') {
      updateData.excluded = { decrement: 1 };
    } else if (donorStatus === 'AutoExcluded') {
      updateData.autoExcluded = { decrement: 1 };
    }

    // Update donor list statistics
    await prisma.eventDonorList.update({
      where: { id: donorListId },
      data: updateData
    });

    // Get updated donor list
    const updatedDonorList = await prisma.eventDonorList.findUnique({
      where: { id: donorListId },
      select: {
        id: true,
        name: true,
        totalDonors: true,
        pending: true,
        approved: true,
        excluded: true,
        autoExcluded: true
      }
    });

    res.json({
      message: 'Donor removed from event successfully',
      donorList: updatedDonorList
    });
  } catch (error) {
    console.error('Error removing donor from event:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Update event donor information
 * @route PATCH /api/events/:eventId/donors/:donorId
 * @param {string} req.params.eventId - Event ID
 * @param {string} req.params.donorId - Event Donor ID
 * @param {object} req.body - Fields to update (comments, exclude_reason, etc.)
 * @returns {object} Updated event donor
 */
router.patch('/:eventId/donors/:donorId', protect, async (req, res) => {
  try {
    const { eventId, donorId } = req.params;
    const updateData = req.body;
    
    console.log('Updating event donor:', { eventId, donorId, updateData });
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);

    // Create a valid update object with Prisma model field names
    const validUpdateFields = {
      status: updateData.status,
      comments: updateData.comments,
      excludeReason: updateData.exclude_reason, // Convert from snake_case to camelCase
      autoExcluded: updateData.auto_excluded    // Convert from snake_case to camelCase
    };
    
    // Add review_date and reviewer_id if we're updating status
    if (updateData.status) {
      validUpdateFields.reviewDate = new Date();  // Convert from snake_case to camelCase
      validUpdateFields.reviewerId = req.user?.id; // Convert from snake_case to camelCase
    }
    
    // Remove undefined fields
    Object.keys(validUpdateFields).forEach(key => 
      validUpdateFields[key] === undefined && delete validUpdateFields[key]
    );
    
    // If no valid fields to update, return error
    if (Object.keys(validUpdateFields).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    // Find the event donor record
    let eventDonor;
    try {
      console.log(`Finding event donor with id = ${parseInt(donorId)}`);
      eventDonor = await prisma.eventDonor.findUnique({
        where: { id: parseInt(donorId) },
        include: { donor: true }
      });
      console.log('Event donor search result:', eventDonor ? 'Found' : 'Not found', 
        eventDonor ? { id: eventDonor.id, donorId: eventDonor.donorId, donorListId: eventDonor.donorListId } : null);
    } catch (error) {
      console.error('Error finding event donor:', error);
      return res.status(500).json({ message: 'Failed to find event donor: ' + error.message });
    }
    
    if (!eventDonor) {
      console.log(`Event donor with id=${donorId} not found. Trying alternative lookup methods.`);
      
      // Try alternative lookup methods
      try {
        // Try finding by donorId and eventId through donorList
        console.log(`Trying to find eventDonor by donor connection`);
        const donorList = await prisma.eventDonorList.findFirst({
          where: { eventId: parseInt(eventId) },
          include: { eventDonors: true }
        });
        
        if (donorList) {
          console.log(`Found donor list with ${donorList.eventDonors.length} donors`);
          eventDonor = donorList.eventDonors.find(ed => 
            ed.donorId === parseInt(donorId) || ed.id === parseInt(donorId)
          );
          
          if (eventDonor) {
            console.log(`Found event donor using alternative lookup: ${eventDonor.id}`);
            // Get full donor info
            eventDonor = await prisma.eventDonor.findUnique({
              where: { id: eventDonor.id },
              include: { donor: true }
            });
          } else {
            console.log(`No event donor found in donor list matching donorId=${donorId}`);
          }
        } else {
          console.log(`No donor list found for eventId=${eventId}`);
        }
      } catch (altError) {
        console.error('Error in alternative event donor lookup:', altError);
      }
      
      // If still not found after alternative methods
      if (!eventDonor) {
        return res.status(404).json({ message: 'Event donor not found' });
      }
    }
    
    // Check if this eventDonor belongs to the specified event
    if (eventDonor.donorListId) {
      let donorList;
      try {
        console.log(`Finding donor list with id = ${eventDonor.donorListId}`);
        donorList = await prisma.eventDonorList.findUnique({
          where: { id: eventDonor.donorListId }
        });
        console.log('Donor list search result:', donorList ? 
          { id: donorList.id, eventId: donorList.eventId, expectedEventId: parseInt(eventId) } : 'Not found');
      } catch (error) {
        console.error('Error finding donor list:', error);
        return res.status(500).json({ message: 'Failed to find donor list: ' + error.message });
      }
      
      if (!donorList || donorList.eventId !== parseInt(eventId)) {
        return res.status(403).json({ message: 'Event donor does not belong to the specified event' });
      }
    }
    
    // If updating status, validate it
    if (validUpdateFields.status && !['Pending', 'Approved', 'Excluded'].includes(validUpdateFields.status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: Pending, Approved, Excluded' });
    }
    
    // If status is Excluded, we might want to ensure exclude_reason is provided
    if (validUpdateFields.status === 'Excluded' && !validUpdateFields.excludeReason && !eventDonor.excludeReason) {
      validUpdateFields.excludeReason = 'Excluded by user';
    }
    
    console.log('Valid update fields:', validUpdateFields);
    
    // Update the event donor
    let updatedEventDonor;
    try {
      updatedEventDonor = await prisma.eventDonor.update({
        where: { id: parseInt(eventDonor.id) }, // Use the eventDonor.id we found
        data: validUpdateFields,
        include: { donor: true }
      });
      console.log('Updated event donor successfully:', { id: updatedEventDonor.id });
    } catch (error) {
      console.error('Error updating event donor:', error);
      return res.status(500).json({ message: 'Failed to update event donor: ' + error.message });
    }
    
    // Convert back to snake_case for API response
    res.json({
      id: updatedEventDonor.id,
      status: updatedEventDonor.status,
      comments: updatedEventDonor.comments,
      exclude_reason: updatedEventDonor.excludeReason,
      auto_excluded: updatedEventDonor.autoExcluded,
      review_date: updatedEventDonor.reviewDate,
      reviewer_id: updatedEventDonor.reviewerId,
      donor: {
        id: updatedEventDonor.donor.id,
        firstName: updatedEventDonor.donor.firstName,
        lastName: updatedEventDonor.donor.lastName,
        organizationName: updatedEventDonor.donor.organizationName
      }
    });
  } catch (error) {
    console.error('Error updating event donor:', error);
    res.status(500).json({ message: 'Failed to update event donor: ' + error.message });
  }
});

/**
 * Update event donor status
 * @route PATCH /api/events/:eventId/donors/:donorId/status
 * @param {string} req.params.eventId - Event ID
 * @param {string} req.params.donorId - Event Donor ID
 * @param {string} req.body.status - New status ('Pending', 'Approved', or 'Excluded')
 * @returns {object} Updated event donor
 */
router.patch('/:eventId/donors/:donorId/status', protect, async (req, res) => {
  try {
    const { eventId, donorId } = req.params;
    const { status } = req.body;
    
    console.log('Updating event donor status:', { eventId, donorId, status });
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    // Validate status
    if (!status || !['Pending', 'Approved', 'Excluded'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: Pending, Approved, Excluded' });
    }
    
    // Find the event donor record
    let eventDonor;
    try {
      console.log(`Finding event donor with id = ${parseInt(donorId)}`);
      eventDonor = await prisma.eventDonor.findUnique({
        where: { id: parseInt(donorId) },
        include: { donor: true }
      });
      console.log('Event donor search result:', eventDonor ? 'Found' : 'Not found',
        eventDonor ? { id: eventDonor.id, donorId: eventDonor.donorId, donorListId: eventDonor.donorListId } : null);
    } catch (error) {
      console.error('Error finding event donor:', error);
      return res.status(500).json({ message: 'Failed to find event donor: ' + error.message });
    }
    
    if (!eventDonor) {
      console.log(`Event donor with id=${donorId} not found. Trying alternative lookup methods.`);
      
      // Try alternative lookup methods
      try {
        // Try finding by donorId and eventId through donorList
        console.log(`Trying to find eventDonor by donor connection`);
        const donorList = await prisma.eventDonorList.findFirst({
          where: { eventId: parseInt(eventId) },
          include: { eventDonors: true }
        });
        
        if (donorList) {
          console.log(`Found donor list with ${donorList.eventDonors.length} donors`);
          eventDonor = donorList.eventDonors.find(ed => 
            ed.donorId === parseInt(donorId) || ed.id === parseInt(donorId)
          );
          
          if (eventDonor) {
            console.log(`Found event donor using alternative lookup: ${eventDonor.id}`);
            // Get full donor info
            eventDonor = await prisma.eventDonor.findUnique({
              where: { id: eventDonor.id },
              include: { donor: true }
            });
          } else {
            console.log(`No event donor found in donor list matching donorId=${donorId}`);
          }
        } else {
          console.log(`No donor list found for eventId=${eventId}`);
        }
      } catch (altError) {
        console.error('Error in alternative event donor lookup:', altError);
      }
      
      // If still not found after alternative methods
      if (!eventDonor) {
        return res.status(404).json({ message: 'Event donor not found' });
      }
    }
    
    // Check if this eventDonor belongs to the specified event
    if (eventDonor.donorListId) {
      let donorList;
      try {
        console.log(`Finding donor list with id = ${eventDonor.donorListId}`);
        donorList = await prisma.eventDonorList.findUnique({
          where: { id: eventDonor.donorListId }
        });
        console.log('Donor list search result:', donorList ? 
          { id: donorList.id, eventId: donorList.eventId, expectedEventId: parseInt(eventId) } : 'Not found');
      } catch (error) {
        console.error('Error finding donor list:', error);
        return res.status(500).json({ message: 'Failed to find donor list: ' + error.message });
      }
      
      if (!donorList || donorList.eventId !== parseInt(eventId)) {
        return res.status(403).json({ message: 'Event donor does not belong to the specified event' });
      }
    }
    
    // Update the event donor status - use correct Prisma field names
    let updatedEventDonor;
    try {
      updatedEventDonor = await prisma.eventDonor.update({
        where: { id: parseInt(eventDonor.id) }, // Use the eventDonor.id we found
        data: { 
          status,
          // If status is Excluded, we might want to set autoExcluded to true as well
          autoExcluded: status === 'Excluded' ? true : false,
          // Set reviewDate to now
          reviewDate: new Date(),
          // Set reviewerId to current user if available
          reviewerId: req.user?.id
        },
        include: { donor: true }
      });
      console.log('Updated event donor status successfully:', { id: updatedEventDonor.id, status: updatedEventDonor.status });
    } catch (error) {
      console.error('Error updating event donor status:', error);
      return res.status(500).json({ message: 'Failed to update event donor status: ' + error.message });
    }
    
    // Return response with snake_case for API consistency
    res.json({
      id: updatedEventDonor.id,
      status: updatedEventDonor.status,
      auto_excluded: updatedEventDonor.autoExcluded,
      review_date: updatedEventDonor.reviewDate,
      reviewer_id: updatedEventDonor.reviewerId,
      donor: {
        id: updatedEventDonor.donor.id,
        firstName: updatedEventDonor.donor.firstName,
        lastName: updatedEventDonor.donor.lastName,
        organizationName: updatedEventDonor.donor.organizationName
      }
    });
  } catch (error) {
    console.error('Error updating event donor status:', error);
    res.status(500).json({ message: 'Failed to update event donor status: ' + error.message });
  }
});

/**
 * Get available donors for an event
 * 
 * @name GET /api/events/:id/available-donors
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.params.id - Event ID
 * @param {string} [req.query.page=1] - Page number for pagination
 * @param {string} [req.query.limit=20] - Number of items per page
 * @param {string} [req.query.search] - Search term for donor name or attributes
 * @param {string} [req.query.city] - Filter by city
 * @param {string} [req.query.minDonation] - Filter by minimum total donation amount
 * @param {string} [req.query.tags] - Filter by tags (comma-separated)
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Available donors with pagination info
 * @returns {Error} 400 - Invalid event ID format
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Event not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * GET /api/events/1/available-donors?page=1&limit=10&search=John&city=Vancouver
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "donors": [
 *     {
 *       "id": 201,
 *       "first_name": "John",
 *       "last_name": "Doe",
 *       "organization_name": null,
 *       "total_donations": 5000,
 *       "city": "Vancouver",
 *       "tags": ["High Priority", "Cancer Research Interest"]
 *     }
 *   ],
 *   "total": 1,
 *   "page": 1,
 *   "limit": 10,
 *   "pages": 1
 * }
 */
router.get('/:id/available-donors', protect, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    // Step 1: Get event information
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Step 2: Get existing donors in the event
    const existingDonors = await prisma.eventDonor.findMany({
      where: {
        donorList: {
          eventId: eventId
        }
      },
      include: {
        donor: true  // Include full donor information
      }
    });

    // Process multiple ID fields and ensure uniqueness
    const currentEventDonorIds = [...new Set(
      existingDonors
        .map(donor => {
          // Process possible different ID fields
          const id = donor.donorId || donor.donor_id || donor.donor?.id;
          if (!id) {
            console.warn(`Warning: Donor record missing ID:`, donor);
          }
          return id;
        })
        .filter(id => id != null)  // Filter out null values
    )];

    // If no donors found in the event
    if (!existingDonors && !currentEventDonorIds.length) {
      console.log(`No donors found for event ${eventId}, creating empty list`);
      // Continue processing, but use empty array
    }

    // Get pagination and filter parameters
    const {
      page = '1',
      limit = '20',
      search = '',
      city = '',
      minDonation = '',
      tags = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build base where clause for donors
    const where = {
      excluded: false,
      deceased: false
    };

    // Add search conditions
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { firstName: { contains: searchLower } },
        { lastName: { contains: searchLower } },
        { organizationName: { contains: searchLower } }
      ];
    }

    // Add city filter
    if (city) {
      where.city = city;
    }

    // Add minimum donation filter
    if (minDonation) {
      where.totalDonations = {
        gte: parseFloat(minDonation)
      };
    }

    // Add tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = {
        contains: tagArray.join(',')
      };
    }

    // Get donors already in the event
    const eventDonors = await prisma.eventDonor.findMany({
      where: {
        donorList: {
          eventId: eventId
        }
      },
      select: {
        donorId: true
      }
    });

    const existingDonorIds = eventDonors.map(ed => ed.donorId);

    // Add exclusion for existing donors
    if (existingDonorIds.length > 0) {
      where.NOT = {
        id: {
          in: existingDonorIds
        }
      };
    }

    // Get total count for pagination
    const total = await prisma.donor.count({ where });

    // Get available donors
    const donors = await prisma.donor.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        totalDonations: 'desc'
      }
    });

    // Format response
    res.json({
      donors: formatDonor(donors),
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching available donors:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Get recommended donors for an event based on location matching
 * 
 * @name GET /api/events/:eventId/recommended-donors
 * @function
 * @memberof module:EventAPI
 * @inner
 */
router.get('/:eventId/recommended-donors', protect, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    console.log('Getting recommended donors for event:', eventId);

    // Get event information
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      console.error('Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.location) {
      console.error('Event has no location set:', eventId);
      return res.status(400).json({ message: 'Event location is not set' });
    }

    console.log('Event location:', event.location);

    // Get donors from the same city
    const recommendedDonors = await prisma.donor.findMany({
      where: {
        city: event.location,
        excluded: false,
        deceased: false
      },
      orderBy: {
        totalDonations: 'desc'
      }
    });

    console.log('Found donors in same city:', recommendedDonors.length);

    // Get existing donors in the event
    const existingDonors = await prisma.eventDonor.findMany({
      where: {
        donorList: {
          eventId: eventId
        }
      },
      select: {
        donorId: true
      }
    });

    const existingDonorIds = existingDonors.map(d => d.donorId);
    console.log('Existing donor IDs:', existingDonorIds);

    // Filter out already added donors
    const filteredRecommendedDonors = recommendedDonors.filter(
      donor => !existingDonorIds.includes(donor.id)
    );

    console.log('Filtered recommended donors:', filteredRecommendedDonors.length);

    res.json({
      recommendedDonors: formatDonor(filteredRecommendedDonors)
    });

  } catch (error) {
    console.error('Error getting recommended donors:', error);
    res.status(500).json({ 
      message: 'Failed to get recommended donors', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Get all donor IDs for a specific event
 * 
 * @name GET /api/events/:id/donor-ids
 * @function
 * @memberof module:EventAPI
 * @inner
 * @param {string} req.params.id - Event ID
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Array of donor IDs
 * @returns {Error} 400 - Invalid event ID format
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Event not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * GET /api/events/1/donor-ids
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "donorIds": [1, 2, 3, 4, 5]
 * }
 */
router.get('/:id/donor-ids', protect, async (req, res) => {
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

    // Verify if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId, isDeleted: false },
      include: {
        donorLists: {
          select: {
            id: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Return empty array if event has no donor list
    if (!event.donorLists || event.donorLists.length === 0) {
      return res.json({
        donorIds: []
      });
    }

    // Get the first donor list ID of the event
    const donorListId = event.donorLists[0].id;

    // Get all donor IDs
    const eventDonors = await prisma.eventDonor.findMany({
      where: {
        donorListId: donorListId
      },
      select: {
        donorId: true
      }
    });

    // Extract donor IDs array
    const donorIds = eventDonors.map(ed => ed.donorId);

    res.json({
      donorIds
    });
  } catch (error) {
    console.error('Error fetching event donor IDs:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

export default router;