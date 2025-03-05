import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, MapPin, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const EditEventPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
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
        image: null
    });

    const categories = ['academic', 'cultural', 'sports', 'technical', 'other'];
    const departments = ['Computer', 'IT', 'EXTC', 'Chemical', 'Mechanical'];

    useEffect(() => {
        fetchEvent();
    }, [id]);

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

                // Format date for input field
                const eventDate = new Date(event.date);
                const formattedDate = eventDate.toISOString().split('T')[0];
                
                // Format registration deadline for input field
                const deadlineDate = new Date(event.registrationDeadline);
                const formattedDeadline = deadlineDate.toISOString().split('T')[0];

                setFormData({
                    title: event.title,
                    description: event.description,
                    date: formattedDate,
                    time: event.time,
                    location: event.location,
                    category: event.category,
                    department: event.department,
                    maxAttendees: event.maxAttendees || '',
                    registrationDeadline: formattedDeadline,
                    requirements: event.requirements || '',
                });

                if (event.image) {
                    setImagePreview(`${import.meta.env.VITE_API_URL}/${event.image}`);
                }
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
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== '') {
                    data.append(key, value);
                }
            });

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/v1/events/${id}`,
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
                navigate(`/events/${id}`);
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                        <div className="mt-1 relative">
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                            Time
                        </label>
                        <div className="mt-1 relative">
                            <input
                                type="time"
                                id="time"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <Clock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
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

                {/* Category and Department */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                            Category
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">Select a category</option>
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
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

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate(`/events/${id}`)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditEventPage; 