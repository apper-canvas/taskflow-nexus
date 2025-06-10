import React from 'react';
import FormField from '@/components/molecules/FormField';
import Button from '@/components/atoms/Button';
import Select from 'react-select';
import { useDropzone } from 'react-dropzone';
import ApperIcon from '@/components/ApperIcon';

const CreateEditTaskForm = ({ 
    task, 
    setTask, 
    handleSubmit, 
    onClose, 
    projectColumns, 
    users = [], 
    isEditMode = false, 
    showAdvancedFeatures = false 
}) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            const newAttachments = acceptedFiles.map(file => ({
                id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file)
            }));
            setTask(prev => ({
                ...prev,
                attachments: [...(prev.attachments || []), ...newAttachments]
            }));
        },
        multiple: true
    });

    const userOptions = users.map(user => ({
        value: user.id,
        label: user.name,
        avatar: user.avatar
    }));

    const removeAttachment = (attachmentId) => {
        setTask(prev => ({
            ...prev,
            attachments: prev.attachments?.filter(a => a.id !== attachmentId) || []
        }));
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
                label="Task Title"
                id="taskTitle"
                type="text"
                value={task.title}
                onChange={(e) => setTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                autoFocus
                required
            />
            <FormField
                label="Description"
                id="taskDescription"
                type="textarea"
                value={task.description}
                onChange={(e) => setTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional task description"
            />
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    label="Start Date"
                    type="date"
                    value={task.startDate}
                    onChange={(e) => setTask(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full"
                />

                <FormField
                    label="Due Date"
                    type="date"
                    value={task.dueDate}
                    onChange={(e) => setTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full"
                />
            </div>

            <FormField
                label="Status"
                type="select"
                value={task.status}
                onChange={(e) => setTask(prev => ({ ...prev, status: e.target.value }))}
                className="w-full"
            >
                {projectColumns.map(column => (
                    <option key={column.id} value={column.id}>
                        {column.name}
                    </option>
                ))}
            </FormField>

            <FormField
                label="Priority"
                type="select"
                value={task.priority}
                onChange={(e) => setTask(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full"
            >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
</FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    label="Task Type"
                    type="select"
                    value={task.type || 'task'}
                    onChange={(e) => setTask(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full"
                >
                    <option value="task">Regular Task</option>
                    <option value="milestone">Milestone</option>
                </FormField>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Options</label>
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={task.isDeadline || false}
                            onChange={(e) => setTask(prev => ({ ...prev, isDeadline: e.target.checked }))}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Mark as deadline</span>
                    </label>
                </div>
</div>

            {/* Assignee Selection */}
            {showAdvancedFeatures && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign To
                        </label>
                        <Select
                            value={task.assignedTo ? userOptions.find(u => u.value === task.assignedTo.id) : null}
                            onChange={(selectedOption) => {
                                const user = users.find(u => u.id === selectedOption?.value);
                                setTask(prev => ({ ...prev, assignedTo: user || null }));
                            }}
                            options={userOptions}
                            isClearable
                            placeholder="Select assignee..."
                            formatOptionLabel={(option) => (
                                <div className="flex items-center space-x-2">
                                    <img 
                                        src={option.avatar || '/default-avatar.png'} 
                                        alt={option.label}
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <span>{option.label}</span>
                                </div>
                            )}
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* Recurring Task Options */}
                    <div>
                        <label className="flex items-center space-x-2 mb-3">
                            <input
                                type="checkbox"
                                checked={task.isRecurring || false}
                                onChange={(e) => setTask(prev => ({ ...prev, isRecurring: e.target.checked }))}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Recurring Task</span>
                        </label>

                        {task.isRecurring && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <FormField
                                    label="Repeat"
                                    type="select"
                                    value={task.recurringType || 'daily'}
                                    onChange={(e) => setTask(prev => ({ ...prev, recurringType: e.target.value }))}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </FormField>
                                
                                <FormField
                                    label="Every"
                                    type="number"
                                    min="1"
                                    value={task.recurringInterval || 1}
                                    onChange={(e) => setTask(prev => ({ ...prev, recurringInterval: parseInt(e.target.value) }))}
                                />
                            </div>
                        )}
                    </div>

                    {/* File Attachments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Attachments
                        </label>
                        <div {...getRootProps()} className="task-attachment-preview cursor-pointer">
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center space-y-2">
                                <ApperIcon name="Upload" size={24} className="text-gray-400" />
                                <p className="text-sm text-gray-600">
                                    {isDragActive 
                                        ? 'Drop files here...' 
                                        : 'Drag & drop files here, or click to select'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Attachment List */}
                        {task.attachments && task.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {task.attachments.map(attachment => (
                                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div className="flex items-center space-x-2">
                                            <ApperIcon name="File" size={16} className="text-gray-500" />
                                            <span className="text-sm text-gray-700">{attachment.name}</span>
                                            <span className="text-xs text-gray-500">
                                                ({Math.round(attachment.size / 1024)}KB)
                                            </span>
                                        </div>
                                        <Button
                                            onClick={() => removeAttachment(attachment.id)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                        >
                                            <ApperIcon name="X" size={14} className="text-gray-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {task.type === 'milestone' && (
                <div className="p-3 bg-accent-50 border border-accent-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-accent-600">🏁</span>
                        <span className="text-sm font-medium text-accent-800">Milestone</span>
                    </div>
                    <p className="text-xs text-accent-700">
                        Milestones represent significant project achievements or deadlines. They appear as diamond shapes on the timeline.
                    </p>
                </div>
            )}

            {task.isDeadline && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-red-600">⚠️</span>
                        <span className="text-sm font-medium text-red-800">Deadline Alert</span>
                    </div>
                    <p className="text-xs text-red-700">
                        This task is marked as a deadline and will have special visual indicators to highlight its importance.
                    </p>
                </div>
            )}
            <div className="flex space-x-3 pt-4">
                <Button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    {isEditMode ? `Update ${task.type === 'milestone' ? 'Milestone' : 'Task'}` : `Create ${task.type === 'milestone' ? 'Milestone' : 'Task'}`}
                </Button>
            </div>
        </form>
    );
};

export default CreateEditTaskForm;