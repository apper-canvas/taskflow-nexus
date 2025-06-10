import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { projectService, taskService } from '@/services';
import ProjectCard from '@/components/molecules/ProjectCard';
import EmptyState from '@/components/molecules/EmptyState';
import ErrorState from '@/components/molecules/ErrorState';
import LoadingSection from '@/components/organisms/LoadingSection';
import Modal from '@/components/molecules/Modal';
import CreateProjectForm from '@/components/organisms/CreateProjectForm';
import ApperIcon from '@/components/ApperIcon';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
const [showCreateProject, setShowCreateProject] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await projectService.getAll();
            const activeProjects = result.filter(p => !p.archived);

            const projectsWithStats = await Promise.all(
                activeProjects.map(async (project) => {
                    try {
                        const tasks = await taskService.getByProjectId(project.id);
                        const completedTasks = tasks.filter(t => t.status === 'done').length;
                        const totalTasks = tasks.length;
                        return {
                            ...project,
                            taskCount: totalTasks,
                            completedTasks,
                            progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                        };
                    } catch {
                        return { ...project, taskCount: 0, completedTasks: 0, progress: 0 };
                    }
                })
            );

            setProjects(projectsWithStats);
        } catch (err) {
            setError(err.message || 'Failed to load projects');
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

const handleShowCreateProject = async () => {
        try {
            setFormLoading(true);
            setShowCreateProject(true);
            // Reset form state
            setNewProject({ name: '', description: '' });
        } catch (error) {
            console.error('Error displaying form:', error);
            toast.error('Failed to load project form');
        } finally {
            setFormLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProject.name.trim()) {
            toast.error('Project name is required');
            return;
        }

        if (creating) return; // Prevent double submission

        setCreating(true);
        try {
            const project = {
                name: newProject.name.trim(),
                description: newProject.description.trim(),
                columns: [
                    { id: 'todo', name: 'To Do', position: 0, color: '#6B7280' },
                    { id: 'in-progress', name: 'In Progress', position: 1, color: '#3B82F6' },
                    { id: 'done', name: 'Done', position: 2, color: '#10B981' }
                ]
            };
            
            const created = await projectService.create(project);
            if (created) {
                setProjects(prev => [...prev, { ...created, taskCount: 0, completedTasks: 0, progress: 0 }]);
                setNewProject({ name: '', description: '' });
                setShowCreateProject(false);
                toast.success('Project created successfully');
            }
        } catch (error) {
            console.error('Error creating project:', error);
            toast.error(error.message || 'Failed to create project');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return <LoadingSection type="project-list" />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadProjects} />;
    }

if (projects.length === 0) {
        return (
            <EmptyState
                iconName="FolderPlus"
                title="Welcome to TaskFlow Pro"
                message="Get started by creating your first project. Organize tasks, track progress, and meet deadlines efficiently."
                actionButtonText="Create First Project"
                actionButtonIcon="Plus"
                onActionButtonClick={handleShowCreateProject}
                loading={formLoading}
            />
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                    <Text as="h1" className="text-2xl font-heading font-bold text-gray-900">Project Dashboard</Text>
<Text as="p" className="text-gray-600">Manage your projects and track progress</Text>
                </div>
                <Button
                    as={motion.button}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShowCreateProject}
                    disabled={formLoading}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ApperIcon name="Plus" size={16} />
                    <span>{formLoading ? 'Loading...' : 'New Project'}</span>
                </Button>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index} />
                ))}
</div>

            <Modal
                isOpen={showCreateProject}
                onClose={() => setShowCreateProject(false)}
                title="Create New Project"
            >
                <CreateProjectForm
                    newProject={newProject}
                    setNewProject={setNewProject}
                    handleSubmit={handleCreateProject}
                    onClose={() => setShowCreateProject(false)}
                    loading={creating}
                    formLoading={formLoading}
                />
            </Modal>
        </div>
    );
};

export default ProjectList;