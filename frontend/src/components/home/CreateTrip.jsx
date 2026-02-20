import { useState, useEffect } from 'react';
import { faXmark, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import useAuth from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const CreateTrip = ({ route, setCreateTripOpenFalse }) => {
    const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
    const [validDepartureDate, setValidDepartureDate] = useState(true);

    const [availableSeats, setAvailableSeats] = useState(1);
    const [validAvailableSeats, setValidAvailableSeats] = useState(true);

    const [errMsg, setErrMsg] = useState('');
    const [err, setErr] = useState(false);

    const [success, setSuccess] = useState(false);

    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setErr(false);
        validateDepartureDate() ? setValidDepartureDate(true) : setValidDepartureDate(false);
    }, [departureDate]);

    useEffect(() => {
        setErr(false);
        availableSeats >= 1 ? setValidAvailableSeats(true) : setValidAvailableSeats(false);
    }, [availableSeats]);

    const validateDepartureDate = () => {
        const today = new Date().toISOString().split('T')[0];
        const departure = departureDate.split('T')[0];

        return departure >= today
    };

    const handleCreateTrip = async (e) => {
        e.preventDefault();

        if (!auth?.username) {
            navigate('/login', { state: { from: location } });
            return;
        }
        if (!validateDepartureDate()) {
            setErrMsg('Invalid departure date');
            setErr(true);
            return;
        }
        if (availableSeats < 1) {
            setErrMsg('Invalid available seats');
            setErr(true);
            return;
        }

        try {
            const driver = auth?.username;
            const departure_date = departureDate.split('T')[0];
            const response = await axiosPrivate.post('/api/trips', {
                driver: driver,
                ...route,
                departure_date: departure_date,
                seats_available: availableSeats
            });
            setSuccess(true);
        }
        catch (error) {
            if (!error?.response) {
                setErrMsg('Network error. No server response.');
            }
            else if (error.response?.status === 400) {
                setErrMsg('Invalid trip.');
            }
            else if (error.response?.status === 409) {
                setErrMsg('Cannot create two trips on the same day.')
            }
            else {
                setErrMsg('Trip creation failed.');
            }
            setErr(true);
        }
    };

    return (
        <div
            className='absolute flex justify-center items-center w-full h-[calc(100vh-48px)] top-0 z-20 backdrop-blur-sm'
            onClick={() => { setCreateTripOpenFalse(); setSuccess(false) }}
        >
            <form
                className='flex flex-col w-full max-w-sm p-5 rounded-md bg-base text-white'
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleCreateTrip}
            >
                <button
                    type='button'
                    className='ml-auto p-2 hover:bg-gray-700 rounded-md'
                    onClick={() => { setCreateTripOpenFalse(); setSuccess(false) }}
                >
                    <FontAwesomeIcon
                        icon={faXmark}
                        size='xl'
                        color='white'
                    />
                </button>

                {success ? (
                    <div className='text-lg'>Trip Created</div>
                )
                    :
                    (
                        <>
                            {err && (
                                <p className='bg-red-500 rounded-md p-3 mb-2 mt-1'>
                                    {errMsg}
                                </p>
                            )}

                            <label htmlFor='origin' className='font-bold text-gray-400 hover:cursor-not-allowed'>Origin:</label>
                            <input
                                className='p-2 mb-3 rounded-md text-black hover:cursor-not-allowed'
                                type='text'
                                id='origin'
                                name='origin'
                                value={route.origin}
                                required
                                disabled
                            />

                            <label htmlFor='destination' className='font-bold text-gray-400 hover:cursor-not-allowed'>Destination:</label>
                            <input
                                className='p-2 mb-3 rounded-md text-black hover:cursor-not-allowed'
                                type='text'
                                id='destination'
                                name='destination'
                                value={route.destination}
                                required
                                disabled
                            />

                            <label htmlFor='departureDate' className='font-bold text-gray-400 '>Departure Date:</label>
                            <input
                                className='p-2 mb-3 rounded-md text-black'
                                type='date'
                                id='departureDate'
                                name='departureDate'
                                value={departureDate}
                                onChange={(e) => setDepartureDate(e.target.value)}
                                required
                            />
                            {!validDepartureDate && (
                                <p className="bg-black p-2 rounded-md mt-1 mb-2">
                                    <FontAwesomeIcon icon={faInfoCircle} className='mr-2' />
                                    Date has already passed
                                </p>
                            )}

                            <label htmlFor='seatsAvailable' className='font-bold text-gray-400 '>Seats Available:</label>
                            <input
                                className='p-2 mb-3 rounded-md text-black'
                                type='number'
                                min={1}
                                id='seatsAvailable'
                                name='seatsAvailable'
                                value={availableSeats}
                                onChange={(e) => setAvailableSeats(e.target.value)}
                                required
                            />
                            {!validAvailableSeats && (
                                <p className="bg-black p-2 rounded-md mt-1 mb-2">
                                    <FontAwesomeIcon icon={faInfoCircle} className='mr-2' />
                                    Number must be greater than 1
                                </p>
                            )}

                            <button
                                className={`text-sm py-1 px-4 mt-3 w-1/3 rounded-3xl bg-green-500 ${validDepartureDate && validAvailableSeats ? 'hover:scale-95' : 'opacity-50 cursor-not-allowed'}`}
                                disabled={!validDepartureDate || !validAvailableSeats}
                                onClick={(e) => e.stopPropagation()}
                            >
                                Create Trip
                            </button>
                        </>
                    )}
            </form>
        </div>
    );
};

export default CreateTrip;