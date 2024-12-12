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
  console.log(index);
  let email = generateEmail(index);

  // GraphQL mutation query
  let query = `
  mutation Register($email: String!) {
    demo_register(email: $email) {
        data
        message
        status
    }
}
`;

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

  console.log(res.body);
  // Check the response 
  check(res, {
    "Status is 200": (r) => r.status == 200,
    "Response body contain message": (r) => r.body.includes("message"),
    "Response message is correct": (r) => r.body.includes('Create successfully')
  });

  // Add a sleep to simulate time between requests
  sleep(1);
}

// Teardown function to save data to a JSON file
export function teardown(data) {
}
