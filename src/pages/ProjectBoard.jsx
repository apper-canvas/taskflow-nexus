import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ApperIcon from '../components/ApperIcon';
import { projectService, taskService } from '../services';

const ProjectBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    status: 'todo'
  });
  const dragPreviewRef = useRef(null);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    setLoading(true);
    setError(null);
try {
      const [projectData, tasksData] = await Promise.all([
        projectService.getById(id),
        taskService.getByProjectId(id)
      ]);
      
      if (!projectData) {
        setError('Project not found');
        return;
      }

      setProject(projectData);
      setTasks(tasksData);
    } catch (err) {
      setError(err.message || 'Failed to load project');
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create drag preview
    if (dragPreviewRef.current) {
      const preview = dragPreviewRef.current.cloneNode(true);
      preview.style.transform = 'rotate(3deg)';
      preview.style.opacity = '0.8';
      e.dataTransfer.setDragImage(preview, 0, 0);
    }
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    setDraggedOver(null);

    if (!draggedTask || draggedTask.status === columnId) {
      setDraggedTask(null);
      return;
    }

    try {
      const updatedTask = {
        ...draggedTask,
        status: columnId,
        completedAt: columnId === 'done' ? new Date().toISOString() : null
      };
await taskService.update(draggedTask.id, updatedTask);
      setTasks(prev => prev.map(task => 
        task.id === draggedTask.id ? updatedTask : task
      ));

      toast.success(`Task moved to ${project.columns.find(c => c.id === columnId)?.name}`);
    } catch (error) {
      toast.error('Failed to update task');
    }

    setDraggedTask(null);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const task = {
        ...newTask,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        projectId: id,
        dueDate: newTask.dueDate || null
      };
const created = await taskService.create(task);
      setTasks(prev => [...prev, created]);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        status: 'todo'
      });
      setShowTaskModal(false);
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      status: task.status
    });
    setShowTaskModal(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const updatedTask = {
        ...selectedTask,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        dueDate: newTask.dueDate || null,
        status: newTask.status
      };
await taskService.update(selectedTask.id, updatedTask);
      setTasks(prev => prev.map(task =>
        task.id === selectedTask.id ? updatedTask : task
      ));
      setShowTaskModal(false);
      setSelectedTask(null);
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

try {
      await taskService.delete(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getColumnTasks = (columnId) => {
    return tasks.filter(task => task.status === columnId);
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="bg-white rounded-lg p-4 shadow-card">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{error}</h3>
          <div className="space-x-4">
            <button
              onClick={loadProjectData}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Project Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <ApperIcon name="ArrowLeft" size={20} className="text-gray-500" />
              </button>
              <h1 className="text-2xl font-heading font-bold text-gray-900 truncate">
                {project.name}
              </h1>
            </div>
            {project.description && (
              <p className="text-gray-600 break-words">{project.description}</p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedTask(null);
              setNewTask({
                title: '',
                description: '',
                priority: 'medium',
                dueDate: '',
                status: 'todo'
              });
              setShowTaskModal(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <ApperIcon name="Plus" size={16} />
            <span>Add Task</span>
          </motion.button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex space-x-6 h-full min-w-max">
          {project.columns.map((column) => {
            const columnTasks = getColumnTasks(column.id);
            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-80 flex flex-col"
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="flex-shrink-0 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <h3 className="font-heading font-semibold text-gray-900">
                        {column.name}
                      </h3>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>
                  <div
                    className="h-1 mt-2 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                </div>

                {/* Task Cards */}
                <div 
                  className={`flex-1 space-y-3 overflow-y-auto min-h-[200px] p-2 rounded-lg transition-colors ${
                    draggedOver === column.id ? 'bg-primary-50' : 'bg-transparent'
                  }`}
                >
                  <AnimatePresence>
                    {columnTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        ref={draggedTask?.id === task.id ? dragPreviewRef : null}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onClick={() => handleEditTask(task)}
                        className={`bg-white rounded-lg p-4 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-move group ${
                          draggedTask?.id === task.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors break-words flex-1 mr-2">
                            {task.title}
                          </h4>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all"
                            >
                              <ApperIcon name="Trash2" size={12} className="text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-600 mb-3 break-words line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="capitalize">{task.priority} priority</span>
                          {task.dueDate && (
                            <div className="flex items-center space-x-1">
                              <ApperIcon name="Calendar" size={12} />
                              <span>{format(new Date(task.dueDate), 'MMM dd')}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {columnTasks.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                      <div className="text-center">
                        <ApperIcon name="Plus" size={24} className="mx-auto mb-2" />
                        <p className="text-sm">Drop tasks here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowTaskModal(false)}
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
                    {selectedTask ? 'Edit Task' : 'Create New Task'}
                  </h2>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ApperIcon name="X" size={20} className="text-gray-500" />
                  </button>
                </div>

                <form onSubmit={selectedTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter task title"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-20 resize-none"
                      placeholder="Optional task description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={newTask.status}
                        onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {project.columns.map(column => (
                          <option key={column.id} value={column.id}>
                            {column.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {selectedTask ? 'Update Task' : 'Create Task'}
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

export default ProjectBoard;