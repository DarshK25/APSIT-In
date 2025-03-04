import {Link} from "react-router-dom";
import { Home, UserPlus, Bell } from "lucide-react";

const Sidebar = ({ user }) => {
  // If no user is provided, show a loading state
  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-16 w-full bg-gray-200 rounded-t-lg" />
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full mt-[-40px] border-4 border-white" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mt-4" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
            <div className="h-3 bg-gray-200 rounded w-1/3 mt-2" />
          </div>
        </div>
      </div>
    );
  }

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
            alt={user.name || "User"}
            className="w-20 h-20 rounded-full mx-auto mt-[-40px] border-4 border-white"
          />
          <h2 className="text-xl font-semibold mt-2">{user.name || "User"}</h2>
        </Link>
        <p className="text-gray-700">{user.headline || ""}</p>
        <p className="text-gray-700 text-xs">{(user.connections?.length || 0)} connections</p>
        <p className="text-gray-700 text-xs">
          {user.year} {user.department}
        </p>
        <p className="text-gray-700 text-xs">{user.studentid || ""}</p>
        <p className="text-gray-700 text-xs md:font-bold">{user.workplace || ""}</p>
        <p className="text-gray-700 text-xs">{user.status || ""}</p>
        <p className="text-gray-700 text-xs">{user.location || ""}</p>
      </div>
      <div className="border-t border-gray-300 p-4">
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                to="/home"
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

export default Sidebar;