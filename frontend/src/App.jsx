import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LoginPage from './Pages/LoginPage.jsx';
import SignUpPage from './Pages/SignUpPage.jsx';
import HomePage from './Pages/HomePage.jsx';
import NotificationsPage from './Pages/NotificationsPage.jsx';
import ProfilePage from './Pages/ProfilePage.jsx';
import NetworkPage from './Pages/NetworkPage.jsx';
import MessagesPage from './Pages/MessagesPage.jsx';
import LandingPage from './Pages/LandingPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import EventProtectedRoute from './components/EventProtectedRoute.jsx';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import EventsPage from './Pages/EventsPage';
import EventDetailsPage from './Pages/EventDetailsPage';
import CreateEventPage from './Pages/CreateEventPage';
import EditEventPage from './Pages/EditEventPage';
import OnboardingToast from './components/OnboardingToast';
import Settings from './Pages/Settings.jsx';

const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Layout>
            <OnboardingToast />
            <Toaster 
              position="top-center" 
              reverseOrder={false}
              containerClassName="toast-container"
              toastOptions={{
                // Consistent duration for all toasts
                duration: 4000,
                // Limit the number of toasts on screen
                style: {
                  background: '#1f2937',
                  color: '#f3f4f6',
                  padding: '16px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  maxWidth: '500px',
                  fontSize: '14px',
                },
                success: {
                  duration: 4000,
                  style: {
                    background: '#065F46',
                    color: '#fff',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#065F46',
                  },
                },
                error: {
                  duration: 5000, // Longer for errors
                  style: {
                    background: '#B91C1C',
                    color: '#fff',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#B91C1C',
                  },
                },
                loading: {
                  duration: Infinity,
                  style: {
                    background: '#1f2937',
                    color: '#f3f4f6',
                  },
                },
              }}
              // Limit concurrent toasts
              gutter={8}
            />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              
              {/* Events Routes */}
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <EventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/create"
                element={
                  <EventProtectedRoute>
                    <CreateEventPage />
                  </EventProtectedRoute>
                }
              />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <EventDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id/edit"
                element={
                  <EventProtectedRoute>
                    <EditEventPage />
                  </EventProtectedRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:username"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/network"
                element={
                  <ProtectedRoute>
                    <NetworkPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route - redirect to home if logged in, otherwise to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
