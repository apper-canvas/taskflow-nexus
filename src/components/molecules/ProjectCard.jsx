import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '@/components/molecules/Card';
import Text from '@/components/atoms/Text';
import ApperIcon from '@/components/ApperIcon';

const ProjectCard = ({ project, index }) => {
    const navigate = useNavigate();

    return (
        <Card
            animate={true}
            delay={index * 0.1}
            hoverEffect={true}
            onClick={() => navigate(`/project/${project.id}`)}
            className="group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1">
                    <Text as="h3" className="font-heading font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                        {project.name}
                    </Text>
                    {project.description && (
                        <Text as="p" className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                            {project.description}
                        </Text>
                    )}
                </div>
                <div className="flex-shrink-0 ml-3">
                    <div className="w-3 h-3 bg-accent-500 rounded-full"></div>
                </div>
            </div>

            {/* Progress Ring */}
            <div className="relative mb-4">
                <div className="flex items-center justify-center">
                    <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="2"
                            />
                            <motion.path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#5B21B6"
                                strokeWidth="2"
                                strokeDasharray={`${project.progress}, 100`}
                                initial={{ strokeDasharray: "0, 100" }}
                                animate={{ strokeDasharray: `${project.progress}, 100` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Text as="span" className="text-lg font-heading font-bold text-gray-900">
                                {project.progress}%
                            </Text>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-gray-600">
                        <ApperIcon name="CheckSquare" size={14} />
                        <Text as="span">{project.completedTasks}/{project.taskCount} tasks</Text>
                    </div>
                </div>
                <div className="flex items-center space-x-1 text-gray-400 group-hover:text-primary-500 transition-colors">
                    <ApperIcon name="ArrowRight" size={14} />
                </div>
            </div>
        </Card>
    );
};

export default ProjectCard;