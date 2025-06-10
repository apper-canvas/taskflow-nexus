import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Layout from './Layout';
import HomePage from '@/components/pages/HomePage';
import DashboardPage from '@/components/pages/DashboardPage';
import ProjectBoardPage from '@/components/pages/ProjectBoardPage';
import TaskManagementPage from '@/components/pages/TaskManagementPage';
import ArchivePage from '@/components/pages/ArchivePage';
import SettingsPage from '@/components/pages/SettingsPage';
import NotFoundPage from '@/components/pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col overflow-hidden bg-white">
        <Routes>
<Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="project/:id" element={<ProjectBoardPage />} />
            <Route path="tasks" element={<TaskManagementPage />} />
            <Route path="archive" element={<ArchivePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName="shadow-card"
          className="z-[9999]"
        />
      </div>
    </BrowserRouter>
  );
}

export default App;