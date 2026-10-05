const mongoose = require("mongoose");

const ResetPassword = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "type",
    },
    type: {
      type: String,
      required: true,
      enum: ["AdminDetails", "StaffDetails", "StudentDetails"],
    },
    resetToken: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResetPassword", ResetPassword);
