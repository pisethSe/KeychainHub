const axios = require("axios");

const API_BASE = "http://localhost:5001";

async function testAuth() {
  try {
    console.log("Testing Register endpoint...");
    const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, {
      name: "Test User",
      email: `test_${Date.now()}@example.com`,
      password: "password123",
    });

    console.log("Register Response:", {
      status: registerResponse.status,
      hasToken: !!registerResponse.data.data.token,
      tokenLength: registerResponse.data.data.token?.length,
      user: registerResponse.data.data.user,
    });

    console.log("\nTesting Login endpoint...");
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: "admin@keychain.com",
      password: "admin123",
    });

    console.log("Login Response:", {
      status: loginResponse.status,
      hasToken: !!loginResponse.data.data.token,
      tokenLength: loginResponse.data.data.token?.length,
      user: loginResponse.data.data.user,
    });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testAuth();
