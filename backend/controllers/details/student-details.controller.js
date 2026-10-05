const studentDetails = require("../../models/details/student-details.model");
const Department = require("../../models/department.model");
const resetToken = require("../../models/reset-password.model");
const bcrypt = require("bcryptjs");
const ApiResponse = require("../../utils/ApiResponse");
const jwt = require("jsonwebtoken");
const sendResetMail = require("../../utils/SendMail");

const loginStudentController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await studentDetails.findOne({ email });

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

const getAllDetailsController = async (req, res) => {
  try {
    const users = await studentDetails
      .find()
      .select("-__v -password")
      .populate("departmentId");

    if (!users || users.length === 0) {
      return ApiResponse.notFound("No Student Found").send(res);
    }

    return ApiResponse.success(users, "Student Details Found!").send(res);
  } catch (error) {
    console.error("Get Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const registerStudentController = async (req, res) => {
  try {
    const profile = req.file.filename;

    if (!req.body.departmentId) {
      return ApiResponse.badRequest("Department is required").send(res);
    }

    const department = await Department.findById(req.body.departmentId);
    if (!department) {
      return ApiResponse.badRequest("Invalid department selected").send(res);
    }

    const departmentCode = parseInt(department.departmentId, 10);
    if (isNaN(departmentCode) || departmentCode <= 0) {
      return ApiResponse.badRequest(
        `Department ID "${department.departmentId}" must be a positive number to auto-generate enrollment numbers`,
      ).send(res);
    }

    // e.g. department code 1 -> enrollment numbers 101-199, department code 2 -> 201-299
    const rangeStart = departmentCode * 100;
    const rangeEnd = rangeStart + 99;

    const MAX_ATTEMPTS = 5;
    let user = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const lastStudent = await studentDetails
        .findOne({ enrollmentNo: { $gte: rangeStart, $lte: rangeEnd } })
        .sort({ enrollmentNo: -1 });

      const nextSequence = lastStudent
        ? lastStudent.enrollmentNo - rangeStart + 1
        : 1;

      if (nextSequence > 99) {
        return ApiResponse.conflict(
          `Department "${department.name}" has reached its maximum of 99 students under the current enrollment number scheme`,
        ).send(res);
      }

      const enrollmentNo = rangeStart + nextSequence;
      const email = `${enrollmentNo}@gmail.com`;

      try {
        user = await studentDetails.create({
          ...req.body,
          profile,
          password: "student123",
          email,
          enrollmentNo,
        });
        break;
      } catch (error) {
        // 11000 = MongoDB duplicate key error - someone else grabbed this
        // number concurrently; loop again and pick the next one
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    if (!user) {
      return ApiResponse.conflict(
        "Could not generate a unique enrollment number, please try again",
      ).send(res);
    }

    const sanitizedUser = await studentDetails
      .findById(user._id)
      .select("-__v -password");

    return ApiResponse.created(sanitizedUser, "Student Details Added!").send(
      res,
    );
  } catch (error) {
    console.error("Add Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getMyDetailsController = async (req, res) => {
  try {
    const user = await studentDetails
      .findById(req.userId)
      .select("-password -__v")
      .populate("departmentId");

    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    return ApiResponse.success(user, "My Details Found!").send(res);
  } catch (error) {
    console.error("Get My Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateDetailsController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.badRequest("Student ID is required").send(res);
    }

    const updateData = { ...req.body };
    const { email, phone, password, enrollmentNo } = updateData;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ApiResponse.badRequest("Invalid email format").send(res);
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return ApiResponse.badRequest("Phone number must be 10 digits").send(res);
    }

    if (password && password.length < 8) {
      return ApiResponse.badRequest(
        "Password must be at least 8 characters long",
      ).send(res);
    }

    if (phone) {
      const existingStudent = await studentDetails.findOne({
        _id: { $ne: req.params.id },
        phone: phone,
      });

      if (existingStudent) {
        return ApiResponse.conflict("Phone number already in use").send(res);
      }
    }

    if (email) {
      const existingStudent = await studentDetails.findOne({
        _id: { $ne: req.params.id },
        email: email,
      });

      if (existingStudent) {
        return ApiResponse.conflict("Email already in use").send(res);
      }
    }

    if (enrollmentNo) {
      const existingStudent = await studentDetails.findOne({
        _id: { $ne: req.params.id },
        enrollmentNo: enrollmentNo,
      });

      if (existingStudent) {
        return ApiResponse.conflict("Enrollment number already in use").send(
          res,
        );
      }
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      updateData.profile = req.file.filename;
    }

    if (updateData.dob) {
      updateData.dob = new Date(updateData.dob);
    }
    if (updateData.joiningDate) {
      updateData.joiningDate = new Date(updateData.joiningDate);
    }

    const updatedUser = await studentDetails
      .findByIdAndUpdate(req.params.id, updateData, { new: true })
      .select("-__v -password");

    if (!updatedUser) {
      return ApiResponse.notFound("Student not found").send(res);
    }

    return ApiResponse.success(updatedUser, "Updated Successfully!").send(res);
  } catch (error) {
    console.error("Update Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteDetailsController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.badRequest("Student ID is required").send(res);
    }

    const user = await studentDetails.findById(req.params.id);

    if (!user) {
      return ApiResponse.notFound("No Student Found").send(res);
    }

    await studentDetails.findByIdAndDelete(req.params.id);

    return ApiResponse.success(null, "Deleted Successfully!").send(res);
  } catch (error) {
    console.error("Delete Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const sendForgetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return ApiResponse.badRequest("Email is required").send(res);
    }

    const user = await studentDetails.findOne({ email });

    if (!user) {
      return ApiResponse.notFound("No Student Found").send(res);
    }
    const resetTkn = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      },
    );

    await resetToken.deleteMany({
      type: "StudentDetails",
      userId: user._id,
    });

    const resetId = await resetToken.create({
      resetToken: resetTkn,
      type: "StudentDetails",
      userId: user._id,
    });

    await sendResetMail(user.email, resetId._id, "student");

    return ApiResponse.success(null, "Reset Mail Send Successful").send(res);
  } catch (error) {
    console.error("Send Reset Mail Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updatePasswordHandler = async (req, res) => {
  try {
    const { resetId } = req.params;
    const { password } = req.body;
    if (!resetId || !password) {
      return ApiResponse.badRequest("Password and ResetId is Required").send(
        res,
      );
    }

    const resetTkn = await resetToken.findById(resetId);

    if (!resetTkn) {
      return ApiResponse.notFound("No Reset Request Found").send(res);
    }

    const verifyToken = await jwt.verify(
      resetTkn.resetToken,
      process.env.JWT_SECRET,
    );

    if (!verifyToken) {
      return ApiResponse.notFound("Token Expired").send(res);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await studentDetails.findByIdAndUpdate(verifyToken._id, {
      password: hashedPassword,
    });

    await resetToken.deleteMany({
      type: "StudentDetails",
      userId: verifyToken._id,
    });

    return ApiResponse.success(null, "Password Updated!").send(res);
  } catch (error) {
    console.error("Update Password Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const searchStudentsController = async (req, res) => {
  try {
    const { enrollmentNo, name, semester, department } = req.body;
    let query = {};

    if (!enrollmentNo && !name && !semester && !department) {
      return ApiResponse.badRequest("Select at least one filter").send(res);
    }

    if (enrollmentNo) {
      query.enrollmentNo = enrollmentNo;
    }

    if (name) {
      const nameWords = name.trim().split(/\s+/).filter(Boolean);
      query.$and = nameWords.map((word) => {
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return {
          $or: [
            { firstName: { $regex: escapedWord, $options: "i" } },
            { middleName: { $regex: escapedWord, $options: "i" } },
            { lastName: { $regex: escapedWord, $options: "i" } },
          ],
        };
      });
    }

    if (semester) {
      query.semester = semester;
    }

    if (department) {
      query.departmentId = department;
    }

    const students = await studentDetails
      .find(query)
      .select("-password -__v")
      .populate("departmentId")
      .sort({ enrollmentNo: 1 });

    if (!students || students.length === 0) {
      return ApiResponse.notFound("No students found").send(res);
    }

    return ApiResponse.success(students, "Students found successfully").send(
      res,
    );
  } catch (error) {
    console.error("Search Students Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateLoggedInPasswordController = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return ApiResponse.badRequest(
        "Current password and new password are required",
      ).send(res);
    }

    if (newPassword.length < 8) {
      return ApiResponse.badRequest(
        "New password must be at least 8 characters long",
      ).send(res);
    }

    const user = await studentDetails.findById(userId);
    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return ApiResponse.unauthorized("Current password is incorrect").send(
        res,
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await studentDetails.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    return ApiResponse.success(null, "Password updated successfully").send(res);
  } catch (error) {
    console.error("Update Password Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  loginStudentController,
  getAllDetailsController,
  registerStudentController,
  updateDetailsController,
  deleteDetailsController,
  getMyDetailsController,
  sendForgetPasswordEmail,
  updatePasswordHandler,
  searchStudentsController,
  updateLoggedInPasswordController,
};
