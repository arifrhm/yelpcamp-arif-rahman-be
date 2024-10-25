const express = require("express");
const router = express.Router();
const passport = require("passport");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/user");
const users = require("../controllers/users");

// Registration route
router.post("/register", catchAsync(users.register));

// Login route
router.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: false,
  }),
  users.login
);

// Logout route
router.post("/logout", users.logout);

// Get user profile (for example purposes)
router.get("/:id", catchAsync(users.getUserProfile));

module.exports = router;
