import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, UserPlus, Bell, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar.jsx";
import Recommendations from "../components/Recommendations.jsx";
import userService from "../api/userService";
import connectionService from "../api/connectionService";

// UserCard component
const UserCard = ({ user, onConnect, onRemove, connectionStatus }) => {
	return (
		<motion.div 
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className='bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border flex flex-col items-center transition-all hover:shadow-md dark:hover:shadow-dark-hover'
		>
			<Link to={`/profile/${user.username}`} className='flex flex-col items-center'>
				{user.profilePicture ? (
					<img
						src={user.profilePicture}
						alt={user.name}
						className='w-24 h-24 rounded-full object-cover mb-4'
						onError={(e) => {
							e.target.outerHTML = `
								<div class="w-24 h-24 rounded-full bg-gray-900 dark:bg-dark-hover ring-2 ring-gray-100 dark:ring-dark-border flex items-center justify-center mb-4">
									<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
										<circle cx="12" cy="7" r="4" />
									</svg>
								</div>`;
						}}
					/>
				) : (
					<div className="w-24 h-24 rounded-full bg-gray-900 dark:bg-dark-hover ring-2 ring-gray-100 dark:ring-dark-border flex items-center justify-center mb-4">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
					</div>
				)}
				<h3 className='font-semibold text-lg text-center dark:text-dark-text-primary'>{user.name}</h3>
			</Link>
			<p className='text-gray-600 dark:text-dark-text-secondary text-center line-clamp-2'>{user.headline || 'APSIT Student'}</p>
			<p className='text-sm text-gray-500 dark:text-dark-text-muted mt-2'>
				{user.connectionsCount || user.connections?.length || 0} connections
			</p>
			
			{connectionStatus === 'not_connected' && (
				<motion.button 
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={() => onConnect(user._id)}
					className='mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full flex items-center justify-center gap-2'
				>
					<UserPlus size={18} />
					Connect
				</motion.button>
			)}
			
			{connectionStatus === 'pending' && (
				<button 
					className='mt-4 bg-gray-200 dark:bg-dark-hover text-gray-800 dark:text-dark-text-primary px-4 py-2 rounded-md cursor-not-allowed w-full'
					disabled
				>
					Request Pending
				</button>
			)}
			
			{connectionStatus === 'connected' && (
				<motion.button 
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={() => onRemove(user._id)}
					className='mt-4 bg-gray-200 dark:bg-dark-hover text-gray-800 dark:text-dark-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-dark-hover/80 transition-colors w-full'
				>
					Remove Connection
				</motion.button>
			)}
		</motion.div>
	);
};

// FriendRequest component
const FriendRequest = ({ request, onAccept, onReject, isConnection = false }) => {
	if (!request?.sender) return null;

	return (
		<motion.div 
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3 }}
			className='bg-white dark:bg-dark-card rounded-lg shadow p-4 border border-gray-200 dark:border-dark-border flex items-center justify-between transition-all hover:shadow-md dark:hover:shadow-dark-hover'
		>
			<div className='flex items-center gap-4'>
				<Link to={`/profile/${request.sender.username}`}>
					{request.sender.profilePicture ? (
						<img
							src={request.sender.profilePicture}
							alt={request.sender.name}
							className='w-16 h-16 rounded-full object-cover ring-2 ring-gray-100 dark:ring-dark-border'
							onError={(e) => {
								e.target.outerHTML = `
									<div class="w-16 h-16 rounded-full bg-gray-900 dark:bg-dark-hover ring-2 ring-gray-100 dark:ring-dark-border flex items-center justify-center">
										<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
											<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
											<circle cx="12" cy="7" r="4" />
										</svg>
									</div>`;
							}}
						/>
					) : (
						<div className="w-16 h-16 rounded-full bg-gray-900 dark:bg-dark-hover ring-2 ring-gray-100 dark:ring-dark-border flex items-center justify-center">
							<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
								<circle cx="12" cy="7" r="4" />
							</svg>
						</div>
					)}
				</Link>

				<div>
					<Link to={`/profile/${request.sender.username}`} className='font-semibold text-lg hover:underline dark:text-dark-text-primary'>
						{request.sender.name || 'APSIT Student'}
					</Link>
					<p className='text-gray-600 dark:text-dark-text-secondary line-clamp-1'>{request.sender.headline || 'APSIT Student'}</p>
					<p className='text-sm text-gray-500 dark:text-dark-text-muted'>{request.sender.connections?.length || 0} connections</p>
				</div>
			</div>

			<div className='space-x-2'>
				{isConnection ? (
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className='bg-gray-200 dark:bg-dark-hover text-gray-800 dark:text-dark-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-dark-hover/80 transition-colors'
						onClick={() => onReject(request.sender._id)}
					>
						Remove Connection
					</motion.button>
				) : (
					<>
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
							onClick={() => onAccept(request._id)}
						>
							Accept
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className='bg-gray-200 dark:bg-dark-hover text-gray-800 dark:text-dark-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-dark-hover/80 transition-colors'
							onClick={() => onReject(request._id)}
						>
							Reject
						</motion.button>
					</>
				)}
			</div>
		</motion.div>
	);
};

// Main NetworkPage component
const NetworkPage = () => {
	const [user, setUser] = useState(null);
	const [connectionRequests, setConnectionRequests] = useState([]);
	const [connections, setConnections] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);

				const [userData, requestsData, connectionsData] = await Promise.all([
					userService.getCurrentUser(),
					connectionService.getConnectionRequests(),
					connectionService.getConnections()
				]);

				setUser(userData);
				setConnectionRequests(requestsData);
				setConnections(connectionsData);
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

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
				<div className="text-center text-red-600 dark:text-red-400">
					<p className="text-xl font-semibold mb-2">Error</p>
					<p>{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 bg-gray-50 dark:bg-[#121212]'>
			<div className="hidden lg:block lg:col-span-1">
				{user && <Sidebar user={user} />}
			</div>
			
			<div className='col-span-1 lg:col-span-3 space-y-6'>
				{/* Connection Requests Section */}
				{connectionRequests.length > 0 && (
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className='bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border'
					>
						<h2 className='text-xl font-semibold mb-4 flex items-center gap-2 dark:text-dark-text-primary'>
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
					</motion.div>
				)}

				{/* My Connections */}
				<motion.div 
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-white dark:bg-dark-card rounded-lg shadow p-6 border border-gray-200 dark:border-dark-border'
				>
					<h2 className='text-xl font-semibold mb-4 dark:text-dark-text-primary'>My Connections ({connections.length})</h2>
					{connections.length > 0 ? (
						<div className='space-y-4'>
							{connections.map((connection) => (
								<FriendRequest
									key={connection._id}
									request={{ sender: connection }}
									onReject={handleRemoveConnection}
									isConnection={true}
								/>
							))}
						</div>
					) : (
						<p className='text-center text-gray-500 dark:text-dark-text-muted py-4'>
							You haven't connected with anyone yet. Start by exploring suggested connections!
						</p>
					)}
				</motion.div>

				{/* Recommended Connections Section */}
				{user && <Recommendations currentUser={user} />}
			</div>
		</div>
	);
};

export default NetworkPage;
