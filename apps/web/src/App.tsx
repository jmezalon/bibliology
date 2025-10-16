import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedRoute } from './components/auth/protected-route';
import { PublicRoute } from './components/auth/public-route';
import { MainLayout } from './components/layout/main-layout';
import { TeacherLayout } from './components/teacher/teacher-layout';
import { Toaster } from './components/ui/toaster';
import { DashboardPage } from './pages/dashboard';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { RegisterPage } from './pages/register';
import { TeacherCourseDetailPage } from './pages/teacher/course-detail';
import { TeacherCoursesPage } from './pages/teacher/courses';
import { TeacherDashboardPage } from './pages/teacher/dashboard';
import { UserRole } from './types/auth';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />

            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          {/* Teacher Routes - separate layout */}
          <Route element={<TeacherLayout />}>
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                  <TeacherDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses"
              element={
                <ProtectedRoute allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                  <TeacherCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses/:courseId"
              element={
                <ProtectedRoute allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
                  <TeacherCourseDetailPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>

      {/* Global Toast Notifications */}
      <Toaster />

      {/* React Query Devtools - only in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
