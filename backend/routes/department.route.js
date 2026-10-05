const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const {
  getDepartmentController,
  addDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
} = require("../controllers/department.controller");

router.get("/", auth, getDepartmentController);
router.post("/", auth, addDepartmentController);
router.patch("/:id", auth, updateDepartmentController);
router.delete("/:id", auth, deleteDepartmentController);

module.exports = router;
