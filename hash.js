const bcrypt = require("bcrypt");

async function generateHash() {
  const password = "customer123"; // password plain text
  const saltRounds = 10; // tingkat kompleksitas hash
  const hash = await bcrypt.hash(password, saltRounds);
  console.log("Password:", password);
  console.log("Hash:", hash);
}

generateHash();
