import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios, { axiosPrivate } from "../../api/axios";
import useAuth from "../../hooks/useAuth";
import TripInfo from "./TripInfo";
import { getDistanceFromLatLonInKm } from "../../utils/distance";

const Rides = ({ route, isRidesVisible, openRides, closeRides }) => {
    const [trips, setTrips] = useState([]);
    const [smallScreen, setSmallScreen] = useState(false);
    const [joinTripOpen, setJoinTripOpen] = useState(false);
    const [openTrip, setOpenTrip] = useState({});

    const [tripInfoErrMsg, setTripInfoErrMsg] = useState("");
    const [tripInfoErr, setTripInfoErr] = useState(false);

    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const response = await axios.get("/api/routes");
                const routes = response.data;
                setTrips(routes);
            } catch (error) {
                setTrips([]);
            }
        };

        fetchRoutes();
    }, [route]);

    useEffect(() => {
        const handleResize = () => {
            setSmallScreen(window.innerWidth < 768);
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const handleOpenDisplayJoin = (trip) => {
        if (!auth?.username) {
            navigate("/login", { state: { from: location } });
            return;
        }

        setOpenTrip(trip);
        setJoinTripOpen(true);
        closeRides();
    };

    const handleCloseDisplayJoin = () => {
        setOpenTrip({});
        setJoinTripOpen(false);
        openRides();
        setTripInfoErr(false);
        setTripInfoErrMsg("");
    };

    const handleTripRequest = async () => {
        if (!auth?.username) {
            navigate("/login", { state: { from: location } });
            return;
        }

        try {
            const response = await axiosPrivate.patch(
                "/api/trips/requestJoin",
                {
                    driver: openTrip.driver,
                    departure_date: openTrip.departure_date,
                    requester: auth?.username,
                },
            );
            setOpenTrip(response.data);
            setTrips((prevTrips) =>
                prevTrips.map((trip) =>
                    trip.driver === openTrip.driver &&
                    trip.departure_date === openTrip.departure_date
                        ? response.data
                        : trip,
                ),
            );
        } catch (error) {
            if (!error?.response) {
                setTripInfoErrMsg("Server is down. Please try again later.");
            } else if (error.response?.status === 404) {
                setTripInfoErrMsg("Trip not available.");
            } else if (error.response?.status === 409) {
                setTripInfoErrMsg("Already requested or joined.");
            } else {
                setTripInfoErrMsg("Request to join failed.");
            }
            setTripInfoErr(true);
        }
    };

    const filteredTrips = trips.filter((trip) => {
        const originDistance = getDistanceFromLatLonInKm(
            route.origin.coords[1],
            route.origin.coords[0],
            trip.origin_coords[1],
            trip.origin_coords[0],
        );
        const destinationDistance = getDistanceFromLatLonInKm(
            route.destination.coords[1],
            route.destination.coords[0],
            trip.destination_coords[1],
            trip.destination_coords[0],
        );

        return (
            trip.passengers.length < trip.seats_available &&
            originDistance <= 2 &&
            destinationDistance <= 2
        );
    });

    const tripElements = filteredTrips.map((trip, index) => (
        <div
            key={index}
            className={`flex items-center mb-2 ${!smallScreen && "bg-base p-2 rounded-full"}`}
        >
            <img
                src="/default_profile_picture.png"
                className={`w-16 h-16 object-cover ${smallScreen && "ml-4"}`}
            />
            <div className="ml-4 w-1/2 text-white">
                <h2 className="text-sm truncate">
                    <span className="font-bold">{trip.driver}</span> (driver)
                </h2>
                <p className="text-xs truncate">{trip.origin}</p>
                <p className="text-xs truncate">{trip.destination}</p>
            </div>
            {trip.driver === auth?.username ? (
                <button
                    className="text-sm mx-auto py-1 px-4 rounded-3xl bg-gray-500 cursor-not-allowed"
                    disabled
                >
                    Your Trip
                </button>
            ) : (
                <button
                    className="text-sm mx-auto py-1 px-4 rounded-3xl bg-green-500 hover:scale-95"
                    onClick={() => handleOpenDisplayJoin(trip)}
                >
                    Join
                </button>
            )}
        </div>
    ));

    return (
        <>
            {smallScreen && (
                <div
                    className={`absolute bottom-0 w-full h-1/3 bg-base p-1 pb-4 z-10 overflow-y-hidden ${isRidesVisible ? "slide-in" : "slide-out"}`}
                >
                    <div className="max-h-full px-2 mt-2 overflow-y-auto passenger-scroll-container">
                        {tripElements}
                    </div>
                </div>
            )}
            {!smallScreen && (
                <div
                    className={`absolute bottom-0 ml-3 w-80 h-2/3 z-10 ${isRidesVisible ? "slide-in2" : "slide-out2"}`}
                >
                    <div className="max-h-full pr-2 overflow-y-auto passenger-scroll-container">
                        {tripElements}
                    </div>
                </div>
            )}

            {joinTripOpen && (
                <TripInfo
                    openTrip={openTrip}
                    handleCloseDisplayJoin={handleCloseDisplayJoin}
                    tripInfoErr={tripInfoErr}
                    tripInfoErrMsg={tripInfoErrMsg}
                >
                    <button
                        className={`text-sm py-1 px-4 rounded-3xl bg-green-500 ${
                            openTrip.requests.includes(auth?.username) ||
                            openTrip.passengers.includes(auth?.username)
                                ? "cursor-not-allowed opacity-50"
                                : "hover:scale-95"
                        }`}
                        disabled={
                            openTrip.requests.includes(auth?.username) ||
                            openTrip.passengers.includes(auth?.username)
                        }
                        onClick={handleTripRequest}
                    >
                        Request to Join
                    </button>
                </TripInfo>
            )}
        </>
    );
};

export default Rides;
