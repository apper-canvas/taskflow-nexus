import { toast } from 'react-toastify';

class TaskService {
  constructor() {
    this.tableName = 'task';
    this.updateableFields = ['Name', 'Tags', 'Owner', 'project_id', 'title', 'description', 'status', 'priority', 'type', 'is_deadline', 'start_date', 'due_date', 'created_at', 'completed_at'];
    this.allFields = ['Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy', 'project_id', 'title', 'description', 'status', 'priority', 'type', 'is_deadline', 'start_date', 'due_date', 'created_at', 'completed_at'];
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

  formatTaskData(data) {
    return {
      ...data,
      id: data.Id || data.id,
      projectId: data.project_id || data.projectId,
      title: data.title || data.Name || '',
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      type: data.type || 'task',
      isDeadline: data.is_deadline || false,
      startDate: data.start_date || data.startDate,
      dueDate: data.due_date || data.dueDate,
      createdAt: data.CreatedOn || data.created_at || data.createdAt,
      completedAt: data.completed_at || data.completedAt
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

      return (response.data || []).map(task => this.formatTaskData(task));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return [];
    }
  }

  async getById(id) {
    try {
      if (!id) {
        throw new Error('Task ID is required');
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

      return response.data ? this.formatTaskData(response.data) : null;
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Failed to load task');
      return null;
    }
  }

  async getByProjectId(projectId) {
    try {
      if (!projectId) {
        return [];
      }

      const apperClient = this.getApperClient();
      const params = {
        fields: this.allFields,
        where: [
          {
            fieldName: "project_id",
            operator: "EqualTo",
            values: [parseInt(projectId)]
          }
        ]
      };

      const response = await apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return (response.data || []).map(task => this.formatTaskData(task));
    } catch (error) {
      console.error('Error fetching tasks by project:', error);
      toast.error('Failed to load project tasks');
      return [];
    }
  }

  async create(taskData) {
    try {
      if (!taskData || typeof taskData !== 'object') {
        throw new Error('Invalid task data provided');
      }

      const apperClient = this.getApperClient();
      
      // Only include updateable fields and format them properly
      const recordData = {
        title: taskData.title || '',
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        type: taskData.type || 'task',
        is_deadline: taskData.isDeadline || false,
        created_at: new Date().toISOString()
      };

      // Add project_id as integer if provided
      if (taskData.projectId) {
        recordData.project_id = parseInt(taskData.projectId);
      }

      // Format dates properly
      if (taskData.startDate) {
        recordData.start_date = new Date(taskData.startDate).toISOString();
      }
      if (taskData.dueDate) {
        recordData.due_date = new Date(taskData.dueDate).toISOString();
      }

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
          return this.formatTaskData(successfulRecords[0].data);
        }
      }

      throw new Error('Failed to create task');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      throw error;
    }
  }

  async update(id, updates) {
    try {
      if (!id) {
        throw new Error('Task ID is required');
      }
      if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid update data provided');
      }

      const apperClient = this.getApperClient();
      
      // Only include updateable fields that are provided
      const recordData = { Id: parseInt(id) };
      
      if (updates.title !== undefined) recordData.title = updates.title;
      if (updates.description !== undefined) recordData.description = updates.description;
      if (updates.status !== undefined) recordData.status = updates.status;
      if (updates.priority !== undefined) recordData.priority = updates.priority;
      if (updates.type !== undefined) recordData.type = updates.type;
      if (updates.isDeadline !== undefined) recordData.is_deadline = updates.isDeadline;
      
      if (updates.projectId !== undefined) {
        recordData.project_id = parseInt(updates.projectId);
      }
      
      if (updates.startDate !== undefined) {
        recordData.start_date = updates.startDate ? new Date(updates.startDate).toISOString() : null;
      }
      if (updates.dueDate !== undefined) {
        recordData.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;
      }
      if (updates.completedAt !== undefined) {
        recordData.completed_at = updates.completedAt ? new Date(updates.completedAt).toISOString() : null;
      }

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
          return this.formatTaskData(successfulUpdates[0].data);
        }
      }

      throw new Error('Failed to update task');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      throw error;
    }
  }

  async delete(id) {
    try {
      if (!id) {
        throw new Error('Task ID is required');
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
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      throw error;
    }
  }
}

// Export singleton instance to match other services pattern
const taskService = new TaskService();
export default taskService;