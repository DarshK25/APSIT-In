import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar.jsx";
import Feed from "../components/Feed.jsx";
import Recommendations from "../components/Recommendations.jsx";
import userService from "../api/userService";
import * as postService from "../api/postService";
import authService from "../api/authService";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ErrorDisplay = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Try Again
      </button>
    </div>
  </div>
);

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      // Fetch user data first
      const userData = await userService.getCurrentUser();
      if (!userData) {
        throw new Error("Failed to fetch user data");
      }
      setUser(userData);

      // Then fetch posts
      try {
        const postsData = await postService.getAllPosts();
        setPosts(postsData || []);
      } catch (postsError) {
        console.error("Error fetching posts:", postsError);
        // Don't set error state for posts, just show empty posts
        setPosts([]);
        toast.error("Failed to load posts. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error?.message || "Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up an interval to refresh posts every 30 seconds
    const refreshInterval = setInterval(() => {
      if (!isLoading) {
        // Only refresh posts, not user data
        postService.getAllPosts()
          .then(postsData => {
            if (postsData) {
              setPosts(postsData);
            }
          })
          .catch(error => {
            console.error("Error refreshing posts:", error);
            // Don't show toast for background refresh errors
          });
      }
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <div className="md:col-span-1">
        <Sidebar user={user} />
      </div>

      {/* Main Content */}
      <div className="md:col-span-2">
        <Feed posts={posts} setPosts={setPosts} />
      </div>

      {/* Recommendations */}
      <div className="md:col-span-1 hidden md:block">
        <Recommendations currentUser={user} />
      </div>
    </div>
  );
};

export default HomePage;