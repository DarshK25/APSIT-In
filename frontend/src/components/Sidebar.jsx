import { Link, useLocation } from "react-router-dom";
import { Home, UserPlus, Bell, LogOut, Settings, Calendar, Users, MessageSquare, Briefcase, GraduationCap, MapPin, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error("Failed to logout");
        }
    };

    const isAlumni = user?.status?.toLowerCase() === 'alumni' || user?.status?.toLowerCase() === 'passed out';
    const currentExperience = user?.experience?.find(exp => !exp.endDate);

    if (!user) {
        return null;
    }

    const navItems = [
        { icon: Home, label: "Home", path: "/home" },
        { icon: Users, label: "Network", path: "/network" },
        { icon: Bell, label: "Notifications", path: "/notifications" },
        { icon: MessageSquare, label: "Messages", path: "/messages" },
        { icon: Calendar, label: "Events", path: "/events" },
        { icon: Settings, label: "Settings", path: "/settings" }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="relative">
                    <div 
                        className={`h-32 w-full ${!user.bannerImg ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}`}
                    >
                        {user.bannerImg && (
                            <img
                                src={user.bannerImg}
                                alt="Profile Banner"
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-purple-600');
                                }}
                            />
                        )}
                    </div>
                    <Link 
                        to={`/profile/${user.username}`}
                        className="absolute -bottom-12 left-1/2 transform -translate-x-1/2"
                    >
                        {user.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt={user.name || user.username}
                                className="w-24 h-24 rounded-full border-4 border-white dark:border-dark-card object-cover hover:ring-2 hover:ring-blue-500 transition-all duration-300 shadow-md"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `
                                        <div class="w-24 h-24 rounded-full bg-gray-900 dark:bg-dark-hover border-4 border-white dark:border-dark-card shadow-md hover:ring-2 hover:ring-blue-500 transition-all duration-300 flex items-center justify-center">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>`;
                                }}
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-900 dark:bg-dark-hover border-4 border-white dark:border-dark-card shadow-md hover:ring-2 hover:ring-blue-500 transition-all duration-300 flex items-center justify-center">
                                <User className="w-10 h-10 text-white" />
                            </div>
                        )}
                    </Link>
                </div>

                <div className="pt-16 pb-6 px-6">
                    <div className="text-center">
                        <Link to={`/profile/${user.username}`} className="group">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {user.name || user.username}
                            </h2>
                        </Link>
                        {isAlumni && (
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                Alumni
                            </div>
                        )}
                        <p className="text-sm text-gray-600 mt-1">{user.headline || "Welcome to your profile"}</p>
                        
                        {currentExperience && (
                            <div className="flex items-center justify-center text-sm text-gray-600 dark:text-dark-text-secondary mt-2">
                                <Briefcase className="w-4 h-4 mr-1" />
                                <span>{currentExperience.title} at {currentExperience.company}</span>
                            </div>
                        )}
                        
                        {user.location && (
                            <div className="flex items-center justify-center text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{user.location}</span>
                            </div>
                        )}
                    </div>

                    <div className={`${user.accountType === 'student' ? 'grid grid-cols-2 gap-4' : 'flex justify-center'} mt-4 text-center`}>
                        {user.accountType === 'student' ? (
                            <>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                                    <p className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{user.connections?.length || 0}</p>
                                    <p className="text-xs text-gray-500 dark:text-dark-text-muted">Total Connections</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                                    <p className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                                        {user.yearOfStudy === 'First Year' ? 'FE' : 
                                         user.yearOfStudy === 'Second Year' ? 'SE' : 
                                         user.yearOfStudy === 'Third Year' ? 'TE' : 
                                         user.yearOfStudy === 'Fourth Year' ? 'BE' : user.yearOfStudy}
                                    </p>
                                    <p className="text-xs text-gray-400">Year</p>
                                </div>
                            </>
                        ) : (
                            <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-3 w-full">
                                <p className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{user.connections?.length || 0}</p>
                                <p className="text-xs text-gray-500 dark:text-dark-text-muted">Connections</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 space-y-2">
                        {user.department && (
                            <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
                                <span className="font-medium">Department:</span> {user.department}
                            </div>
                        )}
                        {user.studentId && (
                            <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
                                <span className="font-medium">Student ID:</span> {user.studentId}
                            </div>
                        )}
                        {user.workplace && (
                            <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
                                <span className="font-medium">Workplace:</span> {user.workplace}
                            </div>
                        )}
                    </div>
                </div>

                <nav className="px-4 py-2 border-t border-gray-100 dark:border-dark-border">
                    <ul className="space-y-1">
                        {navItems.map(({ icon: Icon, label, path }) => (
                            <li key={path}>
                                <Link
                                    to={path}
                                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                                        location.pathname === path
                                            ? "bg-blue-50 dark:bg-dark-hover text-blue-600 dark:text-blue-400 shadow-sm"
                                            : "text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-hover hover:text-blue-600 dark:hover:text-blue-400"
                                    }`}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    <span className="font-medium">{label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-border">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-dark-text-primary hover:bg-red-50 dark:hover:bg-dark-hover hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;