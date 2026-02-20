const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tripSchema = new Schema({
    driver: {
        type: String,
        required: true
    },
    origin: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    departure_date: {
        type: String,
        required: true
    },
    seats_available: {
        type: Number,
        required: true
    },
    passengers: {
        type: [String],
        required: true
    },
    requests: {
        type: [String],
        required: true
    }
});

module.exports = mongoose.model('Trip', tripSchema);