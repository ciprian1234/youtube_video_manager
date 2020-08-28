const router = require("express").Router();
const { authenticateUser, isAuthorized } = require("../auth/auth");
const { getUsers } = require("../db/interaction");

router.get("/users", async function (req, res) {
  res.json(await getUsers());
});

module.exports = router;
