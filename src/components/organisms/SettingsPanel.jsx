import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';
import Card from '@/components/molecules/Card';
import FormField from '@/components/molecules/FormField';
import ToggleSwitch from '@/components/molecules/ToggleSwitch';

const SettingsPanel = () => {
    const [settings, setSettings] = useState(() => {
        try {
            const savedSettings = localStorage.getItem('taskflow-settings');
            return savedSettings ? JSON.parse(savedSettings) : {
                notifications: {
                    taskReminders: true,
                    projectUpdates: true,
                    deadlineAlerts: true,
                    emailDigest: false
                },
                preferences: {
                    theme: 'light',
                    language: 'en',
                    dateFormat: 'MM/dd/yyyy',
                    timeFormat: '12h'
                },
                defaults: {
                    newTaskPriority: 'medium',
                    defaultColumns: ['todo', 'in-progress', 'done'], // Not used in UI, keep for consistency
                    autoArchive: false
                }
            };
        } catch (error) {
            console.error("Failed to parse settings from localStorage", error);
            // Return default settings on error
            return {
                notifications: {
                    taskReminders: true,
                    projectUpdates: true,
                    deadlineAlerts: true,
                    emailDigest: false
                },
                preferences: {
                    theme: 'light',
                    language: 'en',
                    dateFormat: 'MM/dd/yyyy',
                    timeFormat: '12h'
                },
                defaults: {
                    newTaskPriority: 'medium',
                    defaultColumns: ['todo', 'in-progress', 'done'],
                    autoArchive: false
                }
            };
        }
    });

    const handleSettingChange = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
    };

    const handleSaveSettings = () => {
        localStorage.setItem('taskflow-settings', JSON.stringify(settings));
        toast.success('Settings saved successfully');
    };

    const handleResetSettings = () => {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) {
            return;
        }

        setSettings({
            notifications: {
                taskReminders: true,
                projectUpdates: true,
                deadlineAlerts: true,
                emailDigest: false
            },
            preferences: {
                theme: 'light',
                language: 'en',
                dateFormat: 'MM/dd/yyyy',
                timeFormat: '12h'
            },
            defaults: {
                newTaskPriority: 'medium',
                defaultColumns: ['todo', 'in-progress', 'done'],
                autoArchive: false
            }
        });
        toast.success('Settings reset to defaults');
    };

    // Helper to format setting keys for display
    const formatSettingKey = (key) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl max-w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                    <Text as="h1" className="text-2xl font-heading font-bold text-gray-900">Settings</Text>
                    <Text as="p" className="text-gray-600">Customize your TaskFlow Pro experience</Text>
                </div>
                <div className="flex space-x-3">
                    <Button
                        as={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleResetSettings}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Reset to Defaults
                    </Button>
                    <Button
                        as={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveSettings}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notifications */}
                <Card animate={true} delay={0.1}>
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <ApperIcon name="Bell" size={20} className="text-primary-600" />
                        </div>
                        <div>
                            <Text as="h3" className="font-heading font-semibold text-gray-900">Notifications</Text>
                            <Text as="p" className="text-sm text-gray-600">Manage your notification preferences</Text>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(settings.notifications).map(([key, value]) => (
                            <ToggleSwitch
                                key={key}
                                id={`notification-${key}`}
                                label={formatSettingKey(key)}
                                description={
                                    key === 'taskReminders' ? 'Get notified about upcoming task deadlines' :
                                    key === 'projectUpdates' ? 'Receive updates when projects are modified' :
                                    key === 'deadlineAlerts' ? 'Alert when tasks are overdue' :
                                    key === 'emailDigest' ? 'Weekly email summary of your progress' : ''
                                }
                                checked={value}
                                onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                            />
                        ))}
                    </div>
                </Card>

                {/* Preferences */}
                <Card animate={true} delay={0.2}>
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                            <ApperIcon name="Settings" size={20} className="text-accent-600" />
                        </div>
                        <div>
                            <Text as="h3" className="font-heading font-semibold text-gray-900">Preferences</Text>
                            <Text as="p" className="text-sm text-gray-600">Customize your interface and display</Text>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <FormField
                            label="Theme"
                            id="themeSelect"
                            type="select"
                            value={settings.preferences.theme}
                            onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="auto">Auto (System)</option>
                        </FormField>
                        <FormField
                            label="Language"
                            id="languageSelect"
                            type="select"
                            value={settings.preferences.language}
                            onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                        >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                        </FormField>
                        <FormField
                            label="Date Format"
                            id="dateFormatSelect"
                            type="select"
                            value={settings.preferences.dateFormat}
                            onChange={(e) => handleSettingChange('preferences', 'dateFormat', e.target.value)}
                        >
                            <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                            <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                            <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                        </FormField>
                        <FormField
                            label="Time Format"
                            id="timeFormatSelect"
                            type="select"
                            value={settings.preferences.timeFormat}
                            onChange={(e) => handleSettingChange('preferences', 'timeFormat', e.target.value)}
                        >
                            <option value="12h">12 Hour</option>
                            <option value="24h">24 Hour</option>
                        </FormField>
                    </div>
                </Card>

                {/* Defaults */}
                <Card animate={true} delay={0.3}>
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <ApperIcon name="Sliders" size={20} className="text-green-600" />
                        </div>
                        <div>
                            <Text as="h3" className="font-heading font-semibold text-gray-900">Default Settings</Text>
                            <Text as="p" className="text-sm text-gray-600">Set defaults for new projects and tasks</Text>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <FormField
                            label="Default Task Priority"
                            id="defaultPrioritySelect"
                            type="select"
                            value={settings.defaults.newTaskPriority}
                            onChange={(e) => handleSettingChange('defaults', 'newTaskPriority', e.target.value)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </FormField>
                        <ToggleSwitch
                            id="autoArchiveToggle"
                            label="Auto-archive completed projects"
                            description="Automatically move projects to archive when all tasks are completed"
                            checked={settings.defaults.autoArchive}
                            onChange={(e) => handleSettingChange('defaults', 'autoArchive', e.target.checked)}
                        />
                    </div>
                </Card>

                {/* Data Management */}
                <Card animate={true} delay={0.4}>
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <ApperIcon name="Database" size={20} className="text-red-600" />
                        </div>
                        <div>
                            <Text as="h3" className="font-heading font-semibold text-gray-900">Data Management</Text>
                            <Text as="p" className="text-sm text-gray-600">Manage your data and privacy</Text>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Button className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                            <div>
                                <Text as="div" className="text-sm font-medium text-gray-900">Export Data</Text>
                                <Text as="div" className="text-xs text-gray-500">Download all your projects and tasks</Text>
                            </div>
                            <ApperIcon name="Download" size={16} className="text-gray-400" />
                        </Button>
                        <Button className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                            <div>
                                <Text as="div" className="text-sm font-medium text-gray-900">Import Data</Text>
                                <Text as="div" className="text-xs text-gray-500">Import projects from other tools</Text>
                            </div>
                            <ApperIcon name="Upload" size={16} className="text-gray-400" />
                        </Button>
                        <Button className="w-full flex items-center justify-between p-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-left">
                            <div>
                                <Text as="div" className="text-sm font-medium text-red-700">Clear All Data</Text>
                                <Text as="div" className="text-xs text-red-500">Permanently delete all projects and tasks</Text>
                            </div>
                            <ApperIcon name="Trash2" size={16} className="text-red-500" />
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsPanel;