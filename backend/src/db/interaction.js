const { User } = require("./configuration");
const { randomBytes } = require("crypto");

module.exports = {
  getUser,
  createOrUpdateUser,
  updateUserRefreshTokenVersion,
};

async function createOrUpdateUser(profile) {
  let user = await getUser(profile.email);

  // create new profile data
  const newProfile = createUserProfileAdapter(profile);

  // check if user already exists in DB
  if (!user) {
    user = await User.create(newProfile); // add user to DB
  } else {
    // update userProfile from google profile and also the tokenVersion
    await User.update(newProfile, { where: { email: newProfile.email } });
  }

  return getUser(newProfile.email);
}

// get user by email from database
async function getUser(email) {
  return await User.findOne({ where: { email } });
}

// update user tokenVersion from database
async function updateUserRefreshTokenVersion(email) {
  const refreshTokenVersion = randomBytes(32).toString("base64");
  await User.update({ refreshTokenVersion }, { where: { email } });
}

// user adapter from Provider to User model from database
function createUserProfileAdapter(profile) {
  return {
    providerID: profile.sub,
    providerAccessToken: profile.accessToken,
    providerRefreshToken: profile.refreshToken,
    refreshTokenVersion: randomBytes(32).toString("base64"),
    // role: has already a default value of 'user'
    email: profile.email,
    givenName: profile.given_name,
    familyName: profile.family_name,
    picture: profile.picture,
  };
}
