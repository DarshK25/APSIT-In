import { useState, useEffect } from "react";
import { UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getUserRecommendations, sendConnectionRequest } from "../api/userService";

const Recommendations = ({ currentUser }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connecting, setConnecting] = useState({});

    useEffect(() => {
        fetchRecommendations();
    }, [currentUser?._id]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getUserRecommendations();
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
            setConnecting(prev => ({ ...prev, [userId]: true }));
            await sendConnectionRequest(userId);
            setRecommendations(prev => prev.filter(user => user._id !== userId));
            toast.success("Connection request sent!");
        } catch (error) {
            if (error.response?.data?.message === "A connection request already exists") {
                setRecommendations(prev => prev.filter(user => user._id !== userId));
                toast.error("A connection request is already pending");
            } else {
                toast.error(error.response?.data?.message || "Failed to send connection request");
            }
        } finally {
            setConnecting(prev => ({ ...prev, [userId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">People You May Know</h2>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 animate-pulse">
                            <div className="w-12 h-12 bg-gray-200 rounded-full" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
                            </div>
                            <div className="w-20 h-8 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">People You May Know</h2>
                <div className="flex items-center justify-center p-6 bg-red-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">People You May Know</h2>
            {Array.isArray(recommendations) && recommendations.length > 0 ? (
                <div className="space-y-3">
                    {recommendations.map((user) => (
                        <div 
                            key={user._id} 
                            className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                            <Link 
                                to={`/profile/${user.username}`}
                                className="flex-shrink-0 group"
                            >
                                <img
                                    src={user.profilePicture || `https://api.dicebear.com/7.x/avatars/svg?seed=${user._id}`}
                                    alt={user.name}
                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500 transition-all duration-200"
                                />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <Link 
                                    to={`/profile/${user.username}`}
                                    className="block group"
                                >
                                    <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
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
                                disabled={connecting[user._id]}
                                className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                    connecting[user._id]
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                }`}
                            >
                                {connecting[user._id] ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                        <span>Connecting</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-1.5" />
                                        <span>Connect</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                        No recommendations available at the moment
                    </p>
                    <button
                        onClick={fetchRecommendations}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Refresh recommendations
                    </button>
                </div>
            )}
        </div>
    );
};

export default Recommendations; 