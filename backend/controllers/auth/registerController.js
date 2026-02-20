const User = require('../../model/User');
const bcrypt = require('bcrypt');

const handleNewUser = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({
            message: 'Please provide a username and password'
        })
    }

    const userExists = await User.findOne({ username: username }).exec();
    if (userExists) {
        return res.status(409).json({
            message: 'User already exists'
        })
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        await User.create({
            username: username,
            password: hash
        });
        return res.status(201).json({
            message: 'User added'
        })
        
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
};

module.exports = { handleNewUser };