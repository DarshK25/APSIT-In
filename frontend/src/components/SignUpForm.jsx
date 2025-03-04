import { useState } from "react";
import { Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SignUpForm = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { signup } = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			await signup({ name, username, email, password });
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
				placeholder="Full name"
				value={name}
				onChange={(e) => setName(e.target.value)}
				className="input input-bordered w-full"
				required
			/>
			<input
				type="text"
				placeholder="Username"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				className="input input-bordered w-full"
				required
			/>
			<input
				type="email"
				placeholder="Email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				className="input input-bordered w-full"
				required
			/>
			<input
				type="password"
				placeholder="Password (6+ characters)"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				className="input input-bordered w-full"
				required
			/>

			<button type="submit" disabled={isLoading} className="btn btn-primary w-full text-white">
				{isLoading ? <Loader className="size-5 animate-spin" /> : "Agree & Join"}
			</button>
		</form>
	);
};

export default SignUpForm;