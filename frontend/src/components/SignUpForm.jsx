import { useState } from "react";
import { Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const SignUpForm = () => {
	const [formData, setFormData] = useState({
		name: "",
		username: "",
		email: "",
		password: ""
	});
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(true);
	const { signup } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const validateEmail = (email) => {
		return email.toLowerCase().endsWith('@apsit.edu.in');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		// Validate email
		if (!validateEmail(formData.email)) {
			toast.error('Please use your APSIT college email (example@apsit.edu.in)');
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
				password: formData.password
			});
			
			if (success) {
				toast.success('Account created successfully!');
				navigate('/profile');
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
				className="input input-bordered w-full"
				required
				maxLength={50}
			/>
			<input
				type="text"
				name="username"
				placeholder="Username"
				value={formData.username}
				onChange={handleChange}
				className="input input-bordered w-full"
				required
				pattern="^[a-zA-Z0-9._]{3,30}$"
				title="Username can contain letters, numbers, dots and underscores (3-30 characters)"
				maxLength={30}
			/>
			<input
				type="email"
				name="email"
				placeholder="College Email (example@apsit.edu.in)"
				value={formData.email}
				onChange={handleChange}
				className="input input-bordered w-full"
				required
			/>
			<div className="relative">
				<input
					type={showPassword ? "text" : "password"}
					name="password"
					placeholder="Password (6+ characters)"
					value={formData.password}
					onChange={handleChange}
					className="input input-bordered w-full pr-10"
					required
					minLength={6}
					maxLength={50}
				/>
				<button
					type="button"
					className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
					onClick={() => setShowPassword(prev => !prev)}
					tabIndex={-1}
				>
					{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
				</button>
			</div>


			<button 
				type="submit" 
				disabled={isLoading} 
				className="btn btn-primary w-full text-white"
			>
				{isLoading ? <Loader className="size-5 animate-spin" /> : "Agree & Join"}
			</button>
		</form>
	);
};

export default SignUpForm;