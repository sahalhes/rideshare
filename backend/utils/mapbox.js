const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

/**
 * Get driving duration between two points using Mapbox Directions API.
 * @param {number[]} origin  - [lng, lat]
 * @param {number[]} destination - [lng, lat]
 * @returns {Promise<number>} duration in seconds
 */
async function getRouteDuration(origin, destination) {
    const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?access_token=${MAPBOX_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
        throw new Error("No route found between origin and destination.");
    }

    return data.routes[0].duration; // seconds
}

/**
 * Get an NxN travel-time matrix between all given coordinates.
 * Uses the Mapbox Matrix API (max 25 coordinates).
 * @param {number[][]} coordinates - array of [lng, lat] pairs
 * @returns {Promise<number[][]>} 2-D matrix of durations in seconds
 */
async function getTimeMatrix(coordinates) {
    const coordString = coordinates.map((c) => `${c[0]},${c[1]}`).join(";");
    const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordString}?access_token=${MAPBOX_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "Ok") {
        throw new Error(`Matrix API error: ${data.code}`);
    }

    return data.durations; // 2-D array, durations[i][j] = seconds from i→j
}

/**
 * Check whether a point falls inside the bounding box formed by
 * two anchor points (driver origin & dest), expanded by a padding.
 * @param {number[]} point       - [lng, lat]
 * @param {number[]} anchor1     - [lng, lat] (driver origin)
 * @param {number[]} anchor2     - [lng, lat] (driver destination)
 * @param {number}   paddingDeg  - padding in degrees (~0.045 ≈ 5 km)
 * @returns {boolean}
 */
function isWithinBoundingBox(point, anchor1, anchor2, paddingDeg = 0.045) {
    const minLng = Math.min(anchor1[0], anchor2[0]) - paddingDeg;
    const maxLng = Math.max(anchor1[0], anchor2[0]) + paddingDeg;
    const minLat = Math.min(anchor1[1], anchor2[1]) - paddingDeg;
    const maxLat = Math.max(anchor1[1], anchor2[1]) + paddingDeg;

    return (
        point[0] >= minLng &&
        point[0] <= maxLng &&
        point[1] >= minLat &&
        point[1] <= maxLat
    );
}

/**
 * Generate all valid permutations of intermediate stops where each
 * rider's pickup appears before their dropoff.
 * @param {{ pickupIdx: number, dropoffIdx: number }[]} riders
 * @returns {number[][]} array of valid orderings
 */
function generateValidPermutations(riders) {
    const indices = [];
    for (const r of riders) {
        indices.push(r.pickupIdx);
        indices.push(r.dropoffIdx);
    }

    const results = [];

    function permute(current, remaining) {
        if (remaining.length === 0) {
            results.push([...current]);
            return;
        }

        for (let i = 0; i < remaining.length; i++) {
            const idx = remaining[i];

            // If this index is a dropoff, its corresponding pickup must already be placed
            const rider = riders.find((r) => r.dropoffIdx === idx);
            if (rider && !current.includes(rider.pickupIdx)) {
                continue;
            }

            current.push(idx);
            const next = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
            permute(current, next);
            current.pop();
        }
    }

    permute([], indices);
    return results;
}

/**
 * Given a trip (with its current passengers) and a prospective rider,
 * determine whether adding the rider keeps total route time within
 * the driver's max_detour_minutes threshold.
 *
 * Route always starts at driver origin (index 0) and ends at driver
 * destination (index 1).
 *
 * @param {object}   trip        - Trip document
 * @param {number[]} riderOrigin - [lng, lat]
 * @param {number[]} riderDest   - [lng, lat]
 * @returns {Promise<boolean>}
 */
async function checkDetourFeasibility(trip, riderOrigin, riderDest) {
    // Build coordinate list
    // 0 = driver origin, 1 = driver destination
    const coords = [trip.origin_coords, trip.destination_coords];

    const riders = [];

    // Existing accepted passengers
    for (const p of trip.passengers) {
        const pickupIdx = coords.length;
        coords.push(p.origin_coords);
        const dropoffIdx = coords.length;
        coords.push(p.destination_coords);
        riders.push({ pickupIdx, dropoffIdx });
    }

    // Prospective new rider
    const newPickupIdx = coords.length;
    coords.push(riderOrigin);
    const newDropoffIdx = coords.length;
    coords.push(riderDest);
    riders.push({ pickupIdx: newPickupIdx, dropoffIdx: newDropoffIdx });

    // Get the NxN time matrix (single API call)
    const matrix = await getTimeMatrix(coords);

    // Enumerate all valid orderings of intermediate stops
    const permutations = generateValidPermutations(riders);

    // Find the minimum total route duration
    let minDuration = Infinity;

    for (const perm of permutations) {
        const fullRoute = [0, ...perm, 1]; // driver origin → ... → driver dest
        let duration = 0;
        for (let i = 0; i < fullRoute.length - 1; i++) {
            duration += matrix[fullRoute[i]][fullRoute[i + 1]];
        }
        minDuration = Math.min(minDuration, duration);
    }

    const maxAllowed = trip.base_trip_duration + trip.max_detour_minutes * 60;
    return minDuration <= maxAllowed;
}

/**
 * Calculate the optimal (minimum) route duration for the driver's
 * current set of accepted passengers. Used after accept / leave.
 *
 * @param {object} trip - Trip document (with passengers already updated)
 * @returns {Promise<number>} optimal duration in seconds
 */
async function calculateOptimalDuration(trip) {
    if (trip.passengers.length === 0) {
        return trip.base_trip_duration;
    }

    const coords = [trip.origin_coords, trip.destination_coords];

    const riders = [];

    for (const p of trip.passengers) {
        const pickupIdx = coords.length;
        coords.push(p.origin_coords);
        const dropoffIdx = coords.length;
        coords.push(p.destination_coords);
        riders.push({ pickupIdx, dropoffIdx });
    }

    const matrix = await getTimeMatrix(coords);
    const permutations = generateValidPermutations(riders);

    let minDuration = Infinity;

    for (const perm of permutations) {
        const fullRoute = [0, ...perm, 1];
        let duration = 0;
        for (let i = 0; i < fullRoute.length - 1; i++) {
            duration += matrix[fullRoute[i]][fullRoute[i + 1]];
        }
        minDuration = Math.min(minDuration, duration);
    }

    return minDuration;
}

module.exports = {
    getRouteDuration,
    getTimeMatrix,
    isWithinBoundingBox,
    generateValidPermutations,
    checkDetourFeasibility,
    calculateOptimalDuration,
};
