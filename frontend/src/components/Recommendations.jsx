import { useState, useEffect } from "react";
import { UserPlus, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getUserRecommendations, sendConnectionRequest } from "../api/userService";

const Recommendations = ({ currentUser }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRecommendations();
    }, [currentUser?._id]); // Refetch when current user changes

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getUserRecommendations();
            // Ensure data is an array and filter out the current user
            const filteredRecommendations = Array.isArray(data) 
                ? data.filter(user => user._id !== currentUser?._id)
                : [];
            setRecommendations(filteredRecommendations);
        } catch (error) {
            console.error("Failed to fetch recommendations:", error);
            setError("Failed to load recommendations. Please try again later.");
            toast.error("Failed to load recommendations");
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (userId) => {
        try {
            await sendConnectionRequest(userId);
            // Remove the user from recommendations immediately
            setRecommendations(prev => prev.filter(user => user._id !== userId));
            toast.success("Connection request sent!");
        } catch (error) {
            if (error.response?.data?.message === "A connection request already exists") {
                // If there's already a pending request, remove from recommendations
                setRecommendations(prev => prev.filter(user => user._id !== userId));
                toast.error("A connection request is already pending");
            } else {
                toast.error(error.response?.data?.message || "Failed to send connection request");
            }
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">People You May Know</h2>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">People You May Know</h2>
                <div className="flex items-center justify-center text-red-500 space-x-2">
                    <AlertCircle size={20} />
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">People You May Know</h2>
            {Array.isArray(recommendations) && recommendations.length > 0 ? (
                <div className="space-y-4">
                    {recommendations.map((user) => (
                        <div key={user._id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <Link 
                                to={`/profile/${user.username}`}
                                className="flex-shrink-0"
                            >
                                <img
                                    src={user.profilePicture || `https://api.dicebear.com/7.x/avatars/svg?seed=${user._id}`}
                                    alt={user.name}
                                    className="w-12 h-12 rounded-full object-cover hover:opacity-90 transition-opacity"
                                />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <Link 
                                    to={`/profile/${user.username}`}
                                    className="block group"
                                >
                                    <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                                        {user.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate">
                                        {user.headline || `${user.department} Student`}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {user.department} • {user.yearOfStudy}
                                    </p>
                                </Link>
                            </div>
                            <button
                                onClick={() => handleConnect(user._id)}
                                className="flex items-center text-primary hover:text-primary-dark transition-colors"
                            >
                                <UserPlus size={18} className="mr-1" />
                                <span className="text-sm">Connect</span>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                    No recommendations available at the moment
                </p>
            )}
        </div>
    );
};

export default Recommendations; 