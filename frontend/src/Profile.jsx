import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useAuth from "./hooks/useAuth";
import axios from "./api/axios";
import useAxiosPrivate from "./hooks/useAxiosPrivate";

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const NAME_REGEX = /^[A-Za-z'-]{1,35}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\d{3}-\d{3}-\d{4}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

const Profile = () => {
    const { username } = useParams();
    const { auth, setAuth } = useAuth();
    const axiosPrivate = useAxiosPrivate();
    
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState();
    const [isAuthUser, setIsAuthUser] = useState(false);

    const [passwordOpen, setPasswordOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [preview, setPreview] = useState(null);

    const [userFocus, setUserFocus] = useState(false);
    const [validName, setValidName] = useState(false);
    const [firstNameFocus, setFirstNameFocus] = useState(false);
    const [validFirstName, setValidFirstName] = useState(false);
    const [lastNameFocus, setLastNameFocus] = useState(false);
    const [validLastName, setValidLastName] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false);
    const [validEmail, setValidEmail] = useState(false);
    const [phoneFocus, setPhoneFocus] = useState(false);
    const [validPhone, setValidPhone] = useState(false);
    const [passwordFocus, setPasswordFocus] = useState(false);
    const [validPassword, setValidPassword] = useState(false);

    const [success, setSuccess] = useState(false);

    const [err, setErr] = useState(false);
    const [errMsg, setErrMsg] = useState('');
    const [updateErr, setUpdateErr] = useState(false);
    const [updateErrMsg, setUpdateErrMsg] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`/api/getUser/${username}`);
                setUser(response.data);
            }
            catch (error) {
                if (!error?.response) {
                    setErrMsg('Network error. No server response.');
                }
                else if (error.response?.status === 400) {
                    setErrMsg('Username parameter required.');
                }
                else if (error.response?.status === 404) {
                    setErrMsg('User not found.');
                }
                else {
                    setErrMsg('Failed to find user.');
                }
                setErr(true);
            }
        };

        fetchUser();
        auth?.username === username ? setIsAuthUser(true) : setIsAuthUser(false);
    }, [username]);

    useEffect(() => {
        setValidName(USER_REGEX.test(user?.username));
    }, [user?.username]);

    useEffect(() => {
        !user?.first_name ? setValidFirstName(false) : setValidFirstName(NAME_REGEX.test(user?.first_name));
    }), [user?.first_name];

    useEffect(() => {
        !user?.last_name ? setValidLastName(false) : setValidLastName(NAME_REGEX.test(user?.last_name));
    }), [user?.last_name];

    useEffect(() => {
        !user?.email ? setValidEmail(false) : setValidEmail(EMAIL_REGEX.test(user?.email));
    }), [user?.email];

    useEffect(() => {
        !user?.phone ? setValidPhone(false) : setValidPhone(PHONE_REGEX.test(user?.phone));
    }), [user?.phone];

    useEffect(() => {
        setValidPassword(PASSWORD_REGEX.test(newPassword));
    }), [newPassword];

    useEffect(() => {
        setUpdateErr(false);
        setUpdateErrMsg('');
        setSuccess(false);
    }, [user, oldPassword, newPassword]);

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const handleFormChange = (e) => {
        const { name, value, type, files } = e.target;
    
        if (type === "file" && files.length > 0) {
            const file = files[0];
    
            if (file.type.startsWith("image/")) {
                const previewUrl = URL.createObjectURL(file);
                setUser((prevUser) => ({
                    ...prevUser,
                    [name]: file, 
                }));
                setPreview(previewUrl); 
            } else {
                setUpdateErrMsg('Selected file must be an image.');
                setUpdateErr(true);
            }
        } 
        else {
            setUser((prevUser) => ({
                ...prevUser,
                [name]: value,
            }));
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        const v1 = USER_REGEX.test(user?.username);
        const v2 = !user?.first_name || user?.first_name === '' ? true : NAME_REGEX.test(user?.first_name);
        const v3 = !user?.last_name || user?.last_name === '' ? true : NAME_REGEX.test(user?.last_name);
        const v4 = !user?.email || user?.email === '' ? true : EMAIL_REGEX.test(user?.email);
        const v5 = !user?.phone || user?.phone === '' ? true : PHONE_REGEX.test(user?.phone);
        const v6 = newPassword === '' ? true : PASSWORD_REGEX.test(newPassword);

        if (!v1 || !v2 || !v3 || !v4 || !v5 || !v6) {
            setUpdateErrMsg('One or more fields are incorrect.');
            setUpdateErr(true);
            return;
        }

        try {
            const formData = new FormData();
            for (const [key, value] of Object.entries(user)) {
                formData.append(key, value);
            }
            if (passwordOpen) {
                formData.append('old_password', oldPassword);
                formData.append('new_password', newPassword);
            }
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
            const response = await axiosPrivate.patch('/api/users', formData);
            setSuccess(true);
            setAuth({ username: user?.username, accessToken: response.data });
        }
        catch (error) {
            if (!error?.response) {
                setUpdateErrMsg('Network error. No server response.');
            }
            else if (error.response?.status === 401) {
                setUpdateErrMsg('Old password is incorrect.');
            }
            else if (error.response?.status === 404) {
                setUpdateErrMsg('User not found.');
            }
            else if (error.response?.status === 409) {
                setUpdateErrMsg('Username already exists.');
            }
            else {
                setUpdateErrMsg('Error updating profile.');
            }
            setUpdateErr(true);
        }
    };

    const handleLogout = () => {
        try {
            const response = axiosPrivate.get('/auth/logout');
            setAuth({});
            navigate('/', { state: { from: location } });
        }
        catch (error) {
            setUpdateErrMsg('Failed to logout.');
            setUpdateErr(true);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] bg-[url('/profile_background.png')]">
            {err ? (
                <div className='text-xl bg-red-500 rounded-md p-3'>
                    {errMsg}
                </div>
            ) : (
                <form
                    className="flex flex-col items-center w-full max-w-8xl bg-black bg-opacity-40 text-white px-4 py-4"
                    onSubmit={handleProfileUpdate}
                >
                    {updateErr && (
                        <div className='bg-red-500 rounded-md p-3 mb-5'>
                            {updateErrMsg}
                        </div>
                    )}
                    {success && (
                        <div className='bg-green-500 rounded-md p-3 mb-5'>
                            Profile updated successfully.
                        </div>
                    )}
                    {isAuthUser && (
                        <button 
                            type="button"
                            className="font-bold ml-auto underline"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    )}
                    <div className="flex flex-col items-center mx-auto md:w-2/3 xl:w-2/5">
                        {isAuthUser && (
                            <input
                                type="file"
                                className="w-52"
                                id="profile_picture"
                                name="profile_picture"
                                accept="image/*"
                                onChange={handleFormChange}
                            >
                            </input>
                        )}
                        <img 
                            src={preview || user?.profile_picture || '/default_profile_picture.png'} 
                            alt="Profile picture." 
                            className="mt-2 rounded-full w-64 h-64 object-cover" 
                        />
                    </div>
                    <div className="flex flex-col mt-2 lg:mt-0 w-full lg:w-1/2">
                        <label htmlFor="username" className="font-bold text-gray-400 mt-1">Username:</label>
                        {isAuthUser ? (
                            <>
                                <input
                                    className="p-2 mb-1 border-2 border-black rounded-xl bg-transparent"
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={user?.username || ''}
                                    onChange={handleFormChange}
                                    onFocus={() => setUserFocus(true)}
                                    onBlur={() => setUserFocus(false)}
                                    required
                                />
                                {userFocus && !validName && (
                                    <p className="bg-black p-2 rounded-md mt-1">
                                        <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                                        4-24 characters. <br />
                                        Must start with a letter. <br />
                                        Letters, numbers, hyphens, and underscores allowed.
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="border-b-2">{user?.username}</p>
                        )}
                        <div className="flex flex-col md:flex-row md:w-full">
                            <div className="flex flex-col w-full">
                                <label htmlFor="first_name" className="font-bold text-gray-400 mt-1 lg:mt-5">First Name:</label>
                                {isAuthUser ? (
                                    <>
                                        <input
                                            className="p-2 mb-1 border-2 border-black rounded-xl bg-transparent md:mr-2"
                                            type="text"
                                            id="first_name"
                                            name="first_name"
                                            value={user?.first_name || ''}
                                            onChange={handleFormChange}
                                            onFocus={() => setFirstNameFocus(true)}
                                            onBlur={() => setFirstNameFocus(false)}
                                        />
                                        {firstNameFocus && !validFirstName && (
                                            <p className="bg-black p-2 rounded-md mt-1">
                                                <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                                                1-35 characters. <br />
                                                Letters, hyphens, and apostrophes allowed.
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="border-b-2">{user?.first_name || 'Not provided'}</p>
                                )}
                            </div>
                            <div className="flex flex-col w-full">
                                <label htmlFor="last_name" className="font-bold text-gray-400 mt-1 md:ml-2 lg:mt-5">Last Name:</label>
                                {isAuthUser ? (
                                    <>
                                        <input
                                            className="p-2 mb-1 border-2 border-black rounded-xl bg-transparent md:ml-2"
                                            type="text"
                                            id="last_name"
                                            name="last_name"
                                            value={user?.last_name || ''}
                                            onChange={handleFormChange}
                                            onFocus={() => setLastNameFocus(true)}
                                            onBlur={() => setLastNameFocus(false)}
                                        />
                                        {lastNameFocus && !validLastName && (
                                            <p className="bg-black p-2 rounded-md mt-1">
                                                <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                                                1-35 characters. <br />
                                                Letters, hyphens, and apostrophes allowed.
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="border-b-2 md:ml-2">{user?.last_name || 'Not provided'}</p>
                                )}
                            </div>
                        </div>
                        <label htmlFor="email" className="font-bold text-gray-400 mt-1 lg:mt-5">Email:</label>
                        {isAuthUser ? (
                            <>
                                <input
                                    className="p-2 mb-1 border-2 border-black rounded-xl bg-transparent"
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={user?.email || ''}
                                    onChange={handleFormChange}
                                    onFocus={() => setEmailFocus(true)}
                                    onBlur={() => setEmailFocus(false)}
                                />
                                {emailFocus && !validEmail && (
                                    <p className="bg-black p-2 rounded-md mt-1">
                                        <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                                        Enter a valid email address (e.g., user@example.com).
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="border-b-2">{user?.email || 'Not provided'}</p>
                        )}
                        <label htmlFor="phone" className="font-bold text-gray-400 mt-1 lg:mt-5">Phone:</label>
                        {isAuthUser ? (
                            <>
                                <input
                                    className="p-2 mb-1 border-2 border-black rounded-xl bg-transparent"
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                                    value={user?.phone || ''}
                                    onChange={handleFormChange}
                                    onFocus={() => setPhoneFocus(true)}
                                    onBlur={() => setPhoneFocus(false)}
                                />
                                {phoneFocus && !validPhone && (
                                    <p className="bg-black p-2 rounded-md mt-1">
                                        <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                                        Enter in the format: 012-345-6789
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="border-b-2">{user?.phone || 'Not provided'}</p>
                        )}
                        {isAuthUser && (
                            !passwordOpen ? (
                                <button
                                    type="button"
                                    className="underline font-bold w-fit mt-2 lg:mt-5"
                                    onClick={() => setPasswordOpen(true)}
                                >
                                    Change Password
                                </button>
                            ) : (
                                <div className="flex flex-col">
                                    <button
                                        type="button"
                                        className="underline font-bold w-fit mt-2 lg:mt-5"
                                        onClick={() => {setPasswordOpen(false); setOldPassword(''); setNewPassword('')}}
                                    >
                                        Close
                                    </button>
                                    <label htmlFor="old_password" className="font-bold text-gray-400 mt-1 lg:mt-5">Old Password:</label>
                                    <input
                                        className="p-2 mb-1 border-2 border-black rounded-xl bg-transparent"
                                        type="password"
                                        id="old_password"
                                        name="old_password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                    />
                                    <label htmlFor="new_password" className="font-bold text-gray-400 mt-1 lg:mt-5">New Password:</label>
                                    <input
                                        className="p-2 mb-1 border-2 border-black rounded-xl bg-transparent"
                                        type="password"
                                        id="new_password"
                                        name="new_password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        onFocus={() => setPasswordFocus(true)}
                                        onBlur={() => setPasswordFocus(false)}
                                    />
                                    {passwordFocus && !validPassword && (
                                        <p className="bg-black p-2 rounded-md mt-1">
                                            <FontAwesomeIcon icon={faInfoCircle} className='mr-1' />
                                            8-24 characters. <br />
                                            Must include uppercase and lowercase letters, a number, and a special character. <br />
                                            Allowed special characters: ! @ # $ %
                                        </p>
                                    )}
                                </div>
                            )
                        )}
                        {isAuthUser && (
                            <button
                                className="underline font-bold w-fit mt-2 lg:mt-5 mx-auto"
                            >
                                Save
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}

export default Profile;