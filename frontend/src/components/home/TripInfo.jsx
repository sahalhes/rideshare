import { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const TripInfo = ({ openTrip, handleCloseDisplayJoin, tripInfoErr, tripInfoErrMsg, children }) => {
    const isScrolling = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();

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

    const passengerElements = openTrip?.passengers?.length > 0 ? (
        openTrip.passengers.map((passenger, index) => (
            <button
                key={index}
                className="text-sm py-1 px-4 rounded-3xl bg-gray-500 text-nowrap hover:scale-95"
                onClick={() => navigate(`/profile/${passenger}`, { state: location })}
            >
                {passenger}
            </button>
        ))
    ) : (
        <div className="text-white text-center">
            No Passengers
        </div>
    );

    return (
        <div
            className='absolute flex justify-center items-center w-full h-[calc(100vh-48px)] top-0 z-20 backdrop-blur-sm'
            onClick={handleCloseDisplayJoin}
        >
            <div
                className='flex flex-col w-full max-w-sm p-5 rounded-md bg-base text-gray-200 shadow-lg'
                onClick={(e) => e.stopPropagation()}
            >
                {tripInfoErr && (
                    <p className='bg-red-500 rounded-md p-3 mb-2 mt-1'>
                        {tripInfoErrMsg}
                    </p>
                )}
                <div className='flex items-center border-b border-gray-500 pb-3'>
                    <img src='/default_profile_picture.png' className='w-14 h-14 object-cover' />
                    <h1 className='text-lg text-white ml-2'>
                        <span className='font-bold'>{openTrip.driver}</span> (driver)
                    </h1>
                    <button
                        type='button'
                        className='ml-auto p-2 hover:bg-gray-700 rounded-md'
                        onClick={handleCloseDisplayJoin}
                    >
                        <FontAwesomeIcon
                            icon={faXmark}
                            size='xl'
                            color='white'
                        />
                    </button>
                </div>

                <div className='mt-4 space-y-2'>
                    <div>
                        <h2 className='font-bold text-gray-400'>Origin:</h2>
                        <p className='text-white'>{openTrip.origin}</p>
                    </div>
                    <div>
                        <h2 className='font-bold text-gray-400'>Destination:</h2>
                        <p className='text-white'>{openTrip.destination}</p>
                    </div>
                    <div>
                        <h2 className='font-bold text-gray-400'>Departure Date:</h2>
                        <p className='text-white'>{openTrip.departure_date}</p>
                    </div>
                    <div>
                        <h2 className='font-bold text-gray-400'>Passengers:</h2>
                        <div
                            className='w-full overflow-x-auto flex space-x-3 mt-1 passenger-scroll-container pb-2'
                            onWheel={handleHorizontalScroll}
                        >
                            {passengerElements}
                        </div>
                    </div>
                    {children.length > 1 ? (
                        <>
                            {children[1]}
                            {children[0]}
                        </>
                    ) : (
                        children
                    )}
                </div>
            </div>
        </div>
    );
};

export default TripInfo;