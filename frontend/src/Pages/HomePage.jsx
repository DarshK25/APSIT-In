import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, UserPlus, Bell, ThumbsUp, Users } from "lucide-react"; // Import icons from lucide-react

const Sidebar = ({ user }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 text-center">
        {/* Banner Image */}
        <div
          className="h-16 w-full rounded-t-lg bg-cover bg-center"
          style={{
            backgroundImage: `url("${user.bannerUrl || "/banner.png"}")`,
          }}
        />
        {/* Profile Picture */}
        <Link to={`/profile/${user.username}`}>
          <img
            src={user.photoUrl || "/avatar.png"}
            alt={user.name}
            className="w-20 h-20 rounded-full mx-auto mt-[-40px] border-4 border-white"
          />
          <h2 className="text-xl font-semibold mt-2">{user.name}</h2>
        </Link>
        <p className='text-gray-700'>{user.headline}</p>
				<p className='text-gray-700 text-xs'>{user.connections.length} connections</p>
				<p className='text-gray-700 text-xs'>{user.year} {user.department}</p>
				<p className='text-gray-700 text-xs'>{user.studentid}</p>
				<p className='text-gray-700 text-xs md:font-bold'>{user.workplace}</p>
				<p className='text-gray-700 text-xs'>{user.status}</p>
				<p className='text-gray-700 text-xs'>{user.location}</p>
      </div>
      <div className="border-t border-gray-300 p-4">
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className="flex items-center py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Home className="mr-2" size={20} /> Home
              </Link>
            </li>
            <li>
              <Link
                to="/network"
                className="flex items-center py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                <UserPlus className="mr-2" size={20} /> My Network
              </Link>
            </li>
            <li>
              <Link
                to="/notifications"
                className="flex items-center py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Bell className="mr-2" size={20} /> Notifications
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-gray-300 p-4">
        <Link
          to={`/profile/${user.username}`}
          className="text-sm font-semibold"
        >
          Visit your profile
        </Link>
        
      </div>
    </div>
  );
};

const HomePage = () => {
  // Mock data

  const [user, setUser] = useState(null); // State to hold fetched user data

  useEffect(() => {
    const fetchUser = () => {
      // Simulating a fetch request
      const fetchedUser = {
        id: 1,
        name: "Jaideep Koya",
        username: "jaideepkoya",
        connections: [1, 2],
        headline: "Hello World!",
        status: "#OPEN_TO_WORK",
        college: "A.P. Shah Institute of Technology, Thane",
        department: "Computer Engineering",
        year: "SE",
        studentid: "23102017",
        location: "Mumbai, Maharashtra",
        workplace: "Microsoft SWE Intern",
        photoUrl: "https://via.placeholder.com/150",
        bannerUrl: "https://via.placeholder.com/600x200",
      };
      setUser(fetchedUser);
    };
    fetchUser();
  }, []);

  const [posts, setPosts] = useState([
    {
      _id: "5",
      content:
        "🎓 Excited to share that I've completed my Certification in Full Stack Development! 🚀",
      author: { name: "Jane Doe" },
      imageUrl: "JohnDoeCertificate.png",
      likes: 0,
      liked: false,
      comments: [],
    },
    {
      _id: "1",
      content:
        "This is a mock post! Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      author: { name: "John Doe" },
      likes: 0,
      liked: false,
      comments: [],
    },
    {
      _id: "2",
      content:
        "Another post for demonstration purposes. Lorem ipsum dolor sit amet.",
      author: { name: "Avishkar Paradkar" },
      likes: 0,
      liked: false,
      comments: [],
    },
    {
      _id: "3",
      content:
        "Feeling great today! Let's connect. Lorem ipsum dolor sit amet.",
      author: { name: "Darsh Kalathiya" },
      likes: 0,
      liked: false,
      comments: [],
    },
    {
      _id: "4",
      content: "Just launched a new project at work.",
      author: { name: "Jaideep Koya" },
      likes: 0,
      liked: false,
      comments: [],
    },
  ]);

  const recommendedUsers = [
    { _id: "1", name: "Vinayak Mishra" },
    { _id: "2", name: "Mihir Mehta" },
    { _id: "3", name: "Saish Joshi" },
    { _id: "4", name: "Chinmay Nanote" },
  ];

  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState(null);

  // Handle posting a new post
  const handlePost = () => {
    if (newPostContent.trim() === "" && !newPostImage) {
      return;
    }

    const newPost = {
      _id: (posts.length + 1).toString(),
      content: newPostContent,
      author: { name: authUser.name },
      imageUrl: newPostImage,
      likes: 0,
      liked: false, // Initialize liked state
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
    setNewPostImage(null);
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPostImage(URL.createObjectURL(file));
    }
  };

  // Handle liking/disliking a post
  const handleLikeToggle = (postId) => {
    setPosts(
      posts.map((post) => {
        if (post._id === postId) {
          const newLikes = post.liked ? post.likes - 1 : post.likes + 1; // Increment or decrement likes
          return { ...post, likes: newLikes, liked: !post.liked }; // Toggle liked status
        }
        return post;
      })
    );
  };

  // Handle commenting on a post
  const handleComment = (postId, comment) => {
    if (!comment) return;
    setPosts(
      posts.map((post) =>
        post._id === postId
          ? { ...post, comments: [...post.comments, comment] }
          : post
      )
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="hidden lg:block lg:col-span-1 bg-gray-200 p-4">
        {user && <Sidebar user={user} />}
      </div>

      {/* Main Content */}
      <div className="col-span-1 lg:col-span-2 order-first lg:order-none p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-xl font-bold mb-2">Create Post</h2>
          <textarea
            className="w-full border rounded p-2"
            placeholder="What's on your mind?"
            rows="3"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <div className="mt-2">
            <label
              htmlFor="post-image"
              className="bg-gray-200 text-gray-800 py-1 px-4 rounded cursor-pointer inline-block mr-2"
            >
              Add Image
            </label>
            <input
              id="post-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded"
              onClick={handlePost}
            >
              Post
            </button>
          </div>

          {newPostImage && (
            <div className="mt-4">
              <img
                src={newPostImage}
                alt="Selected"
                className="max-w-full h-auto rounded"
              />
            </div>
          )}
        </div>

        
        {posts.map((post) => (
          <div key={post._id} className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-center mb-2">
              <img
                src={post.author.photoUrl || "/avatar.png"}
                alt={post.author.name}
                className="w-10 h-10 rounded-full mr-2"
              />
              <div>
                <h3 className="font-semibold">{post.author.name}</h3>
                <p className="text-gray-500 text-sm">{post.author.role}</p>
              </div>
            </div>
            <p className="mb-4">{post.content}</p>
            {post.imageUrl && (
              <div className="mb-4">
                <img
                  src={post.imageUrl}
                  alt="Post"
                  className="max-w-full h-auto rounded"
                />
              </div>
            )}
            <div className="flex items-center">
              <button
                className={`flex items-center mr-4 ${
                  post.liked ? "text-blue-500" : "text-gray-500"
                }`}
                onClick={() => handleLikeToggle(post._id)}
              >
                <ThumbsUp className="mr-1" size={16} />
                {post.likes} Likes
              </button>
              <Link
                to={`/posts/${post._id}`}
                className="text-gray-500 hover:text-gray-800"
              >
                Comment
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/*Here starts Recommended Users */}
      <div className="hidden lg:block lg:col-span-1 bg-gray-200 p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-xl font-bold mb-4">Recommended Users</h2>
          <ul>
            {recommendedUsers.map((user) => (
              <li key={user._id} className="flex items-center mb-2">
                <img
                  src={`/avatars/${user._id}.png`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full mr-2"
                />
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <Link
                    to={`/profile/${user._id}`}
                    className="text-blue-500 text-sm"
                  >
                    View Profile
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
