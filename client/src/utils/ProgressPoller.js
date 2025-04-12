export class ProgressPoller {
  constructor(operationId, onProgress, onComplete, onError, maxAttempts = 300) {
    this.operationId = operationId;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
    this.maxAttempts = maxAttempts;
    this.attempts = 0;
    this.interval = null;
    this.isStopped = false;
  }

  getOperationId() {
    return this.operationId;
  }

  async checkProgress() {
    if (this.isStopped) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/progress/${this.operationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`Progress check failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Progress data received:', data);
      
      // Ensure we have valid progress data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid progress data received');
      }

      // Normalize progress data
      const normalizedData = {
        progress: typeof data.progress === 'number' ? data.progress : 0,
        message: data.message || 'Processing...',
        status: data.status || 'processing',
        result: data.result || {}
      };

      if (normalizedData.status === 'completed' || 
          normalizedData.status === 'error' || 
          normalizedData.status === 'cancelled') {
        this.stop();
        if (this.onComplete) {
          this.onComplete(normalizedData);
        }
      } else if (normalizedData.status === 'processing') {
        if (this.onProgress) {
          this.onProgress(normalizedData);
        }
      }
    } catch (error) {
      console.error('Error checking progress:', error);
      this.attempts++;
      
      if (this.attempts >= this.maxAttempts) {
        this.stop();
        if (this.onError) {
          this.onError(new Error('Maximum polling attempts reached'));
        }
      } else if (error.message.includes('Authentication failed')) {
        this.stop();
        if (this.onError) {
          this.onError(error);
        }
      } else {
        // For other errors, continue polling but log the error
        console.warn('Progress check error, will retry:', error);
      }
    }
  }

  start() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    this.isStopped = false;
    this.attempts = 0;
    
    // Initial check
    this.checkProgress();
    
    // Start polling
    this.interval = setInterval(() => {
      if (!this.isStopped) {
        this.checkProgress();
      }
    }, 2000);
    
    return this;
  }

  stop() {
    this.isStopped = true;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export default ProgressPoller;