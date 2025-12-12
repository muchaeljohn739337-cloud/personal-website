import request from "supertest";
import { Express } from "express";
import { TEST_CREDENTIALS } from "../fixtures/testData";

/**
 * Helper to get JWT token for testing protected routes
 */
export async function getAuthToken(
  app: Express,
  userType: "admin" | "user" = "user"
): Promise<string> {
  const credentials = TEST_CREDENTIALS[userType];

  const response = await request(app).post("/api/auth/login").send({
    email: credentials.email,
    password: credentials.password,
  });

  if (response.status !== 200) {
    throw new Error(
      `Failed to get auth token for ${userType}: ${
        response.status
      } ${JSON.stringify(response.body)}`
    );
  }

  return response.body.token || response.body.accessToken;
}

/**
 * Helper to make authenticated requests
 */
export async function authenticatedRequest(
  app: Express,
  method: "get" | "post" | "put" | "delete" | "patch",
  path: string,
  userType: "admin" | "user" = "user",
  body?: any
) {
  const token = await getAuthToken(app, userType);

  let req = request(app)[method](path).set("Authorization", `Bearer ${token}`);

  if (body) {
    req = req.send(body);
  }

  return req;
}

/**
 * Create a test user and return token
 */
export async function createTestUserAndGetToken(
  app: Express,
  userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }
): Promise<{ user: any; token: string }> {
  const registerRes = await request(app)
    .post("/api/auth/register")
    .send({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName || "Test",
      lastName: userData.lastName || "User",
    });

  if (registerRes.status !== 201 && registerRes.status !== 200) {
    throw new Error(
      `Failed to create test user: ${registerRes.status} ${JSON.stringify(
        registerRes.body
      )}`
    );
  }

  const loginRes = await request(app).post("/api/auth/login").send({
    email: userData.email,
    password: userData.password,
  });

  if (loginRes.status !== 200) {
    throw new Error(
      `Failed to login test user: ${loginRes.status} ${JSON.stringify(
        loginRes.body
      )}`
    );
  }

  return {
    user: loginRes.body.user,
    token: loginRes.body.token || loginRes.body.accessToken,
  };
}
