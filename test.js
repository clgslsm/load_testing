import http from "k6/http";
import { check, sleep } from "k6";

// Base URL for the GraphQL endpoint
const BASE_URL = "http://13.228.115.252:8095/v1/graphql";

// Read Bearer Token from file
const BEARER_TOKEN = open("./bearer_token.txt");

// Function to generate unique email addresses
function generateEmail(index) {
  return `user${index}@example.com`;
}

// Test options
export let options = {
  vus: 1,
  iterations: 10,
};

// Setup function (if needed)
export function setup() {
  return [];
}

// Default function for the test
export default function (data) {
  let index = __ITER + 20;  // __ITER is a built-in variable 
  let email = generateEmail(index);

  // GraphQL query to get user profile
  let query = `query User_profile($email: String!) {
    user_profile(where: { email: { _eq: $email } }) {
        email
        id
        updated_at
        username
    }
  }`;

  // HTTP POST request with Bearer Token
  let res = http.post(
    BASE_URL,
    JSON.stringify({ query: query, variables: { email: email } }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // Check the response 
  check(res, {
    "Status is 200": (r) => r.status == 200,
    "Response contains user_profile": (r) => r.body.includes("user_profile"),
  });

  let response = JSON.parse(res.body);
  console.log(response);
  let id = response.data.user_profile[0].id;

  query = `mutation MyMutation ($user_id: uuid!) {
  insert_demo_account(objects: {balance: "10000", tournament_id: "73578710-1353-419c-9704-17a3977d1a83", user_id: $user_id}) {
    affected_rows
  }
}`;

res = http.post(
    BASE_URL,
    JSON.stringify({ query: query, variables: { user_id: id } }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
    }
  );

  console.log(res.body);
  // Add a sleep to simulate time between requests
  sleep(1);
}

// Teardown function to save data to a JSON file
export function teardown(data) {
}
