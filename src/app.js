const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/poker')
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Could not connect to MongoDB:', error));

// Define User schema and model with isAdmin and isVIP fields
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    wallet: { type: Number, default: 10000 },
    isAdmin: { type: Boolean, default: false },
    isVIP: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your-secret-key', // Replace with a secure secret in production
    resave: false,
    saveUninitialized: false,
}));

// Middleware to check if the user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/');
}

// Middleware to check if the user is an admin
async function isAdmin(req, res, next) {
    const user = await User.findById(req.session.userId);
    if (user && user.isAdmin) {
        return next();
    }
    res.send('Access denied: Admins only');
}

// Handle login requests
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ username, password });
    if (user) {
        // Store user ID in session to persist login
        req.session.userId = user._id;

        // Redirect based on whether the user is an admin
        if (user.isAdmin) {
            res.redirect('/admin');
        } else {
            res.redirect('/lobby');
        }
    } else {
        res.send('Invalid username or password! <a href="/">Try again</a>');
    }
});

// Handle sign-up requests
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        res.send('Username already taken! <a href="/signup">Try again</a>');
    } else {
        // Add new user to the database
        const newUser = new User({ username, password });
        await newUser.save();
        res.redirect('/');
    }
});

// Lobby route (only accessible if logged in)
app.get('/lobby', isAuthenticated, async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Texas Poker Lobby</title>
            <link rel="stylesheet" href="/public/styles.css">
        </head>
        <body>
            <div class="lobby-container">
                <h2>Welcome to Texas Poker Lobby</h2>
                <p>Logged in as: <strong>${user.username}</strong></p>
                <button onclick="location.href='/logout'">Logout</button>
                <div class="wallet">
                    <p>Wallet: $<span id="walletAmount">${user.wallet}</span></p>
                    <button id="withdrawButton" onclick="withdraw()">Withdraw $10</button>
                    <p>Next withdrawal in: <span id="timer">10:00</span></p>
                </div>
                <div class="game-rooms">
                    <h3>Game Rooms</h3>
                    <div class="room" onclick="joinRoom(1)">Room 1</div>
                    <div class="room" onclick="joinRoom(2)">Room 2</div>
                    <div class="room" onclick="joinRoom(3)">Room 3</div>
                    <div class="room" onclick="joinRoom(4)">Room 4</div>
                    <div class="room vip-room" onclick="joinVipRoom()">VIP Room</div>
                </div>
                <div class="leaderboard">
                    <h3>Leaderboard</h3>
                    <ul id="leaderboardList">
                        <li>Player1 - $20000</li>
                        <li>Player2 - $18000</li>
                        <li>Player3 - $15000</li>
                    </ul>
                </div>
            </div>
            <script src="/public/lobby.js"></script>
        </body>
        </html>
    `);
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Admin Dashboard Route (protected by isAuthenticated and isAdmin)
app.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin.html'));
});

// API to get all users for admin dashboard
app.get('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// API to add $100 to a user's wallet (admin only)
app.post('/api/users/:id/add-money', isAuthenticated, isAdmin, async (req, res) => {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (user) {
        user.wallet += 100;
        await user.save();
        res.json({ message: 'Added $100 to user account', wallet: user.wallet });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
