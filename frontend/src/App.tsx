import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DispatchBoardPage from './pages/DispatchBoardPage';
import DriversPage from './pages/DriversPage';
import JobsPage from './pages/JobsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dispatch" replace />} />
        <Route path="dispatch" element={<DispatchBoardPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="jobs" element={<JobsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
