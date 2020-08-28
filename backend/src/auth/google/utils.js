const axios = require("axios");
const jwt = require("jsonwebtoken");
const CONFIG = require("../../config");
const { updateUserByEmail } = require("../../db/interaction");

module.exports = { updateProviderAccessToken, getUserProfile, extractUserProfile };

async function updateProviderAccessToken(userEmail, providerRefreshToken) {
  // const GOOGLE_OAUTH2_TOKEN_URL = "https://oauth2.googleapis.com/token";
  const GOOGLE_OAUTH2_TOKEN_URL = "https://www.googleapis.com/oauth2/v4/token";
  const body = {
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    client_secret: CONFIG.GOOGLE_CLIENT_SECRET,
    refresh_token: providerRefreshToken,
    grant_type: "refresh_token",
  };
  const response = await axios({
    method: "POST",
    url: GOOGLE_OAUTH2_TOKEN_URL,
    data: body,
    headers: { "Content-Type": "application/json" },
  });

  // update accessToken in DB
  const providerAccessToken = response.data.access_token;
  updateUserByEmail({ providerAccessToken }, userEmail);
  return providerAccessToken;
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
