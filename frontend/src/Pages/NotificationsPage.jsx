import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, Eye, MessageSquare, ThumbsUp, Trash2, UserPlus, Bell, Home, Check, CheckCircle, Calendar, Heart, RefreshCw } from "react-feather"; 
import { formatDistanceToNow, format } from "date-fns";
import { toast } from 'react-hot-toast';
import notificationService from '../api/notificationService';
import userService from '../api/userService';

const Sidebar = ({ user }) => {
  if (!user) return null;
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 text-center">
        <div
          className="h-16 w-full rounded-t-lg bg-cover bg-center"
          style={{
            backgroundImage: `url(${user.bannerUrl || "/default-banner.jpg"})`
          }}
        />
        <Link to={`/profile/${user.username}`}>
          <img
            src={user.photoUrl || "/default-avatar.jpg"}
            alt={user.name}
            className="w-20 h-20 rounded-full mx-auto mt-[-40px] border-4 border-white"
          />
          <h2 className="text-xl font-semibold mt-2">{user.name}</h2>
        </Link>
        <p className="text-gray-700">{user.headline}</p>
        {user.connections && (
          <p className="text-gray-700 text-xs">{user.connections.length} connections</p>
        )}
        <p className="text-gray-700 text-xs">{user.year} {user.department}</p>
        <p className="text-gray-700 text-xs">{user.studentid}</p>
        {user.workplace && (
          <p className="text-gray-700 text-xs md:font-bold">{user.workplace}</p>
        )}
        {user.status && (
          <p className="text-gray-700 text-xs">{user.status}</p>
        )}
        {user.location && (
          <p className="text-gray-700 text-xs">{user.location}</p>
        )}
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
                className="flex items-center py-2 px-4 rounded-md hover:bg-gray-200 transition-colors bg-gray-100"
              >
                <Bell className="mr-2" size={20} /> Notifications
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
    const navigate = useNavigate();

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'follow':
                return <UserPlus className="w-5 h-5 text-blue-500" />;
            case 'like':
                return <Heart className="w-5 h-5 text-red-500" />;
            case 'comment':
                return <MessageSquare className="w-5 h-5 text-green-500" />;
            case 'event':
                return <Calendar className="w-5 h-5 text-purple-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const handleClick = () => {
        if (!notification.read) {
            onMarkAsRead(notification._id);
        }
        
        switch (notification.type) {
            case 'post':
            case 'like':
            case 'comment':
                if (notification.post) {
                    navigate(`/posts/${notification.post._id}`);
                }
                break;
            case 'follow':
                if (notification.sender) {
                    navigate(`/profile/${notification.sender.username}`);
                }
                break;
            case 'event':
                if (notification.event) {
                    navigate(`/events/${notification.event._id}`);
                }
                break;
            default:
                break;
        }
    };

    return (
        <div 
            className={`flex items-start gap-4 p-4 ${notification.read ? 'bg-white' : 'bg-blue-50'} hover:bg-gray-50 transition-colors cursor-pointer border-b`}
            onClick={handleClick}
        >
            <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-grow">
                <div className="text-sm text-gray-900">
                    {notification.sender && (
                        <span className="font-medium">{notification.sender.name}</span>
                    )}
                    <span className="ml-1">{notification.message}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
            </div>
            <div className="flex-shrink-0 flex gap-2">
                {!notification.read && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notification._id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full"
                        title="Mark as read"
                    >
                        <Check className="w-4 h-4 text-blue-500" />
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification._id);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full"
                    title="Delete notification"
                >
                    <Trash2 className="w-4 h-4 text-red-500" />
                </button>
            </div>
        </div>
    );
};

const NotificationsPage = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userData = await userService.getCurrentUser();
        setUser(userData);

        const notificationsResponse = await notificationService.getAllNotifications();
        if (notificationsResponse.success) {
          setNotifications(notificationsResponse.data);
        } else {
          throw new Error(notificationsResponse.message || 'Failed to fetch notifications');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getAllNotifications();
      if (response.success) {
        setNotifications(response.data);
        toast.success('Notifications refreshed');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(notifications.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        ));
        toast.success('Marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error(error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error(error.message);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.success) {
        setNotifications(notifications.filter(notif => notif._id !== notificationId));
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(error.message);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        const response = await notificationService.deleteAllNotifications();
        if (response.success) {
          setNotifications([]);
          toast.success('All notifications cleared');
        }
      } catch (error) {
        console.error('Error deleting all notifications:', error);
        toast.error(error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4">
      <div className="hidden lg:block lg:col-span-1">
        <Sidebar user={user} />
      </div>
      <div className="col-span-1 lg:col-span-3">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
            </h1>
            <div className="flex gap-2">
              <button
                onClick={fetchNotifications}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                title="Refresh notifications"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleMarkAllAsRead}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                title="Mark all as read"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
              <button
                onClick={handleDeleteAll}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                title="Clear all notifications"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;