function apiAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "API key missing"
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      message: "Invalid API key"
    });
  }

  next();
}

module.exports = apiAuth;