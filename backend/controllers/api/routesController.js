const Trip = require('../../model/Trip');

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

module.exports = { getTrips };