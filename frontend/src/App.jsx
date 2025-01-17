import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LoginPage from './Pages/LoginPage.jsx';
import SignUpPage from './Pages/SignUpPage.jsx';
import HomePage from './Pages/HomePage.jsx';
import NotificationsPage from './Pages/NotificationsPage.jsx';
import ProfilePage from './Pages/ProfilePage.jsx';
import NetworkPage from './Pages/NetworkPage.jsx';
const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <>
            <Route path="/" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} /> 
            <Route path="/network" element={<NetworkPage />} />
          </>
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
