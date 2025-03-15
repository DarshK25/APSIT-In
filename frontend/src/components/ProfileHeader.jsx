import { useState } from "react";
import { Camera, MapPin, UserPlus, Mail, Calendar, GraduationCap, User } from "lucide-react";
import { uploadToCloudinary } from "../api/userService";
import toast from "react-hot-toast";

const ProfileHeader = ({ userData, isOwnProfile, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: userData.name,
    headline: userData.headline,
    location: userData.location,
    department: userData.department,
    yearOfStudy: userData.yearOfStudy,
    studentId: userData.studentId,
    about: userData.about
  });

  const ifClub = userData.email === 'devopsclub@apsit.edu.in' 
  || userData.email === 'codersclub@apsit.edu.in' 
  || userData.email === 'cybersecurityclub@apsit.edu.in' 
  || userData.email === 'datascienceclub@apsit.edu.in';

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

  // Function to check if user is an alumni
  const isAlumni = () => {
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

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Banner */}
      <div className="relative h-64">
        <img
          src={userData.bannerImg || "/images/default-banner.jpg"}
          alt="Profile Banner"
          className="w-full h-full object-cover"
        />
        {isOwnProfile && (
          <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-white transition-colors duration-200 z-10">
            <Camera className="h-5 w-5 text-gray-700" />
            <input
              type="file"
              className="hidden"
              onChange={(e) => handleImageUpload(e, "bannerImg")}
              accept="image/*"
            />
          </label>
        )}
      </div>

      {/* Profile Content */}
      <div className="relative px-6 pb-6">
        {/* Profile Picture */}
        <div className="relative -mt-20 mb-4 flex justify-between items-end">
          <div className="relative">
            <img
              src={userData.profilePicture || "/images/default-avatar.jpg"}
              alt={userData.name}
              className="w-40 h-40 rounded-2xl border-4 border-white shadow-lg object-cover"
            />
            {isOwnProfile && (
              <label className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg cursor-pointer hover:bg-white transition-colors duration-200">
                <Camera className="h-4 w-4 text-gray-700" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, "profilePicture")}
                  accept="image/*"
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {isOwnProfile ? (
              isEditing ? (
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors duration-200 font-medium"
                >
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors duration-200 font-medium"
                >
                  Edit Profile
                </button>
              )
            ) : (
              <>
                <button
                  onClick={() => toast.success('Message sent!')}
                  className="p-2.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
                >
                  <Mail className="h-5 w-5" />
                </button>
                <button
                  onClick={() => toast.success('Connection request sent!')}
                  className="px-6 py-2.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors duration-200 font-medium"
                >
                  <UserPlus className="h-5 w-5 mr-2 inline-block" />
                  Connect
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.name}
                  onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                  className="text-3xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">{userData.name}</h1>
                  {isAlumni() && (
                    <div 
                      className="flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full"
                      title="APSIT Alumni"
                    >
                      <GraduationCap className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">Alumni</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editedData.headline}
                    onChange={(e) => setEditedData({ ...editedData, headline: e.target.value })}
                    className="text-lg text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Headline"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={editedData.location}
                      onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Location"
                    />
                  </div>

                  <select
                    value={editedData.department}
                    onChange={(e) => setEditedData({ ...editedData, department: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>

                  {!ifClub && !isAlumni() && (
                    <select
                      value={editedData.yearOfStudy}
                      onChange={(e) => setEditedData({ ...editedData, yearOfStudy: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Year of Study</option> 
                      {yearOfStudyOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  )}

                  {!ifClub && (
                    <input
                      type="text"
                      value={editedData.studentId}
                      onChange={(e) => setEditedData({ ...editedData, studentId: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Student ID"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-gray-600 font-medium">{userData.headline}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg w-full">
                      <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <span className="font-medium truncate">{userData.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg w-full">
                      <GraduationCap className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <span className="font-medium truncate">{userData.department}</span>
                    </div>
                  </div>

                  {!ifClub && !isAlumni() && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg w-full">
                        <Calendar className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <span className="font-medium">{userData.yearOfStudy}</span>
                      </div>
                    </div>
                  )}

                  {!ifClub && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg w-full">
                        <User className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <span className="font-medium">ID: {userData.studentId}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;