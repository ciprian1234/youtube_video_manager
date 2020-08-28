const jwt = require("jsonwebtoken");
const CONFIG = require("../config");
const { createOrUpdateUser, getUser } = require("../db/interaction.js");

module.exports = { loginMiddleware, authenticateUser, isAuthorized, verifyToken };

async function loginMiddleware(req, res) {
  if (!req.user) res.status(401).json({ error: "AuthError: Failed to login with OAuth2.0" });

  // check if user is already stored in DB
  const db_user = await createOrUpdateUser(req.user);
  const { id, email, refreshTokenVersion } = db_user;

  // create accessToken
  const accessToken = jwt.sign({ id, email }, CONFIG.ACCESS_TOKEN_SECRET, {
    expiresIn: parseInt(CONFIG.ACCESS_TOKEN_EXPIRATION / 1000),
  });

  // create refreshToken
  const refreshToken = jwt.sign({ id, email, refreshTokenVersion }, CONFIG.REFRESH_TOKEN_SECRET, {
    expiresIn: parseInt(CONFIG.REFRESH_TOKEN_EXPIRATION / 1000),
  });

  // save refreshToken in user browser as cookie
  res.cookie("refreshToken", refreshToken, { httpOnly: true, maxAge: parseInt(CONFIG.REFRESH_TOKEN_EXPIRATION) });

  // send userProfile along with accessToken to user
  res.json({ user: db_user, accessToken });
}

async function authenticateUser(req, res, next) {
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

function isAuthorized(role) {
  // TODO check if user has specific authorization
  // return midleware with specific authorization
  return function (req, res, next) {
    if (req.user.role != role) {
      res.status(401).json({ error: `AuthError: User not authorized!` });
    }
    next();
  };
}

function verifyToken(token, secret, errMsg) {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    throw new Error(`Invalid ${errMsg} (${err.message})`);
  }
}
