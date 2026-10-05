const Material = require("../models/material.model");
const ApiResponse = require("../utils/ApiResponse");

const getMaterialsController = async (req, res) => {
  try {
    const { subject, staff, semester, department, type } = req.query;
    let query = {};

    if (subject) query.subject = subject;
    if (staff) query.staff = staff;
    if (semester) query.semester = semester;
    if (department) query.department = department;
    if (type) query.type = type;

    const materials = await Material.find(query)
      .populate("subject")
      .populate("staff")
      .populate("department")
      .sort({ createdAt: -1 });

    if (!materials || materials.length === 0) {
      return ApiResponse.notFound("No materials found").send(res);
    }

    return ApiResponse.success(
      materials,
      "Materials retrieved successfully"
    ).send(res);
  } catch (error) {
    console.error("Get Materials Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addMaterialController = async (req, res) => {
  try {
    const { title, subject, semester, department, type } = req.body;

    if (!title || !subject || !semester || !department || !type) {
      return ApiResponse.badRequest("All fields are required").send(res);
    }

    if (!req.file) {
      return ApiResponse.badRequest("Material file is required").send(res);
    }

    if (!["notes", "assignment", "syllabus", "other"].includes(type)) {
      return ApiResponse.badRequest("Invalid material type").send(res);
    }

    const material = await Material.create({
      title,
      subject,
      staff: req.userId, // From auth middleware
      semester,
      department,
      type,
      file: req.file.filename,
    });

    const populatedMaterial = await Material.findById(material._id)
      .populate("subject")
      .populate("staff")
      .populate("department");

    return ApiResponse.created(
      populatedMaterial,
      "Material added successfully"
    ).send(res);
  } catch (error) {
    console.error("Add Material Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateMaterialController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, semester, department, type } = req.body;

    if (!id) {
      return ApiResponse.badRequest("Material ID is required").send(res);
    }

    const material = await Material.findById(id);

    if (!material) {
      return ApiResponse.notFound("Material not found").send(res);
    }

    if (material.staff.toString() !== req.userId) {
      return ApiResponse.unauthorized(
        "You are not authorized to update this material"
      ).send(res);
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (subject) updateData.subject = subject;
    if (semester) updateData.semester = semester;
    if (department) updateData.department = department;
    if (type) {
      if (!["notes", "assignment", "syllabus", "other"].includes(type)) {
        return ApiResponse.badRequest("Invalid material type").send(res);
      }
      updateData.type = type;
    }
    if (req.file) updateData.file = req.file.filename;

    const updatedMaterial = await Material.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("subject")
      .populate("staff")
      .populate("department");

    return ApiResponse.success(
      updatedMaterial,
      "Material updated successfully"
    ).send(res);
  } catch (error) {
    console.error("Update Material Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteMaterialController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return ApiResponse.badRequest("Material ID is required").send(res);
    }

    const material = await Material.findById(id);

    if (!material) {
      return ApiResponse.notFound("Material not found").send(res);
    }

    if (material.staff.toString() !== req.userId) {
      return ApiResponse.unauthorized(
        "You are not authorized to delete this material"
      ).send(res);
    }

    await Material.findByIdAndDelete(id);

    return ApiResponse.success(null, "Material deleted successfully").send(res);
  } catch (error) {
    console.error("Delete Material Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getMaterialsController,
  addMaterialController,
  updateMaterialController,
  deleteMaterialController,
};
