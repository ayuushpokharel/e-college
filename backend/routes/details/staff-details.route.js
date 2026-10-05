const express = require("express");
const router = express.Router();
const {
  loginStaffController,
  registerStaffController,
  updateStaffController,
  deleteStaffController,
  getAllStaffController,
  getMyStaffDetailsController,
  sendStaffResetPasswordEmail,
  updateStaffPasswordHandler,
  updateLoggedInPasswordController,
} = require("../../controllers/details/staff-details.controller");
const upload = require("../../middlewares/multer.middleware");
const auth = require("../../middlewares/auth.middleware");

router.post("/register", upload.single("file"), registerStaffController);
router.post("/login", loginStaffController);
router.get("/my-details", auth, getMyStaffDetailsController);

router.get("/", auth, getAllStaffController);
router.patch("/:id", auth, upload.single("file"), updateStaffController);
router.delete("/:id", auth, deleteStaffController);
router.post("/forget-password", sendStaffResetPasswordEmail);
router.post("/update-password/:resetId", updateStaffPasswordHandler);
router.post("/change-password", auth, updateLoggedInPasswordController);

module.exports = router;
