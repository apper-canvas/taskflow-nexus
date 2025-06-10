import React from 'react';
import { motion } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';

const EmptyState = ({
    iconName,
    title,
    message,
    actionButtonText,
    actionButtonIcon,
    onActionButtonClick,
    additionalButtons = [],
    className = ''
}) => {
    return (
        <div className={`p-6 flex items-center justify-center min-h-[500px] ${className}`}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center max-w-md"
            >
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="mb-6"
                >
                    <ApperIcon name={iconName} className="w-16 h-16 text-gray-300 mx-auto" />
                </motion.div>
                <Text as="h3" className="text-xl font-heading font-semibold text-gray-900 mb-2">
                    {title}
                </Text>
                <Text as="p" className="text-gray-600 mb-6">
                    {message}
                </Text>
                <div className="space-x-4">
                    {actionButtonText && onActionButtonClick && (
                        <Button
                            as={motion.button}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onActionButtonClick}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        >
                            {actionButtonIcon && <ApperIcon name={actionButtonIcon} size={20} />}
                            <span>{actionButtonText}</span>
                        </Button>
                    )}
                    {additionalButtons.map((btn, index) => (
                        <Button
                            key={index}
                            as={motion.button}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={btn.onClick}
                            className={btn.className || "px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"}
                        >
                            {btn.icon && <ApperIcon name={btn.icon} size={20} className="mr-2" />}
                            <span>{btn.text}</span>
                        </Button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default EmptyState;