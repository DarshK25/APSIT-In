import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Eye, MessageSquare, ThumbsUp, Trash2, UserPlus, Bell, Home } from "react-feather"; 
import { formatDistanceToNow } from "date-fns";

const Sidebar = ({ user }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 text-center">
        <div
          className="h-16 w-full rounded-t-lg bg-cover bg-center"
          style={{
            backgroundImage: `url("${user.bannerUrl || "/banner.png"}")`,
          }}
        />
        <Link to={`/profile/${user.username}`}>
          <img
            src={user.photoUrl || "/avatar.png"}
            alt={user.name}
            className="w-20 h-20 rounded-full mx-auto mt-[-40px] border-4 border-white"
          />
          <h2 className="text-xl font-semibold mt-2">{user.name}</h2>
        </Link>
        <p className="text-gray-700">{user.headline}</p>
        <p className="text-gray-700 text-xs">{user.connections.length} connections</p>
        <p className="text-gray-700 text-xs">{user.year} {user.department}</p>
        <p className="text-gray-700 text-xs">{user.studentid}</p>
        <p className="text-gray-700 text-xs md:font-bold">{user.workplace}</p>
        <p className="text-gray-700 text-xs">{user.status}</p>
        <p className="text-gray-700 text-xs">{user.location}</p>
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
        <Link to={`/profile/${user.username}`} className="text-sm font-semibold">
          Visit your profile
        </Link>
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]); // State for notifications

  useEffect(() => {
    const fetchUser = () => {
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

    const fetchNotifications = () => {
      // Simulated notifications fetch
      const fetchedNotifications = [
        {
          _id: "1",
          type: "like",
          relatedUser: {
            name: "John Doe",
            username: "john_doe",
            profilePicture: "/avatar.png",
          },
          relatedPost: {
            _id: "101",
            content: "This is an example post content",
            image: "/example.jpg",
          },
          createdAt: new Date(),
          read: false,
        },
        {
          _id: "2",
          type: "comment",
          relatedUser: {
            name: "Jane Smith",
            username: "jane_smith",
            profilePicture: "/avatar.png",
          },
          relatedPost: {
            _id: "102",
            content: "Another post with a comment",
          },
          createdAt: new Date(),
          read: true,
        },
      ];
      setNotifications(fetchedNotifications);
    };
    fetchNotifications();
  }, []);

  const renderNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <ThumbsUp className="text-blue-500" />;
      case "comment":
        return <MessageSquare className="text-green-500" />;
      case "connectionAccepted":
        return <UserPlus className="text-purple-500" />;
      default:
        return null;
    }
  };

  const renderNotificationContent = (notification) => {
    switch (notification.type) {
      case "like":
        return (
          <span>
            <strong>{notification.relatedUser.name}</strong> liked your post
          </span>
        );
      case "comment":
        return (
          <span>
            <Link to={`/profile/${notification.relatedUser.username}`} className="font-bold">
              {notification.relatedUser.name}
            </Link>{" "}
            commented on your post
          </span>
        );
      case "connectionAccepted":
        return (
          <span>
            <Link to={`/profile/${notification.relatedUser.username}`} className="font-bold">
              {notification.relatedUser.name}
            </Link>{" "}
            accepted your connection request
          </span>
        );
      default:
        return null;
    }
  };

  const renderRelatedPost = (relatedPost) => {
    if (!relatedPost) return null;

    return (
      <Link
        to={`/post/${relatedPost._id}`}
        className="mt-2 p-2 bg-gray-50 rounded-md flex items-center space-x-2 hover:bg-gray-100 transition-colors"
      >
        {relatedPost.image && (
          <img src={relatedPost.image} alt="Post preview" className="w-10 h-10 object-cover rounded" />
        )}
        <div className="flex-1 overflow-hidden">
          <p className="text-sm text-gray-600 truncate">{relatedPost.content}</p>
        </div>
        <ExternalLink size={14} className="text-gray-400" />
      </Link>
    );
  };

  const markAsRead = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification._id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const deleteNotification = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification._id !== id)
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="hidden lg:block lg:col-span-1 bg-gray-200 p-4">
        {user && <Sidebar user={user} />}
      </div>
      <div className="col-span-1 lg:col-span-3">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Notifications</h1>

          {notifications.length > 0 ? (
            <ul>
              {notifications.map((notification) => (
                <li
                  key={notification._id}
                  className={`bg-white border rounded-lg p-4 my-4 transition-all hover:shadow-md ${
                    !notification.read ? "border-blue-500" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {renderNotificationIcon(notification.type)}
                      {renderNotificationContent(notification)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                    </div>
                  </div>
                  {renderRelatedPost(notification.relatedPost)}
                  <div className="flex justify-end mt-2 space-x-2">
                    <button onClick={() => markAsRead(notification._id)} className="text-blue-600">
                      Mark as read
                    </button>
                    <button onClick={() => deleteNotification(notification._id)} className="text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No notifications available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;