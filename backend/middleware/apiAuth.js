const { clerkMiddleware, requireAuth } = require("@clerk/express");

// Pure Clerk authentication - no custom admin checks
// All authenticated Clerk users can access the API

// Require genuine clerk JWT sessions on every request
module.exports = [clerkMiddleware(), requireAuth()];