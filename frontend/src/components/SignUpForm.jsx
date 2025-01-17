import { useState } from "react";
import { toast } from "react-hot-toast";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
const SignUpForm = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const handleSignUp = (e) => {
		e.preventDefault();
		setIsLoading(true);

		setTimeout(() => {
			setIsLoading(false);
			if (name && username && email && password.length >= 6) {
				toast.success("Account created successfully");
				navigate("/profile");
				// Here you can reset form fields or perform other actions
				setName("");
				setUsername("");
				setEmail("");
				setPassword("");
			} else {
				toast.error("Please enter valid details. Password must be 6+ characters.");
			}
		}, 1500); // Simulate async sign-up process (replace with real logic)
	};

	return (
        <>
		<form onSubmit={handleSignUp} className="flex flex-col gap-4">
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
        </>
	);
};

export default SignUpForm;
