const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const CONFIG = require("./config");
const { sequelize } = require("./db/configuration");
const authRouter = require("./auth/router");
const authGoogleRouter = require("./auth/google/router");
const adminRouter = require("./routers/admin");
const subsRouter = require("./routers/subs");

async function main() {
  const app = express();
  // add midleware
  app.use(cors());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // add paths with routers
  app.use(authRouter);
  app.use(authGoogleRouter);
  app.use(adminRouter);
  app.use(subsRouter);

  // add home path
  app.get("/", function (req, res) {
    res.send("home");
  });

  // connect to db
  await sequelize.authenticate();
  console.log("Connection to DB has been established successfully.");
  // sync db to sequelize modeles, (re)create all modeles
  await sequelize.sync();
  // await sequelize.sync({ force: true });

  app.listen(CONFIG.SERVER_PORT, () => console.log(`Server is listening on: http://localhost:${CONFIG.SERVER_PORT}/`));
}

main();
