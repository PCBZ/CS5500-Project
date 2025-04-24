// src/utils/statusConversion.js

/**
 * Converts backend event status format to frontend format
 * @param {string} backendStatus - Status string from the database
 * @returns {string} Frontend-formatted status
 */
export const toFrontendStatus = (backendStatus) => {
    if (!backendStatus) return '';
    return backendStatus.toLowerCase();
};
  
/**
 * Converts frontend event status format to backend format
 * @param {string} frontendStatus - Status string from the frontend
 * @returns {string} Backend-formatted status matching Prisma EventStatus enum
 */
export const toBackendStatus = (frontendStatus) => {
    if (!frontendStatus) return 'Planning'; // Default value
    
    switch(frontendStatus) {
        case 'complete': return 'Complete';
        case 'planning': return 'Planning';
        case 'listgeneration': return 'ListGeneration';
        case 'review': return 'Review';
        case 'ready': return 'Ready';
        default: return frontendStatus; // Fallback if already in correct format
    }
};