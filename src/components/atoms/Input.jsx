import React from 'react';

const Input = ({ type = 'text', value, onChange, className = '', placeholder, autoFocus, rows = 3, children, ...props }) => {
    const defaultClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

    const commonProps = {
        value,
        onChange,
        className: `${defaultClasses} ${className}`,
        placeholder,
        autoFocus, // Applies to input and textarea
        ...props,
    };

    // Filter out non-standard HTML attributes for native elements
    const filteredProps = { ...commonProps };
    const allowedInputProps = ['type', 'value', 'onChange', 'className', 'placeholder', 'autoFocus', 'readOnly', 'disabled', 'required', 'min', 'max', 'step', 'pattern', 'list', 'name', 'id', 'aria-label'];
    const allowedTextareaProps = ['value', 'onChange', 'className', 'placeholder', 'autoFocus', 'readOnly', 'disabled', 'required', 'rows', 'cols', 'name', 'id', 'aria-label'];
    const allowedSelectProps = ['value', 'onChange', 'className', 'autoFocus', 'readOnly', 'disabled', 'required', 'multiple', 'name', 'id', 'aria-label'];


    for (const key in filteredProps) {
        if (!key.startsWith('data-')) { // Allow data- attributes
            if (type === 'textarea' && !allowedTextareaProps.includes(key)) delete filteredProps[key];
            if (type === 'select' && !allowedSelectProps.includes(key)) delete filteredProps[key];
            if (type !== 'textarea' && type !== 'select' && !allowedInputProps.includes(key)) delete filteredProps[key];
        }
    }

    if (type === 'textarea') {
        return <textarea rows={rows} {...filteredProps} />;
    } else if (type === 'select') {
        return <select {...filteredProps}>{children}</select>;
    } else {
        return <input type={type} {...filteredProps} />;
    }
};

export default Input;