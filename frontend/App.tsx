import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import AnalysisPage from '@/pages/AnalysisPage';
import BatchAnalysisPage from '@/pages/BatchAnalysisPage';
import LogsPage from '@/pages/LogsPage';
import AlertsPage from '@/pages/AlertsPage';
import BlockedIPsPage from '@/pages/BlockedIPsPage';

export default function App() {
  const { loadUser } = useAuthStore();
  useEffect(() => { loadUser(); }, [loadUser]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'rgba(3,7,18,0.95)', color: '#00ff41', border: '1px solid rgba(255,255,255,0.08)',
          fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', borderRadius: '12px' },
      }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/batch" element={<BatchAnalysisPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/blocked-ips" element={<BlockedIPsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
