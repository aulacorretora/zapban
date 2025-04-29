import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './stores/userStore';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import HumanizedAgent from './pages/HumanizedAgent';
import ChatPage from './pages/ChatPage';
import { supabase } from './lib/supabase';

function App() {
  const { fetchUser, user, loading } = useUserStore();

  useEffect(() => {
    fetchUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUser();
      } else {
        useUserStore.getState().clearUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-whatsapp"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
        
        {/* Protected routes with MainLayout */}
        <Route element={!user ? <Navigate to="/login" replace /> : <MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          {/* Additional routes will be added as they are implemented */}
          <Route path="/automations" element={<div>Automations page coming soon</div>} />
          <Route path="/agent" element={<HumanizedAgent />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/webhooks" element={<div>Webhooks page coming soon</div>} />
          <Route path="/admin" element={<div>Admin page coming soon</div>} />
        </Route>
        
        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
