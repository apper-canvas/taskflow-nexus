import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '', hoverEffect = false, animate = false, delay = 0, onClick, ...props }) => {
    const baseClasses = "bg-white rounded-xl p-6 shadow-card";
    const hoverClasses = hoverEffect ? "hover:shadow-card-hover transition-all duration-200" : "";
    const clickableClasses = onClick ? "cursor-pointer" : "";

    const Component = animate ? motion.div : 'div';

    const motionProps = animate ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: delay }
    } : {};

    // Filter out props that are not for the underlying DOM element when Component is 'div'
    const filteredProps = { ...props };
    if (Component === 'div') {
        for (const key in filteredProps) {
            if (!['className', 'id', 'style', 'aria-label', 'role'].includes(key) && !key.startsWith('data-')) {
                delete filteredProps[key];
            }
        }
    }


    return (
        <Component
            className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`}
            onClick={onClick}
            {...motionProps}
            {...filteredProps}
        >
            {children}
        </Component>
    );
};

export default Card;