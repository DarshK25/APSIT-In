import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, MapPin, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ClubSearch from '../components/ClubSearch';

const EditEventPage = ({ event: initialEvent, onSuccess, isModal = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedClub, setSelectedClub] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        department: '',
        maxAttendees: '',
        registrationDeadline: '',
        requirements: '',
        image: null
    });

    const departments = [
        'Computer Engineering',
        'Information Technology',
        'Computer Science & Engineering: Data Science', 
        'Computer Science & Engineering: Artificial Intelligence & Machine Learning', 
        'Civil Engineering',
        'Mechanical Engineering'
    ];

    useEffect(() => {
        if (initialEvent) {
            setupFormData(initialEvent);
        } else {
            fetchEvent();
        }
    }, [id, initialEvent]);

    const setupFormData = (event) => {
        try {
            // Format date for input field
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toISOString().split('T')[0];
            
            // Format registration deadline for input field
            const deadlineDate = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
            const formattedDeadline = deadlineDate ? deadlineDate.toISOString().split('T')[0] : '';

            setFormData({
                title: event.title,
                description: event.description,
                date: formattedDate,
                time: event.time,
                location: event.location,
                department: event.department,
                maxAttendees: event.maxAttendees || '',
                registrationDeadline: formattedDeadline,
                requirements: event.requirements || '',
            });

            if (event.image) {
                setImagePreview(`${import.meta.env.VITE_API_URL}/${event.image}`);
            }

            // Set the organizer club
            if (event.organizer) {
                setSelectedClub({
                    _id: event.organizer._id,
                    name: event.organizer.name,
                    profilePicture: event.organizer.profilePicture,
                    headline: event.organizer.headline
                });
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error setting up form data:', error);
            toast.error('Error loading event data');
            setLoading(false);
        }
    };

    const fetchEvent = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/v1/events/${id}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                const event = response.data.event;
                
                // Check if user is the organizer
                if (event.organizer._id !== user?._id) {
                    toast.error('You are not authorized to edit this event');
                    navigate(`/events/${id}`);
                    return;
                }

                setupFormData(event);
            } else {
                throw new Error(response.data.message || 'Failed to load event');
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
            toast.error(error.response?.data?.message || 'Failed to load event details');
            navigate('/events');
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        
        if (type === 'file') {
            const file = e.target.files[0];
            if (file) {
                setFormData(prev => ({ ...prev, image: file }));
                setImagePreview(URL.createObjectURL(file));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            
            // Add all form data fields
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== '') {
                    data.append(key, value);
                }
            });

            // Add the organizer field from selectedClub
            if (selectedClub) {
                data.append('organizer', selectedClub._id);
            }

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/v1/events/${initialEvent?._id || id}`,
                data,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Event updated successfully');
                if (isModal && onSuccess) {
                    onSuccess();
                } else {
                    navigate(`/events/${initialEvent?._id || id}`);
                }
            } else {
                throw new Error(response.data.message || 'Failed to update event');
            }
        } catch (error) {
            console.error('Failed to update event:', error);
            toast.error(error.response?.data?.message || 'Failed to update event');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${isModal ? 'h-64' : 'min-h-screen'}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className={isModal ? '' : 'container mx-auto p-4 max-w-2xl'}>
            {!isModal && <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h1>}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Club Selection */}
                {user?.accountType !== 'club' && (
                    <ClubSearch
                        onSelectClub={setSelectedClub}
                        selectedClub={selectedClub}
                        disabled={user?.accountType === 'club'}
                    />
                )}

                {/* Image Upload */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Event Image
                    </label>
                    <div className="flex items-center space-x-4">
                        <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                </div>
                            )}
                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={handleChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <div className="text-sm text-gray-500">
                            Click to upload or drag and drop<br />
                            SVG, PNG, JPG or GIF (max. 10MB)
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            Date
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className="block w-full pr-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                            Time
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type="time"
                                id="time"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                required
                                className="block w-full pr-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                    </label>
                    <div className="mt-1 relative">
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                {/* Department */}
                <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                        Department
                    </label>
                    <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select a department</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>

                {/* Max Attendees and Registration Deadline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700">
                            Maximum Attendees
                        </label>
                        <input
                            type="number"
                            id="maxAttendees"
                            name="maxAttendees"
                            value={formData.maxAttendees}
                            onChange={handleChange}
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-700">
                            Registration Deadline
                        </label>
                        <input
                            type="date"
                            id="registrationDeadline"
                            name="registrationDeadline"
                            value={formData.registrationDeadline}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Requirements */}
                <div>
                    <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                        Requirements (Optional)
                    </label>
                    <textarea
                        id="requirements"
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="List any requirements or prerequisites for the event..."
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => isModal ? onSuccess() : navigate('/events')}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                    >
                        {loading ? 'Updating...' : 'Update Event'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditEventPage; 