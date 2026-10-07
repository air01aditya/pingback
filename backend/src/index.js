const app = require("./app");
const { port, baseUrl } = require("./config/env");

app.listen(port, () => {
  console.log(`Pingback API running on ${baseUrl}`);
});
