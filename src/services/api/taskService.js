import tasksData from '../mockData/tasks.json';
import { delay } from '../index';

class TaskService {
  constructor() {
    this.tasks = this.loadFromStorage();
  }

  loadFromStorage() {
    const stored = localStorage.getItem('taskflow-tasks');
    return stored ? JSON.parse(stored) : [...tasksData];
  }

  saveToStorage() {
    localStorage.setItem('taskflow-tasks', JSON.stringify(this.tasks));
  }

  async getAll() {
    await delay(250);
    return [...this.tasks];
  }

  async getById(id) {
    await delay(200);
    const task = this.tasks.find(t => t.id === id);
    return task ? { ...task } : null;
  }

  async getByProjectId(projectId) {
    await delay(250);
    return this.tasks.filter(t => t.projectId === projectId).map(t => ({ ...t }));
  }

async create(taskData) {
    await delay(350);
    const task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: taskData.type || 'task',
      isDeadline: taskData.isDeadline || false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    this.tasks.push(task);
    this.saveToStorage();
    return { ...task };
  }

  async update(id, updates) {
    await delay(300);
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    // Validate date ranges if both start and due dates are provided
    if (updates.startDate && updates.dueDate) {
      const startDate = new Date(updates.startDate);
      const dueDate = new Date(updates.dueDate);
      if (startDate > dueDate) {
        throw new Error('Start date cannot be after due date');
      }
    }

    this.tasks[index] = { ...this.tasks[index], ...updates };
    this.saveToStorage();
    return { ...this.tasks[index] };
  }

  async delete(id) {
    await delay(300);
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) {
throw new Error('Task not found');
    }
    this.tasks.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  async updateTaskDates(id, startDate, dueDate) {
    await delay(250);
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    // Validate date range
    if (startDate && dueDate) {
      const start = new Date(startDate);
      const due = new Date(dueDate);
      if (start > due) {
        throw new Error('Start date cannot be after due date');
      }
    }

    this.tasks[index] = {
      ...this.tasks[index],
      startDate: startDate || this.tasks[index].startDate,
      dueDate: dueDate || this.tasks[index].dueDate
    };
this.saveToStorage();
    return { ...this.tasks[index] };
  }

  async addDependency(sourceTaskId, targetTaskId) {
    await delay(250);
    
    // Validate tasks exist
    const sourceTask = this.tasks.find(t => t.id === sourceTaskId);
    const targetTask = this.tasks.find(t => t.id === targetTaskId);
    
    if (!sourceTask || !targetTask) {
      throw new Error('One or both tasks not found');
    }

    // Check for circular dependency
    const { detectCircularDependency } = await import('../index');
    if (detectCircularDependency(this.tasks, sourceTaskId, targetTaskId)) {
      throw new Error('Cannot create dependency: would create circular dependency');
    }

    // Add dependency
    const targetIndex = this.tasks.findIndex(t => t.id === targetTaskId);
    if (!this.tasks[targetIndex].dependencies) {
      this.tasks[targetIndex].dependencies = [];
    }
    
    if (!this.tasks[targetIndex].dependencies.includes(sourceTaskId)) {
      this.tasks[targetIndex].dependencies.push(sourceTaskId);
      this.saveToStorage();
    }

    return { ...this.tasks[targetIndex] };
  }

  async removeDependency(taskId, dependencyId) {
    await delay(200);
    
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const task = this.tasks[taskIndex];
    if (task.dependencies) {
      task.dependencies = task.dependencies.filter(depId => depId !== dependencyId);
      this.saveToStorage();
    }

    return { ...this.tasks[taskIndex] };
  }

async rescheduleDependent(taskId, newStartDate, newEndDate) {
    await delay(300);
    
    const rescheduledTasks = [];
    const errors = [];
    
    const processTask = async (parentTaskId, parentEndDate, depth = 0) => {
      // Prevent infinite recursion
      if (depth > 10) {
        errors.push(`Maximum dependency depth exceeded for task ${parentTaskId}`);
        return;
      }
      
      const dependentTasks = this.tasks.filter(task => 
        task.dependencies && task.dependencies.includes(parentTaskId)
      );

      for (const dependentTask of dependentTasks) {
        try {
          // Calculate task duration
          const taskStartDate = new Date(dependentTask.startDate || dependentTask.dueDate);
          const taskEndDate = new Date(dependentTask.dueDate || dependentTask.startDate);
          const taskDuration = Math.max(1, Math.ceil((taskEndDate - taskStartDate) / (24 * 60 * 60 * 1000)) + 1);
          
          // Schedule dependent task to start after parent task ends
          const newDependentStartDate = new Date(parentEndDate);
          newDependentStartDate.setDate(newDependentStartDate.getDate() + 1);
          
          const newDependentEndDate = new Date(newDependentStartDate);
          newDependentEndDate.setDate(newDependentEndDate.getDate() + taskDuration - 1);

          // Validate the new dates don't conflict with other constraints
          if (dependentTask.constraints) {
            const maxStartDate = dependentTask.constraints.maxStartDate ? new Date(dependentTask.constraints.maxStartDate) : null;
            const maxEndDate = dependentTask.constraints.maxEndDate ? new Date(dependentTask.constraints.maxEndDate) : null;
            
            if (maxStartDate && newDependentStartDate > maxStartDate) {
              errors.push(`Task ${dependentTask.title} cannot start after ${maxStartDate.toDateString()}`);
              continue;
            }
            
            if (maxEndDate && newDependentEndDate > maxEndDate) {
              errors.push(`Task ${dependentTask.title} cannot end after ${maxEndDate.toDateString()}`);
              continue;
            }
          }

          // Update the task
          await this.update(dependentTask.id, {
            startDate: newDependentStartDate.toISOString(),
            dueDate: newDependentEndDate.toISOString()
          });

          rescheduledTasks.push({
            id: dependentTask.id,
            title: dependentTask.title,
            oldStart: taskStartDate,
            newStart: newDependentStartDate,
            oldEnd: taskEndDate,
            newEnd: newDependentEndDate
          });

          // Recursively reschedule tasks dependent on this one
          await processTask(dependentTask.id, newDependentEndDate, depth + 1);
          
        } catch (error) {
          errors.push(`Failed to reschedule ${dependentTask.title}: ${error.message}`);
        }
      }
    };

    await processTask(taskId, newEndDate);

    if (errors.length > 0) {
      throw new Error(`Rescheduling completed with errors: ${errors.join('; ')}`);
    }

    return {
      success: true,
      rescheduledTasks,
      message: `Successfully rescheduled ${rescheduledTasks.length} dependent tasks`
    };
  }

  async updateDependencies(taskId, dependencies) {
    await delay(250);
    
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    // Validate all dependency IDs exist
    for (const depId of dependencies) {
      if (!this.tasks.find(t => t.id === depId)) {
        throw new Error(`Dependency task ${depId} not found`);
      }
    }

    // Check for circular dependencies
    const { detectCircularDependency } = await import('../index');
    for (const depId of dependencies) {
      if (detectCircularDependency(this.tasks, depId, taskId)) {
        throw new Error('Cannot update dependencies: would create circular dependency');
      }
    }

    this.tasks[taskIndex].dependencies = [...dependencies];
    this.saveToStorage();
    
    return { ...this.tasks[taskIndex] };
  }

  async getDependencies(taskId) {
    await delay(150);
    
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const dependencies = [];
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        const depTask = this.tasks.find(t => t.id === depId);
        if (depTask) {
          dependencies.push({ ...depTask });
        }
      }
    }

return dependencies;
  }

  async createMilestone(milestoneData) {
    await delay(350);
    const milestone = {
      ...milestoneData,
      id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'milestone',
      isDeadline: milestoneData.isDeadline || false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    this.tasks.push(milestone);
    this.saveToStorage();
    return { ...milestone };
  }

  async getMilestones(projectId = null) {
    await delay(200);
    const milestones = this.tasks.filter(t => t.type === 'milestone');
    return projectId 
      ? milestones.filter(m => m.projectId === projectId).map(m => ({ ...m }))
      : milestones.map(m => ({ ...m }));
  }

  async getDeadlines(projectId = null) {
    await delay(200);
    const deadlines = this.tasks.filter(t => t.isDeadline === true);
    return projectId 
      ? deadlines.filter(d => d.projectId === projectId).map(d => ({ ...d }))
      : deadlines.map(d => ({ ...d }));
  }

  async updateMilestone(id, updates) {
    await delay(300);
    const index = this.tasks.findIndex(t => t.id === id && t.type === 'milestone');
    if (index === -1) {
      throw new Error('Milestone not found');
    }

    // Validate milestone-specific constraints
    if (updates.type && updates.type !== 'milestone') {
      throw new Error('Cannot change milestone type');
    }

    this.tasks[index] = { 
      ...this.tasks[index], 
      ...updates,
      type: 'milestone' // Ensure type remains milestone
    };
    this.saveToStorage();
    return { ...this.tasks[index] };
  }

  async deleteMilestone(id) {
    await delay(300);
    const index = this.tasks.findIndex(t => t.id === id && t.type === 'milestone');
    if (index === -1) {
      throw new Error('Milestone not found');
    }

    // Check for dependencies before deletion
    const dependentTasks = this.tasks.filter(task => 
      task.dependencies && task.dependencies.includes(id)
    );
    
    if (dependentTasks.length > 0) {
      throw new Error(`Cannot delete milestone: ${dependentTasks.length} tasks depend on it`);
    }

    this.tasks.splice(index, 1);
    this.saveToStorage();
    return true;
  }
}

export default TaskService;