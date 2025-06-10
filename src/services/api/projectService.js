import projectsData from '../mockData/projects.json';
import { delay } from '../index';

class ProjectService {
  constructor() {
    this.projects = this.loadFromStorage();
  }

  loadFromStorage() {
    const stored = localStorage.getItem('taskflow-projects');
    return stored ? JSON.parse(stored) : [...projectsData];
  }

  saveToStorage() {
    localStorage.setItem('taskflow-projects', JSON.stringify(this.projects));
  }

  async getAll() {
    await delay(300);
    return [...this.projects];
  }

  async getById(id) {
    await delay(200);
    const project = this.projects.find(p => p.id === id);
    return project ? { ...project } : null;
  }

  async create(projectData) {
    await delay(400);
    const project = {
      ...projectData,
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      archived: false
    };
    this.projects.push(project);
    this.saveToStorage();
    return { ...project };
  }

  async update(id, updates) {
    await delay(300);
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Project not found');
    }
    this.projects[index] = { ...this.projects[index], ...updates };
    this.saveToStorage();
    return { ...this.projects[index] };
  }

  async delete(id) {
    await delay(300);
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Project not found');
    }
    this.projects.splice(index, 1);
    this.saveToStorage();
    return true;
  }
}

export default new ProjectService();