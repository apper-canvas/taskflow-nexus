// Services
import ProjectService from './api/projectService';
import TaskService from './api/taskService';
import UserService from './api/userService';
import NotificationService from './api/notificationService';
import AnalyticsService from './api/analyticsService';

// Service instances
export const projectService = new ProjectService();
export const taskService = new TaskService();
export const userService = new UserService();
export const notificationService = new NotificationService();
export const analyticsService = new AnalyticsService();

// Utility functions
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Dependency management utilities
export const detectCircularDependency = (tasks, sourceId, targetId) => {
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
    if (task && task.dependencies) {
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
  return hasCycle(targetId, new Set(), new Set());
};

export const calculateTaskEndDate = (startDate, duration = 1) => {
  const start = new Date(startDate);
  return new Date(start.getTime() + (duration - 1) * 24 * 60 * 60 * 1000);
};