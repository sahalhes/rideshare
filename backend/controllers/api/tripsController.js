const Trip = require("../../model/Trip");
const {
    getRouteDuration,
    calculateOptimalDuration,
} = require("../../utils/mapbox");

const getTrips = async (req, res) => {
    const { type } = req.query;

    if (!type) {
        return res.status(400).json({ message: "Missing type." });
    }

    try {
        if (type === "created") {
            const trips = await Trip.find({
                driver: req.username,
            });
            res.status(200).json(trips);
        } else if (type === "joined") {
            const trips = await Trip.find({
                "passengers.username": req.username,
            });
            res.status(200).json(trips);
        } else {
            return res.send(400).json({
                message: "Invalid type.",
            });
        }
    } catch (error) {
        return res
            .status(500)
            .json({ message: `Error fetching ${type} trips` });
    }
};

const createTrip = async (req, res) => {
    const {
        driver,
        origin,
        destination,
        origin_coords,
        destination_coords,
        departure_date,
        seats_available,
        max_detour_minutes,
    } = req.body;

    if (
        !driver ||
        !origin ||
        !destination ||
        !origin_coords ||
        !destination_coords ||
        !departure_date ||
        !seats_available ||
        max_detour_minutes == null
    ) {
        return res.status(400).json({
            message:
                "Missing driver, origin, destination, departure_date, seats_available, or max_detour_minutes.",
        });
    }

    if (driver !== req.username) {
        return res
            .status(401)
            .json({ message: "Cannot create trip as another user." });
    }

    const today = new Date().toISOString().split("T")[0];
    if (
        departure_date < today ||
        seats_available < 1 ||
        max_detour_minutes < 0
    ) {
        return res.status(400).json({
            message: "Invalid trip.",
        });
    }

    try {
        const tripConflict = await Trip.findOne({
            driver: driver,
            departure_date: departure_date,
        }).exec();
        if (tripConflict) {
            return res.status(409).json({
                message: "Cannot create multiple trips for the same day.",
            });
        }

        // Calculate the base trip duration via Mapbox Directions API
        const base_trip_duration = await getRouteDuration(
            origin_coords,
            destination_coords,
        );

        const trip = {
            driver: driver,
            origin: origin,
            destination: destination,
            origin_coords: origin_coords,
            destination_coords: destination_coords,
            departure_date: departure_date,
            seats_available: seats_available,
            max_detour_minutes: max_detour_minutes,
            base_trip_duration: base_trip_duration,
            current_route_duration: base_trip_duration,
            passengers: [],
            requests: [],
        };
        await Trip.create(trip);
        return res.status(201).json(trip);
    } catch (error) {
        console.error("Error creating trip:", error);
        return res.status(500).json({ message: "Error creating trip." });
    }
};

const deleteTrip = async (req, res) => {
    const { driver, departure_date } = req.query;

    if (!driver || !departure_date) {
        return res
            .status(400)
            .json({ message: "Driver and departure date are required." });
    }

    if (driver != req.username) {
        return res
            .status(401)
            .json({ message: "Cannot delete another users trip." });
    }

    try {
        const result = await Trip.deleteOne({
            driver: driver,
            departure_date: departure_date,
        }).exec();
        if (result.deletedCount == 0) {
            return res.status(404).json({ message: "Trip not found." });
        }
        return res.status(200).json({ message: "Trip deleted successfully." });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "An error occurred while deleting the trip." });
    }
};

const leaveTrip = async (req, res) => {
    const { driver, departure_date, requester } = req.body;

    if (!driver || !departure_date || !requester) {
        return res.status(400).json({
            message: "Driver, departure date, and requester are required.",
        });
    }

    if (requester != req.username) {
        return res
            .status(401)
            .json({ message: "Cannot leave a trip as another user." });
    }

    try {
        const trip = await Trip.findOne({
            driver: driver,
            departure_date: departure_date,
        }).exec();
        if (!trip) {
            return res.status(404).json({ message: "Trip not found." });
        }
        const passenger = trip.passengers.find((p) => p.username === requester);
        if (!passenger) {
            return res.status(404).json({ message: "Passenger not found." });
        }
        // Restore the seats that were taken
        trip.seats_available += passenger.seats_requested || 1;
        trip.passengers = trip.passengers.filter(
            (p) => p.username !== requester,
        );

        // Recalculate optimal route after passenger leaves
        trip.current_route_duration = await calculateOptimalDuration(trip);

        await trip.save();
        return res.status(200).json(trip);
    } catch (error) {
        console.error("Error leaving trip:", error);
        return res.status(500).json({
            message: "An error occurred while trying to leave the trip.",
        });
    }
};

const requestJoin = async (req, res) => {
    const {
        driver,
        departure_date,
        requester,
        origin,
        destination,
        origin_coords,
        destination_coords,
        seats_requested,
    } = req.body;

    const seatsNum = parseInt(seats_requested) || 1;

    if (
        !driver ||
        !departure_date ||
        !requester ||
        !origin ||
        !destination ||
        !origin_coords ||
        !destination_coords ||
        seatsNum < 1
    ) {
        return res.status(400).json({
            message:
                "Driver, departure date, requester, origin, destination, coordinates, and valid seats_requested are required.",
        });
    }

    if (requester != req.username) {
        return res
            .status(401)
            .json({ message: "Cannot join trip as another user." });
    }

    try {
        const trip = await Trip.findOne({
            driver: driver,
            departure_date: departure_date,
        }).exec();
        if (!trip) {
            return res.status(404).json({ message: "Trip not found." });
        }
        if (trip.requests.find((r) => r.username === requester)) {
            return res.status(409).json({ message: "Already requested." });
        }
        if (trip.passengers.find((p) => p.username === requester)) {
            return res.status(409).json({ message: "Already joined." });
        }
        if (seatsNum > trip.seats_available) {
            return res
                .status(400)
                .json({ message: "Not enough seats available." });
        }
        trip.requests.push({
            username: requester,
            origin: origin,
            destination: destination,
            origin_coords: origin_coords,
            destination_coords: destination_coords,
            seats_requested: seatsNum,
        });
        await trip.save();
        return res.status(201).json(trip);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error requesting to join trip." });
    }
};

const acceptRequest = async (req, res) => {
    const { driver, departure_date, requester } = req.body;

    if (!driver || !departure_date || !requester) {
        return res.status(400).json({
            message: "Driver, departure date, and the requester are required.",
        });
    }

    if (driver != req.username) {
        return res
            .status(401)
            .json({ message: "Cannot accept trip as another user." });
    }

    try {
        const trip = await Trip.findOne({
            driver: driver,
            departure_date: departure_date,
        }).exec();
        if (!trip) {
            return res.status(404).json({ message: "Trip not found." });
        }

        const requestObj = trip.requests.find((r) => r.username === requester);
        if (!requestObj) {
            return res.status(404).json({ message: "No matching requester." });
        }

        // Check there are still enough seats
        const seatsNeeded = requestObj.seats_requested || 1;
        if (seatsNeeded > trip.seats_available) {
            return res
                .status(400)
                .json({ message: "Not enough seats available." });
        }

        // Move from requests to passengers
        trip.requests = trip.requests.filter((r) => r.username !== requester);
        trip.passengers.push(requestObj);
        trip.seats_available -= seatsNeeded;

        // Recalculate optimal route duration with new passenger set
        trip.current_route_duration = await calculateOptimalDuration(trip);

        await trip.save();
        return res.status(200).json(trip);
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ message: "Error accepting trip request." });
    }
};

const rejectRequest = async (req, res) => {
    const { driver, departure_date, requester } = req.body;

    if (!driver || !departure_date || !requester) {
        return res.status(400).json({
            message: "Driver, departure date, and the requester are required.",
        });
    }

    if (driver != req.username) {
        return res
            .status(401)
            .json({ message: "Cannot accept trip as another user." });
    }

    try {
        const trip = await Trip.findOne({
            driver: driver,
            departure_date: departure_date,
        }).exec();
        if (!trip) {
            return res.status(404).json({ message: "Trip not found." });
        }
        if (!trip.requests.find((r) => r.username === requester)) {
            return res.status(404).json({ message: "No matching requester." });
        }
        trip.requests = trip.requests.filter((r) => r.username !== requester);
        await trip.save();
        return res.status(200).json(trip);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Error rejecting trip request." });
    }
};

module.exports = {
    getTrips,
    createTrip,
    deleteTrip,
    leaveTrip,
    requestJoin,
    acceptRequest,
    rejectRequest,
};
