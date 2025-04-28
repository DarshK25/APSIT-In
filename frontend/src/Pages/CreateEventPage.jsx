import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Upload, Calendar, Clock, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import eventService from '../api/eventService';
import clubService from '../api/clubService';
import ClubSearch from '../components/ClubSearch';

const CreateEventPage = () => {
    const navigate = useNavigate();
    const { clubId } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [clubs, setClubs] = useState([]);
    const [loadingClubs, setLoadingClubs] = useState(false);
    const [clubSearchQuery, setClubSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

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
        registrationFormLink: '',
        image: null,
        attendees: [],
        organizer: clubId || (user?.accountType === 'club' ? user._id : ''),
    });

    const [selectedClub, setSelectedClub] = useState(null);

    const departments = [
        'Computer Engineering',
        'Information Technology',
        'Computer Science & Engineering: Data Science', 
        'Computer Science & Engineering: Artificial Intelligence & Machine Learning', 
        'Civil Engineering',
        'Mechanical Engineering'
    ];

    useEffect(() => {
        if (clubId) {
            fetchClubDetails(clubId);
        } else if (user?.accountType === 'club') {
            setSelectedClub({
                _id: user._id,
                name: user.name,
                profilePicture: user.profilePicture,
                headline: user.headline
            });
        }
    }, [clubId, user]);

    const fetchClubDetails = async (id) => {
        try {
            const response = await clubService.getClubById(id);
            if (response) {
                setSelectedClub(response);
                setFormData(prev => ({
                    ...prev,
                    organizer: response._id
                }));
            }
        } catch (error) {
            console.error('Error fetching club details:', error);
            toast.error('Failed to load club details');
        }
    };

    const handleClubSearch = async (query) => {
        setClubSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setSearchLoading(true);
            const response = await clubService.getUserClubs();
            if (response) {
                // Filter clubs where user is a member and match the search query
                const filteredClubs = response.filter(club => 
                    (club.name.toLowerCase().includes(query.toLowerCase()) ||
                    club.headline?.toLowerCase().includes(query.toLowerCase())) &&
                    club.accountType === 'club' &&
                    club.members?.some(member => member.userId === user._id)
                );
                setSearchResults(filteredClubs);
            }
        } catch (error) {
            console.error('Error searching clubs:', error);
            toast.error('Failed to search clubs');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectClub = (club) => {
        setSelectedClub(club);
        setFormData(prev => ({
            ...prev,
            organizer: club._id
        }));
        setClubSearchQuery(club.name);
        setSearchResults([]);
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            const file = files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) { // 10MB limit
                    toast.error('Image size should be less than 10MB');
                    return;
                }
                setFormData(prev => ({ ...prev, image: file }));
                setImagePreview(URL.createObjectURL(file));
            }
        } else if (name === 'selectedClub') {
            setFormData(prev => ({
                ...prev,
                selectedClub: value,
                organizer: value
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const validateForm = () => {
        const errors = [];
        const now = new Date();
        const eventDate = new Date(`${formData.date}T${formData.time}`);
        const registrationDeadline = new Date(formData.registrationDeadline);

        if (!formData.title?.trim()) errors.push('Title is required');
        if (!formData.description?.trim()) errors.push('Description is required');
        if (!formData.date) errors.push('Date is required');
        if (!formData.time) errors.push('Time is required');
        if (!formData.location?.trim()) errors.push('Location is required');
        if (!formData.department) errors.push('Department is required');
        if (!formData.registrationDeadline) errors.push('Registration deadline is required');
        if (!selectedClub) errors.push('Please select an organizing club');

        if (eventDate < now) errors.push('Event date cannot be in the past');
        if (registrationDeadline > eventDate) errors.push('Registration deadline must be before the event date');
        if (registrationDeadline < now) errors.push('Registration deadline cannot be in the past');

        if (formData.maxAttendees && parseInt(formData.maxAttendees) <= 0) {
            errors.push('Maximum attendees must be a positive number');
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        
        if (errors.length > 0) {
            errors.forEach(error => toast.error(error));
            return;
        }

        if (!selectedClub) {
            toast.error('Please select an organizing club');
            return;
        }

        setLoading(true);
        try {
            const form = new FormData();
            
            // Basic event details
            form.append('title', formData.title);
            form.append('description', formData.description);
            form.append('location', formData.location);
            form.append('department', formData.department);
            form.append('organizer', selectedClub._id);
            form.append('isPublished', 'true');

            // Handle dates
            const eventDate = new Date(`${formData.date}T${formData.time}`);
            form.append('date', eventDate.toISOString());
            form.append('time', formData.time);

            const regDeadline = new Date(formData.registrationDeadline);
            form.append('registrationDeadline', regDeadline.toISOString());

            // Optional fields
            if (formData.maxAttendees) {
                form.append('maxAttendees', parseInt(formData.maxAttendees));
            }
            if (formData.requirements) {
                form.append('requirements', formData.requirements);
            }
            if (formData.registrationFormLink) {
                form.append('registrationFormLink', formData.registrationFormLink);
            }
            if (formData.image instanceof File) {
                form.append('image', formData.image);
            }

            const response = await eventService.createEvent(form);
            
            if (response.success) {
                toast.success('Event created successfully');
                navigate('/events');
            } else {
                throw new Error(response.message || 'Failed to create event');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            let errorMessage = 'Failed to create event. Please try again.';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
            
            // Log detailed error information
            console.error('Detailed error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                stack: error.stack
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Club Selection */}
                {user?.accountType !== 'club' && !clubId && (
                    <ClubSearch
                        onSelectClub={setSelectedClub}
                        selectedClub={selectedClub}
                        disabled={user?.accountType === 'club' || clubId}
                    />
                )}

                {/* Image Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="flex flex-col items-center">
                        <input
                            type="file"
                            id="image"
                            name="image"
                            accept="image/*"
                            onChange={handleChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="image"
                            className="cursor-pointer flex flex-col items-center"
                        >
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Event preview"
                                    className="w-full max-w-md h-48 object-cover rounded-lg mb-4"
                                />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Upload className="w-12 h-12 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-500">
                                        Click to upload event image
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                PNG, JPG, GIF up to 10MB
                            </p>
                        </label>
                    </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department
                        </label>
                        <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select department</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time
                            </label>
                            <input
                                type="time"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Event venue or online meeting link"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum Attendees
                            </label>
                            <input
                                type="number"
                                name="maxAttendees"
                                value={formData.maxAttendees}
                                onChange={handleChange}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Registration Deadline
                            </label>
                            <input
                                type="datetime-local"
                                name="registrationDeadline"
                                value={formData.registrationDeadline}
                                onChange={handleChange}
                                required
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Registration Form Link (Optional)
                        </label>
                        <input
                            type="url"
                            name="registrationFormLink"
                            value={formData.registrationFormLink}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="External registration form URL (if any)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Requirements (Optional)
                        </label>
                        <textarea
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Any specific requirements for participants..."
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/events')}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                    >
                        {loading ? 'Creating...' : 'Create Event'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEventPage; 