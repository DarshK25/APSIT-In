import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as userService from '../api/userService';

const OnboardingToast = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const currentYear = new Date().getFullYear();
    const [formData, setFormData] = useState({
        department: '',
        startYear: currentYear,
        graduationYear: currentYear + 4
    });

    const departments = [
        'Computer Engineering',
        'Information Technology',
        'Computer Science & Engineering: Data Science',
        'Computer Science & Engineering: Artificial Intelligence & Machine Learning',
        'Civil Engineering',
        'Mechanical Engineering'
    ];

    useEffect(() => {
        if (user && !user.department) {
            setIsOpen(true);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Calculate study duration
            const duration = formData.graduationYear - formData.startYear;
            if (duration !== 4) {
                toast.error('Engineering duration must be 4 years');
                return;
            }

            // Calculate current year of study
            const currentYearOfStudy = calculateYearOfStudy(formData.startYear);
            if (!currentYearOfStudy) {
                toast.error('Invalid study duration');
                return;
            }

            const profileData = {
                department: formData.department,
                education: [{
                    title: 'Bachelor of Engineering',
                    school: 'A. P. Shah Institute of Technology',
                    startYear: formData.startYear,
                    endYear: formData.graduationYear
                }],
                yearOfStudy: currentYearOfStudy
            };

            const response = await userService.updateProfile(profileData);
            if (response.success) {
                setIsOpen(false);
                toast.success('Profile updated successfully');
                window.location.reload(); // Refresh to update the UI
            } else {
                throw new Error(response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.');
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
                <h2 className="text-xl font-semibold mb-4">Complete Your Profile</h2>
                <p className="text-gray-600 mb-6">
                    Please provide your educational details to continue.
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Department
                            </label>
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

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
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                        Save and Continue
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingToast; 