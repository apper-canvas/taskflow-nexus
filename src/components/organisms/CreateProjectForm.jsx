import React from 'react';
import FormField from '@/components/molecules/FormField';
import Button from '@/components/atoms/Button';

const CreateProjectForm = ({ newProject, setNewProject, handleSubmit, onClose }) => {
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
                label="Project Name"
                id="projectName"
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                autoFocus
                required
            />
            <FormField
                label="Description"
                id="projectDescription"
                type="textarea"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional project description"
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
                    Create Project
                </Button>
            </div>
        </form>
    );
};

export default CreateProjectForm;