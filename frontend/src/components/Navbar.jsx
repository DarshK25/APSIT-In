import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Bell, Home, LogOut, User, Users, Calendar, Search, MessageSquare, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const Navbar = ({ children }) => {
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({
        unreadConnectionRequestsCount: 0,
        unreadNotificationCount: 0,
        unreadMessagesCount: 0
    });

    // Function to fetch unread counts
    const fetchUnreadCounts = useCallback(async () => {
        if (!user) return;
        
        try {
            const response = await axios.get('http://localhost:3000/api/v1/users/unread-counts', {
                withCredentials: true
            });
            if (response.data.success) {
                setUnreadCounts(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch unread counts:', error);
        }
    }, [user]);

    // Fetch unread counts initially and set up polling
    useEffect(() => {
        fetchUnreadCounts();
        // Poll every 30 seconds instead of every minute
        const interval = setInterval(fetchUnreadCounts, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCounts]);

    // Refresh counts when the component gains focus
    useEffect(() => {
        const handleFocus = () => {
            fetchUnreadCounts();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchUnreadCounts]);

    // Listen for unread count updates from other components
    useEffect(() => {
        const handleUnreadCountsUpdate = (event) => {
            setUnreadCounts(event.detail);
        };

        window.addEventListener('unreadCountsUpdated', handleUnreadCountsUpdate);
        return () => window.removeEventListener('unreadCountsUpdated', handleUnreadCountsUpdate);
    }, []);

    const handleLogout = async () => {
        await logout();
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length === 0) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowDropdown(true);

        try {
            const response = await axios.get(`http://localhost:3000/api/v1/users/search?query=${query}`, {
                withCredentials: true
            });
            setSearchResults(response.data.data || []);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleClickOutside = () => {
        setTimeout(() => {
            setShowDropdown(false);
        }, 200);
    };

    return (
        <nav className='bg-white shadow-md sticky top-0 z-10'>
            <div className='max-w-7xl mx-auto px-4'>
                <div className='flex justify-between items-center py-3'>
                    <div className='flex items-center space-x-4 flex-grow'>
                        <Link to='/'>
                            <img className='h-8 rounded' src='/ApsitINlogo.avif' alt='Apsit-In' />
                        </Link>
                        {user && (
                            <div className="relative flex-grow max-w-2xl">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        onBlur={handleClickOutside}
                                        className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                                {showDropdown && (searchResults.length > 0 || isSearching) && (
                                    <div className="absolute mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-gray-500">
                                                Searching...
                                            </div>
                                        ) : (
                                            searchResults.map((result) => (
                                                <Link 
                                                    key={result._id}
                                                    to={`/profile/${result.username}`}
                                                    className="block"
                                                    onClick={() => {
                                                        setShowDropdown(false);
                                                        setSearchQuery("");
                                                    }}
                                                >
                                                    <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                                        <div className="flex-shrink-0">
                                                            {result.profilePicture ? (
                                                                <img
                                                                    src={result.profilePicture}
                                                                    alt={result.name}
                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <span className="text-blue-600 font-medium">
                                                                        {result.name.charAt(0)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">{result.name}</div>
                                                                {result.isAlumni && (
                                                                    <div className="flex items-center bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                                        <GraduationCap className="h-3 w-3 mr-1" />
                                                                        <span className="text-xs font-medium">Alumni</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-500">@{result.username}</div>
                                                            <div className="text-xs text-gray-400 mt-0.5">
                                                                {result.department} • {result.yearOfStudy}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
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
                                    {unreadCounts.unreadConnectionRequestsCount > 0 && (
                                        <span className='absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs rounded-full size-3 md:size-4 flex items-center justify-center'>
                                            {unreadCounts.unreadConnectionRequestsCount}
                                        </span>
                                    )}
                                </Link>
                                <Link to='/messages' className='text-neutral flex flex-col items-center relative'>
                                    <MessageSquare size={20} />
                                    <span className='text-xs hidden md:block'>Messages</span>
                                    {unreadCounts.unreadMessagesCount > 0 && (
                                        <span className='absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs rounded-full size-3 md:size-4 flex items-center justify-center'>
                                            {unreadCounts.unreadMessagesCount}
                                        </span>
                                    )}
                                </Link>
                                <Link to='/events' className='text-neutral flex flex-col items-center relative'>
                                    <Calendar size={20} />
                                    <span className='text-xs hidden md:block'>Events</span>
                                </Link>
                                <Link to='/notifications' className='text-neutral flex flex-col items-center relative'>
                                    <Bell size={20} />
                                    <span className='text-xs hidden md:block'>Notifications</span>
                                    {unreadCounts.unreadNotificationCount > 0 && (
                                        <span className='absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs rounded-full size-3 md:size-4 flex items-center justify-center'>
                                            {unreadCounts.unreadNotificationCount}
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
