import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AboutSection from "../components/AboutSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import ExperienceSection from "../components/ExperienceSection";
import ProjectsSection from "../components/ProjectsSection";
import CertificationsSection from "../components/CertificationsSection";
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
import { useTheme } from "../context/ThemeContext";

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
    'projects',
    'certifications'
  ];
  
  // Add account-type specific fields
  if (accountType === 'student' || accountType === 'faculty') {
    requiredFields = [...requiredFields, 'education', 'experience'];
  }
  
  if (accountType === 'faculty') {
    requiredFields = [...requiredFields, 'designation', 'subjects', 'department'];
  }
  
  if (accountType === 'club') {
    requiredFields = [...requiredFields, 'clubType', 'foundedDate', 'description'];
  }

  const completedFields = requiredFields.filter(field => {
    if (Array.isArray(userData[field])) {
      return userData[field] && userData[field].length > 0;
    }
    return userData[field] && userData[field].trim() !== "";
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
};

const ProfilePage = () => {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]); 
  const { user, setUser } = useAuth();
  const [accountType, setAccountType] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 dark:bg-dark-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 dark:bg-dark-secondary">
        <div className="text-center text-red-500 dark:text-red-400">
          <h2 className="text-2xl font-semibold">{error}</h2>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 dark:bg-dark-secondary">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Profile not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">The requested profile could not be found</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = !username || (currentUser?._id === userData?._id);
  const isStudent = accountType === 'student';
  const isFaculty = accountType === 'faculty';
  const isClub = accountType === 'club';

  const isConnected = currentUser?.connections?.includes(userData?._id);
  const canViewFullProfile = isOwnProfile || isConnected;

  const shouldShowSection = (section) => {
    if (isOwnProfile) return true;
    if (isConnected) return true;
    
    // For non-connections, check specific privacy settings
    switch (section) {
      case 'education':
        return userData?.settings?.showEducationToNonConnections;
      case 'experience':
        return userData?.settings?.showExperienceToNonConnections;
      case 'projects':
        return userData?.settings?.showProjectsToNonConnections;
      case 'certifications':
        return userData?.settings?.showCertificationsToNonConnections;
      case 'about':
        return true; // Always show basic info
      case 'skills':
        return true; // Always show skills
      default:
        return false; // Hide other sections by default for non-connections
    }
  };

  // Function to determine what information to show in the profile header
  const getVisibleProfileInfo = () => {
    if (isOwnProfile || isConnected) {
      return userData;
    }

    // For non-connections, only show basic info and what's allowed by settings
    return {
      ...userData,
      education: shouldShowSection('education') ? userData.education : [],
      experience: shouldShowSection('experience') ? userData.experience : [],
      projects: shouldShowSection('projects') ? userData.projects : [],
      // Keep basic info visible
      name: userData.name,
      headline: userData.headline,
      location: userData.location,
      profilePicture: userData.profilePicture,
      bannerImg: userData.bannerImg,
      department: userData.department,
      yearOfStudy: userData.yearOfStudy,
      designation: userData.designation,
      clubType: userData.clubType,
      foundedDate: userData.foundedDate,
      skills: userData.skills,
      about: userData.about
    };
  };

  // Get filtered profile data based on privacy settings
  const visibleProfileData = getVisibleProfileInfo();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-secondary">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 bg-gray-50 dark:bg-dark-secondary">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* Left Column - Main Profile Content */}
          <div className="col-span-1 md:col-span-8 space-y-4 md:space-y-6">
            <ProfileHeader 
              userData={visibleProfileData} 
              isOwnProfile={isOwnProfile}
              onSave={handleProfileUpdate}
              accountType={accountType} // Pass accountType to header if it needs it
            />

            <AboutSection 
              userData={visibleProfileData} 
              isOwnProfile={isOwnProfile}
              onSave={handleProfileUpdate}
            />

            {/* Student/Faculty Specific Sections */}
            {(isStudent || isFaculty) && (
              <>
                <EducationSection
                  userData={visibleProfileData}
                  isOwnProfile={isOwnProfile}
                  onSave={handleProfileUpdate}
                />
                <ExperienceSection
                  userData={visibleProfileData}
                  isOwnProfile={isOwnProfile}
                  onSave={handleProfileUpdate}
                />
                <SkillsSection
                  userData={visibleProfileData}
                  isOwnProfile={isOwnProfile}
                  onSave={handleProfileUpdate}
                />
                <ProjectsSection
                  userData={visibleProfileData}
                  isOwnProfile={isOwnProfile}
                  onSave={handleProfileUpdate}
                />
                <CertificationsSection
                  userData={visibleProfileData}
                  isOwnProfile={isOwnProfile}
                  onSave={handleProfileUpdate}
                />
              </>
            )}

            {/* Faculty specific sections */}
            {isFaculty && (
              <>
                <FacultyInfoSection
                  userData={visibleProfileData}
                  isOwnProfile={isOwnProfile}
                  onSave={handleProfileUpdate}
                />
                <SubjectsSection
                  userData={visibleProfileData}
                  isOwnProfile={isOwnProfile}
                  onSave={handleProfileUpdate}
                />
              </>
            )}

            {/* Club specific sections */}
            {isClub && (
              <>
                <ClubEventsSection
                  userData={visibleProfileData}
                  isOwnProfile={isOwnProfile}
                  onSave={handleProfileUpdate}
                />
                <ClubMemberSection
                  userData={visibleProfileData}
                  isOwnProfile={isOwnProfile}
                  onSave={handleProfileUpdate}
                />
              </>
            )}

            {/* User Posts - for all account types */}
            <UserPostSection
              username={username}
              accountType={accountType}
              isOwnProfile={isOwnProfile}
            />

          </div>

          {/* Right Column - Recommendations, etc. */}
          <div className="col-span-1 md:col-span-4 space-y-4 md:space-y-6">
            {isOwnProfile && calculateProfileCompletion(userData, accountType) < 100 && (
              <div className="rounded-lg shadow-sm p-4 md:p-6 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">Complete Your Profile</h2>
                <div className="w-full rounded-full h-2.5 bg-gray-200 dark:bg-dark-hover">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${calculateProfileCompletion(userData, accountType)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-2">
                  {calculateProfileCompletion(userData, accountType)}% Complete
                </p>
              </div>
            )}

            {isOwnProfile && <Recommendations currentUser={userData} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;