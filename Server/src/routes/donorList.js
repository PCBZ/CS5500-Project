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
    const { donorIds } = req.body;

    if (!Array.isArray(donorIds) || donorIds.length === 0) {
      return res.status(400).json({ message: 'Invalid donor IDs array' });
    }

    // Check if list exists
    const list = await prisma.eventDonorList.findUnique({
      where: { id: listId }
    });

    if (!list) {
      return res.status(404).json({ message: 'Donor list not found' });
    }

    // Check if donors exist
    const existingDonors = await prisma.donor.findMany({
      where: {
        id: {
          in: donorIds
        }
      },
      select: {
        id: true
      }
    });

    const existingDonorIds = existingDonors.map(d => d.id);
    const invalidDonorIds = donorIds.filter(id => !existingDonorIds.includes(id));

    if (invalidDonorIds.length > 0) {
      return res.status(400).json({ 
        message: 'Some donor IDs are invalid', 
        invalidDonorIds 
      });
    }

    // Check for existing donors in the list
    const existingListDonors = await prisma.eventDonor.findMany({
      where: {
        donorListId: listId,
        donorId: {
          in: donorIds
        }
      },
      select: {
        donorId: true
      }
    });

    const existingListDonorIds = existingListDonors.map(d => d.donorId);
    const newDonorIds = donorIds.filter(id => !existingListDonorIds.includes(id));

    if (newDonorIds.length === 0) {
      return res.status(400).json({ message: 'All donors are already in the list' });
    }

    // Add new donors to the list
    const addedDonors = await prisma.eventDonor.createMany({
      data: newDonorIds.map(donorId => ({
        donorListId: listId,
        donorId,
        status: 'Pending'
      }))
    });

    // Update list counts
    const updatedList = await prisma.eventDonorList.update({
      where: { id: listId },
      data: {
        totalDonors: {
          increment: addedDonors.count
        },
        pending: {
          increment: addedDonors.count
        }
      },
      include: {
        _count: {
          select: {
            donors: true
          }
        }
      }
    });

    // 更新关联的事件统计信息
    await prisma.event.update({
      where: { id: list.eventId },
      data: {
        totalDonors: {
          increment: addedDonors.count
        },
        pending: {
          increment: addedDonors.count
        }
      }
    });

    res.json({
      message: `Successfully added ${addedDonors.count} donors to the list`,
      added: addedDonors.count,
      totalDonors: updatedList.totalDonors,
      pending: updatedList.pending
    });
  } catch (error) {
    console.error('Error adding donors to list:', error);
    res.status(500).json({ message: 'Internal server error' });
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

/**
 * Get summary statistics for a specific donor list
 * 
 * @name GET /api/lists/:listId/stats
 * @function
 * @memberof module:DonorListAPI
 * @param {string} req.params.listId - The ID of the donor list to retrieve stats for
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 200 - Statistics about reviewed and pending donors
 * @returns {Error} 404 - Donor list not found
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * GET /api/lists/123/stats
 * Authorization: Bearer <token>
 * 
 * @example Success Response:
 * {
 *   "list_id": 123,
 *   "list_name": "Summer Gala 2024",
 *   "total_donors": 150,
 *   "reviewed": 135,
 *   "pending_review": 15,
 *   "approved": 120,
 *   "excluded": 15,
 *   "auto_excluded": 5,
 *   "approval_rate": 80, // percentage
 *   "review_status": "pending",
 *   "event_name": "Summer Gala 2024"
 * }
 */
router.get('/:listId/stats', protect, async (req, res) => {
  try {
    const listId = parseInt(req.params.listId);

    // Get the donor list with its associated event
    const donorList = await prisma.eventDonorList.findUnique({
      where: { id: listId },
      include: {
        event: {
          select: {
            name: true
          }
        }
      }
    });

    if (!donorList) {
      return res.status(404).json({ message: 'Donor list not found' });
    }

    // Calculate review statistics
    const approvalRate = donorList.totalDonors > 0 
      ? Math.round((donorList.approved / donorList.totalDonors) * 100) 
      : 0;

    // Compile statistics
    const stats = {
      list_id: donorList.id,
      list_name: donorList.name,
      total_donors: donorList.totalDonors,
      reviewed: donorList.approved + donorList.excluded,
      pending_review: donorList.pending,
      approved: donorList.approved,
      excluded: donorList.excluded,
      auto_excluded: donorList.autoExcluded,
      approval_rate: approvalRate,
      review_status: donorList.reviewStatus,
      event_name: donorList.event?.name || 'Unknown Event'
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching donor list statistics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get summary statistics for all donor lists
 * 
 * @name GET /api/lists/stats/summary
 * @function
 * @memberof module:DonorListAPI
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 200 - Overall statistics about all donor lists
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * GET /api/lists/stats/summary
 * Authorization: Bearer <token>
 * 
 * @example Success Response:
 * {
 *   "total_lists": 10,
 *   "total_donors": 1500,
 *   "total_reviewed": 1200,
 *   "total_pending": 300,
 *   "total_approved": 1000,
 *   "total_excluded": 200,
 *   "total_auto_excluded": 50,
 *   "overall_approval_rate": 75, // percentage
 *   "completed_lists": 7,
 *   "pending_lists": 3
 * }
 */
router.get('/stats/summary', protect, async (req, res) => {
  try {
    // Get all donor lists
    const donorLists = await prisma.eventDonorList.findMany();
    
    if (donorLists.length === 0) {
      return res.status(200).json({
        total_lists: 0,
        total_donors: 0,
        total_reviewed: 0,
        total_pending: 0,
        total_approved: 0,
        total_excluded: 0,
        total_auto_excluded: 0,
        overall_approval_rate: 0,
        completed_lists: 0,
        pending_lists: 0
      });
    }

    // Calculate aggregated statistics
    const totalLists = donorLists.length;
    const totalDonors = donorLists.reduce((sum, list) => sum + list.totalDonors, 0);
    const totalApproved = donorLists.reduce((sum, list) => sum + list.approved, 0);
    const totalExcluded = donorLists.reduce((sum, list) => sum + list.excluded, 0);
    const totalPending = donorLists.reduce((sum, list) => sum + list.pending, 0);
    const totalAutoExcluded = donorLists.reduce((sum, list) => sum + list.autoExcluded, 0);
    const totalReviewed = totalApproved + totalExcluded;
    
    const completedLists = donorLists.filter(list => list.reviewStatus === 'completed').length;
    const pendingLists = donorLists.filter(list => list.reviewStatus === 'pending').length;
    
    const overallApprovalRate = totalDonors > 0 
      ? Math.round((totalApproved / totalDonors) * 100) 
      : 0;

    // Compile summary statistics
    const summary = {
      total_lists: totalLists,
      total_donors: totalDonors,
      total_reviewed: totalReviewed,
      total_pending: totalPending,
      total_approved: totalApproved,
      total_excluded: totalExcluded,
      total_auto_excluded: totalAutoExcluded,
      overall_approval_rate: overallApprovalRate,
      completed_lists: completedLists,
      pending_lists: pendingLists
    };

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching donor lists summary statistics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get donors from a specific donor list with pagination and filtering
 * 
 * @name GET /api/donor-lists/:id/donors
 * @function
 * @memberof module:DonorListAPI
 * @param {number} req.params.id - Donor list ID
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=20] - Number of results per page
 * @param {string} [req.query.search] - Search term for donor name
 * @param {string} [req.query.status] - Filter by donor status
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 200 - Donors in the specified list with pagination info
 * @returns {Error} 404 - List not found
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * GET /api/donor-lists/1/donors?page=1&limit=10&search=john
 * Authorization: Bearer <token>
 * 
 * @example Success Response:
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
    const listId = parseInt(req.params.id);
    const {
      page = '1',
      limit = '20',
      search = '',
      status = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 验证捐赠者列表是否存在
    const list = await prisma.eventDonorList.findUnique({
      where: { id: listId }
    });

    if (!list) {
      return res.status(404).json({ message: 'Donor list not found' });
    }

    // 构建查询条件
    const where = {
      donorListId: listId
    };

    // 添加状态过滤
    if (status) {
      where.status = status;
    }

    // 添加名称搜索过滤（搜索关联的捐赠者的名称）
    if (search) {
      where.donor = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { organizationName: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // 获取总记录数
    const total = await prisma.eventDonor.count({ where });

    // 获取捐赠者数据
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
            city: true,
            tags: true
          }
        }
      }
    });

    // 转换数据为API期望的格式
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
    console.error('Error fetching donors from list:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Add multiple donors to a list
 * 
 * @name POST /api/lists/:id/donors
 * @function
 * @memberof module:DonorListAPI
 * @param {number} req.params.id - Donor list ID
 * @param {Array} req.body.donorIds - Array of donor IDs to add
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 200 - Success message with added donors count
 * @returns {Error} 400 - Invalid request data
 * @returns {Error} 404 - List not found
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * POST /api/lists/1/donors
 * Authorization: Bearer <token>
 * {
 *   "donorIds": [1, 2, 3]
 * }
 * 
 * @example Success Response:
 * {
 *   "message": "Successfully added 3 donors to the list",
 *   "added": 3
 * }
 */
router.post('/:id/donors', protect, async (req, res) => {
  try {
    const listId = parseInt(req.params.id);
    const { donorIds } = req.body;

    if (!Array.isArray(donorIds) || donorIds.length === 0) {
      return res.status(400).json({ message: 'Invalid donor IDs array' });
    }

    // Check if list exists
    const list = await prisma.eventDonorList.findUnique({
      where: { id: listId }
    });

    if (!list) {
      return res.status(404).json({ message: 'Donor list not found' });
    }

    // Check if donors exist
    const existingDonors = await prisma.donor.findMany({
      where: {
        id: {
          in: donorIds
        }
      },
      select: {
        id: true
      }
    });

    const existingDonorIds = existingDonors.map(d => d.id);
    const invalidDonorIds = donorIds.filter(id => !existingDonorIds.includes(id));

    if (invalidDonorIds.length > 0) {
      return res.status(400).json({ 
        message: 'Some donor IDs are invalid', 
        invalidDonorIds 
      });
    }

    // Check for existing donors in the list
    const existingListDonors = await prisma.eventDonor.findMany({
      where: {
        donorListId: listId,
        donorId: {
          in: donorIds
        }
      },
      select: {
        donorId: true
      }
    });

    const existingListDonorIds = existingListDonors.map(d => d.donorId);
    const newDonorIds = donorIds.filter(id => !existingListDonorIds.includes(id));

    if (newDonorIds.length === 0) {
      return res.status(400).json({ message: 'All donors are already in the list' });
    }

    // Add new donors to the list
    const addedDonors = await prisma.eventDonor.createMany({
      data: newDonorIds.map(donorId => ({
        donorListId: listId,
        donorId,
        status: 'Pending'
      }))
    });

    // Update list counts
    const updatedList = await prisma.eventDonorList.update({
      where: { id: listId },
      data: {
        totalDonors: {
          increment: addedDonors.count
        },
        pending: {
          increment: addedDonors.count
        }
      },
      include: {
        _count: {
          select: {
            donors: true
          }
        }
      }
    });

    // 更新关联的事件统计信息
    await prisma.event.update({
      where: { id: list.eventId },
      data: {
        totalDonors: {
          increment: addedDonors.count
        },
        pending: {
          increment: addedDonors.count
        }
      }
    });

    res.json({
      message: `Successfully added ${addedDonors.count} donors to the list`,
      added: addedDonors.count,
      totalDonors: updatedList.totalDonors,
      pending: updatedList.pending
    });
  } catch (error) {
    console.error('Error adding donors to list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 