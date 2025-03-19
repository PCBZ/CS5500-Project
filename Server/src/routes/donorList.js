import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

/**
 * @module DonorListAPI
 * @category Routes
 */

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get all donor lists with pagination and filtering
 * 
 * @name GET /api/lists
 * @function
 * @memberof module:DonorListAPI
 * @inner
 * @param {string} req.query.page - Page number for pagination (default: 1)
 * @param {string} req.query.limit - Number of results per page (default: 10)
 * @param {string} req.query.status - Filter by review status ('completed', 'pending')
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - List of donor lists with pagination info
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * GET /api/lists?page=1&limit=10&status=pending
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "total_count": 25,
 *   "page": 1,
 *   "limit": 10,
 *   "lists": [
 *     {
 *       "id": "1",
 *       "event_id": "101",
 *       "name": "Summer Fundraiser 2024",
 *       "total_donors": 150,
 *       "approved": 120,
 *       "excluded": 15,
 *       "pending": 15,
 *       "auto_excluded": 5,
 *       "review_status": "pending",
 *       "created_at": "2024-03-01T10:00:00Z",
 *       "generated_by": "42"
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
 * @inner
 * @param {string} req.params.id - Donor list ID
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Detailed donor list information
 * @returns {Error} 404 - List not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * GET /api/lists/1
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "id": "1",
 *   "event_id": "101",
 *   "name": "Summer Fundraiser 2024",
 *   "total_donors": 150,
 *   "approved": 120,
 *   "excluded": 15,
 *   "pending": 15,
 *   "auto_excluded": 5,
 *   "review_status": "pending",
 *   "created_at": "2024-03-01T10:00:00Z",
 *   "updated_at": "2024-03-02T14:30:00Z",
 *   "generated_by": "42",
 *   "donors": [
 *     {
 *       "id": "201",
 *       "name": "John Doe",
 *       "status": "Approved",
 *       "exclude_reason": null,
 *       "reviewer_id": null,
 *       "review_date": null,
 *       "comments": null
 *     }
 *   ]
 * }
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const listId = BigInt(req.params.id);
    const list = await prisma.eventDonorList.findUnique({
      where: { id: listId },
      include: {
        event: true,
        generator: {
          select: {
            id: true,
            name: true
          }
        },
        eventDonors: {
          include: {
            donor: true
          }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    res.json({
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
      donors: list.eventDonors.map(donor => ({
        id: donor.id,
        name: `${donor.donor.firstName || ''} ${donor.donor.lastName || ''}`.trim(),
        status: donor.status,
        exclude_reason: donor.excludeReason,
        reviewer_id: donor.reviewerId,
        review_date: donor.reviewDate,
        comments: donor.comments
      }))
    });
  } catch (error) {
    console.error('Error fetching donor list details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Delete a donor list
 * 
 * @name DELETE /api/lists/:id
 * @function
 * @memberof module:DonorListAPI
 * @inner
 * @param {string} req.params.id - Donor list ID
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Success message
 * @returns {Error} 404 - List not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * DELETE /api/lists/1
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "message": "Donor list deleted successfully."
 * }
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const listId = BigInt(req.params.id);
    await prisma.eventDonorList.delete({
      where: { id: listId }
    });

    res.json({ message: 'Donor list deleted successfully.' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'List not found' });
    }
    console.error('Error deleting donor list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Add donors to a list
 * 
 * @name POST /api/lists/:id/donors
 * @function
 * @memberof module:DonorListAPI
 * @inner
 * @param {string} req.params.id - Donor list ID
 * @param {Object} req.body
 * @param {Array} req.body.donors - Array of donor objects to add
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 201 - Success message with added donors
 * @returns {Error} 404 - List not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * POST /api/lists/1/donors
 * Authorization: Bearer <token>
 * {
 *   "donors": [
 *     {
 *       "donor_id": "301",
 *       "status": "Pending",
 *       "comments": "Manually added donor"
 *     },
 *     {
 *       "donor_id": "302",
 *       "status": "Approved",
 *       "reviewer_id": "42"
 *     }
 *   ]
 * }
 * 
 * // Success Response
 * {
 *   "message": "Donors added successfully.",
 *   "added_donors": [
 *     {
 *       "donor_id": "301",
 *       "status": "Pending"
 *     },
 *     {
 *       "donor_id": "302",
 *       "status": "Approved"
 *     }
 *   ]
 * }
 */
router.post('/:id/donors', protect, async (req, res) => {
  try {
    const listId = BigInt(req.params.id);
    const { donors } = req.body;

    const list = await prisma.eventDonorList.findUnique({
      where: { id: listId }
    });

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const added_donors = await prisma.$transaction(
      donors.map(donor => 
        prisma.eventDonor.create({
          data: {
            donorListId: listId,
            donorId: BigInt(donor.donor_id),
            status: donor.status,
            reviewerId: donor.reviewer_id ? BigInt(donor.reviewer_id) : null,
            comments: donor.comments
          }
        })
      )
    );

    // 更新列表统计信息
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
      added_donors
    });
  } catch (error) {
    console.error('Error adding donors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Remove a donor from a list
 * 
 * @name DELETE /api/lists/:id/donors/:donorId
 * @function
 * @memberof module:DonorListAPI
 * @inner
 * @param {string} req.params.id - Donor list ID
 * @param {string} req.params.donorId - Donor ID to remove
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Success message
 * @returns {Error} 404 - List or donor not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * DELETE /api/lists/1/donors/201
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "message": "Donor removed from list successfully."
 * }
 */
router.delete('/:id/donors/:donorId', protect, async (req, res) => {
  try {
    const listId = BigInt(req.params.id);
    const donorId = BigInt(req.params.donorId);

    const donor = await prisma.eventDonor.findFirst({
      where: {
        donorListId: listId,
        donorId: donorId
      }
    });

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found in list' });
    }

    await prisma.eventDonor.delete({
      where: {
        id: donor.id
      }
    });

    // update list statistics
    await prisma.eventDonorList.update({
      where: { id: listId },
      data: {
        totalDonors: {
          decrement: 1
        },
        [donor.status.toLowerCase()]: {
          decrement: 1
        }
      }
    });

    res.json({ message: 'Donor removed from list successfully.' });
  } catch (error) {
    console.error('Error removing donor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Update list status
 * 
 * @name PUT /api/lists/:id/status
 * @function
 * @memberof module:DonorListAPI
 * @inner
 * @param {string} req.params.id - Donor list ID
 * @param {Object} req.body
 * @param {string} req.body.review_status - New review status ('completed' or 'pending')
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Success message with updated list info
 * @returns {Error} 400 - Invalid status
 * @returns {Error} 404 - List not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * PUT /api/lists/1/status
 * Authorization: Bearer <token>
 * {
 *   "review_status": "completed"
 * }
 * 
 * // Success Response
 * {
 *   "message": "List status updated successfully.",
 *   "list": {
 *     "id": "1",
 *     "review_status": "completed",
 *     "updated_at": "2024-03-02T15:45:00Z"
 *   }
 * }
 */
router.put('/:id/status', protect, async (req, res) => {
  try {
    const listId = BigInt(req.params.id);
    const { review_status } = req.body;

    if (!['completed', 'pending'].includes(review_status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const list = await prisma.eventDonorList.update({
      where: { id: listId },
      data: { reviewStatus: review_status }
    });

    res.json({
      message: 'List status updated successfully.',
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

export default router; 