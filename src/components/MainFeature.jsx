import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApperIcon from './ApperIcon';
import { projectService, taskService } from '../services';

const MainFeature = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await projectService.getAll();
      const activeProjects = result.filter(p => !p.archived);
      
      // Get task counts for each project
      const projectsWithStats = await Promise.all(
        activeProjects.map(async (project) => {
          try {
            const tasks = await taskService.getByProjectId(project.id);
            const completedTasks = tasks.filter(t => t.status === 'done').length;
            const totalTasks = tasks.length;
            return {
              ...project,
              taskCount: totalTasks,
              completedTasks,
              progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            };
          } catch {
            return { ...project, taskCount: 0, completedTasks: 0, progress: 0 };
          }
        })
      );
      
      setProjects(projectsWithStats);
    } catch (err) {
      setError(err.message || 'Failed to load projects');
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      const project = {
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        columns: [
          { id: 'todo', name: 'To Do', position: 0, color: '#6B7280' },
          { id: 'in-progress', name: 'In Progress', position: 1, color: '#3B82F6' },
          { id: 'done', name: 'Done', position: 2, color: '#10B981' }
        ]
      };

      const created = await projectService.create(project);
      setProjects(prev => [...prev, { ...created, taskCount: 0, completedTasks: 0, progress: 0 }]);
      setNewProject({ name: '', description: '' });
      setShowCreateProject(false);
      toast.success('Project created successfully');
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-card">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load projects</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadProjects}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
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
            <ApperIcon name="FolderPlus" className="w-16 h-16 text-gray-300 mx-auto" />
          </motion.div>
          <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">
            Welcome to TaskFlow Pro
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first project. Organize tasks, track progress, and meet deadlines efficiently.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateProject(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <ApperIcon name="Plus" size={20} />
            <span>Create First Project</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Project Dashboard</h1>
          <p className="text-gray-600">Manage your projects and track progress</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateProject(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <ApperIcon name="Plus" size={16} />
          <span>New Project</span>
        </motion.button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => navigate(`/project/${project.id}`)}
            className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-heading font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                    {project.description}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="w-3 h-3 bg-accent-500 rounded-full"></div>
              </div>
            </div>

            {/* Progress Ring */}
            <div className="relative mb-4">
              <div className="flex items-center justify-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                    />
                    <motion.path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#5B21B6"
                      strokeWidth="2"
                      strokeDasharray={`${project.progress}, 100`}
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: `${project.progress}, 100` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-heading font-bold text-gray-900">
                      {project.progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-gray-600">
                  <ApperIcon name="CheckSquare" size={14} />
                  <span>{project.completedTasks}/{project.taskCount} tasks</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-gray-400 group-hover:text-primary-500 transition-colors">
                <ApperIcon name="ArrowRight" size={14} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowCreateProject(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-modal max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-semibold text-gray-900">
                    Create New Project
                  </h2>
                  <button
                    onClick={() => setShowCreateProject(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ApperIcon name="X" size={20} className="text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter project name"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-20 resize-none"
                      placeholder="Optional project description"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateProject(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Create Project
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainFeature;