import projectsData from '../mockData/projects.json';

// Local delay function to avoid circular dependency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ProjectService {
  constructor() {
    this.projects = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('taskflow-projects');
      return stored ? JSON.parse(stored) : [...projectsData];
    } catch (error) {
      console.error('Error loading projects from storage:', error);
      return [...projectsData];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('taskflow-projects', JSON.stringify(this.projects));
    } catch (error) {
      console.error('Error saving projects to storage:', error);
    }
  }

  async getAll() {
    await delay(300);
    return [...this.projects];
  }

  async getById(id) {
    await delay(200);
    if (!id) {
      throw new Error('Project ID is required');
    }
    const project = this.projects.find(p => p.id === id);
    return project ? { ...project } : null;
  }

  async create(projectData) {
    await delay(400);
    if (!projectData || typeof projectData !== 'object') {
      throw new Error('Invalid project data provided');
    }
    
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
    if (!id) {
      throw new Error('Project ID is required');
    }
    if (!updates || typeof updates !== 'object') {
      throw new Error('Invalid update data provided');
    }
    
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
    if (!id) {
      throw new Error('Project ID is required');
    }
    
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Project not found');
    }
    
    this.projects.splice(index, 1);
    this.saveToStorage();
    return true;
  }
}

// Export singleton instance
export default new ProjectService();