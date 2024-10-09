import { useState } from "react";
import { toast } from "react-hot-toast"; // Keeping toast notifications
import { Loader } from "lucide-react"; // Assuming you still use the loader

const SignUpForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/v1/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, username, email, password }),
        credentials: "include", // If you still need credentials (for cookies)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Account created successfully");
        // Do additional tasks here, like updating the auth state
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (err) {
		toast.error(`Error signing up: ${err.message}`);
	  } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className='flex flex-col gap-4'>
      <input
        type='text'
        placeholder='Full name'
        value={name}
        onChange={(e) => setName(e.target.value)}
        className='input input-bordered w-full'
        required
      />
      <input
        type='text'
        placeholder='Username'
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className='input input-bordered w-full'
        required
      />
      <input
        type='email'
        placeholder='Email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className='input input-bordered w-full'
        required
      />
      <input
        type='password'
        placeholder='Password (6+ characters)'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className='input input-bordered w-full'
        required
      />

      <button type='submit' disabled={isLoading} className='btn btn-primary w-full text-white'>
        {isLoading ? <Loader className='size-5 animate-spin' /> : "Agree & Join"}
      </button>
    </form>
  );
};

export default SignUpForm;
