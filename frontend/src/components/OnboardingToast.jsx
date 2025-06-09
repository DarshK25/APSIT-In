import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, getUserProfile } from '../api/userService';
import { GraduationCap, Briefcase, Users } from 'lucide-react';

const OnboardingToastContent = ({ t }) => {
    const { user, setUser } = useAuth();
    
    const currentYear = new Date().getFullYear();

    // Determine initial account type for the form (it should already be set by now)
    const initialAccountType = user?.accountType || 'student';

    const [selectedAccountType, setSelectedAccountType] = useState(initialAccountType);
    const [formData, setFormData] = useState({
        department: user?.department || '',
        ...(initialAccountType === 'student' && {
            startYear: user?.education?.[0]?.startYear || currentYear,
            graduationYear: user?.education?.[0]?.endYear || currentYear + 4
        }),
        ...(initialAccountType === 'faculty' && {
            designation: user?.designation || '',
            department: user?.department || ''
        }),
        ...(initialAccountType === 'club' && {
            clubType: user?.clubType || '',
            foundedDate: user?.foundedDate ? new Date(user.foundedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        })
    });

    // Reset form data when account type changes (will be triggered by user prop change)
    useEffect(() => {
        // Update selectedAccountType if the user object's accountType changes
        if (user?.accountType && user.accountType !== selectedAccountType) {
            setSelectedAccountType(user.accountType);
        }

        // Reset formData based on the new account type
        setFormData({
            department: user?.department || '',
            designation: user?.designation || '',
            clubType: user?.clubType || '',
            foundedDate: user?.foundedDate ? new Date(user.foundedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            ...(user?.accountType === 'student' && {
                startYear: user?.education?.[0]?.startYear || currentYear,
                graduationYear: user?.education?.[0]?.endYear || currentYear + 4
            }),
            ...(user?.accountType === 'faculty' && {
                designation: user?.designation || '',
                department: user?.department || ''
            }),
            ...(user?.accountType === 'club' && {
                clubType: user?.clubType || '',
                foundedDate: user?.foundedDate ? new Date(user.foundedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            })
        });
    }, [user, selectedAccountType, currentYear]);

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
            
            if (selectedAccountType === 'student') {
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
                    onboardingComplete: true,
                    accountType: selectedAccountType,
                    headline: `Student at APSIT`
                };
            } else if (selectedAccountType === 'faculty') {
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
                    onboardingComplete: true,
                    accountType: selectedAccountType
                };
            } else if (selectedAccountType === 'club') {
                if (!formData.clubType) {
                    toast.error('Please select club type');
                    return;
                }

                profileData = {
                    clubType: formData.clubType,
                    foundedDate: formData.foundedDate,
                    headline: `${formData.clubType.charAt(0).toUpperCase() + formData.clubType.slice(1)} Club at APSIT`,
                    onboardingComplete: true,
                    accountType: selectedAccountType
                };
            }

            await updateUserProfile(profileData);
            
            const updatedUserData = await getUserProfile();
            
            if (updatedUserData) {
                setUser(updatedUserData);
                toast.dismiss(t.id);
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

    return (
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 min-w-[320px] max-w-lg w-full z-[100] relative">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Complete Your Profile</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Please provide the required details to complete your profile.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {selectedAccountType === 'student' && (
                    <>
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Department
                            </label>
                            <select
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <label htmlFor="startYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Start Year
                                </label>
                                <input
                                    type="number"
                                    id="startYear"
                                    name="startYear"
                                    value={formData.startYear}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        startYear: parseInt(e.target.value),
                                        graduationYear: parseInt(e.target.value) + 4 // Automatically calculate graduation year
                                    }))}
                                    className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    required
                                    min={currentYear - 10} // Adjust as needed
                                    max={currentYear}
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Graduation Year
                                </label>
                                <input
                                    type="number"
                                    id="graduationYear"
                                    name="graduationYear"
                                    value={formData.graduationYear}
                                    onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: parseInt(e.target.value) }))}
                                    className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    required
                                    min={currentYear}
                                    max={currentYear + 5} // Adjust as needed
                                />
                            </div>
                        </div>
                    </>
                )}

                {selectedAccountType === 'faculty' && (
                    <>
                        <div>
                            <label htmlFor="designation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Designation
                            </label>
                            <select
                                id="designation"
                                name="designation"
                                value={formData.designation}
                                onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                                className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select Designation</option>
                                {facultyDesignations.map(designation => (
                                    <option key={designation} value={designation}>{designation}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Department
                            </label>
                            <select
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                {selectedAccountType === 'club' && (
                    <>
                        <div>
                            <label htmlFor="clubType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Club Type
                            </label>
                            <select
                                id="clubType"
                                name="clubType"
                                value={formData.clubType}
                                onChange={(e) => setFormData(prev => ({ ...prev, clubType: e.target.value }))}
                                className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select Club Type</option>
                                {clubTypes.map(type => (
                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="foundedDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Founded Date
                            </label>
                            <input
                                type="date"
                                id="foundedDate"
                                name="foundedDate"
                                value={formData.foundedDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, foundedDate: e.target.value }))}
                                className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                required
                                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                            />
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    className="btn btn-primary w-full text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                    Complete Profile
                </button>
            </form>
        </div>
    );
};

const OnboardingToast = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        let shouldShow = false;

        // Show toast if onboarding is not complete AND either:
        // 1. User just signed up (no previous onboarding data)
        // 2. Test user changed account type
        if (!user.onboardingComplete) {
            const isTestUser = user.email === 'darshkalathiya25@gmail.com';
            const hasNoPreviousData = !user.department && !user.designation && !user.clubType;
            
            if (hasNoPreviousData || isTestUser) {
                shouldShow = true;
            }
        }

        if (shouldShow) {
            toast.custom((t) => (
                <OnboardingToastContent t={t} />
            ), {
                duration: Infinity,
                position: 'top-center',
                className: 'w-full max-w-lg mx-auto',
                style: {
                    padding: '0',
                    background: 'transparent',
                    boxShadow: 'none',
                }
            });
        } else {
            // If onboarding is complete, ensure all toasts are dismissed
            toast.dismiss();
        }
    }, [user]);

    return null;
};

export default OnboardingToast;