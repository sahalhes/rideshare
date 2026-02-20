const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    first_name: String,
    last_name: String,
    email: String,
    phone: String,
    profile_picture: String,
    refreshToken: String
});

module.exports = mongoose.model('User', userSchema);