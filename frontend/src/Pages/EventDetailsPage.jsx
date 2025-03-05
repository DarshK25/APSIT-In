import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, MapPin, Users, Edit2, Trash2, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const EventDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);

    const fetchEvent = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/v1/events/${id}`,
                { withCredentials: true }
            );
            
            if (response.data.success) {
                setEvent(response.data.event);
                setIsRegistered(response.data.event.attendees.some(
                    attendee => attendee._id === user?._id
                ));
            } else {
                throw new Error(response.data.message || 'Failed to load event');
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
            toast.error(error.response?.data?.message || 'Failed to load event details');
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const handleRegister = async () => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/events/${id}/register`,
                {},
                { withCredentials: true }
            );
            
            if (response.data.success) {
                toast.success('Successfully registered for event');
                setIsRegistered(true);
                fetchEvent();
            } else {
                throw new Error(response.data.message || 'Failed to register');
            }
        } catch (error) {
            console.error('Failed to register:', error);
            toast.error(error.response?.data?.message || 'Failed to register for event');
        }
    };

    const handleUnregister = async () => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/events/${id}/unregister`,
                {},
                { withCredentials: true }
            );
            
            if (response.data.success) {
                toast.success('Successfully unregistered from event');
                setIsRegistered(false);
                fetchEvent();
            } else {
                throw new Error(response.data.message || 'Failed to unregister');
            }
        } catch (error) {
            console.error('Failed to unregister:', error);
            toast.error(error.response?.data?.message || 'Failed to unregister from event');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/v1/events/${id}`,
                { withCredentials: true }
            );
            
            if (response.data.success) {
                toast.success('Event deleted successfully');
                navigate('/events');
            } else {
                throw new Error(response.data.message || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Failed to delete event:', error);
            toast.error(error.response?.data?.message || 'Failed to delete event');
        }
    };

    const handleShare = async () => {
        try {
            await navigator.share({
                title: event.title,
                text: event.description,
                url: window.location.href
            });
        } catch (error) {
            console.error('Error sharing:', error);
            // Fallback to copying link
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!event) return null;

    const isOrganizer = user?._id === event.organizer._id;
    const registrationClosed = new Date() > new Date(event.registrationDeadline);
    const isFull = event.maxAttendees && event.attendees.length >= event.maxAttendees;

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Event Image */}
                {event.image ? (
                    <img
                        src={`${import.meta.env.VITE_API_URL}/${event.image}`}
                        alt={event.title}
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                            e.target.src = '/placeholder-event.jpg';
                        }}
                    />
                ) : (
                    <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-white" />
                    </div>
                )}

                {/* Event Content */}
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
                            <div className="flex items-center space-x-4 text-gray-600">
                                <span className="inline-flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {format(new Date(event.date), 'MMMM d, yyyy')}
                                </span>
                                <span className="inline-flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {event.time}
                                </span>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            {isOrganizer && (
                                <>
                                    <button
                                        onClick={() => navigate(`/events/${id}/edit`)}
                                        className="p-2 text-gray-600 hover:text-blue-500 transition-colors"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleShare}
                                className="p-2 text-gray-600 hover:text-blue-500 transition-colors"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="flex items-center space-x-2 text-gray-600">
                            <MapPin className="w-5 h-5" />
                            <span>{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                            <Users className="w-5 h-5" />
                            <span>
                                {event.attendees.length}
                                {event.maxAttendees && ` / ${event.maxAttendees}`} Attendees
                            </span>
                        </div>
                        <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 self-start">
                            {event.category}
                        </div>
                    </div>

                    <div className="prose max-w-none mb-6">
                        <h3 className="text-lg font-semibold mb-2">About the Event</h3>
                        <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
                    </div>

                    {event.requirements && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                            <p className="text-gray-600 whitespace-pre-line">{event.requirements}</p>
                        </div>
                    )}

                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Organizer</h3>
                            <p className="text-sm text-gray-500">
                                Registration closes on {format(new Date(event.registrationDeadline), 'MMMM d, yyyy')}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            {event.organizer?.profilePicture ? (
                                <img
                                    src={`${import.meta.env.VITE_API_URL}/${event.organizer.profilePicture}`}
                                    alt={event.organizer.name}
                                    className="w-10 h-10 rounded-full"
                                    onError={(e) => {
                                        e.target.src = '/placeholder-avatar.jpg';
                                    }}
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-blue-600 font-medium">
                                        {event.organizer?.name?.charAt(0)}
                                    </span>
                                </div>
                            )}
                            <div>
                                <p className="font-medium">{event.organizer?.name}</p>
                                <p className="text-sm text-gray-500">{event.department}</p>
                            </div>
                        </div>
                    </div>

                    {user && !isOrganizer && (
                        <div className="mt-6 border-t border-gray-200 pt-6">
                            {isRegistered ? (
                                <button
                                    onClick={handleUnregister}
                                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Cancel Registration
                                </button>
                            ) : (
                                <button
                                    onClick={handleRegister}
                                    disabled={registrationClosed || isFull}
                                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {registrationClosed
                                        ? 'Registration Closed'
                                        : isFull
                                        ? 'Event Full'
                                        : 'Register for Event'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetailsPage; 