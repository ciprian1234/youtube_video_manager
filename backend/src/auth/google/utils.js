const axios = require("axios");
const jwt = require("jsonwebtoken");
const CONFIG = require("../../config");
const { updateUserByEmail } = require("../../db/interaction");

module.exports = { updateProviderTokens, getUserProfile, extractUserProfile };

// middleware
async function updateProviderTokens(req, res, next) {
  // const GOOGLE_OAUTH2_TOKEN_URL = "https://oauth2.googleapis.com/token";
  const GOOGLE_OAUTH2_TOKEN_URL = "https://www.googleapis.com/oauth2/v4/token";
  // check if id_token expired:
  const { exp } = jwt.decode(req.user.providerIdToken);
  if (exp * 1000 < new Date().getTime()) {
    console.log("ID TOKEN EXPIRED");
    // create http request request
    const body = {
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      client_secret: CONFIG.GOOGLE_CLIENT_SECRET,
      refresh_token: req.user.providerRefreshToken,
      grant_type: "refresh_token",
    };
    const response = await axios({
      method: "POST",
      url: GOOGLE_OAUTH2_TOKEN_URL,
      data: body,
      headers: { "Content-Type": "application/json" },
    });

    // console.log("response.data:", response.data);
    // extract tokens from response
    const providerAccessToken = response.data.access_token;
    const providerIdToken = response.data.id_token;

    // update req.user
    req.user.providerAccessToken = providerAccessToken;
    req.user.providerIdToken = providerIdToken;
    // update accessToken in DB
    updateUserByEmail({ providerAccessToken, providerIdToken }, req.user.email);
  }
  next();
}

async function getUserProfile(accessToken) {
  return await axios({
    method: "GET",
    url: "https://www.googleapis.com/oauth2/v3/userinfo",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function extractUserProfile(idToken) {
  const payload = jwt.decode(idToken);
  return {
    provider: "google",
    providerId: payload.sub,
    email: payload.email,
    picture: payload.picture,
    givenName: payload.given_name,
    familyName: payload.family_name,
  };
}
