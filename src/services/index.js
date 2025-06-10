export { default as projectService } from './api/projectService';
export { default as taskService } from './api/taskService';

// Utility function for simulating API delays
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility functions for dependency management
export const detectCircularDependency = (tasks, sourceId, targetId) => {
  const visited = new Set();
  const recursionStack = new Set();
  
  const hasCycle = (taskId) => {
    if (recursionStack.has(taskId)) return true;
    if (visited.has(taskId)) return false;
    
    visited.add(taskId);
    recursionStack.add(taskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.dependencies) {
      for (const depId of task.dependencies) {
        if (hasCycle(depId)) return true;
      }
    }
    
    recursionStack.delete(taskId);
    return false;
  };
  
  // Temporarily add the new dependency to check for cycles
  const targetTask = tasks.find(t => t.id === targetId);
  const originalDeps = targetTask?.dependencies || [];
  const testDeps = [...originalDeps, sourceId];
  
  const testTasks = tasks.map(t => 
    t.id === targetId ? { ...t, dependencies: testDeps } : t
  );
  
  return hasCycle(targetId);
};

export const calculateTaskEndDate = (startDate, duration = 1) => {
  const start = new Date(startDate);
  return new Date(start.getTime() + (duration - 1) * 24 * 60 * 60 * 1000);
};