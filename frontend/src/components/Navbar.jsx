import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Bell, Home, LogOut, User, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ children }) => {
    const { user, logout } = useAuth();
    // These would come from an API call in a real app
    const unreadConnectionRequestsCount = 3;
    const unreadNotificationCount = 5;

    const handleLogout = async () => {
        await logout();
    };

    return (
        <nav className='bg-white shadow-md sticky top-0 z-10'>
            <div className='max-w-7xl mx-auto px-4'>
                <div className='flex justify-between items-center py-3'>
                    <div className='flex items-center space-x-4'>
                        <Link to='/'>
                            <img className='h-8 rounded' src='ApsitINlogo.avif' alt='Apsit-In' />
                        </Link>
                    </div>
                    <div className='flex items-center gap-4 md:gap-6'>
                        {user ? (
                            <>
                                <Link to='/home' className='text-neutral flex flex-col items-center'>
                                    <Home size={20} />
                                    <span className='text-xs hidden md:block'>Home</span>
                                </Link>
                                <Link to='/network' className='text-neutral flex flex-col items-center relative'>
                                    <Users size={20} />
                                    <span className='text-xs hidden md:block'>My Network</span>
                                    {unreadConnectionRequestsCount > 0 && (
                                        <span className='absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs rounded-full size-3 md:size-4 flex items-center justify-center'>
                                            {unreadConnectionRequestsCount}
                                        </span>
                                    )}
                                </Link>
                                <Link to='/notifications' className='text-neutral flex flex-col items-center relative'>
                                    <Bell size={20} />
                                    <span className='text-xs hidden md:block'>Notifications</span>
                                    {unreadNotificationCount > 0 && (
                                        <span className='absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs rounded-full size-3 md:size-4 flex items-center justify-center'>
                                            {unreadNotificationCount}
                                        </span>
                                    )}
                                </Link>
                                <Link to={`/profile`} className='text-neutral flex flex-col items-center'>
                                    <User size={20} />
                                    <span className='text-xs hidden md:block'>Me</span>
                                </Link>
                                <button
                                    className='flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800'
                                    onClick={handleLogout}
                                >
                                    <LogOut size={20} />
                                    <span className='hidden md:inline'>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to='/login' className='btn btn-ghost'>
                                    Sign In
                                </Link>
                                <Link to='/signup' className='btn btn-primary'>
                                    Join now
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {children}
        </nav>
    );
};

Navbar.propTypes = {
    children: PropTypes.node,
};

export default Navbar;
