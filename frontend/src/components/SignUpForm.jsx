import { useState } from "react";
import { Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const SignUpForm = () => {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        accountType: "student", // Default to student
        // New fields for conditional rendering
        department: "",
        designation: "",
        clubType: "",
        foundedDate: "" // For club accounts
    });
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    // Define options for dropdowns
    const departments = [
        'Computer Engineering',
        'Information Technology',
        'Computer Science & Engineering: Data Science',
        'Computer Science & Engineering: Artificial Intelligence & Machine Learning',
        'Civil Engineering',
        'Mechanical Engineering'
    ];

    const facultyDesignations = [
        'Professor',
        'Associate Professor', 
        'Assistant Professor',
        'HOD',
        'Principal',
        'Visiting Faculty'
    ];

    const clubTypes = [
        'technical',
        'cultural',
        'sports',
        'other'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateEmail = (email, accountType) => {
        // console.log("Validating email:", email, "for account type:", accountType);
        email = email.toLowerCase();
        // console.log("Email after toLowerCase:", email);

        // Allow admin email to bypass validation
        if (email === 'darshkalathiya25@gmail.com') {
            // console.log("Admin email bypass triggered.");
            return true;
        }

        if (!email.endsWith('@apsit.edu.in')) {
            // console.log("Email does not end with @apsit.edu.in");
            return false;
        }
        
        const prefix = email.split('@')[0];
        // console.log("Email prefix:", prefix);
        switch(accountType) {
            case 'student':
                return /^\d{8}$/.test(prefix);
            case 'faculty':
                return /^[a-z]+$/.test(prefix);
            case 'club':
                return /^[a-z]+club$/.test(prefix);
            default:
                return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate email based on account type
        if (!validateEmail(formData.email, formData.accountType)) {
            let message = '';
            switch(formData.accountType) {
                case 'student':
                    message = 'Student email must be 8 digits followed by @apsit.edu.in (e.g., 12345678@apsit.edu.in)';
                    break;
                case 'faculty':
                    message = 'Faculty email must be lowercase letters followed by @apsit.edu.in (e.g., john@apsit.edu.in)';
                    break;
                case 'club':
                    message = 'Club email must be lowercase letters ending with "club" followed by @apsit.edu.in (e.g., codingclub@apsit.edu.in)';
                    break;
                default:
                    message = 'Please use a valid APSIT college email';
            }
            toast.error(message);
            return;
        }

        // Validate password
        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        // Additional validation based on account type
        if (formData.accountType === 'faculty') {
            if (!formData.designation) {
                toast.error('Please select your designation');
                return;
            }
            if (!formData.department) {
                toast.error('Please select your department');
                return;
            }
        } else if (formData.accountType === 'club') {
            if (!formData.clubType) {
                toast.error('Please select club type');
                return;
            }
            if (!formData.foundedDate) {
                toast.error('Please select a founded date');
                return;
            }
        }

        setIsLoading(true);
        try {
            const dataToSend = {
                name: formData.name.trim(),
                username: formData.username.trim().toLowerCase(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                accountType: formData.accountType
            };

            // Add conditional fields to dataToSend
            if (formData.accountType === 'faculty') {
                dataToSend.designation = formData.designation;
                dataToSend.department = formData.department;
            } else if (formData.accountType === 'club') {
                dataToSend.clubType = formData.clubType;
                dataToSend.foundedDate = formData.foundedDate;
            }
            
            const success = await signup(dataToSend);
            
            if (success) {
                toast.success('Account created successfully!');
                navigate(`/profile/${formData.username.trim().toLowerCase()}`);
            }
        } catch (error) {
            console.error("Signup error:", error);
            toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
                type="text"
                name="name"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
                className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
                maxLength={50}
            />
            <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
                pattern="^[a-zA-Z0-9._]{3,30}$"
                title="Username can contain letters, numbers, dots and underscores (3-30 characters)"
                maxLength={30}
            />
            <input
                type="email"
                name="email"
                placeholder="College Email"
                value={formData.email}
                onChange={handleChange}
                className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
            />
            <input
                type="password"
                name="password"
                placeholder="Password (6+ characters)"
                value={formData.password}
                onChange={handleChange}
                className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
                minLength={6}
                maxLength={50}
            />
            
            <div className="form-control">
                <label className="label">
                    <span className="label-text dark:text-gray-300">Account Type</span>
                </label>
                <select 
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="select select-bordered dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="club">Club</option>
                </select>
            </div>

            {formData.accountType === 'faculty' && (
                <>
                    <div>
                        <label htmlFor="designation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Designation
                        </label>
                        <select
                            id="designation"
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
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
                            onChange={handleChange}
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

            {formData.accountType === 'club' && (
                <>
                    <div>
                        <label htmlFor="clubType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Club Type
                        </label>
                        <select
                            id="clubType"
                            name="clubType"
                            value={formData.clubType}
                            onChange={handleChange}
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
                            onChange={handleChange}
                            className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            required
                            max={new Date().toISOString().split('T')[0]} // Prevent future dates
                        />
                    </div>
                </>
            )}

            <button 
                type="submit" 
                disabled={isLoading} 
                className="btn btn-primary w-full text-white dark:bg-blue-600 dark:hover:bg-blue-700"
            >
                {isLoading ? <Loader className="size-5 animate-spin" /> : "Agree & Join"}
            </button>
        </form>
    );
};

export default SignUpForm;