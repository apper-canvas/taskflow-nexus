import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, className = '', type = 'button', as: Component = 'button', ...props }) => {
    // Filter out non-standard HTML attributes if Component is a native HTML element
    const filteredProps = { ...props };
    if (Component === 'button' || Component === 'a') { // Extend for anchor tags if needed
        for (const key in filteredProps) {
            // Basic whitelist for common HTML attributes and data attributes
            if (!['className', 'id', 'style', 'aria-label', 'disabled', 'tabIndex', 'href', 'rel', 'target'].includes(key) && !key.startsWith('data-')) {
                delete filteredProps[key];
            }
        }
    }

    return (
        <Component
            type={type}
            onClick={onClick}
            className={className}
            {...filteredProps}
        >
            {children}
        </Component>
    );
};

export default Button;