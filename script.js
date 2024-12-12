import http from "k6/http";
import { check, sleep } from "k6";

// Base URL for the GraphQL endpoint
const BASE_URL = "http://13.228.115.252:8095/v1/graphql";

// Read the variables from json file
const VARIABLES = JSON.parse(open("./variables.json"));

// Function to generate unique email addresses
function generateEmail(index) {
  return `user${index}@example.com`;
}

export let options = {
  scenarios: {
    contacts: {
      executor: "per-vu-iterations",
      vus: 10,
      iterations: 1,
    },
  },
};

// Setup function
export function setup() {
  return [];
}

// Default function for the test
export default function (data) {
  let index = __VU;
  let email = generateEmail(index);

  // Step 1: Perform the login mutation to get the access token
  let loginQuery = `
  mutation Login($email: String!) {
  demo_login(email: $email) {
    data
    message
    status
  }
}
  `;

  let loginRes = http.post(
    BASE_URL,
    JSON.stringify({ query: loginQuery, variables: { email: email } }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // Check the response of login
  check(loginRes, {
    "Login Status is 200": (r) => r.status == 200,
  });

  // Parse the response to get the access token
  let loginResponse = JSON.parse(loginRes.body);
  //   console.log(loginResponse);
  let accessToken = loginResponse.data.demo_login.data.accessToken;

  // Step 2: Perform the createCfdOrder mutation using the access token
  let orderQuery = `
  mutation createCfdOrder(
    $asset: String!
    $leverage: Float!
    $pending_price: Float
    $quantity: Float!
    $stop_loss_pip: Float
    $take_profit_pip: Float
    $tournament_id: uuid!
    $type: Int = 2
    $product_type: Int!
    $price_object: PriceObjectData!
) {
    create_forex_order(
        asset: $asset
        leverage: $leverage
        quantity: $quantity
        tournament_id: $tournament_id
        type: $type
        stop_loss_pip: $stop_loss_pip
        take_profit_pip: $take_profit_pip
        pending_price: $pending_price
        product_type: $product_type
        price_object: $price_object
    ) {
        data
        message
        status
        __typename
    }
}
  `;

  let orderRes = http.post(
    BASE_URL,
    JSON.stringify({ query: orderQuery, variables: VARIABLES }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  // Check the response of create order
  check(orderRes, {
    "Order Status is 200": (r) => r.status == 200,
    "Order Response contains message": (r) => r.body.includes("message"),
    "Order Response message is correct": (r) =>
      r.body.includes("Handle success"),
  });

  let createOrderResponse = JSON.parse(orderRes.body);
  let orderId = createOrderResponse.data.create_forex_order.data.id;

  // Wait for 70 seconds
  sleep(70);

  // Step 3: Perform the closePendingCfdOrder mutation
  let closeOrderQuery = `
  mutation closePendingCfdOrder($id: uuid!, $tournament_id: uuid!, $product_type: Int!) {
  close_pending_order(
    id: $id
    tournament_id: $tournament_id
    product_type: $product_type
  ) {
    data
    message
    status
    __typename
  }
}
  `;

  let closeOrderRes = http.post(
    BASE_URL,
    JSON.stringify({
      query: closeOrderQuery,
      variables: {
        id: orderId,
        tournament_id: VARIABLES.tournament_id,
        product_type: VARIABLES.product_type,
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  // Check the response of close order
  check(closeOrderRes, {
    "Close Order Status is 200": (r) => r.status == 200,
    "Close Order Response contains message": (r) => r.body.includes("message"),
    "Close Order Response message is correct": (r) =>
      r.body.includes("Handle success"),
  });

  let closeOrderResponse = JSON.parse(closeOrderRes.body);
  console.log("Account ", email, "with data of order: ", closeOrderResponse);

  // Add a sleep to simulate time between requests
  sleep(1);
}

// Teardown function to save data to a JSON file
export function teardown(data) {
  //   let file = "order_profit_loss.json";
  //   write(file, JSON.stringify(data, null, 2));
}
