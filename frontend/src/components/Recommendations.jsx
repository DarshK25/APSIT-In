import { useState, useEffect } from "react";
import { UserPlus, AlertCircle, Loader2, GraduationCap, Briefcase, ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getUserRecommendations, sendConnectionRequest } from "../api/userService";

const Recommendations = ({ currentUser }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connecting, setConnecting] = useState({});
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        fetchRecommendations(1);
    }, [currentUser?._id]);

    const fetchRecommendations = async (pageNumber) => {
        try {
            if (pageNumber === 1) {
                setLoading(true);
                setRecommendations([]); // Clear existing recommendations when fetching first page
            } else {
                setLoadingMore(true);
            }
            setError(null);
            
            const response = await getUserRecommendations(pageNumber);
            if (!response.success) {
                throw new Error(response.message || "Failed to fetch recommendations");
            }
            
            const newRecommendations = response.data || [];
            setRecommendations(prev => 
                pageNumber === 1 ? newRecommendations : [...prev, ...newRecommendations]
            );
            
            // Determine if there are more recommendations to load
            // Assuming API returns less than expected items when no more data
            setHasMore(newRecommendations.length === 10); // Adjust based on your API's page size
            
        } catch (error) {
            console.error("Failed to fetch recommendations:", error);
            setError("Failed to load recommendations. Please try again later.");
            toast.error("Failed to load recommendations");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMoreRecommendations = async () => {
        if (loadingMore || !hasMore) return;
        
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchRecommendations(nextPage);
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

    const renderUserCard = (user) => (
        <div 
            key={user._id} 
            className="p-4 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors duration-200"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-grow">
                    <Link 
                        to={`/profile/${user.username}`}
                        className="flex-shrink-0"
                    >
                        {user.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-dark-hover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = 
                                        `<div class="w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-700 ring-2 ring-gray-100 dark:ring-dark-hover flex items-center justify-center">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>`;
                                }}
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-700 ring-2 ring-gray-100 dark:ring-dark-hover flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                        )}
                    </Link>
                    <div className="min-w-0 flex-grow">
                        <div className="flex items-center md:block">
                            <Link 
                                to={`/profile/${user.username}`}
                                className="block group"
                            >
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                    {user.name}
                                    {/* Account Type Icon */}
                                    {user.accountType === 'alumni' && (
                                        <GraduationCap size={14} className="ml-1 inline-block text-gray-500 dark:text-dark-text-muted" />
                                    )}
                                    {user.accountType === 'faculty' && (
                                        <Briefcase size={14} className="ml-1 inline-block text-gray-500 dark:text-dark-text-muted" />
                                    )}
                                    {user.accountType === 'club' && (
                                        <Users size={14} className="ml-1 inline-block text-gray-500 dark:text-dark-text-muted" />
                                    )}
                                </h3>
                            </Link>
                        </div>
                        {/* Extra info that shows only on larger screens */}
                        <div className="">
                            <p className="text-sm text-gray-600 dark:text-dark-text-secondary line-clamp-2 mt-0.5">
                                {user.headline || `${user.department} Student`}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-dark-text-muted">
                                <span>{user.department}</span>
                            </div>
                            {user.mutualConnections > 0 && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center">
                                    <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                    {user.mutualConnections} mutual connection{user.mutualConnections > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {/* Connect button */}
                <button
                    onClick={() => handleConnect(user._id)}
                    disabled={connecting[user._id]}
                    className={`flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                        connecting[user._id]
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                            : "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light hover:bg-primary/20 dark:hover:bg-primary/30"
                    }`}
                >
                    {connecting[user._id] ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-400" />
                    ) : (
                        <UserPlus size={16} />
                    )}
                </button>
            </div>
        </div>
    );

    const renderLoadMoreButton = () => (
        hasMore && recommendations.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-dark-border">
                <button
                    onClick={loadMoreRecommendations}
                    disabled={loadingMore}
                    className="w-full bg-gray-100 dark:bg-dark-hover text-gray-800 dark:text-dark-text-primary px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-dark-hover/80 transition-colors flex items-center justify-center gap-2"
                >
                    {loadingMore ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        <>
                            See More
                            <ChevronRight size={18} />
                        </>
                    )}
                </button>
            </div>
        )
    );

    const renderRecommendationsSection = (accountType, title) => (
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">People you may know</h2>
            </div>
            
            {loading ? (
                <div className="space-y-4 p-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-dark-hover animate-pulse">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2" />
                            </div>
                            <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="flex items-center justify-center p-6 bg-red-50 dark:bg-red-900/30 rounded-lg m-4">
                    <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            ) : Array.isArray(recommendations) && recommendations.length > 0 ? (
                <>
                    <div className="divide-y divide-gray-200 dark:divide-dark-border">
                        {recommendations.map(renderUserCard)}
                    </div>
                    {renderLoadMoreButton()}
                </>
            ) : (
                <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted">
                    <p>No recommendations available at the moment</p>
                </div>
            )}
        </div>
    );

    // Don't render anything if no current user or component should be hidden on small screens
    if (!currentUser) return null;

    return (
        <div className="space-y-4 lg:space-y-6">
            {currentUser.accountType === 'student' && 
                renderRecommendationsSection('student', 'People You May Know')
            }
            {currentUser.accountType === 'faculty' && 
                renderRecommendationsSection('faculty', 'People You May Know')
            }
            {currentUser.accountType === 'club' && 
                renderRecommendationsSection('club', 'People You May Know')
            }
        </div>
    );
};

export default Recommendations;