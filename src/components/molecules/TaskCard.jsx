import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import ApperIcon from '@/components/ApperIcon';
import Text from '@/components/atoms/Text';

const TaskCard = ({ 
    task, 
    index, 
    getPriorityColor, 
    onEdit, 
    onDelete, 
    onDragStart, 
    isDragged, 
    dragRef,
    showTooltip = false,
    onTooltipToggle
}) => {
    return (
        <motion.div
            key={task.id}
            ref={dragRef} // Pass ref from parent for drag image
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: index * 0.05 }}
draggable
            onDragStart={onDragStart}
            onClick={onEdit}
            onMouseEnter={onTooltipToggle ? () => onTooltipToggle(task, true) : undefined}
            onMouseLeave={onTooltipToggle ? () => onTooltipToggle(null, false) : undefined}
            className={`bg-white rounded-lg p-4 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-move group relative ${
                isDragged ? 'opacity-50' : ''
            } ${task.type === 'milestone' ? 'milestone-marker' : ''} ${task.isDeadline ? 'deadline-marker' : ''}`}
            data-task-id={task.id}
        >
            <div className="flex items-start justify-between mb-3">
                <Text as="h4" className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors break-words flex-1 mr-2">
                    {task.title}
                </Text>
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card onClick from firing
                            onDelete(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all"
                    >
                        <ApperIcon name="Trash2" size={12} className="text-gray-400 hover:text-red-500" />
                    </button>
                </div>
            </div>

            {task.description && (
                <Text as="p" className="text-sm text-gray-600 mb-3 break-words line-clamp-2">
                    {task.description}
                </Text>
            )}

<div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                    <Text as="span" className="capitalize">{task.priority} priority</Text>
                    {task.type === 'milestone' && (
                        <div className="flex items-center space-x-1">
                            <ApperIcon name="Flag" size={12} className="text-accent-500" />
                            <Text as="span" className="text-accent-600 font-medium">Milestone</Text>
                        </div>
                    )}
                    {task.dependencies && task.dependencies.length > 0 && (
                        <div className="flex items-center space-x-1">
                            <ApperIcon name="GitBranch" size={12} className="text-primary-500" />
                            <Text as="span" className="text-primary-600">{task.dependencies.length}</Text>
                        </div>
                    )}
                </div>
                {task.dueDate && (
                    <div className="flex items-center space-x-1">
                        <ApperIcon name="Calendar" size={12} />
                        <Text as="span">{format(new Date(task.dueDate), 'MMM dd')}</Text>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TaskCard;