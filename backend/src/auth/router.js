const router = require("express").Router();
const jwt = require("jsonwebtoken");
const CONFIG = require("../config");
const { authenticateUser, verifyToken } = require("./auth");
const { getUser, updateUserRefreshTokenVersion } = require("../db/interaction.js");

router.get("/me", authenticateUser, function (req, res) {
  res.send(req.user);
});

router.get("/logout", authenticateUser, async function (req, res) {
  // invalidate refreshToken by updating refreshTokenVersion
  await updateUserRefreshTokenVersion(req.user.email);
  // clear refreshToken cookie
  res.clearCookie("refreshToken", { path: "/" });
  res.json({ error: null });
});

router.get("/refresh_tokens", async function (req, res) {
  // extract jwt refresh token from user cookie
  try {
    if (!req.cookies.refreshToken) throw new Error("Missing refreshToken cookie");
    const refreshToken = req.cookies.refreshToken;

    // verify refreshToken
    const payload = verifyToken(refreshToken, CONFIG.REFRESH_TOKEN_SECRET, "refreshToken");

    // verify if user exists in database
    const user = await getUser(payload.email);
    if (!user) throw new Error("User does not exist");

    // verify refreshTokenVersion from payload agains refreshTokenVersion from user database
    if (payload.refreshTokenVersion !== user.refreshTokenVersion) throw new Error("Invalid refreshTokenVersion");

    // if everything is ok we will reach here, that means refreshToken is valid
    // Generate new accessToken
    const accessToken = jwt.sign({ id: user.id, email: user.email }, CONFIG.ACCESS_TOKEN_SECRET, {
      expiresIn: parseInt(CONFIG.ACCESS_TOKEN_EXPIRATION / 1000),
    });

    // send new accessToken
    res.send({ accessToken });
    // optionally update also the refresh token so that refreshToken will never expire as long user is active
  } catch (err) {
    res.status(401).json({ error: `AuthError: ${err.message}!` });
  }
});

router.post("/register", function (req, res) {
  res.status(501).send({ error: "Not implemented, use registration with oauth instead!" }); // not_implemented
});

router.get("/login", function (req, res) {
  res.status(501).send({ error: "Not implemented, use /auth/<provider> instead" }); // not_implemented
});

module.exports = router;
