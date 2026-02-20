import { useEffect, useState } from 'react';
import Map from './components/home/Map';
import Sidebar from './components/home/Sidebar';
import Rides from './components/home/Rides';

const Home = () => {
    const [route, setRoute] = useState({});
    const [routeSearched, setRouteSearched] = useState(false);
    const [isRidesVisible, setIsRidesVisible] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const closeAll = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
                setIsRidesVisible(false);
            }
        };

        window.addEventListener('resize', closeAll);

        return () => {
            window.removeEventListener('resize', closeAll);
        };
    }, []);

    const displayRides = (newRoute) => {
        setRoute(newRoute);
        setRouteSearched(true);
        setIsRidesVisible(true);
        setSidebarOpen(false);
    };

    const hideRides = () => {
        setIsRidesVisible(false);
        setTimeout(() => {
            setRouteSearched(false);
        }, 700);
    };

    const openRides = () => {
        if (window.innerWidth < 768 && sidebarOpen) {
            closeSidebar();
        }
        setIsRidesVisible(true);
    };

    const closeRides = () => {
        setIsRidesVisible(false);
    };

    const openSidebar = () => {
        if (window.innerWidth < 768 && isRidesVisible) {
            closeRides();
        }
        setSidebarOpen(true);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <section className='relative h-[calc(100vh-48px)]'>
            <Map 
                displayRides={displayRides} 
                hideRides={hideRides}
            />
            <Sidebar 
                sidebarOpen={sidebarOpen}
                openSidebar={openSidebar}
                closeSidebar={closeSidebar}
            />
            {routeSearched && (
                <Rides 
                    route={route}
                    isRidesVisible={isRidesVisible}
                    openRides={openRides}
                    closeRides={closeRides}
                />
            )}
        </section>
    )
};

export default Home;