import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import ApperIcon from '../components/ApperIcon';

const Settings = () => {
  const [settings, setSettings] = useState({
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
    // In a real app, this would save to a backend
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

  return (
    <div className="p-6 space-y-6 max-w-4xl max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Customize your TaskFlow Pro experience</p>
        </div>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleResetSettings}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset to Defaults
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Save Changes
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <ApperIcon name="Bell" size={20} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">Manage your notification preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </label>
                  <p className="text-xs text-gray-500">
                    {key === 'taskReminders' && 'Get notified about upcoming task deadlines'}
                    {key === 'projectUpdates' && 'Receive updates when projects are modified'}
                    {key === 'deadlineAlerts' && 'Alert when tasks are overdue'}
                    {key === 'emailDigest' && 'Weekly email summary of your progress'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
              <ApperIcon name="Settings" size={20} className="text-accent-600" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-gray-900">Preferences</h3>
              <p className="text-sm text-gray-600">Customize your interface and display</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                value={settings.preferences.theme}
                onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={settings.preferences.language}
                onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={settings.preferences.dateFormat}
                onChange={(e) => handleSettingChange('preferences', 'dateFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
              <select
                value={settings.preferences.timeFormat}
                onChange={(e) => handleSettingChange('preferences', 'timeFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="12h">12 Hour</option>
                <option value="24h">24 Hour</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Defaults */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ApperIcon name="Sliders" size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-gray-900">Default Settings</h3>
              <p className="text-sm text-gray-600">Set defaults for new projects and tasks</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Task Priority
              </label>
              <select
                value={settings.defaults.newTaskPriority}
                onChange={(e) => handleSettingChange('defaults', 'newTaskPriority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-archive completed projects</label>
                <p className="text-xs text-gray-500">
                  Automatically move projects to archive when all tasks are completed
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.defaults.autoArchive}
                  onChange={(e) => handleSettingChange('defaults', 'autoArchive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ApperIcon name="Database" size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-gray-900">Data Management</h3>
              <p className="text-sm text-gray-600">Manage your data and privacy</p>
            </div>
          </div>

          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div>
                <div className="text-sm font-medium text-gray-900">Export Data</div>
                <div className="text-xs text-gray-500">Download all your projects and tasks</div>
              </div>
              <ApperIcon name="Download" size={16} className="text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div>
                <div className="text-sm font-medium text-gray-900">Import Data</div>
                <div className="text-xs text-gray-500">Import projects from other tools</div>
              </div>
              <ApperIcon name="Upload" size={16} className="text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-left">
              <div>
                <div className="text-sm font-medium text-red-700">Clear All Data</div>
                <div className="text-xs text-red-500">Permanently delete all projects and tasks</div>
              </div>
              <ApperIcon name="Trash2" size={16} className="text-red-500" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;