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
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-secondary">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
  </div>
);

const ErrorDisplay = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-secondary">
    <div className="text-center">
      <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
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
        // If user data fetch fails or returns null, treat it as an error
        throw new Error("Failed to fetch user data or user not authenticated.");
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
      setUser(null); // Ensure user is null if there's an error
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data on component mount
    fetchData();

    const refreshInterval = setInterval(() => {
      // Only refresh posts if user data is already loaded and not in a main loading state
      if (!isLoading && user) {
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
  }, [navigate]); // Depend only on navigate for initial fetch and interval setup

  // console.log('HomePage render state: isLoading=', isLoading, ', error=', error, ', user=', !!user); // Log state before rendering

  // Render loading spinner or error display while data is being fetched or if there's an error
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} />;
  }

  // Render the main content only if not loading and user data is available
  // The outer div for the grid layout is always rendered to maintain structure
  return (
    // Define grid columns for different breakpoints:
    // On small (<md), it's 1 column (items stack)
    // On md (<lg), it's 3 columns (Sidebar + Feed (2))
    // On lg (<xl), it's 4 columns (Sidebar + Feed (2) + Recommendations (1))
    // On xl+, it's 4 columns (Sidebar + Feed (2) + Recommendations (1))
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2 sm:p-4 bg-gray-100 dark:bg-dark-secondary min-h-screen">
      {/* Sidebar - Conditionally rendered and takes 1 column from md up */}
      {user && (
        <div className="hidden md:block md:col-span-1">
          <Sidebar user={user} />
        </div>
      )}

      {/* Main Content (Feed) - Adjust col-span based on breakpoint and sidebar presence */}
      {/* When user is logged in: */}
      {/* md (<lg): spans 2 columns (taking the 2nd and 3rd columns of md:grid-cols-3) */}
      {/* lg (<xl): spans 2 columns (taking the 2nd and 3rd columns of lg:grid-cols-4) */}
      {/* xl+: spans 2 columns (taking the 2nd and 3rd columns of xl:grid-cols-4) */}
      {/* When user is not logged in: spans full width (col-span-full) */}
      <div className={`${user ? 'md:col-span-2 lg:col-span-2' : 'col-span-full'}`}>
        <Feed posts={posts} setPosts={setPosts} />
      </div>

      {/* Recommendations - Conditionally rendered and hidden on smaller than lg screens */}
      {/* Takes 1 column from lg up (the 4th column of lg:grid-cols-4) */}
      {user && (
        <div className="lg:col-span-1 hidden lg:block">
          <Recommendations currentUser={user} />
        </div>
      )}
    </div>
  );
};

export default HomePage;