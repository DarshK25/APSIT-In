import { useState, useEffect } from "react";
import { Plus, Edit, X, User, Crown, Shield, UserPlus, Search } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import clubService from "../api/clubService";

const ClubMembersSection = ({ userData, isOwnProfile, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [members, setMembers] = useState(userData.members || []);
    const [pendingMembers, setPendingMembers] = useState([]); // For storing pending members before save
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [newMemberRole, setNewMemberRole] = useState("member");
    const [isSearching, setIsSearching] = useState(false);
    const [membersData, setMembersData] = useState([]);
    const [pendingMembersData, setPendingMembersData] = useState([]); // For storing pending member data
    const [isLoading, setIsLoading] = useState(true);
    const [failedMemberImages, setFailedMemberImages] = useState({});
    const [failedSearchImages, setFailedSearchImages] = useState({});
    const [failedPendingImages, setFailedPendingImages] = useState({});
    
    // Fetch member details when component loads
    useEffect(() => {
        if (userData._id) {
            fetchMembers();
        } else {
            setIsLoading(false);
        }
    }, [userData._id]);
    
    // When editing mode is entered, initialize pending members with current members
    useEffect(() => {
        if (isEditing) {
            setPendingMembers([...members]);
            setPendingMembersData([...membersData]);
        }
    }, [isEditing]);
    
    // Fetch club members from backend
    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            // Use the club service to fetch members
            const members = await clubService.getClubMembers(userData._id);
            console.log("Fetched members:", JSON.stringify(members));
            
            setMembers(members || []);
            
            // If members are already populated with user data, use that
            if (members && members.length > 0 && members[0].userId && typeof members[0].userId !== 'string') {
                console.log("Members have populated user data");
                const enrichedMembers = members.map(member => ({
                    ...member,
                    profile: member.userId // Assuming userId is the populated user object
                }));
                setMembersData(enrichedMembers);
            } else {
                // Otherwise, fetch the member details separately
                console.log("Need to fetch member details separately");
                fetchMemberDetails(members);
            }
        } catch (error) {
            console.error("Error fetching club members:", error);
            // Fall back to the members from props
            setMembers(userData.members || []);
            fetchMemberDetails(userData.members || []);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Fetch full details of members
    const fetchMemberDetails = async (membersList = members) => {
        try {
            const memberIds = membersList.map(member => member.userId);
            console.log("Fetching details for members with IDs:", memberIds);
            
            if (memberIds.length === 0) {
                console.log("No members to fetch details for");
                setMembersData([]);
                return;
            }
            
            // Make API call to fetch user details in batch
            const response = await axios.post('http://localhost:3000/api/v1/users/batch', 
                { userIds: memberIds },
                { withCredentials: true }
            );
            
            // Check if response has expected format
            if (response.data && response.data.success && Array.isArray(response.data.users)) {
                const memberProfiles = response.data.users;
                console.log("Fetched profiles for members:", memberProfiles.length);
                
                // Create enriched member objects with profile data
                const enrichedMembers = membersList.map(member => {
                    const profile = memberProfiles.find(p => p._id === member.userId);
                    
                    // If profile not found, use a placeholder
                    if (!profile) {
                        console.log(`No profile found for member with ID ${member.userId}`);
                        return {
                            ...member,
                            profile: { name: "Unknown User", username: "unknown" }
                        };
                    }
                    
                    return {
                        ...member,
                        profile
                    };
                });
                
                console.log("Created enriched member data:", enrichedMembers.length);
                setMembersData(enrichedMembers);
            } else {
                console.error("Invalid response format from batch user API:", response.data);
                createLocalMemberData(membersList);
            }
        } catch (error) {
            console.error("Error fetching member details:", error);
            createLocalMemberData(membersList);
        }
    };
    
    // Create member data from local information if the API fails
    const createLocalMemberData = (membersList = members) => {
        // Use any available information from userData.members
        const localMemberData = membersList.map(member => {
            // Try to extract user information from already loaded user data
            // For example, from posts, comments, or connections available in userData
            
            // For now, create a placeholder
            return {
                ...member,
                profile: { 
                    name: `Member (${member.role})`, 
                    username: "user" + Math.floor(Math.random() * 1000),
                    _id: member.userId
                }
            };
        });
        
        setMembersData(localMemberData);
        toast.error("Could not load member details from server");
    };

    const handleSearch = async (query) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }
        
        setIsSearching(true);
        try {
            // First try with 'query' parameter (correct according to backend)
            const response = await axios.get(`http://localhost:3000/api/v1/users/search?query=${query}`, {
                withCredentials: true
            });
            
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                // Filter out users who are already in pending members
                const pendingUserIds = pendingMembers.map(m => m.userId);
                const filteredResults = response.data.data.filter(
                    user => !pendingUserIds.includes(user._id)
                );
                setSearchResults(filteredResults);
            } else {
                setSearchResults([]);
                toast.error("Search returned an invalid response");
            }
        } catch (error) {
            console.error("Error searching users:", error);
            
            // For demo/development, create some dummy search results
            if (process.env.NODE_ENV !== 'production') {
                const dummyResults = [
                    { 
                        _id: 'user1' + Date.now(), 
                        name: `${query} User 1`, 
                        username: query.toLowerCase() + '1',
                        profilePicture: `https://api.dicebear.com/7.x/avatars/svg?seed=${query}1`
                    },
                    { 
                        _id: 'user2' + Date.now(), 
                        name: `${query} User 2`, 
                        username: query.toLowerCase() + '2',
                        profilePicture: `https://api.dicebear.com/7.x/avatars/svg?seed=${query}2`
                    }
                ];
                setSearchResults(dummyResults);
                toast.warning("Using demo search results (API unavailable)");
            } else {
                setSearchResults([]);
                toast.error("Failed to search users");
            }
        } finally {
            setIsSearching(false);
        }
    };

    // Add a user to pending members list (not saved to database yet)
    const handleAddPendingMember = (user) => {
        const userId = user._id;
        // Check if user is already in the pending list
        if (pendingMembers.some(m => getMemberId(m) === userId)) {
            toast.error("This user is already in your selection");
            return;
        }
        
        // Create new member object
        const newMember = {
            userId: userId,
            role: newMemberRole,
            joinDate: new Date().toISOString()
        };
        
        // Add to pending state
        setPendingMembers(prev => [...prev, newMember]);
        
        // Add to pending membersData as well for UI
        setPendingMembersData(prev => [...prev, {
            ...newMember,
            profile: user
        }]);
        
        // Clear the search results
        setSearchResults([]);
        setSearchQuery("");
        
        toast.success(`${user.name} added to selection (not saved yet)`);
    };

    // Remove a member from pending list
    const handleRemovePendingMember = (userId) => {
        setPendingMembers(pendingMembers.filter(m => getMemberId(m) !== userId));
        setPendingMembersData(pendingMembersData.filter(m => getMemberId(m) !== userId));
    };

    // Update a role in pending list
    const handleUpdatePendingRole = (userId, newRole) => {
        console.log(`Updating role for member with ID: ${userId} to ${newRole}`);
        
        setPendingMembers(pendingMembers.map(m => {
            const memberId = getMemberId(m);
            console.log(`Comparing member ID ${memberId} with ${userId}`);
            return memberId === userId ? { ...m, role: newRole } : m;
        }));
        
        setPendingMembersData(pendingMembersData.map(m => {
            const memberId = getMemberId(m);
            return memberId === userId ? { ...m, role: newRole } : m;
        }));
    };

    // Helper function to get the correct member ID format
    const getMemberId = (member) => {
        // Different scenarios for member ID storage
        if (typeof member.userId === 'string') {
            return member.userId;
        } else if (member.userId && member.userId._id) {
            return member.userId._id;
        } else if (member._id) {
            return member._id;
        } else {
            console.error("Cannot determine member ID format:", member);
            return null;
        }
    };

    // Save all changes to the backend
    const handleSave = async () => {
        try {
            console.log("Starting member operations");
            console.log("Current members:", JSON.stringify(members));
            console.log("Pending members:", JSON.stringify(pendingMembers));
            
            // First, handle adding new members
            const membersToAdd = pendingMembers.filter(pm => 
                !members.some(m => getMemberId(m) === getMemberId(pm))
            );
            console.log("Members to add:", membersToAdd.length);
            
            for (const member of membersToAdd) {
                const userId = getMemberId(member);
                if (userId) {
                    console.log(`Adding member ${userId} with role ${member.role}`);
                    await clubService.addClubMember(userData._id, userId, member.role);
                }
            }
            
            // Handle updating existing members' roles
            const membersToUpdate = [];
            
            for (const pendingMember of pendingMembers) {
                const pendingUserId = getMemberId(pendingMember);
                const existingMember = members.find(m => getMemberId(m) === pendingUserId);
                
                if (existingMember && existingMember.role !== pendingMember.role) {
                    membersToUpdate.push({
                        userId: pendingUserId,
                        newRole: pendingMember.role,
                        oldRole: existingMember.role
                    });
                }
            }
            
            console.log("Members to update:", membersToUpdate.length);
            
            for (const member of membersToUpdate) {
                console.log(`Updating member ${member.userId} from ${member.oldRole} to ${member.newRole}`);
                await clubService.updateMemberRole(userData._id, member.userId, member.newRole);
            }
            
            // Handle removing members
            const membersToRemove = [];
            
            for (const existingMember of members) {
                const existingUserId = getMemberId(existingMember);
                if (!pendingMembers.some(pm => getMemberId(pm) === existingUserId)) {
                    membersToRemove.push({
                        userId: existingUserId
                    });
                }
            }
            
            console.log("Members to remove:", membersToRemove.length);
            
            for (const member of membersToRemove) {
                console.log(`Removing member ${member.userId}`);
                await clubService.removeClubMember(userData._id, member.userId);
            }
            
            // Update the actual state with pending state
            setMembers(pendingMembers);
            setMembersData(pendingMembersData);
            
            // Call the parent component's save handler
            await onSave({ members: pendingMembers });
            
            setIsEditing(false);
            toast.success("Club members updated successfully");
            
            // Refresh data from the server
            fetchMembers();
        } catch (error) {
            console.error("Error saving members:", error);
            console.error("Error details:", error.response?.data);
            toast.error(error.response?.data?.message || "Failed to update members");
        }
    };

    // Cancel editing mode and revert changes
    const handleCancel = () => {
        setPendingMembers([...members]);
        setPendingMembersData([...membersData]);
        setIsEditing(false);
        setSearchResults([]);
        setSearchQuery("");
    };

    const getRoleIcon = (role) => {
        switch(role) {
            case 'president': return <Crown size={16} className="text-yellow-500" />;
            case 'vice-president': return <Shield size={16} className="text-blue-500" />;
            case 'secretary': return <User size={16} className="text-green-500" />;
            default: return <User size={16} className="text-gray-500" />;
        }
    };

    const handleMemberImageError = (userId) => {
        setFailedMemberImages(prev => ({ ...prev, [userId]: true }));
    };
    const handleSearchImageError = (userId) => {
        setFailedSearchImages(prev => ({ ...prev, [userId]: true }));
    };
    const handlePendingImageError = (userId) => {
        setFailedPendingImages(prev => ({ ...prev, [userId]: true }));
    };

    if (isLoading) {
        return (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Club Members</h2>
                </div>
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Club Members</h2>
                {isOwnProfile && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center text-primary hover:text-primary-dark transition duration-300"
                    >
                        <Edit size={20} className="mr-1" />
                        Manage Members
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div className="space-y-3">
                    {membersData.length > 0 ? (
                        membersData.map((member, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition duration-200">
                                <div className="flex items-center">
                                    {member.profile?.profilePicture && !failedMemberImages[member.profile?._id] ? (
                                        <img 
                                            src={member.profile.profilePicture}
                                            alt={member.profile?.name || "Member"}
                                            className="w-10 h-10 rounded-full mr-3 object-cover"
                                            onError={() => handleMemberImageError(member.profile?._id)}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mr-3">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-medium">{member.profile?.name || "Unknown Member"}</h4>
                                        <p className="text-sm text-gray-500">@{member.profile?.username || "unknown"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getRoleIcon(member.role)}
                                    <span className="capitalize text-sm">{member.role}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <User size={48} className="mx-auto mb-3 text-gray-300" />
                            <p>No members added yet</p>
                            {isOwnProfile && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="mt-2 text-primary hover:underline"
                                >
                                    Add club members
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search and Add Members
                        </label>
                        <div className="flex gap-2 flex-wrap md:flex-nowrap">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        handleSearch(e.target.value);
                                    }}
                                    className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Search users by name or username"
                                />
                                <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                {isSearching && (
                                    <div className="absolute right-3 top-2.5">
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                                    </div>
                                )}
                            </div>
                            <select
                                value={newMemberRole}
                                onChange={(e) => setNewMemberRole(e.target.value)}
                                className="w-full md:w-48 p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="member">Member</option>
                                <option value="secretary">Secretary</option>
                                <option value="vice-president">Vice President</option>
                                <option value="president">President</option>
                            </select>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="mt-3 border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                {searchResults.map(user => (
                                    <div 
                                        key={user._id} 
                                        className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center">
                                            {user.profilePicture && !failedSearchImages[user._id] ? (
                                                <img 
                                                    src={user.profilePicture}
                                                    alt={user.name}
                                                    className="w-8 h-8 rounded-full mr-3 object-cover"
                                                    onError={() => handleSearchImageError(user._id)}
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center mr-3">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                        <circle cx="12" cy="7" r="4" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-medium">{user.name}</h4>
                                                <p className="text-sm text-gray-500">@{user.username}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddPendingMember(user)}
                                            className="flex items-center text-primary hover:text-primary-dark px-3 py-1 rounded-full border border-primary hover:bg-primary/5 transition-colors"
                                        >
                                            <UserPlus size={16} className="mr-1" />
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                            <div className="mt-3 text-center py-3 text-gray-500 border rounded-lg">
                                No users found matching "{searchQuery}"
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="font-medium mb-3">Current Members ({pendingMembers.length})</h3>
                        {pendingMembers.length > 0 ? (
                            <div className="space-y-2">
                                {pendingMembersData.map((member, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center">
                                            {member.profile?.profilePicture && !failedPendingImages[member.profile?._id] ? (
                                                <img 
                                                    src={member.profile.profilePicture}
                                                    alt={member.profile?.name || "Member"}
                                                    className="w-10 h-10 rounded-full mr-3 object-cover"
                                                    onError={() => handlePendingImageError(member.profile?._id)}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mr-3">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                        <circle cx="12" cy="7" r="4" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-medium">{member.profile?.name || "Unknown Member"}</h4>
                                                <p className="text-sm text-gray-500">@{member.profile?.username || "unknown"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={member.role}
                                                onChange={(e) => {
                                                    const userId = getMemberId(member);
                                                    console.log(`Changing role for user ${userId} from ${member.role} to ${e.target.value}`);
                                                    handleUpdatePendingRole(userId, e.target.value);
                                                }}
                                                className="p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                            >
                                                <option value="member">Member</option>
                                                <option value="secretary">Secretary</option>
                                                <option value="vice-president">Vice President</option>
                                                <option value="president">President</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const userId = getMemberId(member);
                                                    console.log(`Removing user ${userId}`);
                                                    handleRemovePendingMember(userId);
                                                }}
                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                                                title="Remove member"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500 border rounded-lg">
                                <p>No members added yet</p>
                                <p className="text-sm mt-1">Search for users above to add them to your club</p>
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <button
                            onClick={handleSave}
                            className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={handleCancel}
                            className="border border-gray-300 text-gray-600 py-2 px-4 rounded hover:bg-gray-50 transition duration-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClubMembersSection;