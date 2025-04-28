import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EventProtectedRoute = ({ children }) => {
    const { user } = useAuth();

    // Admin emails that have access
    const adminEmails = [
        'darshkalathiya25@gmail.com',
        '23102187@apsit.edu.in',
        'devopsclub@apsit.edu.in',
        'codersclub@apsit.edu.in',
        'cybersecurityclub@apsit.edu.in',
        'datascienceclub@apsit.edu.in'
    ];

    // Check if user is authorized to access event creation
    const isAuthorized = () => {
        if (!user) return false;

        // Check if user is an admin
        if (adminEmails.includes(user.email)) return true;

        // Check if user is a club account
        if (user.accountType === 'club') return true;

        // Check if user is a club member
        if (user.clubMemberships && user.clubMemberships.length > 0) {
            // Check if user has any role in any club
            return user.clubMemberships.some(membership => membership.role);
        }

        return false;
    };

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!isAuthorized()) {
        return <Navigate to="/events" replace />;
    }

    return children;
};

export default EventProtectedRoute; 