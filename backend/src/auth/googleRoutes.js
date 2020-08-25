const { google } = require("googleapis");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const CONFIG = require("../config");
const { createOrUpdateUser } = require("../db/interaction");
const { isAuthorized } = require("./isAuthorized");

const oauth2Client = new google.auth.OAuth2(CONFIG.GOOGLE_CLIENT_ID, CONFIG.GOOGLE_CLIENT_SECRET, CONFIG.GOOGLE_CALLBACK_URL);

const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.readonly",
];

// store refresh token event in db
oauth2Client.on("tokens", (tokens) => {
  console.log("TODO: store tokens on DB");
  console.log("refresh_token: ", tokens.refresh_token);
});

function addGoogleAuthRoutes(app) {
  app.get("/auth/google", function (req, res) {
    const url = oauth2Client.generateAuthUrl({ access_type: "offline", scope: scopes });
    res.redirect(url);
  });

  app.get("/auth/google/callback", googleCallbackMiddleware, async function (req, res) {
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
  });

  app.get("/subs", isAuthorized, async function (req, res) {
    try {
      const response = await axios({
        method: "GET",
        url: `https://www.googleapis.com/youtube/v3/subscriptions?mine=true`,
        headers: {
          Authorization: `Bearer ${req.user.providerAccessToken}`,
        },
      });
      // send the response from youtube
      res.json(response.data);
    } catch (error) {
      console.log("error.message: ", error.message);
      console.log("error.response.data: ", error.response.data);
      //   console.log(error.response.data.error.errors[0]);
      if (error.response.data.error) error.response.data.error.errors.forEach((e) => console.log(e));
      res.send({ error: error.message });
    }
  });
}

async function googleCallbackMiddleware(req, res, next) {
  try {
    // exchange the code for tokens
    const tokens = await oauth2Client.getToken(req.query.code);
    const accessToken = tokens.tokens.access_token;
    const refreshToken = tokens.tokens.refresh_token;

    // get user profile
    const response = await axios({
      method: "GET",
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
      headers: { Authorization: `Bearer ${tokens.tokens.access_token}` },
    });
    console.log(response.data);

    // set req.user midleware variable
    req.user = response.data;
    req.user.accessToken = accessToken;
    req.user.refreshToken = refreshToken;
    // req.user
  } catch (err) {
    console.log(err.message);
    req.user = null;
  }
  next();
}

module.exports = { addGoogleAuthRoutes };
