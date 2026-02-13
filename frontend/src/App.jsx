import React from "react"
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const LoginPage = React.lazy(() => import('./pages/Login'));
const RegisterPage = React.lazy(() => import('./pages/Register'));
const BookRoom = React.lazy(() => import('./pages/BookRoom'));
const MyReservations = React.lazy(() => import('./pages/MyReservation'));
const Home = React.lazy(() => import('./pages/Home'));
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Home route with redirect logic
const HomeRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // If logged in as admin/staff, redirect to dashboard
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'staff')) {
      navigate('/Dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <React.Suspense fallback={<div className="p-4">Loading...</div>}>
      <Home />
    </React.Suspense>
  );
};

// Protected route for guest booking pages (BookRoom, MyReservations)
const ProtectedGuestRoute = ({ Component }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      // Not logged in - redirect to login
      navigate('/login', { replace: true });
    } else if (user?.role === 'admin' || user?.role === 'staff') {
      // Admin/Staff trying to access guest booking pages - redirect to dashboard
      navigate('/Dashboard', { replace: true });
    }
    // Guests can access these pages - no redirect needed
  }, [isAuthenticated, user, navigate]);

  // Only render if user is authenticated guest
  if (!isAuthenticated) {
    return null;
  }
  
  if (user?.role === 'admin' || user?.role === 'staff') {
    return null;
  }

  return (
    <React.Suspense fallback={<div className="p-4">Loading...</div>}>
      <Component />
    </React.Suspense>
  );
};

// Protected route for admin/staff pages (Dashboard, Rooms, Guests, Reservations)
const ProtectedAdminRoute = ({ Component, pageName }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      // Not logged in - redirect to login
      navigate('/login', { replace: true });
    } else if (user?.role === 'guest') {
      // Guest trying to access admin pages - redirect to home
      navigate('/', { replace: true });
    }
    // Admin/Staff can access these pages - no redirect needed
  }, [isAuthenticated, user, navigate]);

  // Only render if user is authenticated admin/staff
  if (!isAuthenticated) {
    return null;
  }
  
  if (user?.role === 'guest') {
    return null;
  }

  return (
    <LayoutWrapper currentPageName={pageName}>
      <Component />
    </LayoutWrapper>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={
        <React.Suspense fallback={<div className="p-4">Loading...</div>}>
          <LoginPage />
        </React.Suspense>
      } />
      <Route path="/register" element={
        <React.Suspense fallback={<div className="p-4">Loading...</div>}>
          <RegisterPage />
        </React.Suspense>
      } />
      <Route path="/" element={<HomeRoute />} />
      <Route path="/BookRoom" element={
        <ProtectedGuestRoute Component={BookRoom} />
      } />
      <Route path="/MyReservations" element={
        <ProtectedGuestRoute Component={MyReservations} />
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <ProtectedAdminRoute Component={Page} pageName={path} />
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
