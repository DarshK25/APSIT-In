import { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/auth/SignUpPage";
import LoginPage from "./pages/auth/LoginPage";

function App() {
    const [authUser, setAuthUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAuthUser = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/v1/auth/me", {
                    credentials: "include",
                });

                if (response.status === 401) {
                    setAuthUser(null);
                } else if (response.ok) {
                    const data = await response.json();
                    setAuthUser(data);
                } else {
                    throw new Error("Something went wrong");
                }
            } catch (err) {
                toast.error(err.message || "Something went wrong");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAuthUser();
    }, []);

    if (isLoading) return null;

    return (
        <Layout>
            <Routes>
                <Route path='/' element={authUser ? <HomePage /> : <Navigate to={'/signup'} />} />
                <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to={'/'} />} />
                <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to={'/'} />} />
            </Routes>
            <Toaster />
        </Layout>
    );
}

export default App;
