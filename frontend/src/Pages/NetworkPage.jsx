import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, UserPlus, Bell } from "lucide-react";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar.jsx";
import userService from "../api/userService";
import connectionService from "../api/connectionService";

// UserCard component
const UserCard = ({ user, onConnect, onRemove, connectionStatus }) => {
	return (
		<div className='bg-white rounded-lg shadow p-4 flex flex-col items-center transition-all hover:shadow-md'>
			<Link to={`/profile/${user.username}`} className='flex flex-col items-center'>
				<img
					src={user.profilePicture || "/avatar.png"}
					alt={user.name}
					className='w-24 h-24 rounded-full object-cover mb-4'
				/>
				<h3 className='font-semibold text-lg text-center'>{user.name}</h3>
			</Link>
			<p className='text-gray-600 text-center line-clamp-2'>{user.headline}</p>
			<p className='text-sm text-gray-500 mt-2'>{user.connections?.length || 0} connections</p>
			
			{connectionStatus === 'not_connected' && (
				<button 
					onClick={() => onConnect(user._id)}
					className='mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full flex items-center justify-center gap-2'
				>
					<UserPlus size={18} />
					Connect
				</button>
			)}
			
			{connectionStatus === 'pending' && (
				<button 
					className='mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md cursor-not-allowed w-full'
					disabled
				>
					Request Pending
				</button>
			)}
			
			{connectionStatus === 'connected' && (
				<button 
					onClick={() => onRemove(user._id)}
					className='mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors w-full'
				>
					Remove Connection
				</button>
			)}
		</div>
	);
};

// FriendRequest component
const FriendRequest = ({ request, onAccept, onReject }) => {
	return (
		<div className='bg-white rounded-lg shadow p-4 flex items-center justify-between transition-all hover:shadow-md'>
			<div className='flex items-center gap-4'>
				<Link to={`/profile/${request.sender.username}`}>
					<img
						src={request.sender.profilePicture || "/avatar.png"}
						alt={request.sender.name}
						className='w-16 h-16 rounded-full object-cover'
					/>
				</Link>

				<div>
					<Link to={`/profile/${request.sender.username}`} className='font-semibold text-lg hover:underline'>
						{request.sender.name}
					</Link>
					<p className='text-gray-600 line-clamp-1'>{request.sender.headline}</p>
					<p className='text-sm text-gray-500'>{request.sender.connections?.length || 0} connections</p>
				</div>
			</div>

			<div className='space-x-2'>
				<button
					className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
					onClick={() => onAccept(request._id)}
				>
					Accept
				</button>
				<button
					className='bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors'
					onClick={() => onReject(request._id)}
				>
					Reject
				</button>
			</div>
		</div>
	);
};

// Main NetworkPage component
const NetworkPage = () => {
	const [user, setUser] = useState(null);
	const [connectionRequests, setConnectionRequests] = useState([]);
	const [connections, setConnections] = useState([]);
	const [suggestedUsers, setSuggestedUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				const [userData, requestsData, connectionsData, suggestionsData] = await Promise.all([
					userService.getCurrentUser(),
					connectionService.getConnectionRequests(),
					connectionService.getConnections(),
					userService.getSuggestedUsers()
				]);

				setUser(userData);
				setConnectionRequests(requestsData);
				setConnections(connectionsData);
				setSuggestedUsers(suggestionsData);
			} catch (err) {
				console.error("Error fetching network data:", err);
				setError(err.response?.data?.message || "An error occurred while fetching data");
				toast.error("Failed to load network data");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const handleAcceptRequest = async (requestId) => {
		try {
			await connectionService.acceptConnectionRequest(requestId);
			setConnectionRequests((prev) => prev.filter((req) => req._id !== requestId));
			
			// Refresh connections list
			const updatedConnections = await connectionService.getConnections();
			setConnections(updatedConnections);
			
			toast.success("Connection request accepted");
		} catch (error) {
			console.error("Error accepting connection request:", error);
			toast.error("Failed to accept connection request");
		}
	};

	const handleRejectRequest = async (requestId) => {
		try {
			await connectionService.rejectConnectionRequest(requestId);
			setConnectionRequests((prev) => prev.filter((req) => req._id !== requestId));
			toast.success("Connection request rejected");
		} catch (error) {
			console.error("Error rejecting connection request:", error);
			toast.error("Failed to reject connection request");
		}
	};

	const handleRemoveConnection = async (userId) => {
		try {
			await connectionService.removeConnection(userId);
			setConnections((prev) => prev.filter((conn) => conn._id !== userId));
			toast.success("Connection removed");
		} catch (error) {
			console.error("Error removing connection:", error);
			toast.error("Failed to remove connection");
		}
	};

	const handleSendRequest = async (userId) => {
		try {
			await connectionService.sendConnectionRequest(userId);
			setSuggestedUsers((prev) =>
				prev.map((user) =>
					user._id === userId
						? { ...user, connectionStatus: "pending" }
						: user
				)
			);
			toast.success("Connection request sent");
		} catch (error) {
			console.error("Error sending connection request:", error);
			toast.error("Failed to send connection request");
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
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 bg-gray-50'>
			<div className="hidden lg:block lg:col-span-1">
				{user && <Sidebar user={user} />}
			</div>
			
			<div className='col-span-1 lg:col-span-3 space-y-6'>
				{/* Connection Requests Section */}
				{connectionRequests.length > 0 && (
					<div className='bg-white rounded-lg shadow p-6'>
						<h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
							<UserPlus size={24} className="text-blue-600" />
							Connection Requests
						</h2>
						<div className='space-y-4'>
							{connectionRequests.map((request) => (
								<FriendRequest
									key={request._id}
									request={request}
									onAccept={handleAcceptRequest}
									onReject={handleRejectRequest}
								/>
							))}
						</div>
					</div>
				)}

				{/* Suggested Connections */}
				{suggestedUsers.length > 0 && (
					<div className='bg-white rounded-lg shadow p-6'>
						<h2 className='text-xl font-semibold mb-4'>People You May Know</h2>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{suggestedUsers.map((user) => (
								<UserCard
									key={user._id}
									user={user}
									onConnect={handleSendRequest}
									connectionStatus="not_connected"
								/>
							))}
						</div>
					</div>
				)}

				{/* My Connections */}
				<div className='bg-white rounded-lg shadow p-6'>
					<h2 className='text-xl font-semibold mb-4'>My Connections ({connections.length})</h2>
					{connections.length > 0 ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{connections.map((connection) => (
								<UserCard
									key={connection._id}
									user={connection}
									onRemove={handleRemoveConnection}
									connectionStatus="connected"
								/>
							))}
						</div>
					) : (
						<p className='text-center text-gray-500 py-4'>
							You haven't connected with anyone yet. Start by exploring suggested connections!
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default NetworkPage;
