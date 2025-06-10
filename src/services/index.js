// Utility functions
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Import service instances (not classes)
import projectService from './api/projectService';
import taskService from './api/taskService';
import userService from './api/userService';
import notificationService from './api/notificationService';
import analyticsService from './api/analyticsService';

// Export service instances directly
export { 
    projectService, 
    taskService, 
    userService, 
    notificationService, 
    analyticsService 
};
// Export services as default
export default {
    projectService,
    taskService,
    userService,
    notificationService,
    analyticsService
};

// Utility function to detect circular dependencies in task graph
export const detectCircularDependency = (tasks, sourceId, targetId) => {
  if (!sourceId || !targetId) {
    console.warn('detectCircularDependency: Invalid source or target ID provided');
    return false;
  }
  
  if (!Array.isArray(tasks)) {
    console.warn('detectCircularDependency: Tasks must be an array');
    return false;
  }

  // Helper function to detect cycles using DFS
  const hasCycle = (taskId, visited = new Set(), recursionStack = new Set()) => {
    if (recursionStack.has(taskId)) {
      return true; // Cycle detected
    }
    
    if (visited.has(taskId)) {
      return false; // Already processed
    }
    
    visited.add(taskId);
    recursionStack.add(taskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.dependencies && Array.isArray(task.dependencies)) {
      for (const depId of task.dependencies) {
        if (hasCycle(depId, visited, recursionStack)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(taskId);
    return false;
  };
  
  // Create a test scenario by temporarily adding the proposed dependency
  const targetTask = tasks.find(t => t.id === targetId);
  if (!targetTask) {
    return false;
  }
  
  const testTasks = tasks.map(t => 
    t.id === targetId 
      ? { ...t, dependencies: [...(t.dependencies || []), sourceId] }
      : t
  );
  
  // Check for cycles in the modified task graph
  try {
    return hasCycle(targetId, new Set(), new Set());
  } catch (error) {
    console.error('Error detecting circular dependency:', error);
    return true; // Assume circular dependency exists if error occurs
  }
};

export const calculateTaskEndDate = (startDate, duration = 1) => {
  try {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new Error('Invalid start date provided');
    }
    
    const durationDays = Math.max(1, Number(duration) || 1);
    return new Date(start.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000);
  } catch (error) {
    console.error('Error calculating task end date:', error);
    return new Date(); // Return current date as fallback
  }
};