import React from 'react';

const Text = ({ as: Component = 'p', children, className = '', ...props }) => {
    const filteredProps = { ...props };
    // Basic filtering for common HTML attributes
    for (const key in filteredProps) {
        if (!['className', 'id', 'style', 'aria-label', 'role', 'htmlFor'].includes(key) && !key.startsWith('data-')) {
            delete filteredProps[key];
        }
    }
    return (
        <Component className={className} {...filteredProps}>
            {children}
        </Component>
    );
};

export default Text;