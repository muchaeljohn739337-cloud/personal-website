const axios = require("axios");

async function testLogin() {
  try {
    console.log("🔐 Testing login...");
    const response = await axios.post("http://localhost:4000/api/auth/login", {
      email: "admin@advanciapayledger.com",
      password: "Admin123!",
    });
    console.log("✅ Login successful!");
    console.log("Token:", response.data.token.substring(0, 30) + "...");
  } catch (error) {
    console.log("❌ Login failed!");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Error:", error.response.data);
    } else {
      console.log("Error:", error.message);
    }
  }
}

testLogin();
