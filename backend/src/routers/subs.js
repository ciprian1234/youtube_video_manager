const router = require("express").Router();
const axios = require("axios");
const { authenticateUser } = require("../auth/auth");
const { updateProviderAccessToken } = require("../auth/google/utils");

router.get("/subs", authenticateUser, async function (req, res) {
  try {
    // update access token if is expired
    req.user.providerAccessToken = await updateProviderAccessToken(req.user.email, req.user.providerRefreshToken);

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
    //   console.log(error.response.data.error.errors[0]);
    //if (error.response.data.error) error.response.data.error.errors.forEach((e) => console.log(e));
    res.send({ error: error.message });
  }
});

module.exports = router;
