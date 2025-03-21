import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

/**
 * Donor List API Module
 * @module DonorListAPI
 */

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get all donor lists with pagination and filtering
 * 
 * @name GET /api/lists
 * @function
 * @memberof module:DonorListAPI
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=10] - Number of results per page
 * @param {string} [req.query.status] - Filter by review status ('completed' or 'pending')
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 200 - Donor lists with pagination info
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * GET /api/lists?page=1&limit=10&status=pending
 * Authorization: Bearer <token>
 * 
 * @example Success Response:
 * {
 *   "total_count": 25,
 *   "page": 1,
 *   "limit": 10,
 *   "lists": [
 *     {
 *       "id": 1,
 *       "event_id": 101,
 *       "name": "Summer Fundraiser 2024",
 *       "total_donors": 150,
 *       "approved": 120,
 *       "excluded": 15,
 *       "pending": 15,
 *       "auto_excluded": 5,
 *       "review_status": "pending",
 *       "created_at": "2024-03-01T10:00:00Z",
 *       "generated_by": 42
 *     }
 *   ]
 * }
 */
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const where = status ? { reviewStatus: status } : {};
    
    const total_count = await prisma.eventDonorList.count({ where });
    const lists = await prisma.eventDonorList.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        event: true,
        generator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      total_count,
      page,
      limit,
      lists: lists.map(list => ({
        id: list.id,
        event_id: list.eventId,
        name: list.name,
        total_donors: list.totalDonors,
        approved: list.approved,
        excluded: list.excluded,
        pending: list.pending,
        auto_excluded: list.autoExcluded,
        review_status: list.reviewStatus,
        created_at: list.createdAt,
        generated_by: list.generatedBy
      }))
    });
  } catch (error) {
    console.error('Error fetching donor lists:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get donor list details by ID
 * 
 * @name GET /api/lists/:id
 * @function
 * @memberof module:DonorListAPI
 * @param {number} req.params.id - Donor list ID
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 200 - Detailed donor list information
 * @returns {Error} 404 - List not found
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * GET /api/lists/1
 * Authorization: Bearer <token>
 * 
 * @example Success Response:
 * {
 *   "id": 1,
 *   "event_id": 101,
 *   "name": "Summer Fundraiser 2024",
 *   "total_donors": 150,
 *   "approved": 120,
 *   "excluded": 15,
 *   "pending": 15,
 *   "auto_excluded": 5,
 *   "review_status": "pending",
 *   "created_at": "2024-03-01T10:00:00Z",
 *   "updated_at": "2024-03-02T14:30:00Z",
 *   "generated_by": 42,
 *   "donors": [
 *     {
 *       "id": 201,
 *       "donor_id": 301,
 *       "status": "Approved",
 *       "reviewer_id": null,
 *       "comments": "Important donor",
 *       "created_at": "2024-03-01T12:00:00Z",
 *       "updated_at": "2024-03-01T14:00:00Z",
 *       "donor": {
 *         "id": 301,
 *         "first_name": "John",
 *         "last_name": "Doe",
 *         "total_donations": 5000,
 *         "largest_gift": 2000,
 *         "created_at": "2024-01-01T00:00:00Z",
 *         "updated_at": "2024-01-01T00:00:00Z"
 *       }
 *     }
 *   ]
 * }
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const listId = parseInt(req.params.id);
    const list = await prisma.eventDonorList.findUnique({
      where: { id: listId },
      include: {
        eventDonors: {
          include: {
            donor: true
          }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ message: 'Donor list not found' });
    }

    // Transform the data to match the expected format
    const transformedList = {
      id: list.id,
      event_id: list.eventId,
      name: list.name,
      total_donors: list.totalDonors,
      approved: list.approved,
      excluded: list.excluded,
      pending: list.pending,
      auto_excluded: list.autoExcluded,
      review_status: list.reviewStatus,
      created_at: list.createdAt,
      updated_at: list.updatedAt,
      generated_by: list.generatedBy,
      donors: list.eventDonors.map(d => ({
        id: d.id,
        donor_id: d.donorId,
        status: d.status,
        reviewer_id: d.reviewerId,
        comments: d.comments,
        created_at: d.createdAt,
        updated_at: d.updatedAt,
        donor: {
          id: d.donor.id,
          first_name: d.donor.firstName,
          last_name: d.donor.lastName,
          total_donations: d.donor.totalDonations,
          largest_gift: d.donor.largestGift,
          created_at: d.donor.createdAt,
          updated_at: d.donor.updatedAt
        }
      }))
    };

    res.json(transformedList);
  } catch (error) {
    console.error('Error fetching list details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Delete a donor list
 * 
 * @name DELETE /api/lists/:id
 * @function
 * @memberof module:DonorListAPI
 * @param {number} req.params.id - Donor list ID
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 200 - Success message
 * @returns {Error} 404 - List not found
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * DELETE /api/lists/1
 * Authorization: Bearer <token>
 * 
 * @example Success Response:
 * {
 *   "message": "Donor list deleted successfully"
 * }
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const listId = parseInt(req.params.id);
    
    // First delete associated event donors
    await prisma.eventDonor.deleteMany({
      where: { donorListId: listId }
    });
    
    await prisma.eventDonorList.delete({
      where: { id: listId }
    });

    res.json({ message: 'Donor list deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Donor list not found' });
    }
    console.error('Error deleting donor list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Update donor list status
 * 
 * @name PUT /api/lists/:id/status
 * @function
 * @memberof module:DonorListAPI
 * @param {number} req.params.id - Donor list ID
 * @param {object} req.body - Request body
 * @param {string} req.body.review_status - New status ('completed' or 'pending')
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 200 - Updated list status
 * @returns {Error} 400 - Invalid status
 * @returns {Error} 404 - List not found
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * PUT /api/lists/1/status
 * Authorization: Bearer <token>
 * Content-Type: application/json
 * 
 * {
 *   "review_status": "completed"
 * }
 * 
 * @example Success Response:
 * {
 *   "message": "List status updated successfully",
 *   "list": {
 *     "id": 1,
 *     "review_status": "completed",
 *     "updated_at": "2024-04-15T09:30:00Z"
 *   }
 * }
 */
router.put('/:id/status', protect, async (req, res) => {
  try {
    const listId = parseInt(req.params.id);
    const { review_status } = req.body;

    if (!['completed', 'pending'].includes(review_status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const list = await prisma.eventDonorList.update({
      where: { id: listId },
      data: { reviewStatus: review_status }
    });

    res.json({
      message: 'List status updated successfully',
      list: {
        id: list.id,
        review_status: list.reviewStatus,
        updated_at: list.updatedAt
      }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'List not found' });
    }
    console.error('Error updating list status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Add donors to a list
 * 
 * @name POST /api/lists/:id/donors
 * @function
 * @memberof module:DonorListAPI
 * @param {number} req.params.id - Donor list ID
 * @param {object} req.body - Request body
 * @param {Array} req.body.donors - Array of donors
 * @param {number} req.body.donors[].donor_id - Donor ID
 * @param {string} req.body.donors[].status - Status ('Pending', 'Approved', 'Excluded', 'AutoExcluded')
 * @param {number} [req.body.donors[].reviewer_id] - Reviewer ID (optional)
 * @param {string} [req.body.donors[].comments] - Comments (optional)
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 201 - Added donors information
 * @returns {Error} 400 - Invalid request format
 * @returns {Error} 404 - List not found
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * POST /api/lists/1/donors
 * Authorization: Bearer <token>
 * Content-Type: application/json
 * 
 * {
 *   "donors": [
 *     {
 *       "donor_id": 301,
 *       "status": "Pending",
 *       "comments": "Potential major donor"
 *     },
 *     {
 *       "donor_id": 302,
 *       "status": "Approved",
 *       "comments": "Reliable donor"
 *     }
 *   ]
 * }
 * 
 * @example Success Response:
 * {
 *   "message": "Donors added successfully.",
 *   "added_donors": [
 *     {
 *       "id": 201,
 *       "donorListId": 1,
 *       "donorId": 301,
 *       "status": "Pending",
 *       "comments": "Potential major donor",
 *       "donor": {
 *         "id": 301,
 *         "firstName": "John",
 *         "lastName": "Doe",
 *         "totalDonations": 5000,
 *         "largestGift": 2000
 *       }
 *     },
 *     {
 *       "id": 202,
 *       "donorListId": 1,
 *       "donorId": 302,
 *       "status": "Approved",
 *       "comments": "Reliable donor",
 *       "donor": {
 *         "id": 302,
 *         "firstName": "Jane",
 *         "lastName": "Smith",
 *         "totalDonations": 3000,
 *         "largestGift": 1000
 *       }
 *     }
 *   ]
 * }
 */
router.post('/:id/donors', protect, async (req, res) => {
  try {
    const listId = parseInt(req.params.id);
    const { donors } = req.body;

    if (!Array.isArray(donors)) {
      return res.status(400).json({ message: 'Invalid request format: donors must be an array' });
    }

    const list = await prisma.eventDonorList.findUnique({
      where: { id: listId }
    });

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Validate donor IDs exist
    const donorIds = donors.map(d => parseInt(d.donor_id));
    const existingDonors = await prisma.donor.findMany({
      where: {
        id: {
          in: donorIds
        }
      }
    });

    if (existingDonors.length !== donorIds.length) {
      return res.status(400).json({ message: 'One or more donor IDs do not exist' });
    }

    const added_donors = await prisma.$transaction(
      donors.map(donor => 
        prisma.eventDonor.create({
          data: {
            donorListId: listId,
            donorId: parseInt(donor.donor_id),
            status: donor.status,
            reviewerId: donor.reviewer_id ? parseInt(donor.reviewer_id) : null,
            comments: donor.comments
          },
          include: {
            donor: true
          }
        })
      )
    );

    // Update list statistics
    await prisma.eventDonorList.update({
      where: { id: listId },
      data: {
        totalDonors: {
          increment: donors.length
        },
        pending: {
          increment: donors.filter(d => d.status === 'Pending').length
        },
        approved: {
          increment: donors.filter(d => d.status === 'Approved').length
        },
        excluded: {
          increment: donors.filter(d => d.status === 'Excluded').length
        },
        autoExcluded: {
          increment: donors.filter(d => d.status === 'AutoExcluded').length
        }
      }
    });

    res.status(201).json({
      message: 'Donors added successfully.',
      added_donors: added_donors
    });
  } catch (error) {
    console.error('Error adding donors:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Remove a donor from a list
 * 
 * @name DELETE /api/lists/:id/donors/:donorId
 * @function
 * @memberof module:DonorListAPI
 * @param {number} req.params.id - Donor list ID
 * @param {number} req.params.donorId - Donor ID
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 200 - Success message and updated list information
 * @returns {Error} 404 - List or donor not found
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * DELETE /api/lists/1/donors/301
 * Authorization: Bearer <token>
 * 
 * @example Success Response:
 * {
 *   "message": "Donor removed from list successfully",
 *   "list": {
 *     "id": 1,
 *     "total_donors": 149,
 *     "approved": 120,
 *     "excluded": 14,
 *     "pending": 15,
 *     "auto_excluded": 5,
 *     "review_status": "pending"
 *   }
 * }
 */
router.delete('/:id/donors/:donorId', protect, async (req, res) => {
  try {
    const listId = parseInt(req.params.id);
    const donorId = parseInt(req.params.donorId);

    const list = await prisma.eventDonorList.findUnique({
      where: { id: listId }
    });

    if (!list) {
      return res.status(404).json({ message: 'Donor not found in list' });
    }

    const eventDonor = await prisma.eventDonor.findFirst({
      where: {
        donorListId: listId,
        donorId: donorId
      }
    });

    if (!eventDonor) {
      return res.status(404).json({ message: 'Donor not found in list' });
    }

    // Get the status to update list statistics
    const donorStatus = eventDonor.status;

    await prisma.eventDonor.delete({
      where: { id: eventDonor.id }
    });

    // Update list statistics
    await prisma.eventDonorList.update({
      where: { id: listId },
      data: {
        totalDonors: {
          decrement: 1
        },
        ...(donorStatus === 'Pending' && { pending: { decrement: 1 } }),
        ...(donorStatus === 'Approved' && { approved: { decrement: 1 } }),
        ...(donorStatus === 'Excluded' && { excluded: { decrement: 1 } }),
        ...(donorStatus === 'AutoExcluded' && { autoExcluded: { decrement: 1 } }),
      }
    });

    // Get the updated list
    const updatedList = await prisma.eventDonorList.findUnique({
      where: { id: listId }
    });

    res.json({
      message: 'Donor removed from list successfully',
      list: updatedList
    });
  } catch (error) {
    console.error('Error removing donor from list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 