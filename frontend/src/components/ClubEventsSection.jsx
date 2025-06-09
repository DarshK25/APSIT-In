import { useState, useEffect } from "react";
import { Plus, Edit, X, Calendar, MapPin, Users, AlertCircle } from "lucide-react";
import { uploadToCloudinary } from "../api/userService";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import clubService from "../api/clubService";
import eventService from "../api/eventService";

const ClubEventsSection = ({ userData, isOwnProfile, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [events, setEvents] = useState(userData.events || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [memberRole, setMemberRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const [currentEvent, setCurrentEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    image: "",
    registrationLink: "",
    isOnline: false,
    capacity: "",
    category: userData.name || "", // Default to club name
    department: "Inter-Department" // Default department
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Check if current user is a member of the club using the club service
  useEffect(() => {
    const checkMembership = async () => {
      if (!currentUser || !userData._id) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Use clubService to check membership
        const membershipData = await clubService.checkClubMembership(userData._id);
        
        if (membershipData.success && membershipData.isMember) {
          setIsMember(true);
          setMemberRole(membershipData.role);
        } else {
          setIsMember(false);
          setMemberRole(null);
        }
      } catch (error) {
        console.error("Error checking club membership:", error);
        
        // Fall back to checking membership from userData
        if (userData.members) {
          const memberEntry = userData.members.find(m => 
            m.userId === currentUser._id || 
            (m.userId && typeof m.userId === 'object' && m.userId._id === currentUser._id)
          );
          
          if (memberEntry) {
            setIsMember(true);
            setMemberRole(memberEntry.role);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkMembership();
    fetchClubEvents();
  }, [currentUser, userData._id, userData.members]);

  // Fetch club events from the backend
  const fetchClubEvents = async () => {
    try {
      if (userData._id) {
        // Try to get all events and filter them
        try {
          // console.log("Fetching all events");
          const allEventsResponse = await eventService.getAllEvents();
          if (allEventsResponse.success && allEventsResponse.data) {
            // Filter events for this specific club
            const clubEvents = allEventsResponse.data.filter(event => {
              // Check both string and object ID formats
              const organizerId = event.organizer?._id || event.organizer;
              return organizerId === userData._id || 
                     (typeof organizerId === 'object' && organizerId.toString() === userData._id);
            });
          //  console.log("Filtered club events:", clubEvents);
            setEvents(clubEvents);
            return;
          }
        } catch (error) {
          console.warn("Error fetching events:", error);
        }
      }
      
      // If we reach here, use the events from props
      setEvents(userData.events || []);
    } catch (error) {
      console.error("Error fetching club events:", error);
      // Fall back to the events from props
      setEvents(userData.events || []);
    }
  };

  // Check if user has permissions to manage events
  const canManageEvents = () => {
    // Club owner can always manage events
    if (isOwnProfile) return true;
    
    // If user is a club member, they can manage events
    return isMember;
  };

  const handleEditEvent = (index) => {
    if (!canManageEvents()) {
      toast.error('You do not have permission to edit events');
      return;
    }
    
    setEditingIndex(index);
    
    // Format the date for the form
    const eventToEdit = events[index];
    const formattedDate = eventToEdit.date ? new Date(eventToEdit.date).toISOString().split('T')[0] : "";
    
    setCurrentEvent({
      ...eventToEdit,
      date: formattedDate
    });
    
    setIsEditing(true);
  };

  const handleAddNew = () => {
    if (!canManageEvents()) {
      toast.error('You do not have permission to add events');
      return;
    }
    
    setEditingIndex(null);
    setCurrentEvent({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      image: "",
      registrationLink: "",
      isOnline: false,
      capacity: "",
      category: userData.name || "", // Default to club name
      department: "Inter-Department" // Default department
    });
    setIsEditing(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      setCurrentEvent(prev => ({
        ...prev,
        image: imageUrl
      }));
      toast.success('Event image uploaded successfully');
    } catch (error) {
      console.error('Error uploading event image:', error);
      toast.error('Failed to upload event image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!canManageEvents()) {
      toast.error('You do not have permission to save events');
      return;
    }
    
    if (currentEvent.title && currentEvent.description && currentEvent.date) {
      try {
        const formData = new FormData();
        
        // Add all event fields to the form data
        Object.entries(currentEvent).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });
        
        if (editingIndex !== null) {
          // Update existing event
          const eventId = events[editingIndex]._id;
          await eventService.updateEvent(eventId, formData);
          toast.success('Event updated successfully');
        } else {
          // Create new event
          await eventService.createEvent(formData);
          toast.success('Event added successfully');
        }
        
        // Refresh events from the backend
        fetchClubEvents();
        
        // Reset form state
        setIsEditing(false);
        setEditingIndex(null);
        setCurrentEvent({
          title: "",
          description: "",
          date: "",
          time: "",
          location: "",
          image: "",
          registrationLink: "",
          isOnline: false,
          capacity: "",
          category: userData.name || "",
          department: "Inter-Department"
        });
      } catch (error) {
        console.error("Error saving event:", error);
        toast.error(error.response?.data?.message || 'Error saving event');
      }
    } else {
      toast.error('Title, description and date are required');
    }
  };

  const handleDeleteEvent = async (index) => {
    if (!canManageEvents()) {
      toast.error('You do not have permission to delete events');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const eventId = events[index]._id;
        await eventService.deleteEvent(eventId);
        
        // Update local state
        const updatedEvents = events.filter((_, i) => i !== index);
        setEvents(updatedEvents);
        
        toast.success('Event deleted successfully');
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error('Failed to delete event');
      }
    }
  };

  return (
    <div className="rounded-lg shadow-sm p-4 md:p-6 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Club Events</h2>
      
      {isOwnProfile && (
        <div className="flex justify-end mb-4">
          <button 
            onClick={handleAddNew}
            className="flex items-center text-primary hover:text-primary-dark transition-colors duration-200 text-sm font-semibold dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Event
          </button>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-4">
          Add events to showcase your club's activities
        </p>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event._id} className="border border-gray-200 dark:border-dark-border rounded-lg p-4 bg-gray-50 dark:bg-dark-hover shadow-sm flex items-start space-x-4 relative">
              {event.image && (
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{event.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">{event.description}</p>
                
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                </div>
                {event.location && (
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.capacity && (
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Capacity: {event.capacity}</span>
                  </div>
                )}

                {event.registrationLink && (
                  <a 
                    href={event.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-primary hover:underline text-sm dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Register Here
                  </a>
                )}
              </div>

              {isOwnProfile && (
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button 
                    onClick={() => handleEditEvent(index)}
                    className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteEvent(index)}
                    className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{editingIndex !== null ? 'Edit Event' : 'Add New Event'}</h3>
            <button 
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEvent(); }} className="space-y-4">
              <div>
                <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  id="event-title"
                  className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={currentEvent.title}
                  onChange={(e) => setCurrentEvent({...currentEvent, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  id="event-description"
                  className="textarea textarea-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={currentEvent.description}
                  onChange={(e) => setCurrentEvent({...currentEvent, description: e.target.value})}
                  rows="3"
                  required
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    id="event-date"
                    className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={currentEvent.date}
                    onChange={(e) => setCurrentEvent({...currentEvent, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="event-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                  <input
                    type="time"
                    id="event-time"
                    className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={currentEvent.time}
                    onChange={(e) => setCurrentEvent({...currentEvent, time: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  id="event-location"
                  className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={currentEvent.location}
                  onChange={(e) => setCurrentEvent({...currentEvent, location: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="event-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Image</label>
                <input
                  type="file"
                  id="event-image"
                  className="file-input file-input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
                {uploadingImage && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Uploading image...</p>}
                {currentEvent.image && !uploadingImage && (
                  <div className="mt-2 relative w-24 h-24">
                    <img src={currentEvent.image} alt="Event Preview" className="w-full h-full object-cover rounded-md" />
                    <button 
                      type="button"
                      onClick={() => setCurrentEvent(prev => ({ ...prev, image: "" }))}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-xs"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="registration-link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registration Link</label>
                <input
                  type="url"
                  id="registration-link"
                  className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={currentEvent.registrationLink}
                  onChange={(e) => setCurrentEvent({...currentEvent, registrationLink: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-online"
                  className="checkbox checkbox-primary dark:checkbox-info"
                  checked={currentEvent.isOnline}
                  onChange={(e) => setCurrentEvent({...currentEvent, isOnline: e.target.checked})}
                />
                <label htmlFor="is-online" className="text-sm font-medium text-gray-700 dark:text-gray-300">Online Event</label>
              </div>
              <div>
                <label htmlFor="event-capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity</label>
                <input
                  type="number"
                  id="event-capacity"
                  className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={currentEvent.capacity}
                  onChange={(e) => setCurrentEvent({...currentEvent, capacity: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="event-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  id="event-category"
                  className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={currentEvent.category}
                  onChange={(e) => setCurrentEvent({...currentEvent, category: e.target.value})}
                  required
                />
              </div>
              <div>
                <label htmlFor="event-department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                <input
                  type="text"
                  id="event-department"
                  className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={currentEvent.department}
                  onChange={(e) => setCurrentEvent({...currentEvent, department: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-ghost dark:text-gray-300 dark:hover:bg-dark-hover"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                >
                  {editingIndex !== null ? 'Save Changes' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubEventsSection;