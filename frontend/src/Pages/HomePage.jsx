import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar.jsx";
import Feed from "../components/Feed.jsx";
import Recommendations from "../components/Recommendations.jsx";
import userService from "../api/userService.js";
import postService from "../api/postService.js";
import authService from "../api/authService.js";

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

      const [userData, postsData] = await Promise.all([
        userService.getCurrentUser(),
        postService.getAllPosts()
      ]);

      if (!userData) {
        throw new Error("Failed to fetch user data");
      }

      setUser(userData);
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error?.response?.data?.message || "Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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