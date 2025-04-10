import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Clock, Users, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import eventService from '../api/eventService';
import axios from 'axios';

const EventCard = ({ event, onEdit, onDelete, isAdmin }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = () => {
        if (event.registrationFormLink) {
            window.open(event.registrationFormLink, '_blank');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
                <div className="mt-4 flex justify-between items-center">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        {isExpanded ? 'Show Less' : 'Show More'}
                    </button>

                    <div className="flex space-x-2">
                        {event.registrationFormLink && (
                            <button
                                onClick={handleRegister}
                                disabled={isLoading}
                                className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isLoading ? 'Loading...' : 'Register'}
                            </button>
                        )}
                        {isAdmin && onEdit && (
                            <button
                                onClick={() => onEdit(event)}
                                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Edit
                            </button>
                        )}
                        {isAdmin && onDelete && (
                            <button
                                onClick={() => onDelete(event._id)}
                                className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Time conversion utility functions
const convertTo24Hour = (time12h) => {
    if (!time12h) return '00:00';
    try {
        const [time, modifier] = time12h.split(' ');
        if (!time || !modifier) return time; // If no AM/PM, assume it's already 24h format
        
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours);
        
        if (hours === 12) {
            hours = modifier === 'PM' ? 12 : 0;
        } else if (modifier === 'PM') {
            hours = hours + 12;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } catch (error) {
        console.error('Error converting to 24 hour:', error);
        return '00:00';
    }
};

const convertTo12Hour = (time24) => {
    if (!time24) return '12:00 PM';
    try {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        if (isNaN(hour)) return '12:00 PM';
        
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
    } catch (error) {
        console.error('Error converting to 12 hour:', error);
        return '12:00 PM';
    }
};

const formatDateForInput = (dateString) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
};

const EventForm = ({ event, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(() => {
        if (event) {
            return {
                ...event,
                date: formatDateForInput(event.date),
                time: event.time || '12:00 PM'
            };
        }
        return {
            title: '',
            description: '',
            date: formatDateForInput(new Date()),
            time: '12:00 PM',
            location: '',
            category: '',
            department: '',
            maxAttendees: '',
            registrationDeadline: '',
            requirements: '',
            registrationFormLink: '',
            isPublished: true
        };
    });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(event?.image || '');

    const handleTimeChange = (e) => {
        const time24 = e.target.value;
        const time12 = convertTo12Hour(time24);
        setFormData(prev => ({ ...prev, time: time12 }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Create a new FormData instance
        const formDataToSubmit = new FormData();
        
        // Validate required fields
        const requiredFields = [
            'title',
            'description',
            'date',
            'time',
            'location',
            'category',
            'department',
            'registrationDeadline'
        ];

        // Check if any required field is missing or empty
        const missingFields = requiredFields.filter(field => !formData[field]);
        if (missingFields.length > 0) {
            toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        // Add all form fields to FormData
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                formDataToSubmit.append(key, value);
            }
        });

        // Append image if it exists
        if (image instanceof File) {
            formDataToSubmit.append('image', image);
        }

        console.log('Form data being submitted:', Object.fromEntries(formDataToSubmit));
        onSubmit(formDataToSubmit);
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
                        value={convertTo24Hour(formData.time)}
                        onChange={handleTimeChange}
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
                        <option value="None">None</option>
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
                        <option value="Information Technology">Information Technology</option>
                        <option value="CSE (AI & ML)">CSE (AI & ML)</option>
                        <option value="CSE (DS)">CSE (DS)</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Inter-Department">Inter-Department</option>
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
            <div>
                <label className="block text-sm font-medium text-gray-700">Event Cover Image</label>
                <div className="mt-1 flex items-center">
                    <div className="relative">
                        <img
                            src={imagePreview || '/placeholder-event.jpg'}
                            alt="Event cover preview"
                            className="h-32 w-32 object-cover rounded-lg"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <div className="ml-4">
                        <button
                            type="button"
                            onClick={() => document.querySelector('input[type="file"]').click()}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Choose Image
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Registration Form Link</label>
                <input
                    type="url"
                    value={formData.registrationFormLink}
                    onChange={(e) => setFormData({ ...formData, registrationFormLink: e.target.value })}
                    placeholder="https://forms.gle/..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                    Add a Google Forms link for event registration
                </p>
            </div>
            <div className="flex justify-end space-x-3">
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

    const handleCreateEvent = async (formData) => {
        try {
            // Convert FormData to a regular object for validation
            const eventData = {};
            for (let [key, value] of formData.entries()) {
                eventData[key] = value;
            }

            // Log the data being sent
            console.log('Creating event with data:', eventData);

            // Ensure all required fields are present
            const requiredFields = [
                'title',
                'description',
                'date',
                'time',
                'location',
                'category',
                'department',
                'registrationDeadline'
            ];

            // Check if any required field is missing
            const missingFields = requiredFields.filter(field => !eventData[field]);
            if (missingFields.length > 0) {
                toast.error(`Missing required fields: ${missingFields.join(', ')}`);
                return;
            }

            // Create a new FormData instance for the final submission
            const finalFormData = new FormData();
            
            // Add all required fields
            requiredFields.forEach(field => {
                finalFormData.append(field, eventData[field]);
            });

            // Add optional fields if they exist
            if (eventData.maxAttendees) finalFormData.append('maxAttendees', eventData.maxAttendees);
            if (eventData.requirements) finalFormData.append('requirements', eventData.requirements);
            if (eventData.registrationFormLink) finalFormData.append('registrationFormLink', eventData.registrationFormLink);
            if (eventData.image) finalFormData.append('image', eventData.image);

            // Add default values
            finalFormData.append('isPublished', 'true');
            finalFormData.append('status', 'upcoming');

            // Log the final FormData being sent
            console.log('Final FormData being sent:', Object.fromEntries(finalFormData));

            await eventService.createEvent(finalFormData);
            toast.success('Event created successfully');
            setShowForm(false);
            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            // Log the full error response if available
            if (error.response) {
                console.error('Error response:', error.response.data);
                toast.error(error.response.data.message || 'Failed to create event');
            } else {
                toast.error('Failed to create event. Please try again.');
            }
        }
    };

    const handleUpdateEvent = async (eventData) => {
        try {
            console.log('Starting event update with raw data:', eventData);
            
            // Create FormData for the update
            const formData = new FormData();

            // Handle basic fields first
            formData.append('title', eventData.get('title') || '');
            formData.append('description', eventData.get('description') || '');
            formData.append('location', eventData.get('location') || '');
            formData.append('category', eventData.get('category') || '');
            formData.append('department', eventData.get('department') || '');
            formData.append('requirements', eventData.get('requirements') || '');
            formData.append('registrationFormLink', eventData.get('registrationFormLink') || '');
            formData.append('maxAttendees', eventData.get('maxAttendees') || '0');
            formData.append('isPublished', true);

            // Get the date and time values
            const dateValue = eventData.get('date');
            const timeValue = eventData.get('time');

            console.log('Date value:', dateValue);
            console.log('Time value:', timeValue);

            if (!dateValue || !timeValue) {
                toast.error('Date and time are required');
                return;
            }

            try {
                // Convert time to 24-hour format if needed
                const time24 = timeValue.includes('M') ? convertTo24Hour(timeValue) : timeValue;
                
                // Format the date string
                const dateStr = formatDateForInput(dateValue);
                if (!dateStr) throw new Error('Invalid date format');
                
                // Combine date and time
                const dateTimeString = `${dateStr}T${time24}`;
                console.log('Constructed datetime:', dateTimeString);
                
                formData.append('date', dateTimeString);
                formData.append('time', timeValue);
            } catch (error) {
                console.error('Error formatting date/time:', error);
                toast.error('Invalid date or time format');
                return;
            }

            // Handle registration deadline
            const deadlineValue = eventData.get('registrationDeadline');
            if (deadlineValue) {
                try {
                    const deadlineStr = formatDateForInput(deadlineValue);
                    if (!deadlineStr) throw new Error('Invalid deadline format');
                    formData.append('registrationDeadline', deadlineStr);
                } catch (error) {
                    console.error('Error formatting registration deadline:', error);
                    toast.error('Invalid registration deadline format');
                    return;
                }
            }

            // Handle image if present
            const imageFile = eventData.get('image');
            if (imageFile instanceof File) {
                formData.append('image', imageFile);
            }

            console.log('Sending formatted data to server:', Object.fromEntries(formData));
            
            const response = await eventService.updateEvent(editingEvent._id, formData);
            console.log('Update response:', response);

            if (response.success) {
                toast.success('Event updated successfully');
                setEditingEvent(null);
                await fetchEvents(); // Re-fetch events to update the display
            } else {
                throw new Error(response.message || 'Failed to update event');
            }
        } catch (error) {
            console.error('Error updating event:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                toast.error(error.response.data.message || 'Failed to update event');
            } else {
                toast.error(error.message || 'Failed to update event. Please try again.');
            }
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
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b">
                                <h2 className="text-2xl font-semibold">
                                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                                </h2>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
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