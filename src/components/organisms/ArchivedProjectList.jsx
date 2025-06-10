import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ApperIcon from '@/components/ApperIcon';
import { projectService, taskService } from '@/services';
import Button from '@/components/atoms/Button';
import Text from '@/components/atoms/Text';
import Card from '@/components/molecules/Card';
import EmptyState from '@/components/molecules/EmptyState';
import ErrorState from '@/components/molecules/ErrorState';
import LoadingSection from '@/components/organisms/LoadingSection';

const ArchivedProjectList = () => {
    const [archivedProjects, setArchivedProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadArchivedProjects();
    }, []);

const loadArchivedProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const projects = await projectService.getAll();
            const archived = projects.filter(p => p.archived);

            const projectsWithStats = await Promise.all(
                archived.map(async (project) => {
                    try {
                        const tasks = await taskService.getByProjectId(project.id);
                        const completedTasks = tasks.filter(t => t.status === 'done').length;
                        return {
                            ...project,
                            totalTasks: tasks.length,
                            completedTasks
                        };
                    } catch {
                        return { ...project, totalTasks: 0, completedTasks: 0 };
                    }
                })
            );

            setArchivedProjects(projectsWithStats);
        } catch (err) {
            setError(err.message || 'Failed to load archived projects');
            toast.error('Failed to load archived projects');
        } finally {
            setLoading(false);
        }
    };

const handleRestoreProject = async (projectId) => {
        try {
            await projectService.update(projectId, { archived: false });
            setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
            toast.success('Project restored successfully');
        } catch (error) {
            toast.error('Failed to restore project');
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
            return;
}

        try {
            const tasks = await taskService.getByProjectId(projectId);
            await Promise.all(tasks.map(task => taskService.delete(task.id)));

            await projectService.delete(projectId);
            setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
            toast.success('Project deleted permanently');
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    if (loading) {
        return <LoadingSection type="archive-list" />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadArchivedProjects} />;
    }

    if (archivedProjects.length === 0) {
        return (
            <EmptyState
                iconName="Archive"
                title="No Archived Projects"
                message="Completed projects will appear here. Archive projects to keep your dashboard organized while preserving project history."
            />
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                    <Text as="h1" className="text-2xl font-heading font-bold text-gray-900">Archived Projects</Text>
                    <Text as="p" className="text-gray-600">View and manage your completed projects</Text>
                </div>
                <Text as="div" className="text-sm text-gray-500">
                    {archivedProjects.length} archived project{archivedProjects.length !== 1 ? 's' : ''}
                </Text>
            </div>

            {/* Archived Projects List */}
            <div className="space-y-4">
                {archivedProjects.map((project, index) => (
                    <Card
                        key={project.id}
                        animate={true}
                        delay={index * 0.1}
                        className="hover:shadow-card-hover"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <Text as="h3" className="font-heading font-semibold text-gray-900 truncate">
                                        {project.name}
                                    </Text>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                        <ApperIcon name="Archive" size={12} className="mr-1" />
                                        Archived
                                    </span>
                                </div>

                                {project.description && (
                                    <Text as="p" className="text-gray-600 break-words mb-3">{project.description}</Text>
                                )}

                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center space-x-1">
                                        <ApperIcon name="CheckSquare" size={14} />
                                        <Text as="span">{project.completedTasks}/{project.totalTasks} tasks completed</Text>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <ApperIcon name="Calendar" size={14} />
                                        <Text as="span">Created {format(new Date(project.createdAt), 'MMM dd, yyyy')}</Text>
                                    </div>
                                    {project.totalTasks > 0 && (
                                        <div className="flex items-center space-x-1">
                                            <ApperIcon name="TrendingUp" size={14} />
                                            <Text as="span">{Math.round((project.completedTasks / project.totalTasks) * 100)}% complete</Text>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <Button
                                    as={motion.button}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleRestoreProject(project.id)}
                                    className="inline-flex items-center space-x-2 px-3 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors text-sm"
                                >
                                    <ApperIcon name="RotateCcw" size={14} />
                                    <Text as="span">Restore</Text>
                                </Button>

                                <Button
                                    as={motion.button}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteProject(project.id)}
                                    className="inline-flex items-center space-x-2 px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm"
                                >
                                    <ApperIcon name="Trash2" size={14} />
                                    <Text as="span">Delete</Text>
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ArchivedProjectList;