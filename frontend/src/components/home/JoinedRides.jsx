import { useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import useAuth from "../../hooks/useAuth";

const JoinedRides = ({ searchBar, handleOpenDisplay, joinedRides, initJoinedRides }) => {
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();

    useEffect(() => {
        if (!auth?.username) {
            initJoinedRides([]);
            return;
        }

        const fetchJoinedRides = async () => {
            try {
                const response = await axiosPrivate.get('/api/trips', {
                    params: {
                        type: 'joined'
                    }
                });
                initJoinedRides(response.data);
            }
            catch (error) {
                initJoinedRides([]);
            }
        };

        fetchJoinedRides();
    }, []);

    const filteredRides = searchBar === '' ? joinedRides 
        : joinedRides.filter((ride) => {
        const query = searchBar.toLowerCase();
        return (
            ride.driver.toLowerCase().includes(query) ||
            ride.origin.toLowerCase().includes(query) ||
            ride.destination.toLowerCase().includes(query)
        );
    });

    const joinedRidesElements = filteredRides.length > 0 ? (
        filteredRides.map((ride, index) => (
            <div key={index} className="flex items-center w-full mb-2">
                <img 
                    src="/default_profile_picture.png" 
                    alt="Driver Profile" 
                    className="w-14 h-14 md:w-16 md:h-16 object-cover" 
                />
                <div className="ml-2 w-1/2 text-white">
                    <h2 className="text-sm truncate">
                        <span className="font-bold">{ride.driver}</span> (driver)
                    </h2>
                    <p className="text-xs truncate">{ride.origin}</p>
                    <p className="text-xs truncate">{ride.destination}</p>
                </div>
                <button
                    className="text-sm ml-auto py-1 px-4 rounded-3xl bg-green-500 hover:scale-95"
                    onClick={() => handleOpenDisplay(ride)}
                >
                    View
                </button>
            </div>
        ))
    ) : (
        <div className="text-white text-center mt-4">
            No Rides Joined
        </div>
    );

    return (
        <div className='w-full h-full mt-3 pr-1 flex flex-col items-center overflow-x-hidden overflow-y-auto passenger-scroll-container'>
            {joinedRidesElements}
        </div>
    )
};

export default JoinedRides;