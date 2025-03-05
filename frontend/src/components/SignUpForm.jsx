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
		password: ""
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

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const success = await signup(formData);
			if (success) {
				toast.success('Account created successfully!');
				toast((t) => (
					<div className="flex flex-col gap-2">
						<p>Welcome to ApsitIn! Please complete your profile to get started.</p>
						<button
							onClick={() => {
								toast.dismiss(t.id);
								navigate('/profile/edit');
							}}
							className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
						>
							Complete Profile
						</button>
					</div>
				), {
					duration: 5000,
				});
			}
		} catch (error) {
			console.error("Signup error:", error);
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
			/>
			<input
				type="text"
				name="username"
				placeholder="Username"
				value={formData.username}
				onChange={handleChange}
				className="input input-bordered w-full"
				required
			/>
			<input
				type="email"
				name="email"
				placeholder="College Email"
				value={formData.email}
				onChange={handleChange}
				pattern="[a-zA-Z0-9._%+-]+@apsit\.edu\.in$"
				title="Please use your APSIT college email (e.g., example@apsit.edu.in)"
				className="input input-bordered w-full"
				required
			/>
			<input
				type="password"
				name="password"
				placeholder="Password (6+ characters)"
				value={formData.password}
				onChange={handleChange}
				minLength={6}
				className="input input-bordered w-full"
				required
			/>

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