import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Bell, Home, LogOut, User, Users, Calendar, Search, MessageSquare, GraduationCap, Settings, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from '../api/axiosConfig';
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({
        unreadConnectionRequestsCount: 0,
        unreadNotificationCount: 0,
        unreadMessagesCount: 0,
        unreadEventsCount: 0
    });
    const [failedSearchImages, setFailedSearchImages] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const searchInputRef = useRef(null);
    const searchDropdownRef = useRef(null);

    // Function to fetch unread counts
    const fetchUnreadCounts = useCallback(async () => {
        if (!user) return;
        
        try {
            const response = await axiosInstance.get('/users/unread-counts');
            // console.log('Unread counts response:', response.data); // Debug log
            if (response.data.success) {
                // Ensure counts are numbers and not null/undefined, and subtract 1 from connection requests if count is greater than 1
                const connectionCount = Number(response.data.data.unreadConnectionRequestsCount || 0);
                const counts = {
                    unreadConnectionRequestsCount: connectionCount > 1 ? connectionCount - 1 : connectionCount,
                    unreadNotificationCount: Math.max(0, Number(response.data.data.unreadNotificationCount || 0)),
                    unreadMessagesCount: Math.max(0, Number(response.data.data.unreadMessagesCount || 0)),
                    unreadEventsCount: Math.max(0, Number(response.data.data.unreadEventsCount || 0))
                };
                // console.log('Processed unread counts:', counts); // Debug log
                setUnreadCounts(counts);
            }
        } catch (error) {
            console.error('Failed to fetch unread counts:', error);
            // Reset counts on error
            setUnreadCounts({
                unreadConnectionRequestsCount: 0,
                unreadNotificationCount: 0,
                unreadMessagesCount: 0,
                unreadEventsCount: 0
            });
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
            setUnreadCounts(prevCounts => ({
                ...prevCounts,
                ...event.detail
            }));
        };

        window.addEventListener('unreadCountsUpdated', handleUnreadCountsUpdate);
        return () => window.removeEventListener('unreadCountsUpdated', handleUnreadCountsUpdate);
    }, []);

    // Close search dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchInputRef.current && searchDropdownRef.current &&
                !searchInputRef.current.contains(event.target) &&
                !searchDropdownRef.current.contains(event.target))
             {
                setShowSearchDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        await logout();
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length === 0) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        setIsSearching(true);
        // Open dropdown only if there's a query
        setShowSearchDropdown(true);

        try {
            const response = await axiosInstance.get(`/users/search?query=${query}`);
            setSearchResults(response.data.data || []);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchImageError = (userId) => {
        setFailedSearchImages(prev => ({ ...prev, [userId]: true }));
    };

    const navItems = [
        { icon: Home, label: 'Home', path: '/home', badge: null },
        { 
            icon: Users, 
            label: 'My Network', 
            path: '/network', 
            badge: unreadCounts.unreadConnectionRequestsCount 
        },
        { 
            icon: MessageSquare, 
            label: 'Messages', 
            path: '/messages', 
            badge: unreadCounts.unreadMessagesCount 
        },
        { 
            icon: Calendar, 
            label: 'Events', 
            path: '/events', 
            badge: unreadCounts.unreadEventsCount 
        },
        { 
            icon: Bell, 
            label: 'Notifications', 
            path: '/notifications', 
            badge: unreadCounts.unreadNotificationCount 
        }
    ];

    return (
        <>
            <nav className='bg-white/80 dark:bg-dark-card/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200/50 dark:border-dark-border/50'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='flex justify-between items-center h-16'>
                        {/* Logo */}
                        <Link to='/' className='flex-shrink-0'>
                            <img className='h-8 w-auto' src='/ApsitINlogo.avif' alt='Apsit-In' />
                        </Link>

                        {/* Search Bar - Desktop */}
                        {user && (
                            <div className="flex-1 max-w-xl mx-2 md:mx-8">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        onFocus={() => searchQuery && setShowSearchDropdown(true)}
                                        ref={searchInputRef}
                                        className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-dark-text-muted" />
                                </div>
                                {showSearchDropdown && (searchResults.length > 0 || isSearching) && (
                                    <div ref={searchDropdownRef} className="absolute mt-2 w-full bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border max-h-96 overflow-y-auto z-50">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-gray-500 dark:text-dark-text-muted">
                                                Searching...
                                            </div>
                                        ) : (
                                            searchResults.map((result) => (
                                                <Link 
                                                    key={result._id}
                                                    to={`/profile/${result.username}`}
                                                    className="block w-full hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                                                    onClick={() => {
                                                        // This onClick is just to ensure dropdown closes after navigation
                                                        setShowSearchDropdown(false);
                                                        setSearchQuery("");
                                                    }}
                                                >
                                                    <div className="flex items-start space-x-4 p-3">
                                                        <div className="flex-shrink-0">
                                                            {result.profilePicture && !failedSearchImages[result._id] ? (
                                                                <img
                                                                    src={result.profilePicture}
                                                                    alt={result.name}
                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                    onError={() => handleSearchImageError(result._id)}
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-700 flex items-center justify-center">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                                        <circle cx="12" cy="7" r="4" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-medium text-gray-900 dark:text-dark-text-primary">{result.name}</div>
                                                                {result.isAlumni && (
                                                                    <div className="flex items-center bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light px-2 py-0.5 rounded-full">
                                                                        <GraduationCap className="h-3 w-3 mr-1" />
                                                                        <span className="text-xs font-medium">Alumni</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-dark-text-muted">@{result.username}</div>
                                                            <div className="text-xs text-gray-400 dark:text-dark-text-muted mt-0.5">
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

                        {/* Desktop Navigation */}
                        <div className='hidden md:flex items-center space-x-1'>
                            {user ? (
                                <>
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className='relative p-2 rounded-full text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover transition-all duration-200'
                                        >
                                            <item.icon size={20} />
                                            {item.badge > 0 && (
                                                <span className='absolute -top-1 -right-1 bg-red-500 rounded-full w-2 h-2'></span>
                                            )}
                                        </Link>
                                    ))}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                            className='p-2 rounded-full text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover transition-all duration-200'
                                        >
                                            <User size={20} />
                                        </button>
                                        {showProfileDropdown && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border py-1">
                                                <Link
                                                    to={`/profile/${user.username}`}
                                                    className='block px-4 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover'
                                                    onClick={() => setShowProfileDropdown(false)}
                                                >
                                                    Profile
                                                </Link>
                                                <Link
                                                    to="/settings"
                                                    className='block px-4 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover'
                                                    onClick={() => setShowProfileDropdown(false)}
                                                >
                                                    Settings
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setShowProfileDropdown(false);
                                                        handleLogout();
                                                    }}
                                                    className='block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-hover'
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link
                                        to="/login"
                                        className='px-4 py-2 rounded-full bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-dark-text-primary hover:bg-gray-200 dark:hover:bg-dark-hover/80 transition-colors duration-200'
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className='px-4 py-2 rounded-full bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200'
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className='md:hidden p-2 rounded-full text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover transition-all duration-200'
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="fixed right-0 top-0 h-full w-64 bg-white dark:bg-dark-card shadow-xl z-50 md:hidden"
                        >
                            <div className="flex flex-col h-full">
                                {/* Sidebar Header */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Menu</h2>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="p-2 rounded-full text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover transition-all duration-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Sidebar Content */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {user ? (
                                        <div className="space-y-4">
                                            {navItems.map((item) => (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    onClick={() => setIsSidebarOpen(false)}
                                                    className='flex items-center space-x-3 p-2 rounded-lg text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover transition-all duration-200'
                                                >
                                                    <item.icon size={20} />
                                                    <span>{item.label}</span>
                                                    {item.badge > 0 && (
                                                        <span className='ml-auto bg-red-500 rounded-full w-2 h-2'></span>
                                                    )}
                                                </Link>
                                            ))}
                                            <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                                                <Link
                                                    to={`/profile/${user.username}`}
                                                    onClick={() => setIsSidebarOpen(false)}
                                                    className='flex items-center space-x-3 p-2 rounded-lg text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover transition-all duration-200'
                                                >
                                                    <User size={20} />
                                                    <span>Profile</span>
                                                </Link>
                                                <Link
                                                    to="/settings"
                                                    onClick={() => setIsSidebarOpen(false)}
                                                    className='flex items-center space-x-3 p-2 rounded-lg text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover transition-all duration-200'
                                                >
                                                    <Settings size={20} />
                                                    <span>Settings</span>
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setIsSidebarOpen(false);
                                                        handleLogout();
                                                    }}
                                                    className='flex items-center space-x-3 p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 w-full'
                                                >
                                                    <LogOut size={20} />
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 p-4">
                                            <Link
                                                to="/login"
                                                onClick={() => setIsSidebarOpen(false)}
                                                className='w-full px-4 py-2 text-center rounded-lg bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-dark-text-primary hover:bg-gray-200 dark:hover:bg-dark-hover/80 transition-colors duration-200'
                                            >
                                                Sign In
                                            </Link>
                                            <Link
                                                to="/signup"
                                                onClick={() => setIsSidebarOpen(false)}
                                                className='w-full px-4 py-2 text-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200'
                                            >
                                                Sign Up
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

Navbar.propTypes = {
    // Remove this line:
    // children: PropTypes.node.isRequired
};

export default Navbar;
