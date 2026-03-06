import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import Map from "./components/home/Map";
import Sidebar from "./components/home/Sidebar";
import Rides from "./components/home/Rides";
import CreateTrip from "./components/home/CreateTrip";
import useAuth from "./hooks/useAuth";

const Home = () => {
    const [route, setRoute] = useState({});
    const [routeSearched, setRouteSearched] = useState(false);
    const [isRidesVisible, setIsRidesVisible] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [createTripOpen, setCreateTripOpen] = useState(false);
    const [directionsContainer, setDirectionsContainer] = useState(null);
    const mapRef = useRef();

    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const closeAll = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
                setIsRidesVisible(false);
            }
        };

        window.addEventListener("resize", closeAll);
        return () => window.removeEventListener("resize", closeAll);
    }, []);

    const displayRides = (newRoute) => {
        setRoute(newRoute);
        setRouteSearched(true);
        setIsRidesVisible(true);
        setSidebarOpen(false);
    };

    const hideRides = () => {
        setIsRidesVisible(false);
        setTimeout(() => setRouteSearched(false), 700);
    };

    const openRides = () => {
        if (window.innerWidth < 768 && sidebarOpen) closeSidebar();
        setIsRidesVisible(true);
    };

    const closeRides = () => setIsRidesVisible(false);

    const openSidebar = () => {
        if (window.innerWidth < 768 && isRidesVisible) closeRides();
        setSidebarOpen(true);
    };

    const closeSidebar = () => setSidebarOpen(false);

    const handleOpenCreateTrip = () => {
        if (!auth?.username) {
            navigate("/login", { state: { from: location } });
            return;
        }
        setCreateTripOpen(true);
        closeRides();
    };

    const handleCloseCreateTrip = () => {
        setCreateTripOpen(false);
        openRides();
    };

    const showTripOnMap = useCallback((trip, riderInfo) => {
        mapRef.current?.showTripOnMap(trip, riderInfo);
    }, []);

    const clearTripFromMap = useCallback(() => {
        mapRef.current?.clearTripFromMap();
    }, []);

    return (
        <section className="relative h-[calc(100vh-48px)]">
            <Map
                ref={mapRef}
                displayRides={displayRides}
                hideRides={hideRides}
                onDirectionsReady={setDirectionsContainer}
            />
            <Sidebar
                sidebarOpen={sidebarOpen}
                openSidebar={openSidebar}
                closeSidebar={closeSidebar}
                showTripOnMap={showTripOnMap}
                clearTripFromMap={clearTripFromMap}
            />

            {/* Portal the Create Trip button into the directions container so it sits flush below the inputs */}
            {directionsContainer &&
                createPortal(
                    <div
                        style={{
                            opacity: routeSearched ? 1 : 0,
                            transform: routeSearched
                                ? "translateY(0)"
                                : "translateY(-6px)",
                            pointerEvents: routeSearched ? "auto" : "none",
                            transition:
                                "opacity 0.3s ease, transform 0.3s ease",
                            marginTop: 8,
                        }}
                    >
                        <button
                            onClick={handleOpenCreateTrip}
                            className="w-full py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                            style={{
                                background: "#161616",
                                color: "#fff",
                                border: "1px solid #3a3a3a",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                            }}
                        >
                            + Create a Trip
                        </button>
                    </div>,
                    directionsContainer,
                )}

            {routeSearched && (
                <Rides
                    route={route}
                    isRidesVisible={isRidesVisible}
                    openRides={openRides}
                    closeRides={closeRides}
                />
            )}

            {createTripOpen && routeSearched && (
                <CreateTrip
                    route={route}
                    setCreateTripOpenFalse={handleCloseCreateTrip}
                />
            )}
        </section>
    );
};

export default Home;
