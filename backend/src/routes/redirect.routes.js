const express = require("express");
const redirect = require("../controllers/redirect.controller");

const router = express.Router();

router.get("/:code", redirect.follow);

module.exports = router;
