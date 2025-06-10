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
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    label="Priority"
                    id="taskPriority"
                    type="select"
                    value={task.priority}
                    onChange={(e) => setTask(prev => ({ ...prev, priority: e.target.value }))}
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </FormField>
                <FormField
                    label="Status"
                    id="taskStatus"
                    type="select"
                    value={task.status}
                    onChange={(e) => setTask(prev => ({ ...prev, status: e.target.value }))}
                >
                    {projectColumns.map(column => (
                        <option key={column.id} value={column.id}>
                            {column.name}
                        </option>
                    ))}
                </FormField>
            </div>
            <FormField
                label="Due Date"
                id="taskDueDate"
                type="date"
                value={task.dueDate}
                onChange={(e) => setTask(prev => ({ ...prev, dueDate: e.target.value }))}
            />
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
                    {isEditMode ? 'Update Task' : 'Create Task'}
                </Button>
            </div>
        </form>
    );
};

export default CreateEditTaskForm;