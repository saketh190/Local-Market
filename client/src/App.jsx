import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ListingDetail from './pages/ListingDetail';
import PostListing from './pages/PostListing';
import MyListings from './pages/MyListings';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route
            path="/post"
            element={
              <ProtectedRoute requiredRole="seller">
                <PostListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-listings"
            element={
              <ProtectedRoute requiredRole="seller">
                <MyListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:conversationId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1A2035',
              color: '#F1F5F9',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#00E676', secondary: '#1A2035' },
            },
            error: {
              iconTheme: { primary: '#FF5252', secondary: '#1A2035' },
            },
          }}
        />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
