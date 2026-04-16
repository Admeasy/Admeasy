const { nanoid } = require("nanoid");
const User = require("../models/userSchema");

const generateUniqueReferralCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = nanoid(8).toUpperCase(); //"AB3X9KLM"
    const existing = await User.findOne({ referralCode: code });
    exists = !!existing;
  }
  return code;
};

module.exports = generateUniqueReferralCode;
