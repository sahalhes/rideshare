import { useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import useAuth from '../../hooks/useAuth';

const CreatedRides = ({ searchBar, createdRides, initCreatedRides, handleOpenDisplay }) => {
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();

    useEffect(() => {
        if (!auth?.username) {
            initCreatedRides([]);
            return;
        }

        const fetchCreatedRides = async () => {
            try {
                const response = await axiosPrivate.get('/api/trips', {
                    params: {
                        type: 'created'
                    }
                });
                initCreatedRides(response.data);
            }
            catch (error) {
                initCreatedRides([]);
            }
        };

        fetchCreatedRides();
    }, []);

    const filteredRides = searchBar === '' ? createdRides
        : createdRides.filter((ride) => {
            const query = searchBar.toLowerCase();
            return (
                ride.driver.toLowerCase().includes(query) ||
                ride.origin.toLowerCase().includes(query) ||
                ride.destination.toLowerCase().includes(query)
            );
        });

    const createdRidesElements = filteredRides.length > 0 ? (
        filteredRides.map((ride, index) => (
            <div key={index} className="flex items-center w-full mb-2">
                <div className="min-w-2/3 w-2/3 text-white">
                    <h2 className="text-sm truncate">
                        <span className="font-bold">Me</span> (driver)
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
            No Trips Created
        </div>
    );

    return (
        <div className='w-full h-full mt-3 pr-1 flex flex-col items-center overflow-x-hidden overflow-y-auto passenger-scroll-container'>
            {createdRidesElements}
        </div>

    )
};

export default CreatedRides;