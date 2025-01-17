import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, UserPlus, Bell, UserPlus as UserPlusIcon } from "lucide-react";

// Sidebar component
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

// UserCard component
const UserCard = ({ user, isConnection }) => {
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
			<p className='text-gray-600 text-center'>{user.headline}</p>
			<p className='text-sm text-gray-500 mt-2'>{user.connections?.length} connections</p>
			<button className='mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors w-full'>
				{isConnection ? "Connected" : "Connect"}
			</button>
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
					<Link to={`/profile/${request.sender.username}`} className='font-semibold text-lg'>
						{request.sender.name}
					</Link>
					<p className='text-gray-600'>{request.sender.headline}</p>
				</div>
			</div>

			<div className='space-x-2'>
				<button
					className='bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors'
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

	// Simulated fetching user data
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
	}, []);

	// Simulated fetching connection requests
	useEffect(() => {
		const fetchConnectionRequests = () => {
			const fetchedRequests = [
				{
					_id: 1,
					sender: {
						username: "jane.smith",
						name: "Jane Smith",
						headline: "Designer",
						profilePicture: "/avatar.png",
					},
				},
				{
					_id: 2,
					sender: {
						username: "mark.johnson",
						name: "Mark Johnson",
						headline: "Developer",
						profilePicture: "/avatar.png",
					},
				},
				// Mock new connection request
				{
					_id: 3,
					sender: {
						username: "emma.watson",
						name: "Emma Watson",
						headline: "Product Manager",
						profilePicture: "/avatar.png",
					},
				},
			];
			setConnectionRequests(fetchedRequests);
		};
		fetchConnectionRequests();
	}, []);

	// Simulated fetching connections
	useEffect(() => {
		const fetchConnections = () => {
			const fetchedConnections = [
				{
					_id: 1,
					username: "alice.brown",
					name: "Alice Brown",
					headline: "Content Writer",
					profilePicture: "/avatar.png",
				},
				{
					_id: 2,
					username: "bob.green",
					name: "Bob Green",
					headline: "Data Analyst",
					profilePicture: "/avatar.png",
				},
			];
			setConnections(fetchedConnections);
		};
		fetchConnections();
	}, []);

	const handleAcceptRequest = (requestId) => {
		setConnectionRequests((prevRequests) =>
			prevRequests.filter((request) => request._id !== requestId)
		);
		setUser((prevUser) => ({
			...prevUser,
			connections: [...prevUser.connections, requestId],
		}));
	};

	const handleRejectRequest = (requestId) => {
		setConnectionRequests((prevRequests) =>
			prevRequests.filter((request) => request._id !== requestId)
		);
	};

	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
			<div className="hidden lg:block lg:col-span-1 bg-gray-200 p-4">
				{user && <Sidebar user={user} />}
			</div>
			<div className='col-span-1 lg:col-span-3'>
				<div className='bg-white rounded-lg shadow p-6 mb-6'>
					<h1 className='text-2xl font-bold mb-6'>My Network</h1>

					{connectionRequests.length > 0 ? (
						<div className='mb-8'>
							<h2 className='text-xl font-semibold mb-2'>Connection Requests</h2>
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
					 ) : (
						<p>No new connection requests.</p>
					 )}

					<div>
						<h2 className='text-xl font-semibold mb-2'>My Connections</h2>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{connections.map((connection) => (
								<UserCard
									key={connection._id}
									user={connection}
									isConnection={true}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default NetworkPage;
