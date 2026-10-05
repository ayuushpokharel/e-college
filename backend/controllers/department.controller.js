const Department = require("../models/department.model");
const ApiResponse = require("../utils/ApiResponse");

const getDepartmentController = async (req, res, next) => {
  try {
    const { search = "" } = req.query;

    const departmentes = await Department.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { departmentId: { $regex: search, $options: "i" } },
      ],
    });
    if (!departmentes || departmentes.length === 0) {
      return ApiResponse.error("No Departmentes Found", 404).send(res);
    }

    return ApiResponse.success(departmentes, "All Departmentes Loaded!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const addDepartmentController = async (req, res, next) => {
  let { name, departmentId } = req.body;
  try {
    let existingDepartment = await Department.findOne({
      $or: [{ name }, { departmentId }],
    });

    if (existingDepartment) {
      return ApiResponse.error(
        "Department with this name or ID already exists!",
        409
      ).send(res);
    }

    const newDepartment = await Department.create(req.body);
    return ApiResponse.created(newDepartment, "Department Added Successfully!").send(
      res
    );
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const updateDepartmentController = async (req, res, next) => {
  try {
    const { name, departmentId } = req.body;

    if (name || departmentId) {
      const existingDepartment = await Department.findOne({
        _id: { $ne: req.params.id },
        $or: [{ name: name || undefined }, { departmentId: departmentId || undefined }],
      });

      if (existingDepartment) {
        return ApiResponse.error(
          "Department with this name or ID already exists!",
          409
        ).send(res);
      }
    }

    let department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!department) {
      return ApiResponse.error("Department Not Found!", 404).send(res);
    }

    return ApiResponse.success(department, "Department Updated Successfully!").send(
      res
    );
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const deleteDepartmentController = async (req, res, next) => {
  try {
    let department = await Department.findById(req.params.id);
    if (!department) {
      return ApiResponse.error("Department Not Found!", 404).send(res);
    }

    await Department.findByIdAndDelete(req.params.id);
    return ApiResponse.success(null, "Department Deleted Successfully!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

module.exports = {
  getDepartmentController,
  addDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
};
