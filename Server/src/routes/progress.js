// server/routes/progress.js

import express from 'express';
import { protect } from '../middleware/auth.js';
import progressService from './progressService.js';

const router = express.Router();

/**
 * Get operation progress by ID
 * @name GET /api/progress/:id
 */
router.get('/:id', protect, async (req, res) => {
  const operationId = req.params.id;
  
  try {
    const operation = progressService.operations.get(operationId);
    
    if (!operation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Operation not found' 
      });
    }
    
    // Check if user has permission to access this operation
    if (operation.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this operation'
      });
    }
    
    // Return the operation status
    res.json({
      success: true,
      operationId,
      progress: operation.progress,
      status: operation.status,
      message: operation.message,
      result: operation.result || null,
      startTime: operation.startTime,
      lastUpdated: operation.lastUpdated
    });
  } catch (error) {
    console.error('Error fetching operation progress:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch operation progress' 
    });
  }
});

/**
 * Get all operations for the current user
 * @route GET /api/progress/user/operations
 * @access Private
 */
router.get('/user/operations', protect, (req, res) => {
  const operations = progressService.getUserOperations(req.user?.id);
  res.json(operations);
});

/**
 * Cancel an operation
 * @route DELETE /api/progress/:operationId
 * @access Private
 */
router.delete('/:operationId', protect, (req, res) => {
  const { operationId } = req.params;
  
  const result = progressService.cancelOperation(operationId, req.user?.id);
  
  if (!result) {
    return res.status(404).json({ message: 'Operation not found or unauthorized to cancel' });
  }
  
  res.json({ message: 'Operation cancelled successfully', operationId });
});

export default router;