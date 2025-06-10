export { default as projectService } from './api/projectService';
export { default as taskService } from './api/taskService';

// Utility function for simulating API delays
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));