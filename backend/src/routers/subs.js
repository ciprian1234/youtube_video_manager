const router = require("express").Router();
const axios = require("axios");
const { authenticateUser } = require("../auth/auth");
const { updateProviderTokens } = require("../auth/google/utils");

router.use(authenticateUser, updateProviderTokens);

router.get("/subs", async function (req, res) {
  try {
    // make the request
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
    //if (error.response.data.error) error.response.data.error.errors.forEach((e) => console.log(e));
    res.send({ error: error.message });
  }
});

module.exports = router;
