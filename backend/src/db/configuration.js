const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "users.sqlite",
});

// Define models
const User = sequelize.define(
  "User",
  {
    // Model attributes are defined here
    providerID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    providerAccessToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    providerRefreshToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    refreshTokenVersion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "user",
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    givenName: {
      type: DataTypes.STRING,
    },
    familyName: {
      type: DataTypes.STRING,
    },
    picture: {
      type: DataTypes.STRING,
    },
  },
  {
    // Other model options go here
    tableName: "Users",
    //freezeTableName: true, // This ensures that table name will also be User instead of users
  }
);

module.exports = { sequelize, User };
