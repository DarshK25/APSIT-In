import { UserPlus, UserMinus, UserCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const UserCard = ({ user, onConnect, onRemove, connectionStatus }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`${
        theme === 'dark'
          ? 'bg-dark-secondary hover:bg-dark-hover border-gray-700'
          : 'bg-white hover:bg-gray-50 border-gray-200'
      } p-4 rounded-lg border transition-colors duration-200`}
    >
      <div className="flex items-center space-x-4">
        <img
          src={user.profilePicture || "/default-avatar.png"}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            {user.name}
          </h3>
          <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {user.headline || "APSIT Student"}
          </p>
        </div>
        {connectionStatus === "not_connected" && (
          <button
            onClick={() => onConnect(user._id)}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'text-blue-400 hover:bg-blue-500/10'
                : 'text-blue-500 hover:bg-blue-500/10'
            }`}
            title="Connect"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        )}
        {connectionStatus === "pending" && (
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Pending
          </span>
        )}
        {connectionStatus === "connected" && (
          <div className="flex space-x-2">
            <span className={`flex items-center ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`}>
              <UserCheck className="h-5 w-5" />
            </span>
            <button
              onClick={() => onRemove(user._id)}
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-red-500 hover:bg-red-500/10'
              }`}
              title="Remove Connection"
            >
              <UserMinus className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard; 