import { useState } from "react";
import { toast } from "react-hot-toast"; 
import { Loader } from "lucide-react"; 
import {useNavigate} from "react-router-dom";
const LoginForm = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false); 
	const navigate = useNavigate();
	const handleSubmit = (e) => {
		e.preventDefault();
		setIsLoading(true); 
		setTimeout(() => {
			setIsLoading(false); 
			if (username && password) {
				toast.success("Login successful!");
				navigate("/home");
			} else {
				toast.error("Please enter valid credentials."); 
			}
		}, 1500); 
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
	);
};

export default LoginForm;
