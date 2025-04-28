import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, getUserProfile } from '../api/userService';
import { GraduationCap, Briefcase, Users } from 'lucide-react';

const OnboardingToast = () => {
    const { user, setUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    
    const currentYear = new Date().getFullYear();
    
    // Determine account type based on email pattern
    const accountType = user?.email?.endsWith('club@apsit.edu.in') 
        ? 'club' 
        : /^\d{8}@apsit\.edu\.in$/.test(user?.email) 
            ? 'student' 
            : 'faculty';

    const [formData, setFormData] = useState({
        department: user?.department || '',
        ...(accountType === 'student' && {
            startYear: currentYear,
            graduationYear: currentYear + 4
        }),
        ...(accountType === 'faculty' && {
            designation: user?.designation || '',
            department: user?.department || ''
        }),
        ...(accountType === 'club' && {
            clubType: user?.clubType || '',
            foundedDate: user?.foundedDate || new Date().toISOString().split('T')[0]
        })
    });

    // Single useEffect to check if onboarding is needed
    useEffect(() => {
        if (!user) return;

        // If onboarding is already complete, don't show the toast
        if (user.onboardingComplete) {
            setIsOpen(false);
            return;
        }

        // Check required fields based on account type
        switch (accountType) {
            case 'student':
                setIsOpen(!user.department || !user.yearOfStudy);
                break;
            case 'faculty':
                setIsOpen(!user.department || !user.designation);
                break;
            case 'club':
                setIsOpen(!user.clubType);
                break;
            default:
                setIsOpen(false);
        }
    }, [user, accountType]);

    const departments = [
        'Computer Engineering',
        'Information Technology',
        'Computer Science & Engineering: Data Science',
        'Computer Science & Engineering: Artificial Intelligence & Machine Learning',
        'Civil Engineering',
        'Mechanical Engineering'
    ];

    const clubTypes = [
        'technical',
        'cultural',
        'sports',
        'other'
    ];

    const facultyDesignations = [
        'Professor',
        'Associate Professor',
        'Assistant Professor',
        'HOD',
        'Principal',
        'Visiting Faculty'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            let profileData = {};
            
            if (accountType === 'student') {
                // Validate student data
                const duration = formData.graduationYear - formData.startYear;
                if (duration !== 4) {
                    toast.error('Engineering duration must be 4 years');
                    return;
                }

                const currentYearOfStudy = calculateYearOfStudy(formData.startYear);
                if (!currentYearOfStudy) {
                    toast.error('Invalid study duration');
                    return;
                }

                profileData = {
                    department: formData.department,
                    education: [{
                        title: 'Bachelor of Engineering',
                        school: 'A. P. Shah Institute of Technology',
                        startYear: formData.startYear,
                        endYear: formData.graduationYear
                    }],
                    yearOfStudy: currentYearOfStudy,
                    onboardingComplete: true
                };
            } else if (accountType === 'faculty') {
                if (!formData.designation) {
                    toast.error('Please select your designation');
                    return;
                }
                if (!formData.department) {
                    toast.error('Please select your department');
                    return;
                }

                profileData = {
                    department: formData.department,
                    designation: formData.designation,
                    headline: `${formData.designation} at APSIT`,
                    onboardingComplete: true
                };
            } else if (accountType === 'club') {
                if (!formData.clubType) {
                    toast.error('Please select club type');
                    return;
                }

                profileData = {
                    clubType: formData.clubType,
                    foundedDate: formData.foundedDate,
                    headline: `${formData.clubType.charAt(0).toUpperCase() + formData.clubType.slice(1)} Club at APSIT`,
                    onboardingComplete: true
                };
            }

            // Update the profile
            await updateUserProfile(profileData);
            
            // Fetch the updated user data to ensure we have the latest state
            const updatedUserData = await getUserProfile();
            
            if (updatedUserData) {
                setUser(updatedUserData);
                setIsOpen(false);
                toast.success('Profile updated successfully');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile. Please try again.');
        }
    };

    const calculateYearOfStudy = (startYear) => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const academicYearStart = 7; // July

        let yearsCompleted = currentYear - startYear;
        if (currentMonth < academicYearStart) {
            yearsCompleted--;
        }

        switch (yearsCompleted) {
            case 0:
                return 'First Year';
            case 1:
                return 'Second Year';
            case 2:
                return 'Third Year';
            case 3:
                return 'Fourth Year';
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center mb-4">
                    {accountType === 'student' && (
                        <GraduationCap className="h-6 w-6 text-blue-600 mr-2" />
                    )}
                    {accountType === 'faculty' && (
                        <Briefcase className="h-6 w-6 text-green-600 mr-2" />
                    )}
                    {accountType === 'club' && (
                        <Users className="h-6 w-6 text-purple-600 mr-2" />
                    )}
                    <h2 className="text-xl font-semibold">
                        Complete Your {accountType.charAt(0).toUpperCase() + accountType.slice(1)} Profile
                    </h2>
                </div>
                <p className="text-gray-600 mb-6">
                    {accountType === 'student' 
                        ? 'Please provide your educational details to continue.'
                        : accountType === 'faculty'
                            ? 'Please provide your professional details to continue.'
                            : 'Please provide your club details to continue.'}
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Common field for students and faculty */}
                        {(accountType === 'student' || accountType === 'faculty') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department
                                </label>
                                <select
                                    value={formData.department}
                                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                    required={accountType === 'student' || accountType === 'faculty'}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Student-specific fields */}
                        {accountType === 'student' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Year
                                    </label>
                                    <select
                                        value={formData.startYear}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            startYear: parseInt(e.target.value),
                                            graduationYear: parseInt(e.target.value) + 4
                                        }))}
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {Array.from({ length: 5 }, (_, i) => currentYear - 3 + i).map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Graduation Year
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.graduationYear}
                                        readOnly
                                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Faculty-specific field */}
                        {accountType === 'faculty' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Designation
                                </label>
                                <select
                                    value={formData.designation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Designation</option>
                                    {facultyDesignations.map(designation => (
                                        <option key={designation} value={designation}>{designation}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Club-specific fields */}
                        {accountType === 'club' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Club Type
                                    </label>
                                    <select
                                        value={formData.clubType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, clubType: e.target.value }))}
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Club Type</option>
                                        {clubTypes.map(type => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Founded Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.foundedDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, foundedDate: e.target.value }))}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={`w-full mt-6 px-4 py-2 rounded-md text-white transition-colors duration-200 ${
                            accountType === 'student' ? 'bg-blue-600 hover:bg-blue-700' :
                            accountType === 'faculty' ? 'bg-green-600 hover:bg-green-700' :
                            'bg-purple-600 hover:bg-purple-700'
                        }`}
                    >
                        Save and Continue
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingToast;