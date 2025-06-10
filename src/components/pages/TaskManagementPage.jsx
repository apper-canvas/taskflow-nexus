import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { format, isAfter, isBefore, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { taskService, userService, notificationService } from '@/services';
import ApperIcon from '@/components/ApperIcon';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Modal from '@/components/molecules/Modal';
import EmptyState from '@/components/molecules/EmptyState';
import ErrorState from '@/components/molecules/ErrorState';
import LoadingSection from '@/components/organisms/LoadingSection';
import TaskCard from '@/components/molecules/TaskCard';
import CreateEditTaskForm from '@/components/organisms/CreateEditTaskForm';

const TaskManagementPage = () => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [currentTaskForm, setCurrentTaskForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        startDate: '',
        status: 'todo',
        assignedTo: null,
        isRecurring: false,
        recurringType: 'none',
        recurringInterval: 1
    });

    // Filter states
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        assignee: 'all',
        milestone: 'all',
        deadline: 'all',
        dateRange: 'all'
    });

    // Sort states
    const [sortBy, setSortBy] = useState('dueDate');
    const [sortOrder, setSortOrder] = useState('asc');

    // View states
    const [viewMode, setViewMode] = useState('grid'); // grid, list, calendar
    const [showBulkActions, setShowBulkActions] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [tasksData, usersData] = await Promise.all([
                taskService.getAll(),
                userService.getAll()
            ]);
            setTasks(tasksData);
            setUsers(usersData);
        } catch (err) {
            setError(err.message || 'Failed to load data');
            toast.error('Failed to load task data');
        } finally {
            setLoading(false);
        }
    };

    // Search functionality using Fuse.js
    const fuse = useMemo(() => {
        const options = {
            keys: ['title', 'description', 'comments.content', 'assignedTo.name'],
            threshold: 0.3,
            includeScore: true
        };
        return new Fuse(tasks, options);
    }, [tasks]);

    const filteredAndSortedTasks = useMemo(() => {
        let filtered = tasks;

        // Apply search
        if (searchQuery.trim()) {
            const searchResults = fuse.search(searchQuery);
            filtered = searchResults.map(result => result.item);
        }

        // Apply filters
        filtered = filtered.filter(task => {
            if (filters.status !== 'all' && task.status !== filters.status) return false;
            if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
            if (filters.assignee !== 'all' && task.assignedTo?.id !== filters.assignee) return false;
            if (filters.milestone !== 'all') {
                if (filters.milestone === 'milestone' && task.type !== 'milestone') return false;
                if (filters.milestone === 'task' && task.type === 'milestone') return false;
            }
            if (filters.deadline !== 'all') {
                if (filters.deadline === 'deadline' && !task.isDeadline) return false;
                if (filters.deadline === 'normal' && task.isDeadline) return false;
            }
            if (filters.dateRange !== 'all') {
                const now = new Date();
                const taskDue = task.dueDate ? new Date(task.dueDate) : null;
                if (!taskDue) return filters.dateRange === 'no-due-date';
                
                switch (filters.dateRange) {
                    case 'overdue':
                        return isBefore(taskDue, now) && task.status !== 'done';
                    case 'today':
                        return format(taskDue, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                    case 'this-week':
                        return isAfter(taskDue, startOfWeek(now)) && isBefore(taskDue, endOfWeek(now));
                    case 'next-week':
                        const nextWeekStart = addDays(endOfWeek(now), 1);
                        const nextWeekEnd = endOfWeek(nextWeekStart);
                        return isAfter(taskDue, nextWeekStart) && isBefore(taskDue, nextWeekEnd);
                    default:
                        return true;
                }
            }
            return true;
        });

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    aValue = priorityOrder[a.priority] || 0;
                    bValue = priorityOrder[b.priority] || 0;
                    break;
                case 'dueDate':
                    aValue = a.dueDate ? new Date(a.dueDate) : new Date('2099-12-31');
                    bValue = b.dueDate ? new Date(b.dueDate) : new Date('2099-12-31');
                    break;
                case 'assignee':
                    aValue = a.assignedTo?.name?.toLowerCase() || 'zzz';
                    bValue = b.assignedTo?.name?.toLowerCase() || 'zzz';
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'dependencyLevel':
                    aValue = a.dependencies?.length || 0;
                    bValue = b.dependencies?.length || 0;
                    break;
                default:
                    aValue = a.createdAt;
                    bValue = b.createdAt;
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [tasks, searchQuery, filters, sortBy, sortOrder, fuse]);

    const handleCreateTask = async (taskData) => {
        try {
            const created = await taskService.create({
                ...taskData,
                comments: [],
                attachments: [],
                notifications: []
            });
            setTasks(prev => [...prev, created]);
            
            // Send notification to assignee
            if (created.assignedTo) {
                await notificationService.create({
                    userId: created.assignedTo.id,
                    type: 'task_assigned',
                    title: 'New Task Assigned',
                    message: `You have been assigned to task: ${created.title}`,
                    taskId: created.id
                });
            }

            toast.success('Task created successfully');
            setShowTaskModal(false);
        } catch (error) {
            toast.error('Failed to create task');
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            const updated = await taskService.update(taskId, updates);
            setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
            
            // Send notification if assignee changed
            const originalTask = tasks.find(t => t.id === taskId);
            if (updates.assignedTo && originalTask?.assignedTo?.id !== updates.assignedTo.id) {
                await notificationService.create({
                    userId: updates.assignedTo.id,
                    type: 'task_reassigned',
                    title: 'Task Reassigned',
                    message: `You have been assigned to task: ${updated.title}`,
                    taskId: updated.id
                });
            }

            toast.success('Task updated successfully');
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        try {
            await taskService.delete(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            toast.success('Task deleted successfully');
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedTasks.length === 0) return;

        try {
            switch (action) {
                case 'delete':
                    if (!confirm(`Delete ${selectedTasks.length} selected tasks?`)) return;
                    await Promise.all(selectedTasks.map(id => taskService.delete(id)));
                    setTasks(prev => prev.filter(t => !selectedTasks.includes(t.id)));
                    toast.success(`${selectedTasks.length} tasks deleted`);
                    break;
                case 'complete':
                    await Promise.all(selectedTasks.map(id => 
                        taskService.update(id, { status: 'done', completedAt: new Date().toISOString() })
                    ));
                    setTasks(prev => prev.map(t => 
                        selectedTasks.includes(t.id) 
                            ? { ...t, status: 'done', completedAt: new Date().toISOString() }
                            : t
                    ));
                    toast.success(`${selectedTasks.length} tasks completed`);
                    break;
                case 'assign':
                    // Open assignee selection modal
                    break;
            }
            setSelectedTasks([]);
            setShowBulkActions(false);
        } catch (error) {
            toast.error(`Failed to ${action} tasks`);
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

    if (loading) return <LoadingSection type="task-management" />;
    if (error) return <ErrorState message={error} onRetry={loadData} />;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <Text as="h1" className="text-2xl font-heading font-bold text-gray-900">
                            Task Management
                        </Text>
                        <Text as="p" className="text-gray-600">
                            Manage all tasks across projects with advanced filtering and search
                        </Text>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {/* View Mode Toggle */}
                        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                            {['grid', 'list', 'calendar'].map(mode => (
                                <Button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                        viewMode === mode
                                            ? 'bg-white text-primary-600 shadow-sm font-medium'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <ApperIcon 
                                        name={mode === 'grid' ? 'Grid3X3' : mode === 'list' ? 'List' : 'Calendar'} 
                                        size={14} 
                                    />
                                </Button>
                            ))}
                        </div>

                        <Button
                            onClick={() => setShowTaskModal(true)}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        >
                            <ApperIcon name="Plus" size={16} />
                            <span>New Task</span>
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="mt-6 space-y-4">
                    {/* Search Bar */}
                    <div className="task-search-container">
                        <div className="relative">
                            <ApperIcon 
                                name="Search" 
                                size={20} 
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                            />
                            <Input
                                type="text"
                                placeholder="Search tasks by title, description, comments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            {searchQuery && (
                                <Button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                                >
                                    <ApperIcon name="X" size={16} className="text-gray-400" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-2">
                        {/* Status Filter */}
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="task-filter-chip"
                        >
                            <option value="all">All Status</option>
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                            className="task-filter-chip"
                        >
                            <option value="all">All Priority</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        {/* Assignee Filter */}
                        <select
                            value={filters.assignee}
                            onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
                            className="task-filter-chip"
                        >
                            <option value="all">All Assignees</option>
                            <option value="unassigned">Unassigned</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>

                        {/* Date Range Filter */}
                        <select
                            value={filters.dateRange}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                            className="task-filter-chip"
                        >
                            <option value="all">All Dates</option>
                            <option value="overdue">Overdue</option>
                            <option value="today">Due Today</option>
                            <option value="this-week">This Week</option>
                            <option value="next-week">Next Week</option>
                            <option value="no-due-date">No Due Date</option>
                        </select>

                        {/* Sort Controls */}
                        <div className="flex items-center space-x-2 ml-auto">
                            <Text as="span" className="text-sm text-gray-600">Sort by:</Text>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="dueDate">Due Date</option>
                                <option value="priority">Priority</option>
                                <option value="title">Title</option>
                                <option value="assignee">Assignee</option>
                                <option value="status">Status</option>
                                <option value="dependencyLevel">Dependencies</option>
                            </select>
                            <Button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <ApperIcon 
                                    name={sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'} 
                                    size={16} 
                                    className="text-gray-600" 
                                />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task List/Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {filteredAndSortedTasks.length === 0 ? (
                    searchQuery ? (
                        <EmptyState
                            iconName="Search"
                            title="No tasks found"
                            message={`No tasks match your search for "${searchQuery}"`}
                            actionButtonText="Clear Search"
                            onActionButtonClick={() => setSearchQuery('')}
                        />
                    ) : (
                        <EmptyState
                            iconName="CheckSquare"
                            title="No tasks yet"
                            message="Create your first task to get started with task management"
                            actionButtonText="Create Task"
                            actionButtonIcon="Plus"
                            onActionButtonClick={() => setShowTaskModal(true)}
                        />
                    )
                ) : (
                    <div className={`
                        ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' :
                          viewMode === 'list' ? 'space-y-2' : 'grid grid-cols-7 gap-1'
                        }
                    `}>
                        {filteredAndSortedTasks.map((task, index) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative"
                            >
                                {/* Selection Checkbox */}
                                <div className="absolute top-2 left-2 z-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedTasks.includes(task.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedTasks(prev => [...prev, task.id]);
                                            } else {
                                                setSelectedTasks(prev => prev.filter(id => id !== task.id));
                                            }
                                            setShowBulkActions(selectedTasks.length > 0 || e.target.checked);
                                        }}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </div>

                                <TaskCard
                                    task={task}
                                    index={index}
                                    getPriorityColor={getPriorityColor}
                                    onEdit={() => {
                                        setSelectedTask(task);
                                        setCurrentTaskForm({
                                            title: task.title,
                                            description: task.description,
                                            priority: task.priority,
                                            dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
                                            startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
                                            status: task.status,
                                            assignedTo: task.assignedTo,
                                            isRecurring: task.isRecurring || false,
                                            recurringType: task.recurringType || 'none',
                                            recurringInterval: task.recurringInterval || 1
                                        });
                                        setShowTaskModal(true);
                                    }}
                                    onDelete={handleDeleteTask}
                                    showAssignee={true}
                                    showComments={true}
                                    showAttachments={true}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Results Summary */}
                {filteredAndSortedTasks.length > 0 && (
                    <div className="mt-6 text-center">
                        <Text as="p" className="text-sm text-gray-600">
                            Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
                        </Text>
                    </div>
                )}
            </div>

            {/* Bulk Actions */}
            <AnimatePresence>
                {showBulkActions && selectedTasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="task-bulk-actions"
                    >
                        <Text as="span" className="text-sm font-medium text-gray-700">
                            {selectedTasks.length} selected
                        </Text>
                        <Button
                            onClick={() => handleBulkAction('complete')}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                            Complete
                        </Button>
                        <Button
                            onClick={() => handleBulkAction('assign')}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Assign
                        </Button>
                        <Button
                            onClick={() => handleBulkAction('delete')}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            Delete
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedTasks([]);
                                setShowBulkActions(false);
                            }}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task Modal */}
            <Modal
                isOpen={showTaskModal}
                onClose={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                    setCurrentTaskForm({
                        title: '',
                        description: '',
                        priority: 'medium',
                        dueDate: '',
                        startDate: '',
                        status: 'todo',
                        assignedTo: null,
                        isRecurring: false,
                        recurringType: 'none',
                        recurringInterval: 1
                    });
                }}
                title={selectedTask ? 'Edit Task' : 'Create New Task'}
            >
                <CreateEditTaskForm
                    task={currentTaskForm}
                    setTask={setCurrentTaskForm}
                    handleSubmit={async (e) => {
                        e.preventDefault();
                        if (selectedTask) {
                            await handleUpdateTask(selectedTask.id, currentTaskForm);
                        } else {
                            await handleCreateTask(currentTaskForm);
                        }
                    }}
                    onClose={() => setShowTaskModal(false)}
                    projectColumns={[
                        { id: 'todo', name: 'To Do' },
                        { id: 'in-progress', name: 'In Progress' },
                        { id: 'done', name: 'Done' }
                    ]}
                    users={users}
                    isEditMode={!!selectedTask}
                    showAdvancedFeatures={true}
                />
            </Modal>
        </div>
    );
};

export default TaskManagementPage;