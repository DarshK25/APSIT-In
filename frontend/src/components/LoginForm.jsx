import { useState, useEffect } from "react";
import { Loader, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
const LoginForm = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { login, user } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
        const loginError = sessionStorage.getItem('loginError');
        if (loginError) {
            toast.error(loginError);
            sessionStorage.removeItem('loginError');
        }
    }, []);


	useEffect(() => {
		if (user) {
			navigate("/home");
		}
	}, [user, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			await login(username, password);
			sessionStorage.removeItem('loginError');
			window.location.reload();
			if(user) {
				navigate("/home");
			}
			if(!user) {
				sessionStorage.setItem('loginError', "Invalid username or password");
				toast.error("Invalid username or password");
			}
		} catch (error) {
			console.error("Login error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
			<input
				type="text"
				placeholder="Username"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				className="input input-bordered w-full"
				required
			/>
			<div className="relative">	
				<input
					type={showPassword ? "text" : "password"}
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="input input-bordered w-full pr-10"
					required
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

			<button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
				{isLoading ? <Loader className="size-5 animate-spin" /> : "Login"}
			</button>
		</form>
	);
};

export default LoginForm;
