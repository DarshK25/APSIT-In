import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, MapPin, Users, Edit2, Trash2, Share2, AlertCircle, Loader } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { canManageEvent, canRegisterForEvent } from '../utils/eventAuth';

const EventDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [error, setError] = useState(null);

    // Admin emails for authorization checks
    const adminEmails = [
        'darshkalathiya25@gmail.com',
        '23102187@apsit.edu.in',
        'devopsclub@apsit.edu.in',
        'codersclub@apsit.edu.in',
        'cybersecurityclub@apsit.edu.in',
        'datascienceclub@apsit.edu.in'
    ];

    const canManage = event ? canManageEvent(user, event, adminEmails) : false;
    const registrationStatus = event ? canRegisterForEvent(user, event) : { allowed: false, reason: 'Loading...' };

    const fetchEvent = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/v1/events/${id}`,
                { withCredentials: true }
            );
            
            if (response.data.success) {
                const eventData = response.data.event;
                if (!eventData.attendees) {
                    eventData.attendees = [];
                }
                
                setEvent(eventData);
                if (eventData.attendees && user) {
                    setIsRegistered(eventData.attendees.some(
                        attendee => attendee._id === user._id
                    ));
                }
            } else {
                throw new Error(response.data.message || 'Failed to load event');
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
            setError(error.message || 'Failed to load event details');
            toast.error(error.response?.data?.message || 'Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const handleRegister = async () => {
        if (!registrationStatus.allowed) {
            toast.error(registrationStatus.reason);
            return;
        }

        setIsRegistering(true);
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
        } finally {
            setIsRegistering(false);
        }
    };

    const handleUnregister = async () => {
        if (!window.confirm('Are you sure you want to cancel your registration?')) {
            return;
        }

        setIsRegistering(true);
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
        } finally {
            setIsRegistering(false);
        }
    };

    const handleDelete = async () => {
        if (!canManage) {
            toast.error('You do not have permission to delete this event');
            return;
        }

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
            navigator.clipboard.writeText(window.location.href)
                .then(() => toast.success('Link copied to clipboard'))
                .catch(err => {
                    console.error('Failed to copy link:', err);
                    toast.error('Failed to share or copy link');
                });
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="flex items-center space-x-2">
                <Loader className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-gray-600">Loading event details...</span>
            </div>
        </div>
    );

    if (error || !event) return (
        <div className="container mx-auto p-4 max-w-4xl text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-semibold text-gray-900">Failed to load event details</h1>
                <p className="text-gray-600 mt-2">{error || "The event could not be found or has been removed."}</p>
                <button 
                    onClick={() => navigate('/events')}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                    Return to Events
                </button>
            </div>
        </div>
    );

    const registrationClosed = event.registrationDeadline ? new Date() > new Date(event.registrationDeadline) : false;
    const isFull = event.maxAttendees && event.attendees && event.attendees.length >= event.maxAttendees;

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Event Image */}
                <div className="relative">
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
                    
                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                        {canManage && (
                            <>
                                <button
                                    onClick={() => navigate(`/events/${id}/edit`)}
                                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md text-gray-700 hover:text-blue-500 transition-colors"
                                    title="Edit Event"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md text-gray-700 hover:text-red-500 transition-colors"
                                    title="Delete Event"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleShare}
                            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md text-gray-700 hover:text-blue-500 transition-colors"
                            title="Share Event"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Event Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
                        <div className="flex flex-wrap gap-4 text-gray-600">
                            <span className="inline-flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {format(new Date(event.date), 'MMMM d, yyyy')}
                            </span>
                            <span className="inline-flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {event.time}
                            </span>
                            <span className="inline-flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {event.location}
                            </span>
                            <span className="inline-flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {event.attendees.length}
                                {event.maxAttendees && ` / ${event.maxAttendees}`} Attendees
                            </span>
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

                    {user && !canManage && (
                        <div className="mt-6 border-t border-gray-200 pt-6">
                            {isRegistered ? (
                                <button
                                    onClick={handleUnregister}
                                    disabled={isRegistering}
                                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-red-300"
                                >
                                    {isRegistering ? (
                                        <span className="flex items-center justify-center">
                                            <Loader className="w-5 h-5 animate-spin mr-2" />
                                            Processing...
                                        </span>
                                    ) : (
                                        'Cancel Registration'
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={handleRegister}
                                    disabled={!registrationStatus.allowed || isRegistering}
                                    className={`w-full px-4 py-2 rounded-lg transition-colors ${
                                        registrationStatus.allowed
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {isRegistering ? (
                                        <span className="flex items-center justify-center">
                                            <Loader className="w-5 h-5 animate-spin mr-2" />
                                            Processing...
                                        </span>
                                    ) : registrationClosed ? (
                                        'Registration Closed'
                                    ) : isFull ? (
                                        'Event Full'
                                    ) : registrationStatus.allowed ? (
                                        'Register for Event'
                                    ) : (
                                        registrationStatus.reason
                                    )}
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