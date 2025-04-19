// Server/src/services/progressService.js

/**
 * 简单的进度跟踪服务
 * 用于跟踪长时间运行操作的进度
 */
class ProgressService {
    constructor() {
      // 存储所有活跃操作的进度信息
      this.operations = new Map();
      
      // 只在非测试环境中启动定时器
      if (process.env.NODE_ENV !== 'test') {
        this.cleanupInterval = setInterval(() => this.cleanupOperations(), 10 * 60 * 1000);
      }
    }
    
    /**
     * 创建一个新的操作并返回操作ID
     * @param {string} type 操作类型（如 'import', 'export'）
     * @param {string} userId 用户ID
     * @param {number} totalItems 总项目数（用于计算进度百分比）
     * @returns {Object} 包含操作对象和操作ID
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
     * 更新操作进度
     * @param {string} operationId 操作ID
     * @param {number} progress 进度百分比 (0-100)
     * @param {string} message 进度消息
     * @param {string} status 操作状态
     * @returns {boolean} 更新是否成功
     */
    updateProgress(operationId, progress, message, status) {
      const operation = this.operations.get(operationId);
      
      if (!operation) {
        console.warn(`尝试更新不存在的操作 ${operationId}`);
        return false;
      }
      
      // 更新操作数据
      operation.progress = progress;
      operation.lastUpdated = new Date();
      
      if (message) operation.message = message;
      if (status) operation.status = status;
      
      // 如果操作已完成或失败，设置一个过期时间
      if (status === 'completed' || status === 'error') {
        operation.expiresAt = Date.now() + 30 * 60 * 1000; // 30分钟后过期
      }
      
      return true;
    }
    
    /**
     * 获取操作进度
     * @param {string} operationId 操作ID
     * @returns {Object|null} 操作进度信息或null（如果操作不存在）
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
     * 获取用户的所有操作
     * @param {string} userId 用户ID
     * @returns {Array} 用户的操作列表
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
     * 取消操作
     * @param {string} operationId 操作ID
     * @param {string} userId 用户ID（用于权限检查）
     * @returns {boolean} 取消是否成功
     */
    cancelOperation(operationId, userId) {
      const operation = this.operations.get(operationId);
      
      if (!operation) {
        return false;
      }
      
      // 检查用户权限
      if (operation.userId !== userId) {
        return false;
      }
      
      // 更新操作状态
      operation.status = 'cancelled';
      operation.message = 'Operation cancelled by user';
      operation.lastUpdated = new Date();
      operation.expiresAt = Date.now() + 10 * 60 * 1000; // 10分钟后过期
      
      // 立即清理已取消的操作
      setTimeout(() => {
        if (this.operations.has(operationId)) {
          this.operations.delete(operationId);
        }
      }, 10 * 60 * 1000);
      
      return true;
    }
    
    /**
     * 清理过期操作
     * @private
     */
    cleanupOperations() {
      const now = Date.now();
      
      for (const [operationId, operation] of this.operations.entries()) {
        // 清理超过10分钟未更新的处理中操作（可能已卡住）
        if (operation.status === 'processing' && 
            now - operation.lastUpdated > 10 * 60 * 1000) {
          console.log(`清理卡住的操作: ${operationId}`);
          this.operations.delete(operationId);
        }
        
        // 清理已过期的操作
        if (operation.expiresAt && now > operation.expiresAt) {
          console.log(`清理过期操作: ${operationId}`);
          this.operations.delete(operationId);
        }
      }
    }
  }
  
  // 创建单例实例
  const progressService = new ProgressService();
  
  export default progressService;