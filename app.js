if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const MongoDBStore = require("connect-mongo")(session);

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';
console.log(dbUrl);

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.use(express.json()); // Parse incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(methodOverride('_method'));
app.use(mongoSanitize({ // Sanitize data to prevent MongoDB injection
    replaceWith: '_'
}));

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
const store = new MongoDBStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
});

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user; // This is usually for rendering views but can stay for logged-in checks
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// API Routes
app.use('/api/users', userRoutes); // These should return JSON responses
app.use('/api/campgrounds', campgroundRoutes); // These should return JSON responses
app.use('/api/campgrounds/:id/reviews', reviewRoutes); // These should return JSON responses

app.get('/', (req, res) => {
    res.json({ message: "Welcome to the Yelp Camp API" }); // JSON response instead of rendering a view
});

// Handle 404 - Not Found
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!';
    res.status(statusCode).json({ error: err.message }); // Respond with JSON for errors
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});
