import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import clubService from '../api/clubService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const ClubSearch = ({ onSelectClub, selectedClub, disabled = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Auto-select current user if it's a club account
    useEffect(() => {
        if (user?.accountType === 'club' && !selectedClub) {
            const clubData = {
                _id: user._id,
                name: user.name,
                headline: user.headline,
                profilePicture: user.profilePicture,
                accountType: user.accountType
            };
            onSelectClub(clubData);
            setSearchQuery(user.name);
        }
    }, [user, selectedClub, onSelectClub]);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setLoading(true);
            const response = await clubService.getUserClubs();

            if (response) {
                // If user is a club account, only allow selecting themselves
                if (user.accountType === 'club') {
                    const clubData = {
                        _id: user._id,
                        name: user.name,
                        headline: user.headline,
                        profilePicture: user.profilePicture,
                        accountType: user.accountType
                    };
                    setSearchResults([clubData]);
                } else {
                    // For non-club users, filter clubs based on search query
                    const filteredClubs = response.filter(club => 
                        club.name.toLowerCase().includes(query.toLowerCase()) ||
                        (club.headline?.toLowerCase() || '').includes(query.toLowerCase())
                    );
                    setSearchResults(filteredClubs);
                }
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching clubs:', error);
            toast.error('Failed to search clubs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Don't show search input if user is a club account
    if (user?.accountType === 'club') {
        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Organizing Club
                </label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center space-x-3">
                    <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                    />
                    <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.headline}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                Organizing Club
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search for clubs you're a member of..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={disabled || user?.accountType === 'club'}
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchResults.map(club => (
                        <button
                            key={club._id}
                            type="button"
                            onClick={() => {
                                onSelectClub(club);
                                setSearchQuery(club.name);
                                setSearchResults([]);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-dark-hover flex items-center space-x-3"
                        >
                            <img
                                src={club.profilePicture}
                                alt={club.name}
                                className="w-8 h-8 rounded-full"
                            />
                            <div>
                                <div className="font-medium text-gray-900 dark:text-dark-text-primary">{club.name}</div>
                                <div className="text-sm text-gray-500 dark:text-dark-text-secondary">{club.headline}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Selected Club Display */}
            {selectedClub && !user?.accountType === 'club' && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-dark-hover rounded-lg flex items-center space-x-3">
                    <img
                        src={selectedClub.profilePicture}
                        alt={selectedClub.name}
                        className="w-10 h-10 rounded-full"
                    />
                    <div>
                        <div className="font-medium text-gray-900 dark:text-dark-text-primary">{selectedClub.name}</div>
                        <div className="text-sm text-gray-500 dark:text-dark-text-secondary">{selectedClub.headline}</div>
                    </div>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={() => {
                                onSelectClub(null);
                                setSearchQuery('');
                            }}
                            className="ml-auto text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClubSearch; 