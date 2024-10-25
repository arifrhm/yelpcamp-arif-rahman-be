const User = require('../models/user');

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.status(201).json({ message: 'User registered successfully', user: registeredUser });
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
}

module.exports.login = (req, res) => {
    req.flash('success', 'welcome back!');
    res.status(200).json({ message: 'Login successful', user: req.user });
}

module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success', "Goodbye!");
    res.status(200).json({ message: 'Logout successful' });
}

// Example of a method to get a user profile
module.exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id); // Assume user ID is passed as URL parameter
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
