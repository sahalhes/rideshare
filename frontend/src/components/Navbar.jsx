import { useState, useEffect } from 'react';
import { Link, useLocation } from "react-router-dom";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useAuth from '../hooks/useAuth';

const Navbar = () => {
    const [currentPage, setCurrentPage] = useState('Home');
    const { auth } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === '/') {
            setCurrentPage('Home');
            return;
        }
        if (location.pathname === '/login' || location.pathname === '/register'){
            setCurrentPage('Login');
            return;
        }
    }, [location.pathname])

    return (
        <nav className="flex items-center bg-black text-white py-2 px-4 border-b-4 border-b-base">
            <Link to='/'>
                <h1 className='text-xl font-bold'>RideShare</h1>
            </Link>

            <Link 
                to='/' 
                className='ml-5'
                onClick={() => setCurrentPage('Home')}
            >
                <h1 className={`${currentPage === 'Home' && 'font-bold'}`}>Home</h1>
            </Link>


            {!auth?.username ?
                <Link 
                    to='/login' 
                    className='ml-auto'
                    onClick={() => setCurrentPage('Login')}
                >
                    <h1 className={`${currentPage === 'Login' && 'font-bold'}`}>Login</h1>
                </Link> :
                <Link to={`/profile/${auth.username}`} className='ml-auto'>
                    <FontAwesomeIcon
                        icon={faUser}
                        color="white"
                        size='xl'
                    />
                </Link>
            }
        </nav>
    )
};

export default Navbar;