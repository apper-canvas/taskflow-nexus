import { toast } from 'react-toastify';

class ProjectService {
  constructor() {
    this.tableName = 'project';
    this.updateableFields = ['Name', 'Tags', 'Owner', 'description', 'columns', 'created_at', 'archived'];
    this.allFields = ['Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy', 'description', 'columns', 'created_at', 'archived'];
  }

  getApperClient() {
    if (!window.ApperSDK) {
      throw new Error('Apper SDK not loaded');
    }
    const { ApperClient } = window.ApperSDK;
    return new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
  }

  formatProjectData(data) {
    return {
      ...data,
      id: data.Id || data.id,
      name: data.Name || data.name,
      description: data.description || '',
      columns: data.columns ? (typeof data.columns === 'string' ? JSON.parse(data.columns) : data.columns) : [],
      archived: data.archived || false,
      createdAt: data.CreatedOn || data.created_at || data.createdAt
    };
  }

  async getAll() {
    try {
      const apperClient = this.getApperClient();
      const params = {
        fields: this.allFields
      };

      const response = await apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return (response.data || []).map(project => this.formatProjectData(project));
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      return [];
    }
  }

  async getById(id) {
    try {
      if (!id) {
        throw new Error('Project ID is required');
      }

      const apperClient = this.getApperClient();
      const params = {
        fields: this.allFields
      };

      const response = await apperClient.getRecordById(this.tableName, id, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      return response.data ? this.formatProjectData(response.data) : null;
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
      return null;
    }
  }

  async create(projectData) {
    try {
      if (!projectData || typeof projectData !== 'object') {
        throw new Error('Invalid project data provided');
      }

      const apperClient = this.getApperClient();
      
      // Only include updateable fields and format them properly
      const recordData = {
        Name: projectData.name || '',
        description: projectData.description || '',
        columns: typeof projectData.columns === 'object' ? JSON.stringify(projectData.columns) : projectData.columns || '',
        created_at: new Date().toISOString(),
        archived: false
      };

      // Filter out any undefined fields
      Object.keys(recordData).forEach(key => {
        if (recordData[key] === undefined) {
          delete recordData[key];
        }
      });

      const params = {
        records: [recordData]
      };

      const response = await apperClient.createRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to create ${failedRecords.length} records:${failedRecords}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
        }
        
        if (successfulRecords.length > 0) {
          return this.formatProjectData(successfulRecords[0].data);
        }
      }

      throw new Error('Failed to create project');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      throw error;
    }
  }

  async update(id, updates) {
    try {
      if (!id) {
        throw new Error('Project ID is required');
      }
      if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid update data provided');
      }

      const apperClient = this.getApperClient();
      
      // Only include updateable fields that are provided
      const recordData = { Id: parseInt(id) };
      
      if (updates.name !== undefined) recordData.Name = updates.name;
      if (updates.description !== undefined) recordData.description = updates.description;
      if (updates.columns !== undefined) {
        recordData.columns = typeof updates.columns === 'object' ? JSON.stringify(updates.columns) : updates.columns;
      }
      if (updates.archived !== undefined) recordData.archived = updates.archived;

      const params = {
        records: [recordData]
      };

      const response = await apperClient.updateRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successfulUpdates = response.results.filter(result => result.success);
        const failedUpdates = response.results.filter(result => !result.success);
        
        if (failedUpdates.length > 0) {
          console.error(`Failed to update ${failedUpdates.length} records:${failedUpdates}`);
          
          failedUpdates.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
        }
        
        if (successfulUpdates.length > 0) {
          return this.formatProjectData(successfulUpdates[0].data);
        }
      }

      throw new Error('Failed to update project');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      throw error;
    }
  }

  async delete(id) {
    try {
      if (!id) {
        throw new Error('Project ID is required');
      }

      const apperClient = this.getApperClient();
      const params = {
        RecordIds: [parseInt(id)]
      };

      const response = await apperClient.deleteRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      if (response.results) {
        const successfulDeletions = response.results.filter(result => result.success);
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete ${failedDeletions.length} records:${failedDeletions}`);
          
          failedDeletions.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }
        
        return successfulDeletions.length > 0;
      }

      return false;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
      throw error;
    }
  }
}

// Export singleton instance
export default new ProjectService();