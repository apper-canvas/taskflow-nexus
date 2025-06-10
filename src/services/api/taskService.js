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
}
export default new TaskService();