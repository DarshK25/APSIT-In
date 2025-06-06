import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, UserPlus, Bell, ChevronRight, Loader2, X, Check } from "lucide-react";
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
									<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
										<circle cx="12" cy="7" r="4" />
									</svg>
								</div>`;
						}}
					/>
				) : (
					<div className="w-24 h-24 rounded-full bg-gray-900 dark:bg-dark-hover ring-2 ring-gray-100 dark:ring-dark-border flex items-center justify-center mb-4">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
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
					Remove
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
			className='p-4 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors duration-200'
		>
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-3 min-w-0 flex-grow'>
					<Link to={`/profile/${request.sender.username}`} className='flex-shrink-0'>
						{request.sender.profilePicture ? (
							<img
								src={request.sender.profilePicture}
								alt={request.sender.name}
								className='w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-dark-hover'
								onError={(e) => {
									e.target.outerHTML = `
										<div class="w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-700 ring-2 ring-gray-100 dark:ring-dark-hover flex items-center justify-center">
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
												<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
												<circle cx="12" cy="7" r="4" />
											</svg>
										</div>`;
								}}
							/>
						) : (
							<div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-700 ring-2 ring-gray-100 dark:ring-dark-hover flex items-center justify-center">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
									<circle cx="12" cy="7" r="4" />
								</svg>
							</div>
						)}
					</Link>
					<div className='min-w-0 flex-grow'>
						<Link to={`/profile/${request.sender.username}`} className='block group'>
							<h3 className='text-sm font-semibold text-gray-900 dark:text-dark-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate'>
								{request.sender.name || 'APSIT Student'}
							</h3>
						</Link>
						<p className='text-sm text-gray-600 dark:text-dark-text-secondary line-clamp-1 truncate'>{request.sender.headline || 'APSIT Student'}</p>
						<p className='text-xs text-gray-500 dark:text-dark-text-muted mt-0.5'>{request.sender.connections?.length || 0} connections</p>
					</div>
				</div>

				<div className='flex-shrink-0 flex items-center space-x-2'>
					{isConnection ? (
						<>
							{/* Full button for large screens */}
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className='hidden md:flex bg-gray-200 dark:bg-dark-hover text-gray-800 dark:text-dark-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-dark-hover/80 transition-colors items-center justify-center gap-2'
								onClick={() => onReject(request.sender._id)}
							>
								<span>Remove</span>
							</motion.button>
							{/* Circular icon for small screens */}
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className='md:hidden w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-hover text-gray-800 dark:text-dark-text-primary hover:bg-gray-300 dark:hover:bg-dark-hover/80 transition-colors flex items-center justify-center'
								onClick={() => onReject(request.sender._id)}
							>
								<X size={16} className='w-4 h-4'/>
							</motion.button>
						</>
					) : (
						<>
							{/* Full buttons for large screens */}
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className='hidden md:flex bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors items-center justify-center gap-2'
								onClick={() => onAccept(request._id)}
							>
								<span>Accept</span>
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className='hidden md:flex bg-gray-200 dark:bg-dark-hover text-gray-800 dark:text-dark-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-dark-hover/80 transition-colors items-center justify-center gap-2'
								onClick={() => onReject(request._id)}
							>
								<span>Reject</span>
							</motion.button>
							{/* Circular icons for small screens */}
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className='md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors items-center justify-center'
								onClick={() => onAccept(request._id)}
							>
								<Check size={16} className='w-4 h-4'/>
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className='md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-hover text-gray-800 dark:text-dark-text-primary hover:bg-gray-300 dark:hover:bg-dark-hover/80 transition-colors items-center justify-center'
								onClick={() => onReject(request._id)}
							>
								<X size={16} className='w-4 h-4'/>
							</motion.button>
						</>
					)}
				</div>
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
						className='bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'
					>
						<div className="p-4 border-b border-gray-200 dark:border-dark-border">
							<h2 className='text-lg font-semibold flex items-center gap-2 dark:text-dark-text-primary'>
								<UserPlus size={20} className="text-blue-600" />
								Connection Requests
							</h2>
						</div>
						<div className='divide-y divide-gray-200 dark:divide-dark-border'>
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
					className='bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'
				>
					<div className="p-4 border-b border-gray-200 dark:border-dark-border">
						<h2 className='text-lg font-semibold dark:text-dark-text-primary'>My Connections ({connections.length})</h2>
					</div>
					{connections.length > 0 ? (
						<div className='divide-y divide-gray-200 dark:divide-dark-border'>
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
