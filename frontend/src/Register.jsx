import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    faCheck,
    faTimes,
    faInfoCircle,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "./api/axios";

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const REGISTER_URL = "/auth/register";

const Register = () => {
    const [username, setUsername] = useState("");
    const [validName, setValidName] = useState(false);
    const [userFocus, setUserFocus] = useState(false);

    const [password, setPassword] = useState("");
    const [validPass, setValidPass] = useState(false);
    const [passFocus, setPassFocus] = useState(false);

    const [confirmPass, setConfirmPass] = useState("");
    const [validConfirmPass, setValidConfirmPass] = useState(false);
    const [confirmFocus, setConfirmFocus] = useState(false);

    const [errMsg, setErrMsg] = useState("");
    const [err, setErr] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    useEffect(() => {
        setValidName(USER_REGEX.test(username));
    }, [username]);

    useEffect(() => {
        setValidPass(PASSWORD_REGEX.test(password));
        setValidConfirmPass(password === confirmPass);
    }, [password, confirmPass]);

    useEffect(() => {
        setErrMsg("");
        setErr(false);
    }, [username, password, confirmPass]);

    const handleClose = () => {
        navigate(from === "/login" || from === "/register" ? "/" : from, {
            replace: true,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const v1 = USER_REGEX.test(username);
        const v2 = PASSWORD_REGEX.test(password);
        if (!v1 || !v2) {
            setErrMsg("Invalid username or password.");
            return;
        }

        try {
            const res = await axios.post(
                REGISTER_URL,
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
            navigate("/login");
        } catch (error) {
            if (!error?.response) {
                setErrMsg("Network error. No server response.");
            } else if (error.response?.status === 409) {
                setErrMsg("Username already exists.");
            } else {
                setErrMsg("Registration Failed.");
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

                <h1 className="text-3xl font-bold mb-6">Sign Up</h1>

                <label
                    htmlFor="username"
                    className="text-sm font-medium text-gray-300 mb-1"
                >
                    Username
                    {username && (
                        <span className="font-bold ml-1">
                            <FontAwesomeIcon
                                icon={validName ? faCheck : faTimes}
                                color={validName ? "#22c55e" : "#ef4444"}
                            />
                        </span>
                    )}
                </label>
                <input
                    className="p-2.5 mb-2 rounded-lg bg-white/10 border border-white/20 focus:border-green-500 focus:outline-none transition-colors placeholder-gray-400"
                    type="text"
                    id="username"
                    autoComplete="off"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setUserFocus(true)}
                    onBlur={() => setUserFocus(false)}
                    required
                />
                {userFocus && !validName && (
                    <p className="bg-black/70 p-2 rounded-lg mb-2 text-xs">
                        <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                        4-24 characters. Must start with a letter. <br />
                        Letters, numbers, hyphens, and underscores allowed.
                    </p>
                )}

                <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-300 mb-1"
                >
                    Password
                    {password && (
                        <span className="font-bold ml-1">
                            <FontAwesomeIcon
                                icon={validPass ? faCheck : faTimes}
                                color={validPass ? "#22c55e" : "#ef4444"}
                            />
                        </span>
                    )}
                </label>
                <input
                    className="p-2.5 mb-2 rounded-lg bg-white/10 border border-white/20 focus:border-green-500 focus:outline-none transition-colors placeholder-gray-400"
                    type="password"
                    id="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPassFocus(true)}
                    onBlur={() => setPassFocus(false)}
                    required
                />
                {passFocus && !validPass && (
                    <p className="bg-black/70 p-2 rounded-lg mb-2 text-xs">
                        <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                        8-24 characters. Must include uppercase, lowercase, a
                        number, and a special character (!@#$%).
                    </p>
                )}

                <label
                    htmlFor="confirm-password"
                    className="text-sm font-medium text-gray-300 mb-1"
                >
                    Confirm Password
                    {confirmPass && (
                        <span className="font-bold ml-1">
                            <FontAwesomeIcon
                                icon={validConfirmPass ? faCheck : faTimes}
                                color={validConfirmPass ? "#22c55e" : "#ef4444"}
                            />
                        </span>
                    )}
                </label>
                <input
                    className="p-2.5 mb-2 rounded-lg bg-white/10 border border-white/20 focus:border-green-500 focus:outline-none transition-colors placeholder-gray-400"
                    type="password"
                    id="confirm-password"
                    placeholder="Confirm your password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    onFocus={() => setConfirmFocus(true)}
                    onBlur={() => setConfirmFocus(false)}
                    required
                />
                {confirmFocus && !validConfirmPass && (
                    <p className="bg-black/70 p-2 rounded-lg mb-2 text-xs">
                        <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                        Passwords do not match.
                    </p>
                )}

                <button
                    className={`w-full py-2.5 mt-2 rounded-lg font-semibold transition-colors ${
                        validName && validPass && validConfirmPass
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-600 cursor-not-allowed opacity-50"
                    }`}
                    disabled={!validName || !validPass || !validConfirmPass}
                >
                    Sign Up
                </button>
                <p className="text-sm text-gray-300 mt-4 text-center">
                    Already registered?{" "}
                    <Link
                        to="/login"
                        className="text-green-400 hover:text-green-300 font-medium"
                    >
                        Sign In
                    </Link>
                </p>
            </form>
        </section>
    );
};

export default Register;
