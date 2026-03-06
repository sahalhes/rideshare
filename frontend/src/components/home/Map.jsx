import {
    useRef,
    useState,
    useEffect,
    useCallback,
    useImperativeHandle,
    forwardRef,
} from "react";
import mapboxgl from "mapbox-gl";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import directionsStyle from "../../mapbox/directionsStyle";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
import "../../mapbox/directionsStyle.css";

const INITIAL_CENTER = [-105.2705, 40.015];
const INITIAL_ZOOM = 10.12;

const Map = forwardRef(
    ({ displayRides, hideRides, onDirectionsReady }, ref) => {
        const mapRef = useRef();
        const mapContainerRef = useRef();
        const directionsRef = useRef();
        const riderMarkersRef = useRef([]);

        const [center, setCenter] = useState(INITIAL_CENTER);
        const [zoom, setZoom] = useState(INITIAL_ZOOM);

        // Expose methods to parent
        useImperativeHandle(ref, () => ({
            showTripOnMap: (trip, riderInfo) => {
                if (!mapRef.current || !directionsRef.current) return;

                // Clear any previous rider overlay
                clearRiderOverlay();

                // Set the driver's route on the directions widget
                directionsRef.current.setOrigin(trip.origin_coords);
                directionsRef.current.setDestination(trip.destination_coords);

                // Fit the map to the route bounds
                const bounds = new mapboxgl.LngLatBounds();
                bounds.extend(trip.origin_coords);
                bounds.extend(trip.destination_coords);

                // If rider info is provided, draw their segment in green
                if (riderInfo) {
                    bounds.extend(riderInfo.origin_coords);
                    bounds.extend(riderInfo.destination_coords);

                    // Fetch the rider's sub-route and draw it in green
                    fetchAndDrawRiderSegment(
                        riderInfo.origin_coords,
                        riderInfo.destination_coords,
                    );

                    // Add green markers for rider pickup/dropoff
                    const pickupMarker = new mapboxgl.Marker({
                        color: "#22c55e",
                    })
                        .setLngLat(riderInfo.origin_coords)
                        .setPopup(
                            new mapboxgl.Popup({ offset: 25 }).setText(
                                `Pickup: ${riderInfo.origin}`,
                            ),
                        )
                        .addTo(mapRef.current);

                    const dropoffMarker = new mapboxgl.Marker({
                        color: "#16a34a",
                    })
                        .setLngLat(riderInfo.destination_coords)
                        .setPopup(
                            new mapboxgl.Popup({ offset: 25 }).setText(
                                `Dropoff: ${riderInfo.destination}`,
                            ),
                        )
                        .addTo(mapRef.current);

                    riderMarkersRef.current.push(pickupMarker, dropoffMarker);
                }

                mapRef.current.fitBounds(bounds, { padding: 80 });
            },
            clearTripFromMap: () => {
                if (!directionsRef.current) return;
                directionsRef.current.removeRoutes();
                clearRiderOverlay();
            },
        }));

        const clearRiderOverlay = useCallback(() => {
            if (!mapRef.current) return;

            // Remove rider markers
            riderMarkersRef.current.forEach((m) => m.remove());
            riderMarkersRef.current = [];

            // Remove rider route layer/source if present
            if (mapRef.current.getLayer("rider-route-line")) {
                mapRef.current.removeLayer("rider-route-line");
            }
            if (mapRef.current.getLayer("rider-route-casing")) {
                mapRef.current.removeLayer("rider-route-casing");
            }
            if (mapRef.current.getSource("rider-route")) {
                mapRef.current.removeSource("rider-route");
            }
        }, []);

        const fetchAndDrawRiderSegment = useCallback(
            async (origin, destination) => {
                try {
                    const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
                    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
                    const res = await fetch(url);
                    const data = await res.json();

                    if (!data.routes || data.routes.length === 0) return;

                    const routeGeoJSON = {
                        type: "Feature",
                        geometry: data.routes[0].geometry,
                    };

                    // Wait a short moment so the directions plugin route renders first
                    setTimeout(() => {
                        if (!mapRef.current) return;

                        // Clean up if already exists
                        if (mapRef.current.getLayer("rider-route-line")) {
                            mapRef.current.removeLayer("rider-route-line");
                        }
                        if (mapRef.current.getLayer("rider-route-casing")) {
                            mapRef.current.removeLayer("rider-route-casing");
                        }
                        if (mapRef.current.getSource("rider-route")) {
                            mapRef.current.removeSource("rider-route");
                        }

                        mapRef.current.addSource("rider-route", {
                            type: "geojson",
                            data: routeGeoJSON,
                        });

                        // Green casing (wider, behind)
                        mapRef.current.addLayer({
                            id: "rider-route-casing",
                            type: "line",
                            source: "rider-route",
                            layout: {
                                "line-cap": "round",
                                "line-join": "round",
                            },
                            paint: {
                                "line-color": "#15803d",
                                "line-width": 14,
                            },
                        });

                        // Green route line (on top)
                        mapRef.current.addLayer({
                            id: "rider-route-line",
                            type: "line",
                            source: "rider-route",
                            layout: {
                                "line-cap": "round",
                                "line-join": "round",
                            },
                            paint: {
                                "line-color": "#22c55e",
                                "line-width": 6,
                            },
                        });
                    }, 1000);
                } catch (err) {
                    console.error("Failed to draw rider segment:", err);
                }
            },
            [],
        );

        useEffect(() => {
            mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;
            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: "mapbox://styles/mapbox/navigation-night-v1",
                center: center,
                zoom: zoom,
            });

            mapRef.current.on("move", () => {
                const mapCenter = mapRef.current.getCenter();
                const mapZoom = mapRef.current.getZoom();

                setCenter([mapCenter.lng, mapCenter.lat]);
                setZoom(mapZoom);
            });

            const geolocateControl = new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true,
                },
                trackUserLocation: true,
                showUserHeading: true,
            });

            const updateGeolocatePosition = () => {
                const position = window.innerWidth < 768 ? "left" : "top-right";
                if (mapRef.current.hasControl(geolocateControl)) {
                    mapRef.current.removeControl(geolocateControl);
                }
                mapRef.current.addControl(geolocateControl, position);
            };

            updateGeolocatePosition();
            window.addEventListener("resize", updateGeolocatePosition);

            directionsRef.current = new MapboxDirections({
                styles: directionsStyle,
                accessToken: mapboxgl.accessToken,
                interactive: false,
                profile: "mapbox/driving",
                controls: {
                    instructions: false,
                    profileSwitcher: false,
                },
                placeholderOrigin: "Enter pickup location",
                placeholderDestination: "Where to?",
            });
            mapRef.current.addControl(directionsRef.current, "top");

            if (onDirectionsReady) {
                onDirectionsReady(directionsRef.current.container);
            }

            directionsRef.current.on("route", () => {
                // Clear any rider overlay from a previously viewed trip
                clearRiderOverlay();

                const handleButtonClick = (e) => {
                    e.stopPropagation();
                    clearRiderOverlay();
                    hideRides();
                };

                const addButtonClickListener = () => {
                    const directionsButtons =
                        directionsRef.current.container.querySelectorAll(
                            ".geocoder-icon.geocoder-icon-close",
                        );

                    directionsButtons.forEach((button) => {
                        button.removeEventListener("click", handleButtonClick);
                        button.addEventListener("click", handleButtonClick);
                    });
                };

                const originName =
                    directionsRef.current.container.querySelector(
                        "#mapbox-directions-origin-input .mapboxgl-ctrl-geocoder input",
                    ).value;
                const destinationName =
                    directionsRef.current.container.querySelector(
                        "#mapbox-directions-destination-input .mapboxgl-ctrl-geocoder input",
                    ).value;

                const originFeature = directionsRef.current.getOrigin();
                const destinationFeature =
                    directionsRef.current.getDestination();

                const origin = {
                    name: originName,
                    coords: originFeature.geometry.coordinates,
                };

                const destination = {
                    name: destinationName,
                    coords: destinationFeature.geometry.coordinates,
                };

                addButtonClickListener();
                displayRides({ origin, destination });
            });

            return () => {
                mapRef.current.remove();
                window.removeEventListener("resize", updateGeolocatePosition);
            };
        }, []);

        useEffect(() => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    mapRef.current.flyTo({
                        center: [
                            position.coords.longitude,
                            position.coords.latitude,
                        ],
                    });
                });
            }
        }, []);

        return <div ref={mapContainerRef} className="w-full h-full" />;
    },
);

export default Map;
