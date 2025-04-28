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
        // First try to fetch events specific to this club
        try {
          if (typeof eventService.getOrganizedEvents === 'function') {
            console.log("Fetching organized events using API");
            const response = await eventService.getOrganizedEvents();
            if (response.success && response.data) {
              // Filter events for this specific club
              const clubEvents = response.data.filter(
                event => event.organizer?._id === userData._id
              );
              setEvents(clubEvents);
              return; // Early return if successful
            }
          } else {
            console.log("getOrganizedEvents function not available, using alternative method");
          }
        } catch (apiError) {
          console.warn("Could not fetch events using getOrganizedEvents, falling back to alternative method", apiError);
        }
        
        // Fallback: Try to get all events and filter them
        try {
          console.log("Fetching all events as fallback");
          const allEventsResponse = await eventService.getAllEvents();
          if (allEventsResponse.success && allEventsResponse.data) {
            const clubEvents = allEventsResponse.data.filter(
              event => event.organizer?._id === userData._id
            );
            setEvents(clubEvents);
            return;
          }
        } catch (fallbackError) {
          console.warn("Fallback event fetch also failed", fallbackError);
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
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Club Events</h2>
        {canManageEvents() && !isEditing && (
          <button
            onClick={handleAddNew}
            className="flex items-center text-primary hover:text-primary-dark transition duration-300"
          >
            <Plus size={20} className="mr-1" />
            Add Event
          </button>
        )}
      </div>

      {/* Event Creation/Editing Form */}
      {isEditing && canManageEvents() && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-3">
            {editingIndex !== null ? "Edit Event" : "Add New Event"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Event Title</label>
              <input
                type="text"
                value={currentEvent.title}
                onChange={(e) => setCurrentEvent(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={currentEvent.description}
                onChange={(e) => setCurrentEvent(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={currentEvent.date}
                  onChange={(e) => setCurrentEvent(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  value={currentEvent.time}
                  onChange={(e) => setCurrentEvent(prev => ({ ...prev, time: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isOnline"
                checked={currentEvent.isOnline}
                onChange={(e) => setCurrentEvent(prev => ({ ...prev, isOnline: e.target.checked }))}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isOnline" className="ml-2 block text-sm text-gray-700">
                This is an online event
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {currentEvent.isOnline ? "Online Meeting Link" : "Location"}
              </label>
              <input
                type="text"
                value={currentEvent.location}
                onChange={(e) => setCurrentEvent(prev => ({ ...prev, location: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder={currentEvent.isOnline ? "Zoom/Meet link" : "Physical location"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Link</label>
              <input
                type="text"
                value={currentEvent.registrationLink}
                onChange={(e) => setCurrentEvent(prev => ({ ...prev, registrationLink: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="URL for event registration"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Capacity</label>
              <input
                type="number"
                value={currentEvent.capacity}
                onChange={(e) => setCurrentEvent(prev => ({ ...prev, capacity: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Maximum number of participants"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={currentEvent.category}
                  onChange={(e) => setCurrentEvent(prev => ({ ...prev, category: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value={userData.name}>{userData.name}</option>
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
                  value={currentEvent.department}
                  onChange={(e) => setCurrentEvent(prev => ({ ...prev, department: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="Inter-Department">Inter-Department</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="CSE (AI & ML)">CSE (AI & ML)</option>
                  <option value="CSE (DS)">CSE (DS)</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Event Image</label>
              {currentEvent.image ? (
                <div className="relative mt-2">
                  <img 
                    src={currentEvent.image} 
                    alt="Event" 
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setCurrentEvent(prev => ({ ...prev, image: "" }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark">
                        <span>Upload an image</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    {uploadingImage && <p className="text-xs text-primary">Uploading...</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition duration-300"
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List of Events */}
      {events.length === 0 && !isEditing ? (
        <div className="text-center py-6 text-gray-500">
          {canManageEvents()
            ? "Add events to showcase your club's activities" 
            : "This club hasn't added any events yet"}
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="border rounded-lg overflow-hidden shadow-sm group">
              {event.image && (
                <div className="relative h-48 w-full">
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                  />
                  {canManageEvents() && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                      <button
                        onClick={() => handleEditEvent(index)}
                        className="bg-white p-1.5 rounded-full shadow-md text-gray-700 hover:text-primary transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(index)}
                        className="bg-white p-1.5 rounded-full shadow-md text-gray-700 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-xl">{event.title}</h3>
                  {!event.image && canManageEvents() && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEvent(index)}
                        className="text-gray-500 hover:text-primary transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(index)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 mt-2">{event.description}</p>
                
                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    <span>
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-2" />
                      <span>{event.isOnline ? "Online Event" : event.location}</span>
                    </div>
                  )}
                  
                  {event.capacity && (
                    <div className="flex items-center">
                      <Users size={16} className="mr-2" />
                      <span>Capacity: {event.capacity} participants</span>
                    </div>
                  )}
                </div>
                
                {event.registrationLink && (
                  <div className="mt-4">
                    <a
                      href={event.registrationLink.startsWith('http') ? event.registrationLink : `https://${event.registrationLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition duration-300"
                    >
                      Register Now
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubEventsSection;
