require("dotenv").config();
const { Users } = require("../db");
const User = require("../models/userSchema"); // This registers the schema
const crypto = require("crypto");

async function backfill() {
  await new Promise((res) => {
    if (Users.readyState === 1) return res();
    Users.once("connected", res);
  });

  const usersWithoutCode = await User.find({
    referralCode: { $in: [null, undefined, ""] },
  });

  console.log(`Found ${usersWithoutCode.length} users without referral codes`);

  for (const user of usersWithoutCode) {
    let code;
    let exists = true;
    while (exists) {
      code = crypto.randomBytes(4).toString("hex").toUpperCase();
      exists = await User.exists({ referralCode: code });
    }
    user.referralCode = code;
    await user.save({ validateBeforeSave: false });
    console.log(`Set code ${code} for user ${user.email}`);
  }

  console.log("Backfill complete");
  process.exit(0);
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
