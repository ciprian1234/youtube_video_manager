const jwt = require("jsonwebtoken");
const CONFIG = require("../config");
const { getUser } = require("../db/interaction.js");

async function isAuthorized(req, res, next) {
  try {
    // extract jwt refreshToken from user cookie
    if (!req.cookies.refreshToken) throw new Error("Missing refreshToken cookie");

    // extract jwt accessToken from HTTP header
    const authorization = req.headers["authorization"];
    if (!authorization) throw new Error("Missing authorization header");

    // extract accessToken from header
    const accessToken = authorization.split(" ")[1];
    if (!accessToken) throw new Error("Missing accessToken from header");

    // verify tokens
    let accessTokenPayload = verifyToken(accessToken, CONFIG.ACCESS_TOKEN_SECRET, "accessToken");
    let refreshTokenPayload = verifyToken(req.cookies.refreshToken, CONFIG.REFRESH_TOKEN_SECRET, "refreshToken");

    // verify if user exists in database
    const user = await getUser(accessTokenPayload.email); //[THIS PART IS ONLY POSIBLE INSIDE THIS MICROSERVICE]
    if (!user) throw new Error("User does not exist");

    // verify refreshTokenVersion from payload agains refreshTokenVersion from user database
    if (refreshTokenPayload.refreshTokenVersion !== user.refreshTokenVersion) throw new Error("Invalid refreshTokenVersion");

    // if everything is ok we will reach here, that means user is identified and authorized
    req.user = user; // add user to the req object
    next(); // call next middleware
  } catch (err) {
    res.status(401).json({ error: `AuthError: ${err.message}!` });
  }
}

function verifyToken(token, secret, errMsg) {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    throw new Error(`Invalid ${errMsg} (${err.message})`);
  }
}

module.exports = { isAuthorized };
