/**
 * Route-aware matching utilities for carpool ride matching.
 *
 * Matching criteria:
 * 1. Same route & direction — both users traveling in the same direction along a shared path.
 * 2. Pickup proximity on-route — user's pickup is within threshold of trip's route polyline.
 * 3. Destination proximity on-route — user's destination is within threshold of trip's route polyline.
 */

const EARTH_RADIUS_KM = 6371;
const DEFAULT_THRESHOLD_KM = 2;

/**
 * Convert degrees to radians.
 */
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Haversine distance between two [lng, lat] points in km.
 */
function haversineDistance(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

/**
 * Find the minimum distance from a point [lng, lat] to a polyline (array of [lng, lat]).
 * Uses point-to-segment projection for accuracy.
 * Returns { distance (km), segmentIndex, projectionFraction }.
 */
function pointToPolylineDistance(point, polyline) {
    let minDist = Infinity;
    let bestSegment = 0;
    let bestFraction = 0;

    for (let i = 0; i < polyline.length - 1; i++) {
        const { distance, fraction } = pointToSegmentDistance(point, polyline[i], polyline[i + 1]);
        if (distance < minDist) {
            minDist = distance;
            bestSegment = i;
            bestFraction = fraction;
        }
    }

    return { distance: minDist, segmentIndex: bestSegment, projectionFraction: bestFraction };
}

/**
 * Minimum distance from a point to a line segment (all [lng, lat]).
 * Projects point onto the segment and clamps to endpoints.
 */
function pointToSegmentDistance(point, segStart, segEnd) {
    // Convert to approximate flat coords (scaled by cos(lat))
    const cosLat = Math.cos(deg2rad((segStart[1] + segEnd[1]) / 2));
    const px = (point[0] - segStart[0]) * cosLat;
    const py = point[1] - segStart[1];
    const sx = (segEnd[0] - segStart[0]) * cosLat;
    const sy = segEnd[1] - segStart[1];

    const lenSq = sx * sx + sy * sy;
    let fraction = 0;

    if (lenSq > 0) {
        fraction = Math.max(0, Math.min(1, (px * sx + py * sy) / lenSq));
    }

    // Projected point in original coords
    const projLng = segStart[0] + fraction * (segEnd[0] - segStart[0]);
    const projLat = segStart[1] + fraction * (segEnd[1] - segStart[1]);

    const distance = haversineDistance(point, [projLng, projLat]);
    return { distance, fraction };
}

/**
 * Compute the cumulative distance along a polyline up to a specific segment + fraction.
 */
function distanceAlongPolyline(polyline, segmentIndex, fraction) {
    let dist = 0;
    for (let i = 0; i < segmentIndex; i++) {
        dist += haversineDistance(polyline[i], polyline[i + 1]);
    }
    if (segmentIndex < polyline.length - 1) {
        dist += fraction * haversineDistance(polyline[segmentIndex], polyline[segmentIndex + 1]);
    }
    return dist;
}

/**
 * Compute the bearing (in degrees) from coord1 to coord2 ([lng, lat]).
 */
function bearing(coord1, coord2) {
    const [lon1, lat1] = coord1.map(deg2rad);
    const [lon2, lat2] = coord2.map(deg2rad);
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/**
 * Check if two routes are traveling in the same general direction.
 * Compares the overall bearing (origin→destination) of both routes.
 * Returns true if the angular difference is less than maxAngle degrees.
 */
function isSameDirection(userOrigin, userDest, tripOrigin, tripDest, maxAngle = 90) {
    const userBearing = bearing(userOrigin, userDest);
    const tripBearing = bearing(tripOrigin, tripDest);
    let diff = Math.abs(userBearing - tripBearing);
    if (diff > 180) diff = 360 - diff;
    return diff <= maxAngle;
}

/**
 * Check if the user's pickup is before the user's destination along the trip's route.
 * This ensures the user is traveling in the same direction as the trip.
 */
function isPickupBeforeDestination(tripPolyline, pickupResult, destResult) {
    const pickupDist = distanceAlongPolyline(
        tripPolyline,
        pickupResult.segmentIndex,
        pickupResult.projectionFraction
    );
    const destDist = distanceAlongPolyline(
        tripPolyline,
        destResult.segmentIndex,
        destResult.projectionFraction
    );
    return pickupDist < destDist;
}

/**
 * Main matching function.
 * Given the user's origin, destination, and an array of trips (with route_geometry),
 * returns the trips that match the route-aware criteria.
 *
 * @param {[Number, Number]} userOrigin - [lng, lat]
 * @param {[Number, Number]} userDest - [lng, lat]
 * @param {Array} trips - array of trip documents with route_geometry
 * @param {Number} thresholdKm - max distance from route (default 2km)
 * @returns {Array} matched trips
 */
function findMatchingTrips(userOrigin, userDest, trips, thresholdKm = DEFAULT_THRESHOLD_KM) {
    return trips.filter(trip => {
        // Skip trips with no route geometry (legacy trips fall back to haversine)
        if (!trip.route_geometry || trip.route_geometry.length < 2) {
            // Fallback: simple haversine check for legacy trips without route geometry
            const originDist = haversineDistance(userOrigin, trip.origin_coords);
            const destDist = haversineDistance(userDest, trip.destination_coords);
            return originDist <= thresholdKm && destDist <= thresholdKm;
        }

        // 1. Check same general direction
        if (!isSameDirection(userOrigin, userDest, trip.origin_coords, trip.destination_coords)) {
            return false;
        }

        // 2. Check pickup proximity on-route
        const pickupResult = pointToPolylineDistance(userOrigin, trip.route_geometry);
        if (pickupResult.distance > thresholdKm) {
            return false;
        }

        // 3. Check destination proximity on-route
        const destResult = pointToPolylineDistance(userDest, trip.route_geometry);
        if (destResult.distance > thresholdKm) {
            return false;
        }

        // 4. Ensure pickup comes before destination along the route (same direction)
        if (!isPickupBeforeDestination(trip.route_geometry, pickupResult, destResult)) {
            return false;
        }

        return true;
    });
}

module.exports = {
    haversineDistance,
    pointToPolylineDistance,
    isSameDirection,
    isPickupBeforeDestination,
    findMatchingTrips
};
