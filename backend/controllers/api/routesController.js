const Trip = require('../../model/Trip');
const { findMatchingTrips } = require('../../utils/routeMatching');

const getTrips = async (req, res) => {
    try {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const trips = await Trip.find({
            departure_date: { $gte: todayString }
        });
        return res.status(200).json(trips);
    }
    catch (error) {
        return res.status(500).json({message: "Error fetching trips."});
    }
};

/**
 * Route-aware trip matching.
 * POST /api/routes/match
 * Body: { origin_coords: [lng, lat], destination_coords: [lng, lat] }
 * Returns trips that match the route-aware criteria.
 */
const matchTrips = async (req, res) => {
    const { origin_coords, destination_coords } = req.body;

    if (!origin_coords || !destination_coords) {
        return res.status(400).json({ message: "origin_coords and destination_coords are required." });
    }

    try {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        // Fetch all active trips
        const trips = await Trip.find({
            departure_date: { $gte: todayString }
        });

        // Filter trips using route-aware matching
        const matchedTrips = findMatchingTrips(origin_coords, destination_coords, trips);

        // Only return trips with available seats
        const availableTrips = matchedTrips.filter(
            trip => trip.passengers.length < trip.seats_available
        );

        return res.status(200).json(availableTrips);
    }
    catch (error) {
        return res.status(500).json({ message: "Error matching trips." });
    }
};

module.exports = { getTrips, matchTrips };