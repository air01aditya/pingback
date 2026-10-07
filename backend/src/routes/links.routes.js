const express = require("express");
const links = require("../controllers/links.controller");

const router = express.Router();

router.get("/", links.list);
router.get("/:id", links.getOne);
router.post("/", links.create);
router.delete("/:id", links.remove);

module.exports = router;
