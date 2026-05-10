require("dotenv").config({
  path: "../.env"
});

const fs = require("fs");
const path = require("path");

const { Admeasy } = require("../db");

const CuetCutoffs = require(
  "../models/CuetCutoffSchema"
);

const importData = async () => {

  try {

    await Admeasy.asPromise();

    console.log("Importing...");

    const dataPath = path.join(
      __dirname,
      "transformed.json"
    );

    const jsonData = JSON.parse(
      fs.readFileSync(dataPath, "utf-8")
    );

    // Remove old data
    await CuetCutoffs.deleteMany({});

    // Insert new data
    await CuetCutoffs.insertMany(jsonData);

    console.log(
      `Imported ${jsonData.length} records`
    );

    process.exit(0);

  }

  catch (err) {

    console.error(err);

    process.exit(1);

  }

};

importData();