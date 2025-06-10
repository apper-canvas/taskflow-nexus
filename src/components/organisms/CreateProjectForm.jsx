import React from 'react';
import FormField from '@/components/molecules/FormField';
import Button from '@/components/atoms/Button';

const CreateProjectForm = ({ newProject, setNewProject, handleSubmit, onClose, loading, formLoading }) => {
    if (formLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="flex space-x-3 pt-4">
                    <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                    <div className="flex-1 h-10 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

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
                disabled={loading}
            />
            <FormField
                label="Description"
                id="projectDescription"
                type="textarea"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional project description"
                disabled={loading}
            />
            <div className="flex space-x-3 pt-4">
                <Button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={loading || !newProject.name?.trim()}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating...' : 'Create Project'}
                </Button>
            </div>
        </form>
    );
};

export default CreateProjectForm;