const User = require('../../model/User');

const handleLogout = async (req, res) => {
    // Make sure to clear the accessToken on the client side

    const cookies = req.cookies;
    if (!cookies?.jwt) {
        return res.sendStatus(204);
    }
    const refreshToken = cookies.jwt;
    const user = await User.findOne({ refreshToken }).exec();
    if (!user) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    }
    try {
        user.refreshToken = '';
        await user.save();
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
};

module.exports = { handleLogout };