import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays, parseISO, isValid } from 'date-fns';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';

const TimelineView = ({ tasks, onUpdateTask, onEditTask }) => {
    const [zoomLevel, setZoomLevel] = useState('week'); // day, week, month
    const [currentDate, setCurrentDate] = useState(new Date());
    const [draggedTask, setDraggedTask] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
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
                if (!task.startDate && !task.dueDate) return false;
                const taskStart = task.startDate ? parseISO(task.startDate) : parseISO(task.dueDate);
                const taskEnd = task.dueDate ? parseISO(task.dueDate) : taskStart;
                return isValid(taskStart) && isValid(taskEnd);
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
            .sort((a, b) => a.startOffset - b.startOffset);
    }, [tasks, timelineRange]);

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

    // Handle task drag start
    const handleDragStart = (e, task) => {
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
            toast.success('Task dates updated successfully');
        } catch (error) {
            toast.error('Failed to update task dates');
        }

        setDraggedTask(null);
        setDragOffset({ x: 0, y: 0 });
    }, [draggedTask, dragOffset, dayWidth, timelineRange.start, onUpdateTask]);

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
        <div className="h-full flex flex-col bg-white">
            {/* Timeline Controls */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
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
                                            onClick={() => onEditTask(task)}
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
        </div>
    );
};

export default TimelineView;