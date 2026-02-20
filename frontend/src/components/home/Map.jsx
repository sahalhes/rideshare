import { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import directionsStyle from '../../mapbox/directionsStyle';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css'
import '../../mapbox/directionsStyle.css'

const INITIAL_CENTER = [
    -105.2705,
    40.0150
];
const INITIAL_ZOOM = 10.12;

const Map = ({ displayRides, hideRides }) => {
    const mapRef = useRef();
    const mapContainerRef = useRef();
    const directionsRef = useRef();

    const [center, setCenter] = useState(INITIAL_CENTER);
    const [zoom, setZoom] = useState(INITIAL_ZOOM);

    useEffect(() => {
        mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/navigation-night-v1',
            center: center,
            zoom: zoom
        });

        mapRef.current.on('move', () => {
            const mapCenter = mapRef.current.getCenter();
            const mapZoom = mapRef.current.getZoom();
      
            setCenter([ mapCenter.lng, mapCenter.lat ]);
            setZoom(mapZoom);
        });

        const geolocateControl = new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        });

        const updateGeolocatePosition = () => {
            const position = window.innerWidth < 768 ? 'left' : 'top-right';
            if (mapRef.current.hasControl(geolocateControl)) {
                mapRef.current.removeControl(geolocateControl); 
            }
            mapRef.current.addControl(geolocateControl, position);
        };

        updateGeolocatePosition();
        window.addEventListener('resize', updateGeolocatePosition);

        directionsRef.current = new MapboxDirections({
            styles: directionsStyle,
            accessToken: mapboxgl.accessToken,
            interactive: false,
            profile: 'mapbox/driving',
            controls: {
                instructions: false,
                profileSwitcher: false
            },
            placeholderOrigin: 'Where from?',
            placeholderDestination: 'Where to?'
        });
        mapRef.current.addControl(directionsRef.current, 'top');

        directionsRef.current.on('route', () => {
            const handleButtonClick = (e) => {
                e.stopPropagation();
                hideRides();
            };
        
            const addButtonClickListener = () => {
                const directionsButtons = directionsRef.current.container.querySelectorAll('.geocoder-icon.geocoder-icon-close');
        
                directionsButtons.forEach((button) => {
                    button.removeEventListener('click', handleButtonClick);
                    button.addEventListener('click', handleButtonClick);
                });
            };

            const origin = directionsRef.current.container.querySelector('#mapbox-directions-origin-input .mapboxgl-ctrl-geocoder input').value;
            const destination = directionsRef.current.container.querySelector('#mapbox-directions-destination-input .mapboxgl-ctrl-geocoder input').value;
            
            addButtonClickListener();
            displayRides({ origin, destination });
        });

        return () => {
            mapRef.current.remove();
            window.removeEventListener('resize', updateGeolocatePosition);
        }
    }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    mapRef.current.flyTo({
                        center: [position.coords.longitude, position.coords.latitude]
                    });
                }
            );
        } 
    }, []);

    return (
        <div ref={mapContainerRef} className='w-full h-full'/>    
    );
};

export default Map;