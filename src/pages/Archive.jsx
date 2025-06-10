import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ApperIcon from '../components/ApperIcon';
import { projectService, taskService } from '../services';

const Archive = () => {
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArchivedProjects();
  }, []);

  const loadArchivedProjects = async () => {
    setLoading(true);
    setError(null);
try {
      const projects = await projectService.getAll();
      const archived = projects.filter(p => p.archived);
      
      // Get task counts for archived projects
      const projectsWithStats = await Promise.all(
        archived.map(async (project) => {
          try {
            const tasks = await taskService.getByProjectId(project.id);
            const completedTasks = tasks.filter(t => t.status === 'done').length;
            return {
              ...project,
              totalTasks: tasks.length,
              completedTasks
            };
          } catch {
            return { ...project, totalTasks: 0, completedTasks: 0 };
          }
        })
      );
      
      setArchivedProjects(projectsWithStats);
    } catch (err) {
      setError(err.message || 'Failed to load archived projects');
      toast.error('Failed to load archived projects');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProject = async (projectId) => {
try {
      await projectService.update(projectId, { archived: false });
      setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project restored successfully');
    } catch (error) {
      toast.error('Failed to restore project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete all tasks first
      const tasks = await taskService.getByProjectId(projectId);
      await Promise.all(tasks.map(task => taskService.delete(task.id)));
// Then delete the project
      await projectService.delete(projectId);
      setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project deleted permanently');
      toast.success('Project deleted permanently');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-card">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ApperIcon name="AlertCircle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load archived projects</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadArchivedProjects}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (archivedProjects.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[500px]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="mb-6"
          >
            <ApperIcon name="Archive" className="w-16 h-16 text-gray-300 mx-auto" />
          </motion.div>
          <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">
            No Archived Projects
          </h3>
          <p className="text-gray-600 mb-6">
            Completed projects will appear here. Archive projects to keep your dashboard organized while preserving project history.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Archived Projects</h1>
          <p className="text-gray-600">View and manage your completed projects</p>
        </div>
        <div className="text-sm text-gray-500">
          {archivedProjects.length} archived project{archivedProjects.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Archived Projects List */}
      <div className="space-y-4">
        {archivedProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-heading font-semibold text-gray-900 truncate">
                    {project.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                    <ApperIcon name="Archive" size={12} className="mr-1" />
                    Archived
                  </span>
                </div>
                
                {project.description && (
                  <p className="text-gray-600 break-words mb-3">{project.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <ApperIcon name="CheckSquare" size={14} />
                    <span>{project.completedTasks}/{project.totalTasks} tasks completed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ApperIcon name="Calendar" size={14} />
                    <span>Created {format(new Date(project.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  {project.totalTasks > 0 && (
                    <div className="flex items-center space-x-1">
                      <ApperIcon name="TrendingUp" size={14} />
                      <span>{Math.round((project.completedTasks / project.totalTasks) * 100)}% complete</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRestoreProject(project.id)}
                  className="inline-flex items-center space-x-2 px-3 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors text-sm"
                >
                  <ApperIcon name="RotateCcw" size={14} />
                  <span>Restore</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeleteProject(project.id)}
                  className="inline-flex items-center space-x-2 px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                  <ApperIcon name="Trash2" size={14} />
                  <span>Delete</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Archive;