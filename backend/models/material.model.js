const mongoose = require("mongoose");

const Material = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffDetail",
      required: true,
    },
    file: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    type: {
      type: String,
      enum: ["notes", "assignment", "syllabus", "other"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", Material);
