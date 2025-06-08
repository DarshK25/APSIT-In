import { useState, useEffect } from "react";
import { Loader, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Assuming your backend runs on 3000

const LoginForm = () => {
	const navigate = useNavigate();
	const { login: loginUser, user } = useAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuth();

	// State for managing the view (login or forgot password)
	const [showForgotPassword, setShowForgotPassword] = useState(false);

	// State for forgot password request form
	const [forgotEmail, setForgotEmail] = useState('');
	const [forgotLoading, setForgotLoading] = useState(false);

	// State for password reset form (after receiving code)
	const [resetCode, setResetCode] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmNewPassword, setConfirmNewPassword] = useState('');
	const [resetLoading, setResetLoading] = useState(false);
	const [showResetPasswordFields, setShowResetPasswordFields] = useState(false);

	// Redirect if user is already logged in
	useEffect(() => {
		if (user) {
			navigate('/home', { replace: true });
		}
	}, [user, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!username || !password) {
			toast.error("Please enter both username and password");
			return;
		}
		setIsLoading(true);
		try {
			const success = await loginUser(username, password);
			if (!success) {
				// Error message is already shown in the login function
				setPassword(''); // Clear password on failed login
			}
		} catch (error) {
			console.error("Login error:", error);
			setPassword(''); // Clear password on error
		} finally {
			setIsLoading(false);
		}
	};

	const handleForgotPasswordRequest = async (e) => {
		e.preventDefault();
		setForgotLoading(true);
		try {
			const response = await axios.post(`${API_URL}/api/v1/auth/forgot-password`, {
				email: forgotEmail
			});
			if (response.data.success) {
				toast.success(response.data.message);
				setShowResetPasswordFields(true); // Show the next step fields
			} else {
				toast.error(response.data.message || 'Failed to send reset code');
			}
		} catch (error) {
			console.error('Forgot password request error:', error);
			toast.error(error.response?.data?.message || 'Failed to send reset code');
		} finally {
			setForgotLoading(false);
		}
	};

	const handlePasswordReset = async (e) => {
		e.preventDefault();

		if (newPassword !== confirmNewPassword) {
			toast.error('Passwords do not match');
			return;
		}

		setResetLoading(true);
		try {
			const response = await axios.post(`${API_URL}/api/v1/auth/reset-password`, {
				token: resetCode,
				newPassword: newPassword
			});
			if (response.data.success) {
				toast.success(response.data.message);
				// Reset form and go back to login view
				setForgotEmail('');
				setResetCode('');
				setNewPassword('');
				setConfirmNewPassword('');
				setShowForgotPassword(false);
				setShowResetPasswordFields(false);
			} else {
				toast.error(response.data.message || 'Failed to reset password');
			}
		} catch (error) {
			console.error('Password reset error:', error);
			toast.error(error.response?.data?.message || 'Failed to reset password');
		} finally {
			setResetLoading(false);
		}
	};

	return (
		<div className="w-full max-w-md">
			{!showForgotPassword ? (
				<form onSubmit={handleSubmit} className="space-y-4">
					<input
						type="text"
						placeholder="Username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
						required
					/>
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="input input-bordered w-full pr-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
							required
						/>
						<button
							type="button"
							className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
							onClick={() => setShowPassword(prev => !prev)}
							tabIndex={-1}
						>
							{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
						</button>
					</div>
					<button type="submit" className="btn btn-primary w-full dark:bg-blue-600 dark:hover:bg-blue-700" disabled={isLoading}>
						{isLoading ? <Loader className="size-5 animate-spin" /> : "Login"}
					</button>
					<button
						type="button"
						className="text-sm text-blue-600 hover:underline mt-2 text-center w-full dark:text-blue-400"
						onClick={() => setShowForgotPassword(true)}
					>
						Forgot Password?
					</button>
				</form>
			) : (
				<div className="space-y-4">
					<h3 className="text-xl font-semibold text-gray-900 dark:text-white">Forgot Password</h3>
					{!showResetPasswordFields ? (
						<form onSubmit={handleForgotPasswordRequest} className="space-y-4">
							<p className="text-sm text-gray-600 dark:text-gray-300">Enter your email to receive a password reset code.</p>
							<input
								type="email"
								placeholder="Enter your email"
								value={forgotEmail}
								onChange={(e) => setForgotEmail(e.target.value)}
								className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
								required
							/>
							<button type="submit" className="btn btn-primary w-full dark:bg-blue-600 dark:hover:bg-blue-700" disabled={forgotLoading}>
								{forgotLoading ? <Loader className="size-5 animate-spin" /> : "Send Reset Code"}
							</button>
							<button
								type="button"
								className="text-sm text-blue-600 hover:underline mt-2 text-center w-full dark:text-blue-400"
								onClick={() => setShowForgotPassword(false)}
							>
								Back to Login
							</button>
						</form>
					) : (
						<form onSubmit={handlePasswordReset} className="space-y-4">
							<p className="text-sm text-gray-600 dark:text-gray-300">Enter the code sent to your email and your new password.</p>
							<input
								type="text"
								placeholder="Reset Code"
								value={resetCode}
								onChange={(e) => setResetCode(e.target.value)}
								className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
								required
							/>
							<input
								type="password"
								placeholder="New Password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
								required
								minLength="6"
							/>
							<input
								type="password"
								placeholder="Confirm New Password"
								value={confirmNewPassword}
								onChange={(e) => setConfirmNewPassword(e.target.value)}
								className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
								required
							/>
							<button type="submit" className="btn btn-primary w-full dark:bg-blue-600 dark:hover:bg-blue-700" disabled={resetLoading}>
								{resetLoading ? <Loader className="size-5 animate-spin" /> : "Reset Password"}
							</button>
							<button
								type="button"
								className="text-sm text-blue-600 hover:underline mt-2 text-center w-full dark:text-blue-400"
								onClick={() => setShowResetPasswordFields(false) // Go back to email request form
								}
							>
								Back
							</button>
						</form>
					)}
				</div>
			)}
		</div>
	);
};

export default LoginForm;
