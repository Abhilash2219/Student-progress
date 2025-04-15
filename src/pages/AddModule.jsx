import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/ModuleForm.css";
import Navbar from "../components/Navbar";

const AddModule = () => {
  const [companyCode, setCompanyCode] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseList, setCourseList] = useState([]);
  const [newCourseId, setNewCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [modules, setModules] = useState([]);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const navigate = useNavigate();

  // Load company code
  useEffect(() => {
    const code = localStorage.getItem("companyCode") || localStorage.getItem("orgCode");
    if (code) {
      setCompanyCode(code);
    } else {
      navigate("/");
    }
  }, [navigate]);

  // Fetch available courses for dropdown
  useEffect(() => {
    if (!companyCode) return;
    const courseRef = collection(db, "CorporateClients", companyCode, "programInfo");
    const unsubscribe = onSnapshot(courseRef, (snapshot) => {
      const courses = snapshot.docs.map((doc) => doc.id);
      setCourseList(courses);
    });
    return () => unsubscribe();
  }, [companyCode]);

  // Fetch modules for selected course
  useEffect(() => {
    if (!companyCode || !courseId) return;
    const moduleRef = collection(
      db,
      "CorporateClients",
      companyCode,
      "programInfo",
      courseId,
      "modules"
    );

    const unsubscribe = onSnapshot(moduleRef, (snapshot) => {
      const moduleList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setModules(moduleList);
    });

    return () => unsubscribe();
  }, [companyCode, courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseId.trim() || (!editingModuleId && moduleId.trim() === "")) {
      alert("Please select Course and Module ID.");
      return;
    }

    try {
      const moduleDocRef = doc(
        db,
        "CorporateClients",
        companyCode,
        "programInfo",
        courseId,
        "modules",
        editingModuleId || moduleId
      );

      if (!editingModuleId) {
        const existingDoc = await getDoc(moduleDocRef);
        if (existingDoc.exists()) {
          alert("Module with this ID already exists.");
          return;
        }
      }

      await setDoc(moduleDocRef, {
        name: moduleName,
        startDate,
        endDate,
        description,
        status,
      });

      alert(editingModuleId ? "Module updated!" : "Module added!");
      resetForm();
    } catch (error) {
      console.error("Save error:", error);
      alert("Something went wrong.");
    }
  };

  const handleEditClick = (module) => {
    setModuleId(module.id);
    setModuleName(module.name);
    setStartDate(module.startDate);
    setEndDate(module.endDate);
    setDescription(module.description);
    setStatus(module.status || "In Progress");
    setEditingModuleId(module.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this module?")) {
      try {
        await deleteDoc(
          doc(db, "CorporateClients", companyCode, "programInfo", courseId, "modules", id)
        );
        if (editingModuleId === id) resetForm();
        alert("Module deleted.");
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete.");
      }
    }
  };

  const resetForm = () => {
    setModuleId("");
    setModuleName("");
    setStartDate("");
    setEndDate("");
    setDescription("");
    setStatus("In Progress");
    setEditingModuleId(null);
  };

  const handleAddCourse = async () => {
    if (!newCourseId.trim()) {
      alert("Enter a Course ID.");
      return;
    }

    try {
      const courseRef = doc(db, "CorporateClients", companyCode, "programInfo", newCourseId);
      const existing = await getDoc(courseRef);

      if (existing.exists()) {
        alert("Course already exists.");
        return;
      }

      await setDoc(courseRef, { createdAt: new Date().toISOString() });
      alert("Course added successfully!");
      setNewCourseId("");
    } catch (err) {
      console.error("Course add error:", err);
      alert("Failed to add course.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="module-layout">
        <div className="module-list">
          <h3>Existing Modules</h3>

          {/* Course dropdown in module list */}
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="dropdown"
          >
            <option value="">-- Select Course --</option>
            {courseList.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>

          {/* Add new course input */}
          <div className="add-course-top">
            <input
              type="text"
              placeholder="New Course ID"
              value={newCourseId}
              onChange={(e) => setNewCourseId(e.target.value)}
            />
            <button onClick={handleAddCourse}>+ Add Course</button>
          </div>


          {modules.map((module) => (
            <div
              key={module.id}
              className={`module-card ${editingModuleId === module.id ? "active" : ""}`}
              onClick={() => handleEditClick(module)}
            >
              <h4>{module.name}</h4>
              
              <button onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }}>
                Delete
              </button>
            </div>
          ))}
        </div>

        <div className="module-form-container">
          <h2>{editingModuleId ? "Edit Module" : "Add Module"}</h2>

          {editingModuleId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                marginBottom: "1rem",
                backgroundColor: "#f44336",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              + Add New Module
            </button>
          )}

          <form onSubmit={handleSubmit} className="module-form">
            {/* Course dropdown in form */}
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
            >
              <option value="">-- Select Course --</option>
              {courseList.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>

            {!editingModuleId && (
              <input
                type="text"
                placeholder="Module ID (e.g., M01)"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                required
              />
            )}
            <input
              type="text"
              placeholder="Module Name"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              required
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button type="submit">
              {editingModuleId ? "Update Module" : "Add Module"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddModule;
