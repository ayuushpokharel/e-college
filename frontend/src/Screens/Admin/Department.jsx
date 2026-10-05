import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { MdOutlineDelete, MdEdit } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import axiosWrapper from "../../utils/AxiosWrapper";
import Heading from "../../components/Heading";
import DeleteConfirm from "../../components/DeleteConfirm";
import CustomButton from "../../components/CustomButton";
import Loading from "../../components/Loading";

const Department = () => {
  const [data, setData] = useState({
    name: "",
    departmentId: "",
  });
  const [department, setDepartment] = useState();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    getDepartmentHandler();
  }, []);

  const getDepartmentHandler = async () => {
    setDataLoading(true);
    try {
      const response = await axiosWrapper.get(`/department`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      if (response.data.success) {
        setDepartment(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setDepartment([]);
        return;
      }
      console.error(error);
      toast.error(error.response?.data?.message || "Error fetching departmentes");
    } finally {
      setDataLoading(false);
    }
  };

  const addDepartmentHandler = async () => {
    if (!data.name || !data.departmentId) {
      toast.dismiss();
      toast.error("Please fill all the fields");
      return;
    }
    try {
      toast.loading(isEditing ? "Updating Department" : "Adding Department");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      };
      let response;
      if (isEditing) {
        response = await axiosWrapper.patch(
          `/department/${selectedDepartmentId}`,
          data,
          {
            headers: headers,
          }
        );
      } else {
        response = await axiosWrapper.post(`/department`, data, {
          headers: headers,
        });
      }
      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        setData({ name: "", departmentId: "" });
        setShowAddForm(false);
        setIsEditing(false);
        setSelectedDepartmentId(null);
        getDepartmentHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const deleteDepartmentHandler = async (id) => {
    setIsDeleteConfirmOpen(true);
    setSelectedDepartmentId(id);
  };

  const editDepartmentHandler = (department) => {
    setData({
      name: department.name,
      departmentId: department.departmentId,
    });
    setSelectedDepartmentId(department._id);
    setIsEditing(true);
    setShowAddForm(true);
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Deleting Department");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      };
      const response = await axiosWrapper.delete(
        `/department/${selectedDepartmentId}`,
        {
          headers: headers,
        }
      );
      toast.dismiss();
      if (response.data.success) {
        toast.success("Department has been deleted successfully");
        setIsDeleteConfirmOpen(false);
        getDepartmentHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10 relative">
      <Heading title="Department Details" />
      <CustomButton
        onClick={() => {
          setShowAddForm(!showAddForm);
          if (!showAddForm) {
            setData({ name: "", departmentId: "" });
            setIsEditing(false);
            setSelectedDepartmentId(null);
          }
        }}
        className="fixed bottom-8 right-8 !rounded-full !p-4"
      >
        {showAddForm ? (
          <IoMdClose className="text-3xl" />
        ) : (
          <IoMdAdd className="text-3xl" />
        )}
      </CustomButton>

      {dataLoading && <Loading />}

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-[500px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {isEditing ? "Edit Department" : "Add New Department"}
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <IoMdClose className="text-3xl" />
              </button>
            </div>

            <form onSubmit={addDepartmentHandler} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Department Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="departmentId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Department ID
                </label>
                <input
                  type="text"
                  id="departmentId"
                  value={data.departmentId}
                  onChange={(e) =>
                    setData({ ...data, departmentId: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <CustomButton
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </CustomButton>
                <CustomButton variant="primary" onClick={addDepartmentHandler}>
                  {isEditing ? "Update" : "Add"}
                </CustomButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {!dataLoading && (
        <div className="mt-8 w-full">
          <table className="text-sm min-w-full bg-white">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="py-4 px-6 text-left font-semibold">
                  Department Name
                </th>
                <th className="py-4 px-6 text-left font-semibold">Department ID</th>
                <th className="py-4 px-6 text-left font-semibold">
                  Created At
                </th>
                <th className="py-4 px-6 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {department && department.length > 0 ? (
                department.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-blue-50">
                    <td className="py-4 px-6">{item.name}</td>
                    <td className="py-4 px-6">{item.departmentId}</td>
                    <td className="py-4 px-6">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-center flex justify-center gap-4">
                      <CustomButton
                        variant="secondary"
                        className="!p-2"
                        onClick={() => editDepartmentHandler(item)}
                      >
                        <MdEdit />
                      </CustomButton>
                      <CustomButton
                        variant="danger"
                        className="!p-2"
                        onClick={() => deleteDepartmentHandler(item._id)}
                      >
                        <MdOutlineDelete />
                      </CustomButton>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-base pt-10">
                    No departmentes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Are you sure you want to delete this department?"
      />
    </div>
  );
};

export default Department;
