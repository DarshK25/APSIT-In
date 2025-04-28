import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Clock, Users, Plus, Edit2, Trash2, MoreVertical, Search, Filter, Edit, Trash, Loader, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import eventService from '../api/eventService';
import clubService from '../api/clubService';
import { useNavigate } from 'react-router-dom';
import { canManageEvent, canRegisterForEvent } from '../utils/eventAuth';
import EditEventPage from './EditEventPage';

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                >
                    <X size={20} />
                </button>
                {children}
            </div>
        </div>
    );
};

// Event Card Component
const EventCard = ({ event, user, onDelete, onEdit, adminEmails = [] }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef(null);

    const canManage = useMemo(() => {
        if (!user || !event?.organizer) return false;

        // Check if user is the organizer (club account)
        if (user._id === event.organizer._id) return true;

        // Check if user is a member of the organizing club with any role
        if (event.organizer.members?.some(member => member.userId === user._id)) return true;

        // Check if user is an admin
        if (adminEmails.includes(user.email)) return true;

        return false;
    }, [user, event, adminEmails]);

    const registrationStatus = useMemo(() => {
        return canRegisterForEvent(user, event);
    }, [user, event]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async () => {
        if (!canManage) {
            toast.error('You do not have permission to delete this event');
            return;
        }
        
        // Custom toast confirmation
        toast((t) => (
            <div className="flex flex-col gap-4 p-2">
                <p className="font-medium">Are you sure you want to delete this event?</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            onDelete(event._id);
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 6000,
            position: 'top-center',
        });
    };

    const handleEdit = () => {
        if (!canManage) {
            toast.error('You do not have permission to edit this event');
            return;
        }
        onEdit(event);
    };

    const handleNavigateToClub = (e) => {
        e.stopPropagation();
        navigate(`/profile/${event.organizer.username}`);
    };

    const handleRegister = async () => {
        if (!registrationStatus.allowed) {
            toast.error(registrationStatus.reason);
            return;
        }
        setIsLoading(true);
        try {
            // Registration logic here
            toast.success('Successfully registered for event!');
        } catch (error) {
            toast.error(error.message || 'Failed to register for event');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
            {/* Club Profile Header */}
            {event.organizer && (
                <div 
                    onClick={handleNavigateToClub}
                    className="p-4 border-b border-gray-200 flex items-center space-x-3 cursor-pointer hover:bg-gray-50"
                >
                    <img
                        src={event.organizer.profilePicture}
                        alt={event.organizer.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-grow">
                        <h4 className="font-medium text-gray-900">{event.organizer.name}</h4>
                        <p className="text-sm text-gray-500">{event.organizer.headline || 'Club at APSIT'}</p>
                    </div>
                    {event.organizer.members?.length > 0 && (
                        <div className="text-sm text-gray-500">
                            {event.organizer.members.length} members
                        </div>
                    )}
                </div>
            )}

            <div className="relative">
                {event.image ? (
                    <img 
                        src={event.image} 
                        alt={event.title}
                        className="w-full h-48 object-cover"
                    />
                ) : (
                    <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-600" />
                )}
                {canManage && (
                    <div className="absolute top-2 right-2">
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className="p-1 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900"
                            >
                                <MoreVertical size={20} />
                            </button>
                            
                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                                    <button
                                        onClick={handleEdit}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <Edit size={16} />
                                        Edit Event
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                    >
                                        <Trash size={16} />
                                        Delete Event
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                
                <div className="mb-4">
                    <p className={`text-gray-600 ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {event.description}
                    </p>
                    {event.description && event.description.length > 100 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                            {isExpanded ? 'Show Less' : 'Show More'}
                        </button>
                    )}
                </div>
                
                <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{event.date ? format(new Date(event.date), 'MMM d, yyyy') : 'Date not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{event.time || 'Time not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{event.location || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                            {event.category || ''} - {event.department || ''}
                            {event.maxAttendees && ` (${(event.attendees && event.attendees.length) || 0}/${event.maxAttendees})`}
                        </span>
                    </div>
                    {event.registrationDeadline && (
                        <div className="pl-6 text-xs text-red-500 font-medium">
                            Registration closes: {format(new Date(event.registrationDeadline), 'MMM d, yyyy HH:mm')}
                        </div>
                    )}
                </div>
                
                <div className="mt-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRegister();
                        }}
                        disabled={!registrationStatus.allowed || isLoading}
                        className={`w-full px-4 py-2 rounded-md ${
                            registrationStatus.allowed
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader size={16} className="animate-spin" />
                                Registering...
                            </span>
                        ) : (
                            registrationStatus.allowed ? 'Register' : registrationStatus.reason
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Filter Component
const FilterSection = ({ filters, setFilters, categories, departments }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={filters.category || ''}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={filters.department || ''}
                        onChange={(e) => setFilters({...filters, department: e.target.value})}
                    >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={filters.status || ''}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">All Statuses</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>
            
            <div className="mt-4 flex justify-end">
                <button 
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    onClick={() => setFilters({})}
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );
};

// Main Events Page Component
const EventsPage = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({});
    const [editingEvent, setEditingEvent] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const navigate = useNavigate();

    // Admin check based on email
    const isAdmin = user && [
        'darshkalathiya25@gmail.com', 
        '23102187@apsit.edu.in', 
        'devopsclub@apsit.edu.in',
        'codersclub@apsit.edu.in', 
        'cybersecurityclub@apsit.edu.in', 
        'datascienceclub@apsit.edu.in'
    ].includes(user.email);

    useEffect(() => {
        fetchEvents();
        extractCategoriesAndDepartments();
    }, [filters]);

    const extractCategoriesAndDepartments = () => {
        // These would typically come from your API or a configuration file
        const allCategories = [
            "Coder's Club",
            "AIML Club",
            "DevOps Club",
            "Cybersecurity Club",
            "Data Science Club",
            "MAC Club",
            "Student Council",
            "OJUS Team",
            "GDG APSIT",
            "NSS Unit",
            "IEEE",
            "Antarang"
        ];
        
        const allDepartments = [
            'Computer Engineering',
            'Information Technology',
            'Computer Science & Engineering: Data Science', 
            'Computer Science & Engineering: Artificial Intelligence & Machine Learning', 
            'Civil Engineering',
            'Mechanical Engineering'
        ];
        
        setCategories(allCategories);
        setDepartments(allDepartments);
    };

    const fetchEvents = async () => {
        try {
            setLoading(true);
            
            // Build query parameters from filters
            const queryParams = {};
            if (filters.category) queryParams.category = filters.category;
            if (filters.department) queryParams.department = filters.department;
            if (filters.status) queryParams.status = filters.status;
            if (searchQuery) queryParams.search = searchQuery;
            
            const response = await eventService.getAllEvents(queryParams);
            
            if (response.success) {
                setEvents(response.data);
            } else {
                toast.error('Failed to fetch events');
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Error fetching events');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = () => {
        navigate('/events/create');
    };

    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditingEvent(null);
        setIsEditModalOpen(false);
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            const response = await eventService.deleteEvent(eventId);
            
            if (response.success) {
                toast.success('Event deleted successfully');
                fetchEvents(); // Refresh the events list
            } else {
                toast.error(response.message || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Error deleting event');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchEvents();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h1 className="text-3xl font-bold mb-4 md:mb-0">Events</h1>
                
                {isAdmin && (
                    <button
                        onClick={handleCreateEvent}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={18} /> Create Event
                    </button>
                )}
            </div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <button 
                        type="submit"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                    >
                        Search
                    </button>
                </div>
            </form>
            
            {/* Filters */}
            <FilterSection 
                filters={filters} 
                setFilters={setFilters} 
                categories={categories}
                departments={departments}
            />
            
            {/* Events Grid */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <EventCard 
                            key={event._id} 
                            event={event} 
                            onEdit={handleEditEvent}
                            onDelete={handleDeleteEvent}
                            user={user}
                            adminEmails={isAdmin ? ['darshkalathiya25@gmail.com', '23102187@apsit.edu.in', 'devopsclub@apsit.edu.in', 'codersclub@apsit.edu.in', 'cybersecurityclub@apsit.edu.in', 'datascienceclub@apsit.edu.in'] : []}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search query</p>
                </div>
            )}
            
            {/* Edit Event Modal */}
            <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal}>
                {editingEvent && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Edit Event</h2>
                        <EditEventPage 
                            event={editingEvent}
                            onSuccess={() => {
                                handleCloseEditModal();
                                fetchEvents();
                            }}
                            isModal={true}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default EventsPage; 