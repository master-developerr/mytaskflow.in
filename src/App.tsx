import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AgencyProvider } from './context/AgencyContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProfileMode } from './pages/ProfileMode';
// We'll use the existing Dashboard from template or migrate it later. For now, let's assume it exists or use a placeholder.
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectOverview } from './pages/ProjectOverview';
import { KanbanBoard } from './pages/KanbanBoard';
import { TaskDetailsPanel } from './pages/TaskDetailsPanel';
import { AgencySettings } from './pages/AgencySettings';
import { Calendar } from './pages/Calendar';
import { Milestones } from './pages/Milestones';

import { OnboardingModal } from './components/OnboardingModal';
import { AvatarSync } from './components/AvatarSync';

function App() {
  return (
    <AuthProvider>
      <AgencyProvider>
        <AvatarSync />
        <OnboardingModal />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/profile-mode" element={<ProtectedRoute><ProfileMode /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/project-overview" element={<ProtectedRoute><ProjectOverview /></ProtectedRoute>} />
            <Route path="/kanban/:id" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
            <Route path="/kanban" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
            <Route path="/task-details" element={<ProtectedRoute><TaskDetailsPanel /></ProtectedRoute>} />
            <Route path="/agency-settings" element={<ProtectedRoute><AgencySettings /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/milestones" element={<ProtectedRoute><Milestones /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AgencyProvider>
    </AuthProvider>
  );
}

export default App;
