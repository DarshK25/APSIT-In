import { useState, useEffect } from "react";
import { Camera, MapPin, UserPlus, Mail, Calendar, GraduationCap, User, UserSquare2, MessageCircle, Check, Clock, Briefcase, Users } from "lucide-react";
import { uploadToCloudinary, sendConnectionRequest } from "../api/userService";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FaEdit } from "react-icons/fa";

const ProfileHeader = ({ userData, isOwnProfile, onSave, accountType: propAccountType }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('none'); // 'none', 'pending', 'connected', 'received'
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  
  // Initialize editedData with all possible fields
  const [editedData, setEditedData] = useState({
    name: userData.name || "",
    headline: userData.headline || "",
    location: userData.location || "",
    department: userData.department || "",
    yearOfStudy: userData.yearOfStudy || "",
    about: userData.about || "",
    designation: userData.designation || "",
    subjects: userData.subjects || [],
    clubType: userData.clubType || "",
    foundedDate: userData.foundedDate || ""
  });

  // Use the account type from props if available, otherwise determine from user data
  const accountType = propAccountType || userData.accountType || (() => {
    if (/^\d{8}@apsit\.edu\.in$/.test(userData.email)) return 'student';
    if (/club@apsit\.edu\.in$/.test(userData.email)) return 'club';
    return 'faculty';
  })();

  const isStudent = accountType === 'student';
  const isFaculty = accountType === 'faculty';
  const isClub = accountType === 'club';

  // Function to extract student ID from email
  const getStudentId = () => {
    if (!isStudent) return null;
    const studentIdMatch = userData.email.match(/^(\d{8})@apsit\.edu\.in$/);
    return studentIdMatch ? studentIdMatch[1] : null;
  };

  const studentId = getStudentId();

  // Department options
  const departments = [
    'Computer Engineering',
    'Information Technology',
    'Computer Science & Engineering: Data Science',
    'Computer Science & Engineering: Artificial Intelligence & Machine Learning',
    'Civil Engineering',
    'Mechanical Engineering'
  ];

  const yearOfStudyOptions = [
    'First Year',
    'Second Year',
    'Third Year',
    'Fourth Year'
  ];

  const clubTypes = [
    'Technical',
    'Cultural',
    'Sports',
    'Other'
  ];

  const facultyDesignations = [
    'Professor',
    'Associate Professor',
    'Assistant Professor',
    'HOD',
    'Principal',
    'Visiting Faculty'
  ];

  // Function to check if user is an alumni (only for students)
  const isAlumni = () => {
    if (!isStudent) return false;
    if (userData.isAlumni) return true;
    
    if (!userData.education || userData.education.length === 0) return false;
    
    const latestEducation = userData.education.reduce((latest, current) => {
      const currentEndYear = parseInt(current.endYear);
      const latestEndYear = parseInt(latest.endYear);
      return currentEndYear > latestEndYear ? current : latest;
    }, userData.education[0]);

    if (!latestEducation.endYear) return false;
    
    const currentYear = new Date().getFullYear();
    return parseInt(latestEducation.endYear) < currentYear;
  };

  // Check connection status
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!isOwnProfile && userData?._id && currentUser) {
        try {
          // First check if the user is in current user's connections
          if (currentUser.connections?.includes(userData._id)) {
            setConnectionStatus('connected');
            return;
          }

          // Then check for pending requests
          const response = await axios.get(`http://localhost:3000/api/v1/connections/status/${userData._id}`, {
            withCredentials: true
          });

          if (response.data.status === 'connected') {
            setConnectionStatus('connected');
          } else if (response.data.status === 'pending') {
            setConnectionStatus('pending');
          } else if (response.data.status === 'received') {
            setConnectionStatus('received');
            setPendingRequestId(response.data.requestId);
          } else {
            setConnectionStatus('none');
          }
        } catch (error) {
          console.error("Error checking connection status:", error);
          setConnectionStatus('none');
        }
      }
    };

    checkConnectionStatus();
  }, [userData?._id, isOwnProfile, currentUser]);

  const handleImageUpload = async (event, imageType) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const imageUrl = await uploadToCloudinary(file);
      const updatedData = { [imageType]: imageUrl };
      await onSave(updatedData);
      toast.success('Image updated successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(`Failed to upload ${imageType}:`, error);
    }
  };

  const handleSave = async () => {
    try {
      await onSave(editedData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Failed to update profile:', error);
    }
  };

  const handleConnect = async () => {
    try {
      await sendConnectionRequest(userData._id);
      setConnectionStatus('pending');
      toast.success('Connection request sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send connection request');
    }
  };

  const handleMessage = () => {
    if (connectionStatus === 'connected') {
      navigate(`/messages?user=${userData._id}`);
    } else {
      toast.warning("Connect with the user to start messaging");
    }
  };

  const handleAcceptRequest = async () => {
    try {
      await axios.put(`http://localhost:3000/api/v1/connections/accept/${pendingRequestId}`, {}, {
        withCredentials: true
      });
      setConnectionStatus('connected');
      toast.success('Connection request accepted!');
    } catch (error) {
      toast.error('Failed to accept connection request');
    }
  };

  const handleRejectRequest = async () => {
    try {
      await axios.put(`http://localhost:3000/api/v1/connections/reject/${pendingRequestId}`, {}, {
        withCredentials: true
      });
      setConnectionStatus('none');
      toast.success('Connection request rejected');
    } catch (error) {
      toast.error('Failed to reject connection request');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const renderConnectionButton = () => {
    switch (connectionStatus) {
      case 'none':
        return (
          <button
            onClick={handleConnect}
            className="px-6 py-2.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors duration-200 font-medium flex items-center"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Connect
          </button>
        );
      case 'pending':
        return (
          <div className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-full flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Request Pending
          </div>
        );
      case 'received':
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleAcceptRequest}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Check className="h-5 w-5 mr-2" />
              Accept
            </button>
            <button
              onClick={handleRejectRequest}
              className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <UserSquare2 className="h-5 w-5 mr-2" />
              Delete
            </button>
          </div>
        );
      case 'connected':
        return (
          <div className="flex space-x-3">
            <button
              onClick={handleMessage}
              className="p-2.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
              title="Send message"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <div className="px-6 py-2.5 bg-green-100 text-green-700 rounded-full flex items-center">
              <Check className="h-5 w-5 mr-2" />
              Connected
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden relative">
      {/* Banner */}
      <div className="relative h-40 sm:h-64">
        <div 
          className="w-full h-full"
          style={{ 
            background: isClub 
              ? 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)'
              : isFaculty
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'
          }}
        />
        {userData.bannerImg && (
          <img
            src={userData.bannerImg}
            alt="Profile Banner"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        {isOwnProfile && (
          <label className="absolute bottom-4 right-4 bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-white dark:hover:bg-dark-card transition-colors duration-200 z-10">
            <Camera className="h-5 w-5 text-gray-700 dark:text-gray-200" />
            <input
              type="file"
              className="hidden"
              onChange={(e) => handleImageUpload(e, "bannerImg")}
              accept="image/*"
            />
          </label>
        )}
      </div>

      {/* Profile Content Area - Adjusted top padding to accommodate the overlap */}
      <div className="relative px-4 sm:px-6 pt-12 pb-6">
        {/* Profile Picture - positioned with negative top margin to overlap banner */}
        <div className="relative -mt-24 sm:-mt-36 w-24 h-24 sm:w-40 sm:h-40 rounded-2xl border-4 border-white dark:border-dark-card shadow-lg overflow-hidden z-10">
          {userData.profilePicture ? (
            <>
              <img
                src={userData.profilePicture}
                alt={userData.name}
                className="profile-img w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackElement = document.querySelector('.profile-fallback');
                  if (fallbackElement) fallbackElement.style.display = 'flex';
                }}
              />
              <div className="profile-fallback w-full h-full bg-gray-200 dark:bg-dark-hover flex items-center justify-center" style={{ display: 'none' }}>
                {isClub ? (
                  <Users className="h-12 w-12 sm:h-24 sm:w-24 text-primary dark:text-dark-primary" strokeWidth={1.5} />
                ) : (
                  <User className="h-12 w-12 sm:h-24 sm:w-24 text-primary dark:text-dark-primary" strokeWidth={1.5} />
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-900 dark:bg-dark-hover flex items-center justify-center">
              {isClub ? (
                <Users className="h-12 w-12 sm:h-24 sm:w-24 text-white dark:text-gray-200" strokeWidth={1.5} />
              ) : (
                <User className="h-12 w-12 sm:h-24 sm:w-24 text-white dark:text-gray-200" strokeWidth={1.5} />
              )}
            </div>
          )}

          {isOwnProfile && (
            <label className="absolute bottom-1 right-1 bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg cursor-pointer hover:bg-white dark:hover:bg-dark-card transition-colors duration-200 z-20">
              <Camera className="h-4 w-4 text-gray-700 dark:text-gray-200" />
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleImageUpload(e, "profilePicture")}
                accept="image/*"
              />
            </label>
          )}
        </div>

        {/* Edit Profile Button - Moved here */}
        {isOwnProfile ? (
          isEditing ? (
            <div className="absolute top-2 right-2 flex space-x-2 z-20">
              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-sm bg-primary text-white rounded-full hover:bg-primary-dark transition-colors duration-200 font-medium shadow-lg"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-1.5 text-sm bg-gray-200 dark:bg-dark-hover text-gray-700 dark:text-dark-text-secondary rounded-full shadow-lg hover:bg-gray-300 dark:hover:bg-dark-card transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-2 right-2 p-2.5 bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-white dark:hover:bg-dark-card transition-colors duration-200 z-20"
              title="Edit Profile"
            >
              <FaEdit className="h-5 w-5" />
            </button>
          )
        ) : (
          <div className="absolute top-2 right-2 z-20">
            {renderConnectionButton()}
          </div>
        )}

        {/* Profile Info */}
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-3 mb-2 mt-4 sm:mt-0">
            {isEditing ? (
              <input
                type="text"
                value={editedData.name}
                onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary bg-gray-50 dark:bg-dark-hover border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary">{userData.name}</h1>
                {isStudent && isAlumni() && (
                  <div className="flex items-center bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light px-2 py-0.5 rounded-full text-xs sm:text-sm">
                    <GraduationCap className="h-4 w-4 mr-1 sm:h-5 sm:w-5" />
                    <span className="font-medium">Alumni</span>
                  </div>
                )}
                {isClub && (
                  <div className="flex items-center bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full text-xs sm:text-sm">
                    <Users className="h-4 w-4 mr-1 sm:h-5 sm:w-5" />
                    <span className="font-medium">Club</span>
                  </div>
                )}
                {isFaculty && (
                  <div className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full text-xs sm:text-sm">
                    <Briefcase className="h-4 w-4 mr-1 sm:h-5 sm:w-5" />
                    <span className="font-medium">Faculty</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Headline</label>
                <input
                  type="text"
                  value={editedData.headline}
                  onChange={(e) => setEditedData({ ...editedData, headline: e.target.value })}
                  className="w-full p-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary text-sm sm:text-base"
                  placeholder="Add a headline"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Location</label>
                <input
                  type="text"
                  value={editedData.location}
                  onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
                  className="w-full p-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary text-sm sm:text-base"
                  placeholder="Add location"
                />
              </div>

              {isStudent && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Department</label>
                    <select
                      value={editedData.department}
                      onChange={(e) => setEditedData({ ...editedData, department: e.target.value })}
                      className="w-full p-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Year of Study</label>
                    <select
                      value={editedData.yearOfStudy}
                      onChange={(e) => setEditedData({ ...editedData, yearOfStudy: e.target.value })}
                      className="w-full p-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary"
                    >
                      <option value="">Select Year</option>
                      {yearOfStudyOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {isFaculty && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Department</label>
                    <select
                      value={editedData.department}
                      onChange={(e) => setEditedData({ ...editedData, department: e.target.value })}
                      className="w-full p-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Designation</label>
                    <select
                      value={editedData.designation}
                      onChange={(e) => setEditedData({ ...editedData, designation: e.target.value })}
                      className="w-full p-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary"
                    >
                      <option value="">Select Designation</option>
                      {facultyDesignations.map(designation => (
                        <option key={designation} value={designation}>{designation}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {isClub && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Club Type</label>
                    <select
                      value={editedData.clubType}
                      onChange={(e) => setEditedData({ ...editedData, clubType: e.target.value })}
                      className="w-full p-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary"
                    >
                      <option value="">Select Club Type</option>
                      {clubTypes.map(type => (
                        <option key={type} value={type.toLowerCase()}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Founded Date</label>
                    <input
                      type="date"
                      value={editedData.foundedDate ? new Date(editedData.foundedDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditedData({ ...editedData, foundedDate: e.target.value })}
                      className="w-full p-2 border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <p className="text-lg text-gray-600 dark:text-dark-text-secondary font-medium">{userData.headline}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="flex items-center space-x-3 text-gray-600 dark:text-dark-text-secondary">
                  <div className="flex items-center space-x-2 bg-gray-50 dark:bg-dark-hover px-4 py-2 rounded-lg w-full">
                    <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="font-medium truncate">{userData.location}</span>
                  </div>
                </div>

                {/* Student-specific display */}
                {isStudent && (
                  <>
                    <div className="flex items-center space-x-3 text-gray-600 dark:text-dark-text-secondary">
                      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-dark-hover px-4 py-2 rounded-lg w-full">
                        <GraduationCap className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">{userData.department}</span>
                      </div>
                    </div>

                    {!isAlumni() && (
                      <div className="flex items-center space-x-3 text-gray-600 dark:text-dark-text-secondary">
                        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-dark-hover px-4 py-2 rounded-lg w-full">
                          <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{userData.yearOfStudy}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 text-gray-600 dark:text-dark-text-secondary">
                      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-dark-hover px-4 py-2 rounded-lg w-full">
                        <User className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="font-medium">ID: {studentId}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Faculty-specific display */}
                {isFaculty && (
                  <>
                    <div className="flex items-center space-x-3 text-gray-600 dark:text-dark-text-secondary">
                      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-dark-hover px-4 py-2 rounded-lg w-full">
                        <GraduationCap className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">{userData.department}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-gray-600 dark:text-dark-text-secondary">
                      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-dark-hover px-4 py-2 rounded-lg w-full">
                        <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="font-medium">{userData.designation}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Club-specific display */}
                {isClub && (
                  <>
                    <div className="flex items-center space-x-3 text-gray-600 dark:text-dark-text-secondary">
                      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-dark-hover px-4 py-2 rounded-lg w-full">
                        <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="font-medium capitalize">{userData.clubType} Club</span>
                      </div>
                    </div>

                    {userData.foundedDate && (
                      <div className="flex items-center space-x-3 text-gray-600 dark:text-dark-text-secondary">
                        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-dark-hover px-4 py-2 rounded-lg w-full">
                          <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          <span className="font-medium">
                            Founded: {new Date(userData.foundedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;