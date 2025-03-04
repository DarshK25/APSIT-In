import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AboutSection from "../components/AboutSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import ExperienceSection from "../components/ExperienceSection";
import ProjectsSection from "../components/ProjectsSection";
import ProfileHeader from "../components/ProfileHeader";
import Recommendations from "../components/Recommendations";
import { getUserProfile, getPublicProfile, updateUserProfile } from "../api/userService";

const ProfilePage = () => {
  const { username } = useParams(); // Get username from URL
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Always fetch current user for comparison
        const currentUserData = await getUserProfile();
        setCurrentUser(currentUserData);

        // If username is provided in URL, fetch that user's profile
        // Otherwise, use current user's data
        if (username) {
          const profileData = await getPublicProfile(username);
          setUserData(profileData);
        } else {
          setUserData(currentUserData);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setError("Failed to load profile. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username]); // Re-fetch when username changes

  const handleProfileUpdate = async (updatedData) => {
    try {
      const updatedUser = await updateUserProfile(updatedData);
      if (updatedUser) {
        setUserData(updatedUser);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">
          <h2 className="text-2xl font-semibold">{error}</h2>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Profile not found</h2>
          <p className="text-gray-600 mt-2">The requested profile could not be found</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = !username || (currentUser?._id === userData?._id);

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Main Profile Content */}
          <div className="col-span-12 lg:col-span-8">
            <ProfileHeader
              userData={userData}
              isOwnProfile={isOwnProfile}
              onSave={handleProfileUpdate}
            />
            
            <div className="space-y-6">
              <AboutSection
                userData={userData}
                isOwnProfile={isOwnProfile}
                onSave={handleProfileUpdate}
              />

              <ExperienceSection
                userData={userData}
                isOwnProfile={isOwnProfile}
                onSave={handleProfileUpdate}
              />

              <ProjectsSection
                userData={userData}
                isOwnProfile={isOwnProfile}
                onSave={handleProfileUpdate}
              />

              <EducationSection
                userData={userData}
                isOwnProfile={isOwnProfile}
                onSave={handleProfileUpdate}
              />
            </div>
          </div>

          {/* Right Column - Skills and Additional Info */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {isOwnProfile && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Completion</h2>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${calculateProfileCompletion(userData)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {calculateProfileCompletion(userData)}% Complete
                </p>
              </div>
            )}

            <SkillsSection
              userData={userData}
              isOwnProfile={isOwnProfile}
              onSave={handleProfileUpdate}
            />

            {isOwnProfile && <Recommendations currentUser={userData} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate profile completion percentage
const calculateProfileCompletion = (userData) => {
  const requiredFields = [
    'name',
    'headline',
    'location',
    'about',
    'profilePicture',
    'bannerImg',
    'skills',
    'education',
    'experience',
    'projects'
  ];

  const completedFields = requiredFields.filter(field => {
    if (Array.isArray(userData[field])) {
      return userData[field].length > 0;
    }
    return userData[field] && userData[field] !== " ";
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
};

export default ProfilePage;