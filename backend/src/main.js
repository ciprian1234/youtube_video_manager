const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const CONFIG = require("./config");
const { sequelize } = require("./db/configuration");
const { addAuthRoutes } = require("./auth/authRoutes");
const { addGoogleAuthRoutes } = require("./auth/googleRoutes");

async function main() {
  const app = express();
  // add midleware
  app.use(cors());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // add other paths
  addAuthRoutes(app);
  addGoogleAuthRoutes(app);

  // connect to db
  await sequelize.authenticate();
  console.log("Connection to DB has been established successfully.");
  // sync db to sequelize modeles, (re)create all modeles
  await sequelize.sync();
  //   await sequelize.sync({ force: true });

  app.get("/", function (req, res) {
    res.send("home");
  });

  app.listen(CONFIG.SERVER_PORT, () => console.log(`Server is listening on: http://localhost:${CONFIG.SERVER_PORT}/`));
}

main();
