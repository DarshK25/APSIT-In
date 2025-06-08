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
        accountType: "student"
    });
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateEmail = (email, accountType) => {
        email = email.toLowerCase();
        if (!email.endsWith('@apsit.edu.in')) return false;
        
        const prefix = email.split('@')[0];
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

        setIsLoading(true);
        try {
            const success = await signup({
                name: formData.name.trim(),
                username: formData.username.trim().toLowerCase(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                accountType: formData.accountType
            });
            
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