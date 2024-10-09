import { useState } from "react";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";

const LoginForm = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await fetch("http://localhost:5000/api/v1/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
				credentials: "include", // Include this if you're working with sessions/cookies
			});

			const data = await response.json();

			if (response.ok) {
				toast.success("Login successful");
				// Add further actions, such as redirecting or updating the UI
			} else {
				toast.error(data.message || "Something went wrong");
			}
		} catch (error) {
			toast.error("Failed to login. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<img className="mx-auto h-20 w-21 rounded-full" src="/public/ApsitInLogo.avif" alt="APSIT-In" />
				<h1 className="text-center text-4xl font-extrabold text-blue-600 mb-5">APSIT-In</h1>
				<h2 className="text-center text-3xl font-bold text-gray-900">
					Welcome Back to APSIT-In
				</h2>
			</div>
			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md shadow-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					<form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
						<input
							type="text"
							placeholder="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="input input-bordered w-full"
							required
						/>
						<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="input input-bordered w-full"
							required
						/>

						<button type="submit" className="btn btn-primary w-full">
							{isLoading ? <Loader className="size-5 animate-spin" /> : "Login"}
						</button>
					</form>

					<div className="mt-6">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-300"></div>
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-white text-gray-500">New to APSIT-In?</span>
							</div>
						</div>
						<div className="mt-6">
							<a
								href="/signup"
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50"
							>
								Create an account
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginForm;
