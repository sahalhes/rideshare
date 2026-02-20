const User = require('../../model/User');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({
            message: 'Please provide a username and password'
        })
    }
    const user = await User.findOne({ username: username }).exec();
    if (!user) {
        return res.status(401).json({
            message: 'Invalid username or password'
        })
    }

    try {
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({
                message: 'Invalid username or password'
            })
        }
        const accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ username: user.username }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
        user.refreshToken = refreshToken;
        await user.save();
        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 1000 * 24 * 60 * 60 });
        return res.status(200).json({ accessToken });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
};

module.exports = { handleLogin };