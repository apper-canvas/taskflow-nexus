import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/molecules/EmptyState';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <EmptyState
            iconName="SearchX"
            title="Page Not Found"
            message="The page you're looking for doesn't exist or has been moved."
            actionButtonText="Go to Dashboard"
            actionButtonIcon={null} // No icon needed for this specific button
            onActionButtonClick={() => navigate('/dashboard')}
            additionalButtons={[
                {
                    text: 'Go Back',
                    onClick: () => navigate(-1),
                    className: "px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                }
            ]}
        />
    );
};

export default NotFoundPage;