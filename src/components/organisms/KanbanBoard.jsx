import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { projectService, taskService } from '@/services';
import ApperIcon from '@/components/ApperIcon';
import TaskCard from '@/components/molecules/TaskCard';
import EmptyState from '@/components/molecules/EmptyState';
import ErrorState from '@/components/molecules/ErrorState';
import LoadingSection from '@/components/organisms/LoadingSection';
import Modal from '@/components/molecules/Modal';
import CreateEditTaskForm from '@/components/organisms/CreateEditTaskForm';
import TimelineView from '@/components/organisms/TimelineView';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';
const KanbanBoard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentView, setCurrentView] = useState('kanban'); // kanban or timeline
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null); // Task being edited
    const [currentTaskForm, setCurrentTaskForm] = useState({ // State for the form (new or edit)
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        startDate: '',
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
            // Adjust position for better drag image
            const rect = dragPreviewRef.current.getBoundingClientRect();
            e.dataTransfer.setDragImage(preview, e.clientX - rect.left, e.clientY - rect.top);
        }
    };

    const handleDragOver = (e, columnId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDraggedOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDraggedOverColumn(null);
    };

    const handleDrop = async (e, columnId) => {
        e.preventDefault();
        setDraggedOverColumn(null);

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

const handleOpenTaskModal = (task = null) => {
        setSelectedTask(task);
        setCurrentTaskForm({
            title: task?.title || '',
            description: task?.description || '',
            priority: task?.priority || 'medium',
            dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
            startDate: task?.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
            status: task?.status || 'todo'
        });
        setShowTaskModal(true);
    };

    const handleCloseTaskModal = () => {
        setShowTaskModal(false);
        setSelectedTask(null);
        setCurrentTaskForm({
            title: '',
            description: '',
            priority: 'medium',
            dueDate: '',
            startDate: '',
            status: 'todo'
        });
    };

    const handleSubmitTaskForm = async (e) => {
        e.preventDefault();
        if (!currentTaskForm.title.trim()) {
            toast.error('Task title is required');
            return;
        }

        try {
if (selectedTask) {
                // Update task
                const updatedTask = {
                    ...selectedTask,
                    title: currentTaskForm.title.trim(),
                    description: currentTaskForm.description.trim(),
                    priority: currentTaskForm.priority,
                    dueDate: currentTaskForm.dueDate || null,
                    startDate: currentTaskForm.startDate || null,
                    status: currentTaskForm.status
                };
                await taskService.update(selectedTask.id, updatedTask);
                setTasks(prev => prev.map(task =>
                    task.id === selectedTask.id ? updatedTask : task
                ));
                toast.success('Task updated successfully');
            } else {
                // Create task
                const task = {
                    ...currentTaskForm,
                    title: currentTaskForm.title.trim(),
                    description: currentTaskForm.description.trim(),
                    projectId: id,
                    dueDate: currentTaskForm.dueDate || null,
                    startDate: currentTaskForm.startDate || null
                };
                const created = await taskService.create(task);
                setTasks(prev => [...prev, created]);
                toast.success('Task created successfully');
            }
            handleCloseTaskModal();
        } catch (error) {
            toast.error(`Failed to ${selectedTask ? 'update' : 'create'} task`);
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

    const handleUpdateTaskDates = async (taskId, updatedTask) => {
        try {
            await taskService.update(taskId, updatedTask);
            setTasks(prev => prev.map(task =>
                task.id === taskId ? updatedTask : task
            ));
        } catch (error) {
            throw error;
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

    if (loading) {
        return <LoadingSection type="kanban-board" />;
    }
    if (error) {
        return (
            <ErrorState
                title={error}
                message="Please check the project ID or try again."
                onRetry={loadProjectData}
                additionalButtons={[
                    { text: 'Back to Dashboard', onClick: () => navigate('/dashboard'), className: "px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" }
                ]}
            />
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Project Header */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="p-1 rounded hover:bg-gray-100 transition-colors"
                            >
                                <ApperIcon name="ArrowLeft" size={20} className="text-gray-500" />
                            </Button>
                            <Text as="h1" className="text-2xl font-heading font-bold text-gray-900 truncate">
                                {project.name}
                            </Text>
                        </div>
{project.description && (
                            <Text as="p" className="text-gray-600 break-words">{project.description}</Text>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* View Toggle */}
                        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                            <Button
                                onClick={() => setCurrentView('kanban')}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    currentView === 'kanban'
                                        ? 'bg-white text-primary-600 shadow-sm font-medium'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <div className="flex items-center space-x-1">
                                    <ApperIcon name="Columns" size={14} />
                                    <span>Board</span>
                                </div>
                            </Button>
                            <Button
                                onClick={() => setCurrentView('timeline')}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    currentView === 'timeline'
                                        ? 'bg-white text-primary-600 shadow-sm font-medium'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <div className="flex items-center space-x-1">
                                    <ApperIcon name="Calendar" size={14} />
                                    <span>Timeline</span>
                                </div>
                            </Button>
                        </div>
                        
                        <Button
                            as={motion.button}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleOpenTaskModal()}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        >
                            <ApperIcon name="Plus" size={16} />
                            <span>Add Task</span>
                        </Button>
</div>
                </div>
            </div>

            {/* View Content */}
            {currentView === 'kanban' ? (
                /* Kanban Board */
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
                                                <Text as="h3" className="font-heading font-semibold text-gray-900">
                                                    {column.name}
                                                </Text>
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
                                            draggedOverColumn === column.id ? 'bg-primary-50' : 'bg-transparent'
                                        }`}
                                    >
                                        {columnTasks.length === 0 && (
                                            <div className="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                                <div className="text-center">
                                                    <ApperIcon name="Plus" size={24} className="mx-auto mb-2" />
                                                    <Text as="p" className="text-sm">Drop tasks here</Text>
                                                </div>
                                            </div>
                                        )}
                                        {columnTasks.map((task, index) => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                index={index}
                                                getPriorityColor={getPriorityColor}
                                                onEdit={() => handleOpenTaskModal(task)}
                                                onDelete={handleDeleteTask}
                                                onDragStart={(e) => handleDragStart(e, task)}
                                                isDragged={draggedTask?.id === task.id}
                                                dragRef={draggedTask?.id === task.id ? dragPreviewRef : null}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Timeline View */
                <TimelineView
                    tasks={tasks}
                    onUpdateTask={handleUpdateTaskDates}
                    onEditTask={handleOpenTaskModal}
                />
            )}

            {/* Task Modal */}
            <Modal
                isOpen={showTaskModal}
                onClose={handleCloseTaskModal}
                title={selectedTask ? 'Edit Task' : 'Create New Task'}
            >
                <CreateEditTaskForm
                    task={currentTaskForm}
                    setTask={setCurrentTaskForm}
                    handleSubmit={handleSubmitTaskForm}
                    onClose={handleCloseTaskModal}
                    projectColumns={project.columns}
                    isEditMode={!!selectedTask}
                />
            </Modal>
        </div>
    );
};

export default KanbanBoard;