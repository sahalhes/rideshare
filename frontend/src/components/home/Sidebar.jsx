import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SidebarNav from "./SidebarNav";
import CreatedRides from "./CreatedRides";
import JoinedRides from "./JoinedRides";
import TripInfo from "./TripInfo";
import { faCheck, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import useAuth from "../../hooks/useAuth";

const Sidebar = ({ sidebarOpen, openSidebar, closeSidebar }) => {
    const isScrolling = useRef(false);
    const [currentSlide, setCurrentSlide] = useState('Created Rides');
    const [searchBar, setSearchBar] = useState('');

    const [createdRides, setCreatedRides] = useState([]);
    const [joinedRides, setJoinedRides] = useState([]);

    const [createdRideViewOpen, setCreatedRideViewOpen] = useState(false);
    const [createdRide, setCreatedRide] = useState({});
    const [joinedRideViewOpen, setJoinedRideViewOpen] = useState(false);
    const [joinedRide, setJoinedRide] = useState({});

    const [tripInfoErr, setTripInfoErr] = useState(false);
    const [tripInfoErrMsg, setTripInfoErrMsg] = useState('');

    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const handleSlideChange = (slide) => {
        setCurrentSlide(slide);
    };

    const toggleSidebar = () => {
        sidebarOpen ? closeSidebar() : openSidebar();
    }

    const handleOpenCreatedDisplay = (trip) => {
        closeSidebar();
        setCreatedRide(trip);
        setCreatedRideViewOpen(true);
    };

    const handleCloseCreatedDisplay = () => {
        openSidebar();
        setCreatedRide({});
        setCreatedRideViewOpen(false);
        setTripInfoErr(false);
        setTripInfoErrMsg('');
    }

    const handleOpenJoinedDisplay = (trip) => {
        closeSidebar();
        setJoinedRide(trip);
        setJoinedRideViewOpen(true);
    };

    const handleCloseJoinedDisplay = () => {
        openSidebar();
        setJoinedRide({});
        setJoinedRideViewOpen(false);
        setTripInfoErr(false);
        setTripInfoErrMsg('');
    };

    const handleHorizontalScroll = (e) => {
        const container = e.currentTarget;

        if (!isScrolling.current) {
            isScrolling.current = true;

            requestAnimationFrame(() => {
                container.scrollLeft += e.deltaY * 2;
                isScrolling.current = false;
            });
        }
    };

    const initCreatedRides = (rides) => {
        setCreatedRides(rides);
    };

    const initJoinedRides = (rides) => {
        setJoinedRides(rides);
    }

    const handleDeleteTrip = async () => {
        try {
            const response = await axiosPrivate.delete('/api/trips', {
                params: {
                    driver: auth?.username,
                    departure_date: createdRide.departure_date
                }
            });
            setCreatedRides(prevCreatedRides => 
                prevCreatedRides.filter(ride => 
                    ride.driver !== auth?.username || ride.departure_date !== createdRide.departure_date
                )
            );
            handleCloseCreatedDisplay();
        }
        catch (error) {
            if (!error?.response) {
                setTripInfoErrMsg('Server is down. Please try again later.');
            }
            else if (error.response?.status === 404) {
                setTripInfoErrMsg('Trip not found.');
            }
            else {
                setTripInfoErrMsg('Trip failed to delete.')
            }
            setTripInfoErr(true);
        }
    };

    const handleAcceptRequest = async (passenger) => {
        try {
            const response  = await axiosPrivate.patch('/api/trips/acceptRequest', {
                driver: auth?.username,
                departure_date: createdRide.departure_date,
                requester: passenger
            });
            const updatedRide = response.data;
            setCreatedRide(updatedRide);
            setCreatedRides(prevCreatedRides => 
                prevCreatedRides.map(ride => 
                    ride.driver === updatedRide.driver && ride.departure_date === updatedRide.departure_date
                    ? updatedRide 
                    : ride
                )
            );
            setTripInfoErrMsg('');
            setTripInfoErr(false);
        }
        catch (error) {
            if (!error?.response) {
                setTripInfoErrMsg('Server is down. Please try again later.');
            }
            else if (error.response?.status === 404) {
                setTripInfoErrMsg('Trip or requester not found.');
            }
            else {
                setTripInfoErrMsg('Failed to accept requester.')
            }
            setTripInfoErr(true);
        }
    };

    const handleRejectRequest = async (passenger) => {
        try {
            const response  = await axiosPrivate.patch('/api/trips/rejectRequest', {
                driver: auth?.username,
                departure_date: createdRide.departure_date,
                requester: passenger
            });
            const updatedRide = response.data;
            setCreatedRide(updatedRide);
            setCreatedRides(prevCreatedRides => 
                prevCreatedRides.map(ride => 
                    ride.driver === updatedRide.driver && ride.departure_date === updatedRide.departure_date
                    ? updatedRide 
                    : ride
                )
            );
            setTripInfoErrMsg('');
            setTripInfoErr(false);
        }
        catch (error) {
            if (!error?.response) {
                setTripInfoErrMsg('Server is down. Please try again later.');
            }
            else if (error.response?.status === 404) {
                setTripInfoErrMsg('Trip or requester not found.');
            }
            else {
                setTripInfoErrMsg('Failed to reject requester.')
            }
            setTripInfoErr(true);
        }
    };

    const handleLeaveTrip = async () => {
        try {
            const response  = await axiosPrivate.patch('/api/trips/leaveTrip', {
                driver: joinedRide.driver,
                departure_date: joinedRide.departure_date,
                requester: auth?.username
            });
            setJoinedRides(prevJoinedRides => 
                prevJoinedRides.filter(ride => 
                    ride.driver !== joinedRide.driver && ride.departure_date !== joinedRide.departure_date
                )
            );
            handleCloseJoinedDisplay();
        }
        catch (error) {
            if (!error?.response) {
                setTripInfoErrMsg('Server is down. Please try again later.');
            }
            else if (error.response?.status === 404) {
                setTripInfoErrMsg('Trip or passenger not found.');
            }
            else {
                setTripInfoErrMsg('Failed to leave trip.')
            }
            setTripInfoErr(true);
        }
    };

    const requestElements = createdRide?.requests?.length > 0 ? (
        createdRide.requests.map((passenger, index) => (
            <div
                key={index}
                className='flex'
            >
                <button
                    className='text-sm p-1 bg-green-500 rounded-l-3xl hover:scale-95'
                    onClick={() => handleAcceptRequest(passenger)}
                >
                    <FontAwesomeIcon
                        className='px-1'
                        icon={faCheck}
                        size='lg'
                    />
                </button>

                <button
                    className='text-sm p-1 bg-gray-500 text-nowrap hover:scale-95'
                    onClick={() => navigate(`/profile/${passenger}`, { state: location })}
                >
                    {passenger}
                </button>

                <button
                    className='text-sm p-1 bg-red-500 rounded-r-3xl hover:scale-95'
                    onClick={() => handleRejectRequest(passenger)}
                >
                    <FontAwesomeIcon
                        className='px-1'
                        icon={faX}
                        size='lg'
                    />
                </button>
            </div>
        ))) : (
        <div className="text-white text-center">
            No Requests
        </div>
    );

    return (
        <>
            <div className={'absolute flex justify-end top-[20%] right-0 h-2/3 w-80 md:w-96 overflow-x-hidden pointer-events-none z-20'}>
                <div className={`flex w-full h-full pointer-events-auto ${sidebarOpen ? 'slide-in3' : 'slide-out3'}`}>
                    <button
                        className='h-1/4 min-w-2 bg-white rounded-l-md hover:scale-95'
                        onClick={toggleSidebar}
                    >
                    </button>
                    <div className="flex flex-col w-full h-full bg-base p-4">
                        <SidebarNav currentSlide={currentSlide} handleSlideChange={handleSlideChange} />
                        <input
                            type='text'
                            className='p-2 mt-3 rounded-md'
                            placeholder='Search...'
                            value={searchBar}
                            onChange={(e) => setSearchBar(e.target.value)}
                        />
                        {currentSlide === 'Created Rides' && (
                            <CreatedRides 
                                searchBar={searchBar} 
                                createdRides={createdRides} 
                                initCreatedRides={initCreatedRides} 
                                handleOpenDisplay={handleOpenCreatedDisplay} 
                            />
                        )}
                        {currentSlide === 'Joined Rides' && (
                            <JoinedRides 
                                searchBar={searchBar} 
                                joinedRides={joinedRides}
                                initJoinedRides={initJoinedRides}
                                handleOpenDisplay={handleOpenJoinedDisplay} 
                            />
                        )}
                    </div>
                </div>
            </div>

            {createdRideViewOpen && (
                <TripInfo
                    openTrip={createdRide}
                    handleCloseDisplayJoin={handleCloseCreatedDisplay}
                    tripInfoErr={tripInfoErr}
                    tripInfoErrMsg={tripInfoErrMsg}
                >
                    <button
                        className='text-sm py-1 px-4 rounded-3xl bg-red-500 hover:scale-95'
                        onClick={handleDeleteTrip}
                    >
                        Delete
                    </button>
                    <div>
                        <h2 className='font-bold text-gray-400'>Requests:</h2>
                        <div
                            className='w-full overflow-x-auto flex space-x-3 mt-1 passenger-scroll-container pb-2'
                            onWheel={handleHorizontalScroll}
                        >
                            {requestElements}
                        </div>
                    </div>
                </TripInfo>
            )}

            {joinedRideViewOpen && (
                <TripInfo
                    openTrip={joinedRide}
                    handleCloseDisplayJoin={handleCloseJoinedDisplay}
                    tripInfoErr={tripInfoErr}
                    tripInfoErrMsg={tripInfoErrMsg}
                >
                    <button
                        className='text-sm py-1 px-4 rounded-3xl bg-red-500 hover:scale-95'
                        onClick={handleLeaveTrip}
                    >
                        Leave
                    </button>
                </TripInfo>
            )}
        </>
    );
};

export default Sidebar;