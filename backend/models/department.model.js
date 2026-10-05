const mongoose = require("mongoose");

const Department = new mongoose.Schema(
  {
    departmentId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", Department);
