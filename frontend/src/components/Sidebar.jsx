import { Link, useLocation } from "react-router-dom";
import { Home, UserPlus, Bell, LogOut, Settings, Calendar, Users, MessageSquare, Briefcase, GraduationCap, MapPin } from "lucide-react";
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
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-32 w-full bg-gray-100 rounded-t-lg" />
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full mt-[-48px] border-4 border-white" />
                    <div className="h-4 bg-gray-100 rounded w-3/4 mt-4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mt-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3 mt-2" />
                </div>
            </div>
        );
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="relative">
                <div 
                    className={`h-32 w-full ${!user.bannerImg ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}`}
                    style={user.bannerImg ? {
                        backgroundImage: `url("${user.bannerImg}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    } : {}}
                />
                <Link 
                    to={`/profile/${user.username}`}
                    className="absolute -bottom-12 left-1/2 transform -translate-x-1/2"
                >
                    <img
                        src={user.profilePicture || "/default-avatar.png"}
                        alt={user.username}
                        className="w-24 h-24 rounded-full border-4 border-white object-cover hover:ring-2 hover:ring-blue-500 transition-all duration-300 shadow-md"
                    />
                </Link>
            </div>

            <div className="pt-16 pb-6 px-6">
                <div className="text-center">
                    <Link to={`/profile/${user.username}`} className="group">
                        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
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
                        <div className="flex items-center justify-center text-sm text-gray-600 mt-2">
                            <Briefcase className="w-4 h-4 mr-1" />
                            <span>{currentExperience.title} at {currentExperience.company}</span>
                        </div>
                    )}
                    
                    {user.location && (
                        <div className="flex items-center justify-center text-sm text-gray-600 mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{user.location}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-lg font-semibold text-gray-900">{user.connections?.length || 0}</p>
                        <p className="text-xs text-gray-500">Connections</p>
                    </div>
                    {user.yearOfStudy && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-lg font-semibold text-gray-900">
                                {user.yearOfStudy === 'First Year' ? 'FE' : 
                                 user.yearOfStudy === 'Second Year' ? 'SE' : 
                                 user.yearOfStudy === 'Third Year' ? 'TE' : 
                                 user.yearOfStudy === 'Fourth Year' ? 'BE' : user.yearOfStudy}
                            </p>
                            <p className="text-xs text-gray-500">Year</p>
                        </div>
                    )}
                </div>

                <div className="mt-4 space-y-2">
                    {user.department && (
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Department:</span> {user.department}
                        </div>
                    )}
                    {user.studentId && (
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Student ID:</span> {user.studentId}
                        </div>
                    )}
                    {user.workplace && (
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Workplace:</span> {user.workplace}
                        </div>
                    )}
                </div>
            </div>

            <nav className="px-4 py-2 border-t border-gray-100">
                <ul className="space-y-1">
                    {navItems.map(({ icon: Icon, label, path }) => (
                        <li key={path}>
                            <Link
                                to={path}
                                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                                    location.pathname === path
                                        ? "bg-blue-50 text-blue-600 shadow-sm"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                }`}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                <span className="font-medium">{label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="px-4 py-3 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;