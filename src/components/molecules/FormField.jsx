import React from 'react';
import Input from '@/components/atoms/Input';
import Text from '@/components/atoms/Text';

const FormField = ({ label, id, type = 'text', value, onChange, placeholder, required, autoFocus, children, ...props }) => {
    return (
        <div>
            {label && (
                <Text as="label" htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </Text>
            )}
            <Input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoFocus={autoFocus}
                {...props}
            >
                {children}
            </Input>
        </div>
    );
};

export default FormField;