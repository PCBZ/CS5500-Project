// Server/src/services/progressService.js

/**
 * Simple progress tracking service
 * Used to track progress of long-running operations
 */
class ProgressService {
    constructor() {
      // Store progress information for all active operations
      this.operations = new Map();
      
      // Only start timer in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        this.cleanupInterval = setInterval(() => this.cleanupOperations(), 10 * 60 * 1000);
      }
    }
    
    /**
     * Create a new operation and return operation ID
     * @param {string} type Operation type (e.g., 'import', 'export')
     * @param {string} userId User ID
     * @param {number} totalItems Total number of items (for calculating progress percentage)
     * @returns {Object} Contains operation object and operation ID
     */
    createOperation(type, userId, totalItems = 100) {
      const trackingId = `${type}_${Date.now()}`;
      
      // Create the operation object with all required fields
      const operation = {
        id: trackingId,
        type,
        userId,
        status: 'initializing',
        progress: 0,
        message: 'Operation initialized',
        totalItems,
        startTime: new Date(),
        lastUpdated: new Date()
      };
      
      // Store the operation in the Map
      this.operations.set(trackingId, operation);
      
      console.log(`Created operation: ${trackingId} for user ${userId}`);
      
      // Return both the operation object and its ID
      return { 
        operation,
        trackingId 
      };
    }
    
    /**
     * Update operation progress
     * @param {string} operationId Operation ID
     * @param {number} progress Progress percentage (0-100)
     * @param {string} message Progress message
     * @param {string} status Operation status
     * @returns {boolean} Whether the update was successful
     */
    updateProgress(operationId, progress, message, status) {
      const operation = this.operations.get(operationId);
      
      if (!operation) {
        console.warn(`Attempting to update non-existent operation ${operationId}`);
        return false;
      }
      
      // Update operation data
      operation.progress = progress;
      operation.lastUpdated = new Date();
      
      if (message) operation.message = message;
      if (status) operation.status = status;
      
      // Set expiration time if operation is completed or failed
      if (status === 'completed' || status === 'error') {
        operation.expiresAt = Date.now() + 30 * 60 * 1000; // Expire after 30 minutes
      }
      
      return true;
    }
    
    /**
     * Get operation progress
     * @param {string} operationId Operation ID
     * @returns {Object|null} Operation progress information or null if operation doesn't exist
     */
    getProgress(operationId) {
      const operation = this.operations.get(operationId);
      
      if (!operation) {
        return null;
      }
      
      return {
        id: operation.id,
        type: operation.type,
        progress: operation.progress,
        status: operation.status,
        message: operation.message,
        startTime: operation.startTime,
        lastUpdated: operation.lastUpdated,
        result: operation.result
      };
    }
    
    /**
     * Get all operations for a user
     * @param {string} userId User ID
     * @returns {Array} List of user's operations
     */
    getUserOperations(userId) {
      const userOperations = [];
      
      for (const operation of this.operations.values()) {
        if (operation.userId === userId) {
          userOperations.push({
            id: operation.id,
            type: operation.type,
            progress: operation.progress,
            status: operation.status,
            message: operation.message,
            startTime: operation.startTime,
            lastUpdated: operation.lastUpdated
          });
        }
      }
      
      return userOperations;
    }
    
    /**
     * Cancel an operation
     * @param {string} operationId Operation ID
     * @param {string} userId User ID (for permission check)
     * @returns {boolean} Whether the cancellation was successful
     */
    cancelOperation(operationId, userId) {
      const operation = this.operations.get(operationId);
      
      if (!operation) {
        return false;
      }
      
      // Check user permissions
      if (operation.userId !== userId) {
        return false;
      }
      
      // Update operation status
      operation.status = 'cancelled';
      operation.message = 'Operation cancelled by user';
      operation.lastUpdated = new Date();
      operation.expiresAt = Date.now() + 10 * 60 * 1000; // Expire after 10 minutes
      
      // Clean up cancelled operation immediately
      setTimeout(() => {
        if (this.operations.has(operationId)) {
          this.operations.delete(operationId);
        }
      }, 10 * 60 * 1000);
      
      return true;
    }
    
    /**
     * Clean up expired operations
     * @private
     */
    cleanupOperations() {
      const now = Date.now();
      
      for (const [operationId, operation] of this.operations.entries()) {
        // Clean up operations that have been processing for more than 10 minutes (may be stuck)
        if (operation.status === 'processing' && 
            now - operation.lastUpdated > 10 * 60 * 1000) {
          console.log(`Cleaning up stuck operation: ${operationId}`);
          this.operations.delete(operationId);
        }
        
        // Clean up expired operations
        if (operation.expiresAt && now > operation.expiresAt) {
          console.log(`Cleaning up expired operation: ${operationId}`);
          this.operations.delete(operationId);
        }
      }
    }
  }
  
  // Create singleton instance
  const progressService = new ProgressService();
  
  export default progressService;