#!/usr/bin/env node

// Authentication Test Runner
console.log("🚀 Running Authentication Test...");

// Import and run the authentication test
const testAuth = require("./test-authentication.js");
if (typeof testAuth === "function") {
  testAuth().catch(console.error);
} else {
  console.log("Authentication test module loaded, running...");
}
