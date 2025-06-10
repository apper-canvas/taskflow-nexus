import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ApperIcon from './components/ApperIcon';
import { routeArray } from './config/routes';
import { projectService } from './services';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const result = await projectService.getAll();
        setProjects(result.filter(p => !p.archived));
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };
    loadProjects();
  }, []);

  const handleProjectSelect = (projectId) => {
    navigate(`/project/${projectId}`);
    setIsMobileMenuOpen(false);
  };

  const currentProject = location.pathname.startsWith('/project/') 
    ? projects.find(p => p.id === location.pathname.split('/')[2])
    : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-16 bg-white border-b border-gray-200 z-40 px-4 lg:px-6">
        <div className="flex items-center justify-between h-full max-w-full">
          <div className="flex items-center space-x-4 min-w-0">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ApperIcon name="Menu" size={20} />
            </button>
            
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <ApperIcon name="Zap" size={16} className="text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-gray-900 hidden sm:block">
                TaskFlow Pro
              </span>
            </div>

            {/* Current Project Indicator */}
            {currentProject && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{currentProject.name}</span>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <ApperIcon 
                name="Search" 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ApperIcon name="Bell" size={20} className="text-gray-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ApperIcon name="User" size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-gray-50 border-r border-gray-200 flex-col z-40">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Navigation */}
            <nav className="space-y-1">
              {routeArray.map((route) => (
                <NavLink
                  key={route.id}
                  to={route.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <ApperIcon name={route.icon} size={16} />
                  <span>{route.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Projects List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Projects</h3>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                >
                  <ApperIcon name="Plus" size={14} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-1">
                {projects.slice(0, 6).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      currentProject?.id === project.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-2 h-2 bg-accent-500 rounded-full flex-shrink-0"></div>
                    <span className="truncate">{project.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-50 overflow-y-auto"
              >
                <div className="p-4 space-y-6">
                  {/* Mobile Navigation */}
                  <nav className="space-y-1">
                    {routeArray.map((route) => (
                      <NavLink
                        key={route.id}
                        to={route.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`
                        }
                      >
                        <ApperIcon name={route.icon} size={16} />
                        <span>{route.label}</span>
                      </NavLink>
                    ))}
                  </nav>

                  {/* Mobile Projects */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Projects</h3>
                    <div className="space-y-1">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project.id)}
                          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors text-left"
                        >
                          <div className="w-2 h-2 bg-accent-500 rounded-full flex-shrink-0"></div>
                          <span className="truncate">{project.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;