import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays, parseISO, isValid } from 'date-fns';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import ApperIcon from '@/components/ApperIcon';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';
import { taskService } from '@/services';

const TimelineView = ({ tasks, onUpdateTask, onEditTask, onTaskUpdate }) => {
    const [zoomLevel, setZoomLevel] = useState('week'); // day, week, month
const [currentDate, setCurrentDate] = useState(new Date());
    const [draggedTask, setDraggedTask] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isCreatingDependency, setIsCreatingDependency] = useState(false);
    const [dependencySource, setDependencySource] = useState(null);
    const [tooltip, setTooltip] = useState({ task: null, visible: false, x: 0, y: 0 });
    const [filters, setFilters] = useState({
        priority: 'all',
        status: 'all',
        assignee: 'all',
        showMilestones: true,
        showDeadlines: true
    });
    const [sortBy, setSortBy] = useState('startDate'); // startDate, priority, title
    const timelineRef = useRef(null);
    // Calculate timeline range based on zoom level
    const timelineRange = useMemo(() => {
        let start, end, days;
        
        switch (zoomLevel) {
            case 'day':
                start = new Date(currentDate);
                end = addDays(start, 7);
                days = 7;
                break;
            case 'week':
                start = startOfWeek(currentDate);
                end = endOfWeek(addDays(start, 21));
                days = 28;
                break;
            case 'month':
                start = startOfMonth(currentDate);
                end = endOfMonth(addDays(start, 60));
                days = differenceInDays(end, start) + 1;
                break;
            default:
                start = startOfWeek(currentDate);
                end = endOfWeek(addDays(start, 21));
                days = 28;
        }
        
        return { start, end, days };
    }, [currentDate, zoomLevel]);

    // Calculate day width based on container and zoom level
    const dayWidth = useMemo(() => {
        switch (zoomLevel) {
            case 'day': return 120;
            case 'week': return 60;
            case 'month': return 30;
            default: return 60;
        }
    }, [zoomLevel]);

// Filter and position tasks within timeline range
    const timelineTasks = useMemo(() => {
        return tasks
            .filter(task => {
                // Date filter
                if (!task.startDate && !task.dueDate) return false;
                const taskStart = task.startDate ? parseISO(task.startDate) : parseISO(task.dueDate);
                const taskEnd = task.dueDate ? parseISO(task.dueDate) : taskStart;
                if (!isValid(taskStart) || !isValid(taskEnd)) return false;

                // Priority filter
                if (filters.priority !== 'all' && task.priority !== filters.priority) return false;

                // Status filter
                if (filters.status !== 'all' && task.status !== filters.status) return false;

                // Assignee filter
                if (filters.assignee !== 'all' && task.assignee !== filters.assignee) return false;

                // Type filters
                if (!filters.showMilestones && task.type === 'milestone') return false;
                if (!filters.showDeadlines && task.isDeadline) return false;

                return true;
            })
            .map(task => {
                const taskStart = task.startDate ? parseISO(task.startDate) : parseISO(task.dueDate);
                const taskEnd = task.dueDate ? parseISO(task.dueDate) : taskStart;
                
                const startOffset = Math.max(0, differenceInDays(taskStart, timelineRange.start));
                const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
                
                return {
                    ...task,
                    startOffset,
                    duration,
                    taskStart,
                    taskEnd
                };
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'priority':
                        const priorityOrder = { high: 3, medium: 2, low: 1 };
                        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                    case 'title':
                        return a.title.localeCompare(b.title);
                    default:
                        return a.startOffset - b.startOffset;
                }
            });
    }, [tasks, timelineRange, filters, sortBy]);

    // Get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500 border-red-600';
            case 'medium': return 'bg-yellow-500 border-yellow-600';
            case 'low': return 'bg-green-500 border-green-600';
            default: return 'bg-gray-500 border-gray-600';
        }
    };

    // Handle zoom level changes
    const handleZoomChange = (newZoomLevel) => {
        setZoomLevel(newZoomLevel);
    };

    // Navigate timeline
    const navigateTimeline = (direction) => {
        let daysToMove;
        switch (zoomLevel) {
            case 'day': daysToMove = 7; break;
            case 'week': daysToMove = 14; break;
            case 'month': daysToMove = 30; break;
            default: daysToMove = 14;
        }
setCurrentDate(prev => addDays(prev, direction === 'next' ? daysToMove : -daysToMove));
    };

    // Handle dependency creation
    const handleCreateDependency = useCallback(async (sourceTaskId, targetTaskId) => {
        if (sourceTaskId === targetTaskId) {
            toast.error('A task cannot depend on itself');
            return;
        }

        try {
            await taskService.addDependency(sourceTaskId, targetTaskId);
            toast.success('Dependency created successfully');
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            toast.error(error.message || 'Failed to create dependency');
        }
    }, [onTaskUpdate]);

    // Handle dependency removal
    const handleRemoveDependency = useCallback(async (taskId, dependencyId) => {
        try {
            await taskService.removeDependency(taskId, dependencyId);
            toast.success('Dependency removed successfully');
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            toast.error('Failed to remove dependency');
        }
    }, [onTaskUpdate]);

    // Handle tooltip
    const handleTooltip = useCallback((task, visible, event = null) => {
        if (visible && task && event) {
            const rect = event.target.getBoundingClientRect();
            setTooltip({
                task,
                visible: true,
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
        } else {
            setTooltip({ task: null, visible: false, x: 0, y: 0 });
        }
    }, []);

    // Handle task drag start
    const handleDragStart = (e, task) => {
        if (isCreatingDependency) {
            e.preventDefault();
            return;
        }

        setDraggedTask(task);
        const rect = e.target.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
});
        e.dataTransfer.effectAllowed = 'move';
    };

    // Handle task drag over timeline
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // Handle task drop
    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        
        if (!draggedTask || !timelineRef.current) return;

        const timelineRect = timelineRef.current.getBoundingClientRect();
        const dropX = e.clientX - timelineRect.left - dragOffset.x;
        const dayIndex = Math.round(dropX / dayWidth);
        const newStartDate = addDays(timelineRange.start, Math.max(0, dayIndex));
        
        // Calculate new end date maintaining duration
        const originalDuration = draggedTask.duration || 1;
        const newEndDate = addDays(newStartDate, originalDuration - 1);

        try {
            const updatedTask = {
                ...draggedTask,
                startDate: newStartDate.toISOString(),
                dueDate: newEndDate.toISOString()
            };

            await onUpdateTask(draggedTask.id, updatedTask);
            
            // Trigger automatic rescheduling of dependent tasks
            await taskService.rescheduleDependent(draggedTask.id, newStartDate, newEndDate);
            
            toast.success('Task dates updated successfully');
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            toast.error('Failed to update task dates');
        }

        setDraggedTask(null);
        setDragOffset({ x: 0, y: 0 });
    }, [draggedTask, dragOffset, dayWidth, timelineRange.start, onUpdateTask, onTaskUpdate]);

    // Handle task click for dependency creation
    const handleTaskClick = useCallback((task, event) => {
        if (isCreatingDependency) {
            if (dependencySource) {
                handleCreateDependency(dependencySource.id, task.id);
                setIsCreatingDependency(false);
                setDependencySource(null);
            } else {
                setDependencySource(task);
                toast.info(`Click another task to create dependency from "${task.title}"`);
            }
        } else {
            onEditTask(task);
        }
    }, [isCreatingDependency, dependencySource, handleCreateDependency, onEditTask]);

    // Generate dependency arrows
    const generateDependencyArrows = useCallback(() => {
        const arrows = [];
        
        timelineTasks.forEach(task => {
            if (task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach(depId => {
                    const sourceTask = timelineTasks.find(t => t.id === depId);
                    if (sourceTask) {
                        const sourceX = (sourceTask.startOffset + sourceTask.duration) * dayWidth;
                        const targetX = task.startOffset * dayWidth;
                        const sourceY = timelineTasks.indexOf(sourceTask) * 60 + 30;
                        const targetY = timelineTasks.indexOf(task) * 60 + 30;
                        
                        const key = `${sourceTask.id}-${task.id}`;
                        arrows.push({
                            key,
                            sourceX: sourceX + 200,
                            sourceY: sourceY + 60,
                            targetX: targetX + 200,
                            targetY: targetY + 60,
                            sourceTask,
                            targetTask: task
                        });
                    }
                });
            }
        });
        
        return arrows;
    }, [timelineTasks, dayWidth]);

    // Generate timeline header dates
    const generateTimelineHeader = () => {
        const dates = [];
        for (let i = 0; i < timelineRange.days; i++) {
            const date = addDays(timelineRange.start, i);
            dates.push(date);
        }
        return dates;
    };

return (
        <div className={`h-full flex flex-col bg-white ${isCreatingDependency ? 'dependency-creating' : ''}`}>
            {/* Timeline Controls */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
                {/* Filters and Sorting */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Text as="span" className="text-sm font-medium text-gray-700">Filters:</Text>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                            <option value="all">All Priorities</option>
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                            <option value="all">All Status</option>
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                        <label className="flex items-center space-x-1 text-xs">
                            <input
                                type="checkbox"
                                checked={filters.showMilestones}
                                onChange={(e) => setFilters(prev => ({ ...prev, showMilestones: e.target.checked }))}
                                className="rounded"
                            />
                            <span>Milestones</span>
                        </label>
                        <label className="flex items-center space-x-1 text-xs">
                            <input
                                type="checkbox"
                                checked={filters.showDeadlines}
                                onChange={(e) => setFilters(prev => ({ ...prev, showDeadlines: e.target.checked }))}
                                className="rounded"
                            />
                            <span>Deadlines</span>
                        </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Text as="span" className="text-sm font-medium text-gray-700">Sort by:</Text>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                            <option value="startDate">Start Date</option>
                            <option value="priority">Priority</option>
                            <option value="title">Title</option>
                        </select>
                        <Button
                            onClick={() => setIsCreatingDependency(!isCreatingDependency)}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                isCreatingDependency
                                    ? 'bg-primary-600 text-white'
                                    : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <ApperIcon name="GitBranch" size={14} className="mr-1" />
                            {isCreatingDependency ? 'Cancel Dependencies' : 'Create Dependencies'}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    {/* Navigation */}
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => navigateTimeline('prev')}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            <ApperIcon name="ChevronLeft" size={16} />
                        </Button>
                        <Text as="span" className="font-medium text-gray-900 min-w-[120px] text-center">
                            {format(currentDate, zoomLevel === 'day' ? 'MMM dd, yyyy' : 'MMM yyyy')}
                        </Text>
                        <Button
                            onClick={() => navigateTimeline('next')}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            <ApperIcon name="ChevronRight" size={16} />
                        </Button>
                        <Button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Today
                        </Button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                        {['day', 'week', 'month'].map((zoom) => (
                            <Button
                                key={zoom}
                                onClick={() => handleZoomChange(zoom)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors capitalize ${
                                    zoomLevel === zoom
                                        ? 'bg-white text-primary-600 shadow-sm font-medium'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {zoom}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline Container */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-max">
                    {/* Timeline Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                        <div className="flex" style={{ paddingLeft: '200px' }}>
                            {generateTimelineHeader().map((date, index) => (
                                <div
                                    key={index}
                                    className="flex-shrink-0 px-2 py-3 text-center border-r border-gray-100 last:border-r-0"
                                    style={{ width: dayWidth }}
                                >
                                    <Text as="div" className="text-xs font-medium text-gray-900">
                                        {format(date, zoomLevel === 'day' ? 'EEE' : 'dd')}
                                    </Text>
                                    <Text as="div" className="text-xs text-gray-500 mt-1">
                                        {format(date, zoomLevel === 'day' ? 'MM/dd' : 'MMM')}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    </div>

{/* Timeline Content */}
                    <div
                        ref={timelineRef}
                        className="relative timeline-grid"
                        style={{ backgroundSize: `${dayWidth}px 100%` }}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {/* Dependency Arrows SVG */}
                        <svg
                            className="absolute inset-0 pointer-events-none"
                            style={{ zIndex: 15 }}
                        >
                            <defs>
                                <marker
                                    id="arrowhead"
                                    markerWidth="10"
                                    markerHeight="7"
                                    refX="9"
                                    refY="3.5"
                                    orient="auto"
                                >
                                    <polygon
                                        points="0 0, 10 3.5, 0 7"
                                        fill="#6366f1"
                                    />
                                </marker>
                            </defs>
                            {generateDependencyArrows().map(arrow => (
                                <g key={arrow.key}>
                                    <path
                                        d={`M ${arrow.sourceX} ${arrow.sourceY} 
                                           Q ${arrow.sourceX + (arrow.targetX - arrow.sourceX) / 2} ${arrow.sourceY}, 
                                             ${arrow.targetX} ${arrow.targetY}`}
                                        className="dependency-arrow"
                                        onClick={() => handleRemoveDependency(arrow.targetTask.id, arrow.sourceTask.id)}
                                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                    />
                                </g>
                            ))}
                        </svg>
                        {/* Task Rows */}
                        <AnimatePresence>
                            {timelineTasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center min-h-[60px] border-b border-gray-50 hover:bg-gray-25"
                                >
                                    {/* Task Label */}
                                    <div className="w-48 flex-shrink-0 px-4 py-2">
                                        <Text as="h4" className="font-medium text-gray-900 text-sm truncate">
                                            {task.title}
                                        </Text>
                                        <Text as="p" className="text-xs text-gray-500 truncate">
                                            {task.priority} priority
                                        </Text>
                                    </div>

                                    {/* Timeline Bar */}
                                    <div className="relative flex-1" style={{ height: '40px' }}>
                                        <div
                                            className={`timeline-task absolute top-1/2 transform -translate-y-1/2 rounded-md border-2 cursor-pointer group ${getPriorityColor(task.priority)} ${
                                                draggedTask?.id === task.id ? 'dragging' : ''
                                            }`}
style={{
                                                left: task.startOffset * dayWidth + 8,
                                                width: Math.max(dayWidth - 16, task.duration * dayWidth - 16),
                                                height: '24px'
                                            }}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task)}
                                            onClick={(e) => handleTaskClick(task, e)}
                                            onMouseEnter={(e) => handleTooltip(task, true, e)}
                                            onMouseLeave={() => handleTooltip(null, false)}
                                        >
                                            <div className="flex items-center justify-between h-full px-2">
                                                <Text as="span" className="text-xs font-medium text-white truncate">
                                                    {task.title}
                                                </Text>
                                                {task.duration > 2 && (
                                                    <Text as="span" className="text-xs text-white opacity-75">
                                                        {task.duration}d
                                                    </Text>
                                                )}
                                            </div>

                                            {/* Resize Handles */}
                                            <div className="timeline-resize-handle absolute left-0 top-0 w-1 h-full bg-white bg-opacity-50 cursor-ew-resize" />
                                            <div className="timeline-resize-handle absolute right-0 top-0 w-1 h-full bg-white bg-opacity-50 cursor-ew-resize" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty State */}
                        {timelineTasks.length === 0 && (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <ApperIcon name="Calendar" size={48} className="mx-auto text-gray-300 mb-4" />
                                    <Text as="h3" className="text-lg font-medium text-gray-900 mb-2">
                                        No tasks in timeline
                                    </Text>
                                    <Text as="p" className="text-gray-500">
                                        Tasks need start dates or due dates to appear in the timeline view.
                                    </Text>
                                </div>
                            </div>
)}
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {tooltip.visible && tooltip.task && (
                <div
                    className="tooltip"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y - 50
                    }}
                >
                    <div className="font-medium mb-1">{tooltip.task.title}</div>
                    <div className="text-xs opacity-90 mb-1">
                        Priority: <span className="capitalize">{tooltip.task.priority}</span>
                    </div>
                    <div className="text-xs opacity-90 mb-1">
                        Status: <span className="capitalize">{tooltip.task.status || 'Not set'}</span>
                    </div>
                    {tooltip.task.assignee && (
                        <div className="text-xs opacity-90 mb-1">
                            Assignee: {tooltip.task.assignee}
                        </div>
                    )}
                    {tooltip.task.description && (
                        <div className="text-xs opacity-90 mb-1">
                            {tooltip.task.description.substring(0, 100)}
                            {tooltip.task.description.length > 100 ? '...' : ''}
                        </div>
                    )}
                    {tooltip.task.dependencies && tooltip.task.dependencies.length > 0 && (
                        <div className="text-xs opacity-90">
                            Dependencies: {tooltip.task.dependencies.length}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TimelineView;