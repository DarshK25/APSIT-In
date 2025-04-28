import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AboutSection from "../components/AboutSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import ExperienceSection from "../components/ExperienceSection";
import ProjectsSection from "../components/ProjectsSection";
import ProfileHeader from "../components/ProfileHeader";
import Recommendations from "../components/Recommendations";
import UserPostSection from "../components/UserPostSection";
import ClubEventsSection from "../components/ClubEventsSection";
import ClubMemberSection from "../components/ClubMemberSection";
import SubjectsSection from "../components/SubjectsSection";
import FacultyInfoSection from "../components/FacultyInfoSection";
import { getUserProfile, getPublicProfile, updateUserProfile } from "../api/userService";
import { toast } from "react-hot-toast";
import Feed from "../components/Feed";
import { useAuth } from "../context/AuthContext";

const showUserPosts = (userData) => {
  if (!userData?.posts?.length) return null;
  return userData.posts.map(post => (
    <Feed key={post._id} post={post} />
  ));
}

// Determine account type based on email pattern and accountType field
const getAccountType = (userData) => {
  if (!userData) return 'student'; // Default fallback
  
  // First check if accountType is explicitly set
  if (userData.accountType) {
    return userData.accountType.toLowerCase();
  }
  
  // Fallback to email pattern matching
  const email = userData.email;
  if (!email) return 'student';
  if (/^\d{8}@apsit\.edu\.in$/.test(email)) return 'student';
  if (/club@apsit\.edu\.in$/.test(email)) return 'club';
  return 'faculty';
};

const ProfilePage = () => {
  const { username } = useParams(); // Get username from URL
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]); 
  const { user, setUser } = useAuth();
  const [accountType, setAccountType] = useState(null);
  
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
        let profileData;
        if (username) {
          const response = await getPublicProfile(username);
          profileData = response.user || response.data;
          if (!profileData) {
            throw new Error('Profile not found');
          }
          setUserData(profileData);
        } else {
          profileData = currentUserData;
          setUserData(profileData);
        }
        
        // Set account type based on user data
        const type = getAccountType(profileData);
        setAccountType(type);
        
        console.log('Profile Data:', profileData);
        console.log('Account Type:', type);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setError(error.message || "Failed to load profile. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username]); // Re-fetch when username changes

  const handleProfileUpdate = async (updatedData) => {
    try {
      const response = await updateUserProfile(updatedData);
      if (response) {
        // Update local state
        setUserData(prevData => ({
          ...prevData,
          ...response
        }));
        
        // Update AuthContext user state if this is the current user's profile
        if (isOwnProfile && setUser) {
          setUser(prevUser => ({
            ...prevUser,
            ...response
          }));
        }
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
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
  const isStudent = accountType === 'student';
  const isFaculty = accountType === 'faculty';
  const isClub = accountType === 'club';

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
              accountType={accountType}
            />
            
            <div className="space-y-6">
              <AboutSection
                userData={userData}
                isOwnProfile={isOwnProfile}
                onSave={handleProfileUpdate}
              />
              
              {/* User Posts - for all account types */}
              {userData.username && (
                <UserPostSection
                  username={userData.username}
                  accountType={accountType}
                />
              )}
              
              {/* Faculty specific sections */}
              {isFaculty && (
                <>
                  <FacultyInfoSection
                    userData={userData}
                    isOwnProfile={isOwnProfile}
                    onSave={handleProfileUpdate}
                  />
                  <SubjectsSection
                    userData={userData}
                    isOwnProfile={isOwnProfile}
                    onSave={handleProfileUpdate}
                  />
                </>
              )}
              
              {/* Club specific sections */}
              {isClub && (
                <>
                  <ClubEventsSection
                    userData={userData}
                    isOwnProfile={isOwnProfile}
                    onSave={handleProfileUpdate}
                  />
                  <ClubMemberSection
                    userData={userData}
                    isOwnProfile={isOwnProfile}
                    onSave={handleProfileUpdate}
                  />
                </>
              )}
              
              {/* Experience - for students and faculty only */}
              {!isClub && (
                <ExperienceSection
                  userData={userData}
                  isOwnProfile={isOwnProfile}
                  onSave={handleProfileUpdate}
                />
              )}

              {/* Projects - for all account types */}
              <ProjectsSection
                userData={userData}
                isOwnProfile={isOwnProfile}
                onSave={handleProfileUpdate}
              />

              {/* Education - for students and faculty only */}
              {!isClub && (
                <EducationSection
                  userData={userData}
                  isOwnProfile={isOwnProfile}
                  onSave={handleProfileUpdate}
                />
              )}
              
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
                      width: `${calculateProfileCompletion(userData, accountType)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {calculateProfileCompletion(userData, accountType)}% Complete
                </p>
              </div>
            )}

            {/* Skills section - for all account types */}
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

// Helper function to calculate profile completion percentage based on account type
const calculateProfileCompletion = (userData, accountType) => {
  let requiredFields = [
    'name',
    'headline',
    'location',
    'about',
    'profilePicture',
    'bannerImg',
    'skills',
    'projects'
  ];
  
  // Add account-type specific fields
  if (accountType === 'student' || accountType === 'faculty') {
    requiredFields = [...requiredFields, 'education', 'experience'];
  }
  
  if (accountType === 'faculty') {
    requiredFields = [...requiredFields, 'designation', 'subjects'];
  }
  
  if (accountType === 'club') {
    requiredFields = [...requiredFields, 'clubType', 'foundedDate'];
  }

  const completedFields = requiredFields.filter(field => {
    if (Array.isArray(userData[field])) {
      return userData[field].length > 0;
    }
    return userData[field] && userData[field] !== " ";
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
};

export default ProfilePage;