const mongoose = require("mongoose");

const TimeTable = new mongoose.Schema(
  {
    link: {
      type: String,
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", TimeTable);
