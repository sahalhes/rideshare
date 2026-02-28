import { useState, useEffect } from "react";
import useAuth from "./hooks/useAuth";
import axios from "./api/axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const LOGIN_URL = "/auth/login";

const Login = () => {
    const { setAuth } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [errMsg, setErrMsg] = useState("");
    const [err, setErr] = useState(false);

    useEffect(() => {
        setErrMsg("");
        setErr(false);
    }, [username, password]);

    const handleClose = () => {
        navigate(from === "/login" || from === "/register" ? "/" : from, {
            replace: true,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                LOGIN_URL,
                {
                    username: username,
                    password: password,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                },
            );

            const accessToken = response?.data?.accessToken;
            setAuth({ username, accessToken });
            navigate(from, { replace: true });
        } catch (error) {
            if (!error?.response) {
                setErrMsg("Server is down. Please try again later.");
            } else if (error.response?.status === 400) {
                setErrMsg("Missing username or password.");
            } else if (error.response?.status === 401) {
                setErrMsg("Invalid username or password.");
            } else {
                setErrMsg("Login failed.");
            }
            setErr(true);
        }
    };

    return (
        <section className='flex flex-col items-center justify-center h-[calc(100vh-48px)] bg-[url("/profile_background.png")] bg-cover bg-center'>
            <form
                onSubmit={handleSubmit}
                className="relative flex flex-col w-full max-w-sm p-6 rounded-xl bg-black/50 backdrop-blur-md text-white shadow-2xl border border-white/10"
            >
                <button
                    type="button"
                    className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-white/10 transition-colors"
                    onClick={handleClose}
                >
                    <FontAwesomeIcon icon={faXmark} size="lg" color="white" />
                </button>

                {err && (
                    <p className="bg-red-500/80 rounded-lg p-3 mb-4 text-sm">
                        {errMsg}
                    </p>
                )}

                <h1 className="text-3xl font-bold mb-6">Sign In</h1>

                <label
                    htmlFor="username"
                    className="text-sm font-medium text-gray-300 mb-1"
                >
                    Username
                </label>
                <input
                    className="p-2.5 mb-3 rounded-lg bg-white/10 border border-white/20 focus:border-green-500 focus:outline-none transition-colors placeholder-gray-400"
                    type="text"
                    id="username"
                    autoComplete="off"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-300 mb-1"
                >
                    Password
                </label>
                <input
                    className="p-2.5 mb-4 rounded-lg bg-white/10 border border-white/20 focus:border-green-500 focus:outline-none transition-colors placeholder-gray-400"
                    type="password"
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 font-semibold transition-colors">
                    Sign In
                </button>
                <p className="text-sm text-gray-300 mt-4 text-center">
                    Need an Account?{" "}
                    <Link
                        to="/register"
                        className="text-green-400 hover:text-green-300 font-medium"
                    >
                        Sign Up
                    </Link>
                </p>
            </form>
        </section>
    );
};

export default Login;
