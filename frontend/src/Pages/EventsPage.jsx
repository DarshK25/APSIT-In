import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Clock, Users, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import eventService from '../api/eventService';
import axios from 'axios';

const EventCard = ({ event, onEdit, onDelete, isAdmin }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
                <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-600" />
                <div className="absolute top-4 right-4">
                    {isAdmin && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <MoreVertical className="w-5 h-5 text-white" />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                                    <button
                                        onClick={() => {
                                            onEdit(event);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit Event
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDelete(event._id);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Event
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(event.date), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>
                            {event.category} - {event.department}
                            {event.maxAttendees && ` (${event.attendees?.length || 0}/${event.maxAttendees})`}
                        </span>
                    </div>
                    {event.registrationDeadline && (
                        <div className="text-sm text-gray-500">
                            Registration closes: {format(new Date(event.registrationDeadline), 'MMM d, yyyy HH:mm')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const EventForm = ({ event, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(event || {
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: '',
        department: '',
        maxAttendees: '',
        registrationDeadline: '',
        requirements: '',
        isPublished: true
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Event Title</label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="3"
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        <option value="">Select Category</option>
                        <option value="Coder's Club">Coder's Club</option>
                        <option value="AIML Club">AIML Club</option>
                        <option value="DevOps Club">DevOps Club</option>
                        <option value="Cybersecurity Club">Cybersecurity Club</option>
                        <option value="Data Science Club">Data Science Club</option>
                        <option value="MAC Club">MAC Club</option>
                        <option value="Student Council">Student Council</option>
                        <option value="OJUS Team">OJUS Team</option>
                        <option value="GDG APSIT">GDG APSIT</option>
                        <option value="NSS Unit">NSS Unit</option>
                        <option value="IEEE">IEEE</option>
                        <option value="Antarang">Antarang</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        <option value="">Select Department</option>
                        <option value="Computer Engineering">Computer Engineering</option>
                        <option value="IT Engineering">IT Engineering</option>
                        <option value="AI&DS Engineering">AI&DS Engineering</option>
                        <option value="EXTC Engineering">EXTC Engineering</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Maximum Attendees</label>
                    <input
                        type="number"
                        value={formData.maxAttendees}
                        onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        min="1"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
                    <input
                        type="datetime-local"
                        value={formData.registrationDeadline}
                        onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Requirements</label>
                <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="2"
                    placeholder="Any specific requirements for attendees..."
                />
            </div>
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    {event ? 'Update Event' : 'Create Event'}
                </button>
            </div>
        </form>
    );
};

const EventsPage = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [filter, setFilter] = useState('all');
    const [filters, setFilters] = useState({});
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

    const isAdmin = user?.email === 'darshkalathiya25@gmail.com' || user?.email === '23102187@apsit.edu.in' || user?.email === 'devopsclub@apsit.edu.in' 
    || user?.email === 'codersclub@apsit.edu.in' || user?.email === 'cybersecurityclub@apsit.edu.in' || user?.email === 'datascienceclub@apsit.edu.in';

    console.log('User:', user); // Debug log

    useEffect(() => {
        console.log('Effect triggered with filters:', filters, 'page:', pagination.page); // Debug log
        fetchEvents();
    }, [filters, pagination.page]);

    const fetchEvents = async () => {
        try {
            console.log('Fetching events...'); // Debug log
            setLoading(true);
            const queryParams = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            };
            
            console.log('Query params:', queryParams); // Debug log
            const response = await eventService.getAllEvents(queryParams);
            console.log('Events response:', response); // Debug log

            if (response.success) {
                setEvents(response.data || []);
                setPagination(prev => ({
                    ...prev,
                    ...response.pagination
                }));
            } else {
                console.error('Failed response:', response); // Debug log
                toast.error(response.message || 'Failed to load events');
                setEvents([]);
            }
        } catch (error) {
            console.error('Fetch error:', error); // Debug log
            if (error.response?.status === 404) {
                setEvents([]);
                setPagination(prev => ({ ...prev, total: 0, pages: 0 }));
            } else {
                toast.error(error.response?.data?.message || 'Failed to load events');
                setEvents([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (eventData) => {
        try {
            const eventWithDefaults = {
                ...eventData,
                isPublished: true,
                status: 'upcoming'
            };
            await eventService.createEvent(eventWithDefaults);
            toast.success('Event created successfully');
            setShowForm(false);
            fetchEvents();
        } catch (error) {
            toast.error('Failed to create event');
        }
    };

    const handleUpdateEvent = async (eventData) => {
        try {
            console.log('Updating event with data:', eventData);
            
            // Format dates properly and clean up the data
            const formattedData = {
                title: eventData.title,
                description: eventData.description,
                date: new Date(eventData.date).toISOString(),
                time: eventData.time,
                location: eventData.location,
                category: eventData.category,
                department: eventData.department,
                maxAttendees: parseInt(eventData.maxAttendees) || null,
                registrationDeadline: new Date(eventData.registrationDeadline).toISOString(),
                requirements: eventData.requirements,
                isPublished: eventData.isPublished
            };

            // Remove any undefined or null values
            Object.keys(formattedData).forEach(key => {
                if (formattedData[key] === undefined || formattedData[key] === null) {
                    delete formattedData[key];
                }
            });

            console.log('Formatted event data:', formattedData);
            
            await eventService.updateEvent(editingEvent._id, formattedData);
            toast.success('Event updated successfully');
            setEditingEvent(null);
            fetchEvents();
        } catch (error) {
            console.error('Error updating event:', error.response?.data || error);
            toast.error(error.response?.data?.message || 'Failed to update event');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await eventService.deleteEvent(eventId);
                toast.success('Event deleted successfully');
                fetchEvents();
            } catch (error) {
                toast.error('Failed to delete event');
            }
        }
    };

    const handleRegister = async (eventId) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/events/${eventId}/register`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Successfully registered for event');
                fetchEvents(); // Refresh events list
            } else {
                throw new Error(response.data.message || 'Failed to register');
            }
        } catch (error) {
            console.error('Failed to register:', error);
            toast.error(error.response?.data?.message || 'Failed to register for event');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setFilters({
            category: '',
            department: '',
            status: '',
            search: '',
            startDate: '',
            endDate: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const filteredEvents = events.filter(event => {
        if (filter === 'all') return true;
        return event.category.toLowerCase() === filter.toLowerCase();
    });

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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Events</h1>
                    {isAdmin && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Event
                        </button>
                    )}
                </div>

                {/* Filter Section */}
                <div className="mb-8">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="all">All Events</option>
                        <option value="Coder's Club">Coder's Club</option>
                        <option value="AIML Club">AIML Club</option>
                        <option value="DevOps Club">DevOps Club</option>
                        <option value="Cybersecurity Club">Cybersecurity Club</option>
                        <option value="Data Science Club">Data Science Club</option>
                        <option value="MAC Club">MAC Club</option>
                        <option value="Student Council">Student Council</option>
                        <option value="OJUS Team">OJUS Team</option>
                        <option value="GDG APSIT">GDG APSIT</option>
                        <option value="NSS Unit">NSS Unit</option>
                        <option value="IEEE">IEEE</option>
                        <option value="Antarang">Antarang</option>
                    </select>
                </div>

                {/* Event Form Modal */}
                {(showForm || editingEvent) && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                            <h2 className="text-2xl font-semibold mb-4">
                                {editingEvent ? 'Edit Event' : 'Create New Event'}
                            </h2>
                            <EventForm
                                event={editingEvent}
                                onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
                                onCancel={() => {
                                    setShowForm(false);
                                    setEditingEvent(null);
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                        <EventCard
                            key={event._id}
                            event={event}
                            onEdit={setEditingEvent}
                            onDelete={handleDeleteEvent}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>

                {filteredEvents.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No events found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPage; 