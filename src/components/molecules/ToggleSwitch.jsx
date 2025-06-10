import React from 'react';
import Text from '@/components/atoms/Text';

const ToggleSwitch = ({ checked, onChange, label, description, id }) => {
    return (
        <div className="flex items-center justify-between">
            <div>
                <Text as="label" htmlFor={id} className="text-sm font-medium text-gray-700 capitalize">
                    {label}
                </Text>
                {description && <Text as="p" className="text-xs text-gray-500">{description}</Text>}
            </div>
            <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
        </div>
    );
};

export default ToggleSwitch;