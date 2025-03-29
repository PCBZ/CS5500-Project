import authService from '../services/authService';

// 创建一个通用的fetch包装函数，用于处理401错误
export const fetchWithAuthMiddleware = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    // 检查是否是401错误
    if (response.status === 401) {
      // 清除本地存储的认证信息
      authService.logout();
      
      // 重定向到登录页面
      window.location.href = '/login';
      return;
    }
    
    // 如果不是401错误，继续处理响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw errorData;
    }
    
    return response;
  } catch (error) {
    // 如果是401错误，已经在上面处理了
    // 这里处理其他类型的错误
    throw error;
  }
};

// 创建一个axios拦截器配置
export const setupAxiosInterceptors = (axios) => {
  // 响应拦截器
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // 清除本地存储的认证信息
        authService.logout();
        
        // 重定向到登录页面
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}; 