const Trip = require('../../model/Trip');

const getTrips = async (req, res) => {
    const { type } = req.query;

    if (!type) {
        return res.status(400).json({message: "Missing type."});
    }

    try {
        if (type === "created"){
            const trips = await Trip.find({
                driver: req.username
            });
            res.status(200).json(trips);
        }
        else if (type === "joined"){
            const trips = await Trip.find({
                passengers: { $in: [req.username] }
            });
            res.status(200).json(trips);
        }
        else {
            return res.send(400).json({
                message: "Invalid type."
            });
        }
    }
    catch (error) {
        return res.status(500).json({message: `Error fetching ${type} trips`});
    }
};

const createTrip = async (req, res) => {
    const { 
        driver, 
        origin, 
        destination, 
        departure_date, 
        seats_available, 
    } = req.body;

    if (!driver || !origin || !destination || !departure_date || !seats_available) {
        return res.status(400).json({message: "Missing dirver, origin, destination, departure_date, or seats_available"});
    }

    if (driver !== req.username) {
        return res.status(401).json({message: "Cannot create trip as another user."});
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (departure_date < today || seats_available < 1) {
        return res.status(400).json({
            message: "Invalid trip."
        });
    }

    try {
        const tripConflict = await Trip.findOne({
            driver: driver,
            departure_date: departure_date
        }).exec();
        if (tripConflict) {
            return res.status(409).json({
                message: 'Cannot create multiple trips for the same day.'
            });
        }

        const trip = {
            driver: driver,
            origin: origin,
            destination: destination,
            departure_date: departure_date,
            seats_available: seats_available,
            passengers: [],
            requests: []
        };
        await Trip.create(trip);
        return res.status(201).json(trip);
    } catch (error) {
        return res.status(500).json({message: "Error creating trip."});
    }
};

const deleteTrip = async (req, res) => {
    const { driver, departure_date } = req.query;

    if (!driver || !departure_date) {
        return res.status(400).json({ message: "Driver and departure date are required." });
    }

    if (driver != req.username) {
        return res.status(401).json({ message: "Cannot delete another users trip." });
    }

    try {
        const result = await Trip.deleteOne({
            driver: driver,
            departure_date: departure_date
        }).exec();
        if (result.deletedCount == 0) {
            return res.status(404).json({ message: "Trip not found." });
        }
        return res.status(200).json({ message: "Trip deleted successfully." });
    }
    catch (error) {
        return res.status(500).json({ message: "An error occurred while deleting the trip." });
    }
};

const leaveTrip = async (req, res) => {
    const { driver, departure_date, requester } = req.body;

    if (!driver || !departure_date || !requester) {
        return res.status(400).json({ message: "Driver, departure date, and requester are required." });
    }

    if (requester != req.username) {
        return res.status(401).json({ message: "Cannot leave a trip as another user." });
    }

    try {
        const trip = await Trip.findOne({
            driver: driver,
            departure_date: departure_date
        }).exec();
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }
        if (!trip.passengers.includes(requester)){
            return res.status(404).json({ message: 'Passenger not found.' });
        }
        trip.passengers = trip.passengers.filter(passenger => passenger !== requester);
        await trip.save()
        return res.status(200).json(trip);
    }
    catch (error) {
        return res.status(500).json({ message: "An error occurred while trying to leave the trip." });
    }
};


const requestJoin = async (req, res) => {
    const { driver, departure_date, requester } = req.body;

    if (!driver || !departure_date || !requester) {
        return res.status(400).json({ message: "Driver, departure date, and the requester are required." });
    }

    if (requester != req.username) {
        return res.status(401).json({ message: "Cannot join trip as another user." });
    }

    try {
        const trip = await Trip.findOne({
            driver: driver,
            departure_date: departure_date
        }).exec();
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }
        if (trip.requests.find(request => request === requester)) {
            return res.status(409).json({ message: 'Already requested.' });
        }
        if (trip.passengers.find(passenger => passenger === requester)) {
            return res.status(409).json({ message: 'Already joined.' });
        }
        trip.requests.push(requester);
        await trip.save();
        return res.status(201).json(trip);
    }
    catch (error) {
        return res.status(500).json({ message: "Error requesting to join trip." });
    }
};

const acceptRequest = async (req, res) => {
    const { driver, departure_date, requester } = req.body;

    if (!driver || !departure_date || !requester) {
        return res.status(400).json({ message: "Driver, departure date, and the requester are required." });
    }

    if (driver != req.username) {
        return res.status(401).json({ message: "Cannot accept trip as another user." });
    }

    try {
        const trip = await Trip.findOne({
            driver: driver,
            departure_date: departure_date
        }).exec();
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }
        if (!trip.requests.includes(requester)) {
            return res.status(404).json({ message: 'No matching requester.' })
        }
        trip.requests = trip.requests.filter(request => request !== requester);
        trip.passengers.push(requester);
        await trip.save();
        return res.status(200).json(trip);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error accepting trip request." });
    }
};

const rejectRequest = async (req, res) => {
    const { driver, departure_date, requester } = req.body;

    if (!driver || !departure_date || !requester) {
        return res.status(400).json({ message: "Driver, departure date, and the requester are required." });
    }

    if (driver != req.username) {
        return res.status(401).json({ message: "Cannot accept trip as another user." });
    }

    try {
        const trip = await Trip.findOne({
            driver: driver,
            departure_date: departure_date
        }).exec();
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }
        if (!trip.requests.includes(requester)) {
            return res.status(404).json({ message: 'No matching requester.' })
        }
        trip.requests = trip.requests.filter(request => request !== requester);
        await trip.save();
        return res.status(200).json(trip);
    }
    catch (error) {
        return res.status(500).json({ message: "Error rejecting trip request." });
    }
};

module.exports = { getTrips, createTrip, deleteTrip, leaveTrip, requestJoin, acceptRequest, rejectRequest };