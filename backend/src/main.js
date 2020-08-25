const express = require("express");

const app = express();

app.get("/", function (req, res) {
  res.send("ok");
});

app.listen(4040, () => console.log("Server is listening on: http://localhost:4040/"));
