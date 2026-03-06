const Trip = require("../../model/Trip");
const {
    isWithinBoundingBox,
    checkDetourFeasibility,
} = require("../../utils/mapbox");

const getTrips = async (req, res) => {
    const { origin_lng, origin_lat, dest_lng, dest_lat } = req.query;

    if (!origin_lng || !origin_lat || !dest_lng || !dest_lat) {
        return res
            .status(400)
            .json({
                message:
                    "Rider origin and destination coordinates are required.",
            });
    }

    try {
        const today = new Date();
        const todayString = today.toISOString().split("T")[0];
        const trips = await Trip.find({
            departure_date: { $gte: todayString },
        });

        const riderOrigin = [parseFloat(origin_lng), parseFloat(origin_lat)];
        const riderDest = [parseFloat(dest_lng), parseFloat(dest_lat)];

        // Step 1: Bounding box pre-filter (cheap — no API calls)
        const bbFiltered = trips.filter(
            (trip) =>
                isWithinBoundingBox(
                    riderOrigin,
                    trip.origin_coords,
                    trip.destination_coords,
                ) &&
                isWithinBoundingBox(
                    riderDest,
                    trip.origin_coords,
                    trip.destination_coords,
                ),
        );

        // Step 2: Seat availability
        const seatFiltered = bbFiltered.filter(
            (trip) => trip.passengers.length < trip.seats_available,
        );

        // Step 3: Detour cost check via Mapbox Matrix API
        const feasibleTrips = [];
        for (const trip of seatFiltered) {
            try {
                const feasible = await checkDetourFeasibility(
                    trip,
                    riderOrigin,
                    riderDest,
                );
                if (feasible) {
                    feasibleTrips.push(trip);
                }
            } catch (err) {
                // If Matrix API fails for one trip, skip it rather than failing all
                console.error(
                    `Detour check failed for trip ${trip._id}:`,
                    err.message,
                );
            }
        }

        return res.status(200).json(feasibleTrips);
    } catch (error) {
        console.error("Error fetching routes:", error);
        return res.status(500).json({ message: "Error fetching trips." });
    }
};

module.exports = { getTrips };
