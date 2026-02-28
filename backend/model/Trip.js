const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const riderSchema = new Schema(
    {
        username: { type: String, required: true },
        origin: { type: String, required: true },
        destination: { type: String, required: true },
        origin_coords: { type: [Number], required: true },
        destination_coords: { type: [Number], required: true },
        seats_requested: { type: Number, required: true, default: 1 },
    },
    { _id: false },
);

const tripSchema = new Schema({
    driver: {
        type: String,
        required: true,
    },
    origin: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    origin_coords: {
        type: [Number],
        required: true,
    },
    destination_coords: {
        type: [Number],
        required: true,
    },
    departure_date: {
        type: String,
        required: true,
    },
    seats_available: {
        type: Number,
        required: true,
    },
    max_detour_minutes: {
        type: Number,
        required: true,
    },
    base_trip_duration: {
        type: Number,
        required: true,
    },
    current_route_duration: {
        type: Number,
        default: 0,
    },
    passengers: {
        type: [riderSchema],
        default: [],
    },
    requests: {
        type: [riderSchema],
        default: [],
    },
});

module.exports = mongoose.model("Trip", tripSchema);
