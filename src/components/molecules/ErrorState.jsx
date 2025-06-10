import React from 'react';
import ApperIcon from '@/components/ApperIcon';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';

const ErrorState = ({ title = 'Something went wrong', message = 'An unexpected error occurred.', onRetry, retryButtonText = 'Try Again', className = '', additionalButtons = [] }) => {
    return (
        <div className={`p-6 flex items-center justify-center min-h-[400px] ${className}`}>
            <div className="text-center">
                <ApperIcon name="AlertCircle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <Text as="h3" className="text-lg font-semibold text-gray-900 mb-2">{title}</Text>
                <Text as="p" className="text-gray-600 mb-4">{message}</Text>
                <div className="space-x-4">
                    {onRetry && (
                        <Button
                            onClick={onRetry}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            {retryButtonText}
                        </Button>
                    )}
                    {additionalButtons.map((btn, index) => (
                        <Button
                            key={index}
                            onClick={btn.onClick}
                            className={btn.className || "px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"}
                        >
                            {btn.text}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ErrorState;