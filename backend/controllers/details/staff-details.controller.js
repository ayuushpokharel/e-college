const staffDetails = require("../../models/details/staff-details.model");
const resetToken = require("../../models/reset-password.model");
const bcrypt = require("bcryptjs");
const ApiResponse = require("../../utils/ApiResponse");
const jwt = require("jsonwebtoken");
const sendResetMail = require("../../utils/SendMail");

const loginStaffController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await staffDetails.findOne({ email });

    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return ApiResponse.unauthorized("Invalid password").send(res);
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return ApiResponse.success({ token }, "Login successful").send(res);
  } catch (error) {
    console.error("Login Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getAllStaffController = async (req, res) => {
  try {
    const users = await staffDetails.find().select("-__v -password");
    if (!users || users.length === 0) {
      return ApiResponse.notFound("No Staff Found").send(res);
    }
    return ApiResponse.success(users, "Staff Details Found!").send(res);
  } catch (error) {
    console.error("Get All Staff Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const generateEmployeeId = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const registerStaffController = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const profile = req.file.filename;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ApiResponse.badRequest("Invalid email format").send(res);
    }

    if (!/^\d{10}$/.test(phone)) {
      return ApiResponse.badRequest("Phone number must be 10 digits").send(res);
    }

    const existing = await staffDetails.findOne({
      $or: [{ phone }, { email }],
    });
    if (existing) {
      return ApiResponse.conflict(
        "Staff with these details already exists"
      ).send(res);
    }

    const employeeId = generateEmployeeId();

    const user = await staffDetails.create({
      ...req.body,
      employeeId,
      profile,
      password: "staff123",
    });

    const sanitizedUser = await staffDetails
      .findById(user._id)
      .select("-__v -password");
    return ApiResponse.created(
      sanitizedUser,
      "Staff Registered Successfully!"
    ).send(res);
  } catch (error) {
    console.error("Register Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateStaffController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.badRequest("Staff ID is required").send(res);
    }

    const updateData = { ...req.body };
    const { email, phone, password } = updateData;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ApiResponse.badRequest("Invalid email format").send(res);
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return ApiResponse.badRequest("Phone number must be 10 digits").send(res);
    }

    if (password && password.length < 8) {
      return ApiResponse.badRequest(
        "Password must be at least 8 characters"
      ).send(res);
    }

    if (email) {
      const existing = await staffDetails.findOne({
        _id: { $ne: req.params.id },
        email,
      });
      if (existing) {
        return ApiResponse.conflict("Email already in use").send(res);
      }
    }

    if (phone) {
      const existing = await staffDetails.findOne({
        _id: { $ne: req.params.id },
        phone,
      });
      if (existing) {
        return ApiResponse.conflict("Phone number already in use").send(res);
      }
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      updateData.profile = req.file.filename;
    }

    if (updateData.dob) updateData.dob = new Date(updateData.dob);
    if (updateData.joiningDate)
      updateData.joiningDate = new Date(updateData.joiningDate);

    const updatedUser = await staffDetails
      .findByIdAndUpdate(req.params.id, updateData, { new: true })
      .select("-__v -password");

    if (!updatedUser) {
      return ApiResponse.notFound("Staff not found").send(res);
    }

    return ApiResponse.success(updatedUser, "Updated Successfully!").send(res);
  } catch (error) {
    console.error("Update Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteStaffController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.badRequest("Staff ID is required").send(res);
    }

    const user = await staffDetails.findByIdAndDelete(req.params.id);
    if (!user) {
      return ApiResponse.notFound("No Staff Found").send(res);
    }

    return ApiResponse.success(null, "Deleted Successfully!").send(res);
  } catch (error) {
    console.error("Delete Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getMyStaffDetailsController = async (req, res) => {
  try {
    const user = await staffDetails
      .findById(req.userId)
      .select("-__v -password");
    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }
    return ApiResponse.success(user, "My Details Found!").send(res);
  } catch (error) {
    console.error("My Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const sendStaffResetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return ApiResponse.badRequest("Email is required").send(res);
    }

    const user = await staffDetails.findOne({ email });
    if (!user) {
      return ApiResponse.notFound("No Staff Found").send(res);
    }

    const resetTkn = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    await resetToken.deleteMany({ type: "StaffDetails", userId: user._id });

    const resetId = await resetToken.create({
      resetToken: resetTkn,
      type: "StaffDetails",
      userId: user._id,
    });

    await sendResetMail(user.email, resetId._id, "staff");

    return ApiResponse.success(null, "Reset Mail Sent Successfully").send(res);
  } catch (error) {
    console.error("Forgot Password Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateStaffPasswordHandler = async (req, res) => {
  try {
    const { resetId } = req.params;
    const { password } = req.body;

    if (!resetId || !password) {
      return ApiResponse.badRequest("Password and ResetId are required").send(
        res
      );
    }

    const resetTkn = await resetToken.findById(resetId);
    if (!resetTkn) {
      return ApiResponse.notFound("No Reset Request Found").send(res);
    }

    const verifyToken = jwt.verify(resetTkn.resetToken, process.env.JWT_SECRET);
    if (!verifyToken) {
      return ApiResponse.unauthorized("Token Expired or Invalid").send(res);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await staffDetails.findByIdAndUpdate(verifyToken._id, {
      password: hashedPassword,
    });

    await resetToken.deleteMany({
      type: "StaffDetails",
      userId: verifyToken._id,
    });

    return ApiResponse.success(null, "Password Updated Successfully!").send(
      res
    );
  } catch (error) {
    console.error("Password Update Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateLoggedInPasswordController = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return ApiResponse.badRequest(
        "Current password and new password are required"
      ).send(res);
    }

    if (newPassword.length < 8) {
      return ApiResponse.badRequest(
        "New password must be at least 8 characters long"
      ).send(res);
    }

    const user = await staffDetails.findById(userId);
    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return ApiResponse.unauthorized("Current password is incorrect").send(
        res
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await staffDetails.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    return ApiResponse.success(null, "Password updated successfully").send(res);
  } catch (error) {
    console.error("Update Password Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  loginStaffController,
  registerStaffController,
  updateStaffController,
  deleteStaffController,
  getAllStaffController,
  getMyStaffDetailsController,
  sendStaffResetPasswordEmail,
  updateStaffPasswordHandler,
  updateLoggedInPasswordController,
};
