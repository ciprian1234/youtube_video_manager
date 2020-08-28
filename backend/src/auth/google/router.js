const router = require("express").Router();
const { google } = require("googleapis");
const CONFIG = require("../../config");
const { loginMiddleware } = require("../auth");
const { extractUserProfile } = require("./utils");

const oauth2Client = new google.auth.OAuth2(CONFIG.GOOGLE_CLIENT_ID, CONFIG.GOOGLE_CLIENT_SECRET, CONFIG.GOOGLE_CALLBACK_URL);

const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.readonly",
];

router.get("/auth/google", function (req, res) {
  const url = oauth2Client.generateAuthUrl({ access_type: "offline", scope: scopes });
  res.redirect(url);
});

router.get("/auth/google/callback", googleCallbackMiddleware, loginMiddleware);

// exchange code for tokens and add user to req object
async function googleCallbackMiddleware(req, res, next) {
  try {
    // exchange the code for tokens
    let response = await oauth2Client.getToken(req.query.code);
    req.user = extractUserProfile(response.tokens.id_token); // extract profile form id_token payload
    req.user.providerAccessToken = response.tokens.access_token;
    req.user.providerRefreshToken = response.tokens.refresh_token;
    req.user.providerIdToken = response.tokens.id_token;
  } catch (err) {
    console.log(err.message);
    req.user = null;
  }
  next();
}

module.exports = router;
