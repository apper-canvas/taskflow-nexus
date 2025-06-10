import React from 'react';
import FormField from '@/components/molecules/FormField';
import Button from '@/components/atoms/Button';

const CreateEditTaskForm = ({ task, setTask, handleSubmit, onClose, projectColumns, isEditMode }) => {
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