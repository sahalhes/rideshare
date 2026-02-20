const User = require('../../model/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { putImage, deleteImage } = require('../../middleware/s3');

const updateUser = async (req, res) => {
    const { 
        username, 
        first_name, 
        last_name, 
        email, 
        phone, 
        old_password, 
        new_password
    } = req.body;

    try {
        const user = await User.findOne({
            username: req.username
        }).exec();
        if (!user) {
            return res.status(404).json({ message: 'User not found.'});
        }
        if (user.username !== username) {
            const newUser = await User.findOne({
                username: username
            }).exec();
            if (newUser) {
                return res.status(409).json({ message: "Username already exists." })
            }
            user.username = username;
        }
        if (user.first_name !== first_name) {
            user.first_name = first_name;
        }
        if (user.last_name !== last_name) {
            user.last_name = last_name;
        }
        if (user.email !== email) {
            user.email = email;
        }
        if (user.phone !== phone) {
            user.phone = phone
        }
        if (req.file) {
            if (user.profile_picture) {
                await deleteImage(user.profile_picture);
                user.profile_picture = '';
            }
            const imageName = await putImage(req.file);
            user.profile_picture = imageName;
        }
        if (old_password && new_password) {
            const match = await bcrypt.compare(old_password, user.password);
            if (!match) {
                return res.status(401).json({ message: "Password is incorrect." });
            }
            const hash = await bcrypt.hash(new_password, 10);
            user.password = hash;
        }
        const accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ username: user.username }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
        user.refreshToken = refreshToken;
        await user.save();
        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 1000 * 24 * 60 * 60 });
        return res.status(200).json(accessToken);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json( {message: "Failed to update user." })
    }
};

module.exports = { updateUser };