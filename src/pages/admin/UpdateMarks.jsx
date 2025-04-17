// UpdateMarks.jsx
import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc
} from "firebase/firestore";
import "./UpdateMarks.css";
import Navbar from "./Navbar";

const UpdateMarks = () => {
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [newCourseName, setNewCourseName] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [pendingStudentId, setPendingStudentId] = useState(null);

  const companyCode = localStorage.getItem("companyCode");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsCollectionRef = collection(db, "CorporateClients", companyCode, "studentInfo");
        const querySnapshot = await getDocs(studentsCollectionRef);
        const studentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsList);

        const allCoursesSet = new Set();
        studentsList.forEach(student => {
          const courseKeys = Object.keys(student.marks || {});
          courseKeys.forEach(course => allCoursesSet.add(course));
        });

        const defaultCourse = Array.from(allCoursesSet)[0] || "Course01";
        setSelectedCourse(defaultCourse);
        setCourseOptions([...allCoursesSet]);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [companyCode]);

  useEffect(() => {
    const prepareMarksData = () => {
      const updatedMarks = {};
      const moduleSet = new Set();

      students.forEach(student => {
        const courseMarks = student.marks?.[selectedCourse] || {};
        updatedMarks[student.id] = {};

        Object.entries(courseMarks).forEach(([mod, values]) => {
          if (mod === "comments") {
            updatedMarks[student.id]["comments"] = values;
          } else {
            moduleSet.add(mod);
            updatedMarks[student.id][mod] = {
              assignment: values.assignment || "",
              quiz: values.quiz || ""
            };
          }
        });

        if (!updatedMarks[student.id]["comments"]) {
          updatedMarks[student.id]["comments"] = "";
        }
      });

      setMarksData(updatedMarks);
      setModules([...moduleSet].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
    };

    if (selectedCourse) {
      prepareMarksData();
    }
  }, [students, selectedCourse]);

  const handleCreateCourse = () => {
    const trimmed = newCourseName.trim();
    if (!trimmed) return alert("Course name cannot be empty.");
    if (courseOptions.includes(trimmed)) return alert("Course already exists.");

    setModalType("create");
    setShowModal(true);
  };

  const confirmCourseCreate = () => {
    const trimmed = newCourseName.trim();

    const newMarksData = {};
    students.forEach(student => {
      newMarksData[student.id] = {
        comments: "",
        "Module 1": { assignment: "", quiz: "" }
      };
    });

    setMarksData(newMarksData);
    setModules(["Module 1"]);
    setSelectedCourse(trimmed);
    setCourseOptions(prev => [...prev, trimmed]);
    setNewCourseName("");
  };

  const handleMarksChange = (studentId, module, type, value) => {
    if (module === "general" && type === "comments") {
      setMarksData(prev => ({ ...prev, [studentId]: { ...prev[studentId], comments: value } }));
    } else {
      setMarksData(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [module]: {
            ...prev[studentId]?.[module],
            [type]: value
          }
        }
      }));
    }
  };

  const handleUpdateMarks = (studentId) => {
    setPendingStudentId(studentId);
    setModalType("update");
    setShowModal(true);
  };

  const confirmUpdate = async (studentId) => {
    const studentRef = doc(db, "CorporateClients", companyCode, "studentInfo", studentId);
    const student = students.find(s => s.id === studentId);
    const allCourseMarks = student?.marks || {};

    const updatedCourseMarks = {
      ...Object.fromEntries(Object.entries(marksData[studentId]).filter(([k]) => k !== "comments")),
      comments: marksData[studentId].comments || ""
    };

    const updatedMarks = {
      ...allCourseMarks,
      [selectedCourse]: updatedCourseMarks
    };

    try {
      await setDoc(studentRef, { marks: updatedMarks }, { merge: true });
      alert("Marks updated successfully!");
    } catch (error) {
      console.error("Error updating marks:", error);
      alert("Failed to update marks.");
    }
  };

  const handleConfirmModal = async () => {
    if (modalType === "update") {
      await confirmUpdate(pendingStudentId);
    } else if (modalType === "create") {
      confirmCourseCreate();
    }
    setShowModal(false);
    setPendingStudentId(null);
    setModalType("");
  };

  const getNextModuleNumber = () => {
    const numbers = modules.map(m => parseInt(m.split(" ")[1])).filter(Boolean);
    return Math.max(...numbers, 0) + 1;
  };

  const handleAddModule = () => {
    const next = getNextModuleNumber();
    const newMod = `Module ${next}`;
    if (!modules.includes(newMod)) {
      const updatedModules = [...modules, newMod];
      setModules(updatedModules);

      const updatedMarksData = {};
      Object.entries(marksData).forEach(([studentId, studentMarks]) => {
        const { comments, ...rest } = studentMarks;
        updatedMarksData[studentId] = {
          ...rest,
          [newMod]: { assignment: "", quiz: "" },
          comments: comments || ""
        };
      });
      setMarksData(updatedMarksData);
    }
  };

  const handleRemoveModule = (modToRemove) => {
    const updatedModules = modules.filter(mod => mod !== modToRemove);
    setModules(updatedModules);

    const updatedMarks = {};
    Object.entries(marksData).forEach(([studentId, marks]) => {
      const { [modToRemove]: _, ...rest } = marks;
      updatedMarks[studentId] = { ...rest };
    });
    setMarksData(updatedMarks);
  };

  const handleDeleteCourse = () => {
    if (!window.confirm(`Are you sure you want to delete course "${selectedCourse}" for all students?`)) return;

    const updatedCourseOptions = courseOptions.filter(c => c !== selectedCourse);
    setCourseOptions(updatedCourseOptions);
    setSelectedCourse(updatedCourseOptions[0] || "");
    setMarksData({});
    setModules([]);

    students.forEach(async (student) => {
      const studentRef = doc(db, "CorporateClients", companyCode, "studentInfo", student.id);
      const existingMarks = student?.marks || {};
      const { [selectedCourse]: _, ...remainingMarks } = existingMarks;
      await setDoc(studentRef, { marks: remainingMarks }, { merge: true });
    });

    alert(`Course "${selectedCourse}" deleted.`);
  };

  return (
    <>
      <Navbar />
      <div className="update-container">
        <h2>Update Student Marks - {companyCode}</h2>

        <div className="course-creator">
          <input
            type="text"
            placeholder="Enter new course name"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
          />
          <button onClick={handleCreateCourse} className="add-button">➕ Create Course</button>
        </div>

        <div className="course-select">
          <label>Select Course:</label>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            {courseOptions.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
          <button onClick={handleDeleteCourse} className="delete-button">🗑️ Delete Course</button>
        </div>

        <div className="module-control">
          <button onClick={handleAddModule} className="add-button">➕ Add Module</button>
        </div>

        <div className="modules-list">
          {modules.map(mod => (
            <span key={mod} className="module-tag">
              {mod}
              <button onClick={() => handleRemoveModule(mod)}>×</button>
            </span>
          ))}
        </div>

        <div className="table-wrapper">
          <table className="update-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Course</th>
                <th>Module</th>
                <th>Assignment</th>
                <th>Quiz</th>
                <th>Comments</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const studentMarks = marksData[student.id] || {};
                const comment = studentMarks?.comments || "";
                const rowCount = modules.length || 1;
                let nameDisplayed = false;

                return modules.map((mod, index) => {
                  const moduleScores = studentMarks[mod] || { assignment: "", quiz: "" };
                  const row = (
                    <tr key={`${student.id}-${mod}`}>
                      {!nameDisplayed && index === 0 && (
                        <>
                          <td rowSpan={rowCount}>{student.fullName}</td>
                          <td rowSpan={rowCount}>{selectedCourse}</td>
                        </>
                      )}
                      <td>{mod}</td>
                      <td><input type="number" value={moduleScores.assignment} onChange={e => handleMarksChange(student.id, mod, "assignment", e.target.value)} /></td>
                      <td><input type="number" value={moduleScores.quiz} onChange={e => handleMarksChange(student.id, mod, "quiz", e.target.value)} /></td>
                      {index === 0 && (
                        <>
                          <td rowSpan={rowCount}><textarea value={comment} onChange={e => handleMarksChange(student.id, "general", "comments", e.target.value)} /></td>
                          <td rowSpan={rowCount}><button onClick={() => handleUpdateMarks(student.id)}>Update</button></td>
                        </>
                      )}
                    </tr>
                  );
                  nameDisplayed = true;
                  return row;
                });
              })}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h4>{modalType === "create" ? "Create New Course?" : "Confirm Update?"}</h4>
              <p>
                {modalType === "create"
                  ? `This will create a new course \"${newCourseName}\" for all students. Proceed?`
                  : `Are you sure you want to update marks for this student in \"${selectedCourse}\"?`}
              </p>
              <div style={{ marginTop: "15px" }}>
                <button onClick={handleConfirmModal} className="confirm-button">Yes</button>
                <button onClick={() => setShowModal(false)} className="cancel-button">No</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UpdateMarks;