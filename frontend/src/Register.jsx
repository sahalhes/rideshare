import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { faCheck, faTimes, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from './api/axios';

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const REGISTER_URL = '/auth/register';

const Register = () => {
    const [username, setUsername] = useState('');
    const [validName, setValidName] = useState(false);
    const [userFocus, setUserFocus] = useState(false);

    const [password, setPassword] = useState('');
    const [validPass, setValidPass] = useState(false);
    const [passFocus, setPassFocus] = useState(false);

    const [confirmPass, setConfirmPass] = useState('');
    const [validConfirmPass, setValidConfirmPass] = useState(false);
    const [confirmFocus, setConfirmFocus] = useState(false);

    const [errMsg, setErrMsg] = useState('');
    const [err, setErr] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        setValidName(USER_REGEX.test(username));
    }, [username]);

    useEffect(() => {
        setValidPass(PASSWORD_REGEX.test(password));
        setValidConfirmPass(password === confirmPass);
    }, [password, confirmPass]);

    useEffect(() => {
        setErrMsg('');
        setErr(false);
    }, [username, password, confirmPass]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const v1 = USER_REGEX.test(username);
        const v2 = PASSWORD_REGEX.test(password);
        if (!v1 || !v2) {
            setErrMsg('Invalid username or password.');
            return;
        }

        try {
            const res = await axios.post(REGISTER_URL,
                {
                    username: username,
                    password: password,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true,
                }
            );
            navigate('/login');
        }
        catch (error) {
            if (!error?.response) {
                setErrMsg('Network error. No server response.');
            }
            else if (error.response?.status === 409) {
                setErrMsg('Username already exists.');
            }
            else {
                setErrMsg('Registration Failed.');
            }
            setErr(true);
        }
    };

    return (
        <section className='flex flex-col items-center justify-center h-[calc(100vh-48px)] bg-[url("/profile_background.png")] bg-cover bg-center'>
            <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm p-5 rounded-md bg-black bg-opacity-40 text-white'>
                {err && (
                    <p className='bg-red-500 rounded-md p-3 mb-5'>
                        {errMsg}
                    </p>
                )}

                <h1 className="text-3xl font-bold mb-5">Sign Up</h1>

                <label htmlFor='username' className='text-lg mb-1'>
                    Username:
                    {username && (
                        <span className='text-lg font-bold ml-1'>
                            <FontAwesomeIcon
                                icon={validName ? faCheck : faTimes}
                                color={validName ? 'green' : 'red'}
                            />
                        </span>
                    )}
                </label>
                <input
                    className='p-2 mb-1 border-2 border-black rounded-xl bg-transparent'
                    type='text'
                    id='username'
                    autoComplete="off"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setUserFocus(true)}
                    onBlur={() => setUserFocus(false)}
                    required
                />
                {userFocus && !validName && (
                    <p className="bg-black p-2 rounded-md mt-1">
                        <FontAwesomeIcon icon={faInfoCircle} className='mr-1' />
                        4-24 characters. <br />
                        Must start with a letter. <br />
                        Letters, numbers, hyphens, and underscores allowed.
                    </p>
                )}


                <label htmlFor='password' className='text-lg mb-1'>
                    Password:
                    {password && (
                        <span className='text-lg font-bold ml-1'>
                            <FontAwesomeIcon
                                icon={validPass ? faCheck : faTimes}
                                color={validPass ? 'green' : 'red'}
                            />
                        </span>
                    )}
                </label>
                <input
                    className='p-2 mb-1 border-2 border-black rounded-xl bg-transparent'
                    type='password'
                    id='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPassFocus(true)}
                    onBlur={() => setPassFocus(false)}
                    required
                />
                {passFocus && !validPass && (
                    <p className="bg-black p-2 rounded-md mt-1">
                        <FontAwesomeIcon icon={faInfoCircle} className='mr-1' />
                        8-24 characters. <br />
                        Must include uppercase and lowercase letters, a number, and a special character. <br />
                        Allowed special characters: ! @ # $ %
                    </p>
                )}


                <label htmlFor='confirm-password' className='text-lg mb-1'>
                    Confirm Password:
                    {confirmPass && (
                        <span className='text-lg font-bold ml-1'>
                            <FontAwesomeIcon
                                icon={validConfirmPass ? faCheck : faTimes}
                                color={validConfirmPass ? 'green' : 'red'}
                            />
                        </span>
                    )}
                </label>
                <input
                    className='p-2 mb-1 border-2 border-black rounded-xl bg-transparent'
                    type='password'
                    id='confirm-password'
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    onFocus={() => setConfirmFocus(true)}
                    onBlur={() => setConfirmFocus(false)}
                    required
                />
                {confirmFocus && !validConfirmPass && (
                    <p className="bg-black p-2 rounded-md mt-1">
                        <FontAwesomeIcon icon={faInfoCircle} className='mr-1' />
                        Passwords do not match.
                    </p>
                )}


                <button 
                    className={`px-2 mt-2 w-fit mx-auto rounded-md text-lg ${validName && validPass && validConfirmPass && 'underline'}`} 
                    disabled={!validName || !validPass || !validConfirmPass ? true : false}
                >
                    Sign Up
                </button>
                <p className='text-lg mt-3'>
                    Already registered? <br />
                    <Link to='/login' className='underline'>Sign In</Link>
                </p>
            </form>
        </section>
    )
};

export default Register;
