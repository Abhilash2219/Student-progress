import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";
import "../styles/UpdateMarks.css";
import Navbar from "../components/Navbar";

const UpdateMarks = () => {
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("Course01");

  const companyCode = localStorage.getItem("companyCode");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsCollectionRef = collection(db, "CorporateClients", companyCode, "studentInfo");
        const querySnapshot = await getDocs(studentsCollectionRef);

        const studentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentsList);

        const updatedMarks = {};
        const uniqueModules = new Set();

        studentsList.forEach(student => {
          const courseMarks = student.marks?.[selectedCourse] || {};
          updatedMarks[student.id] = {};

          Object.entries(courseMarks).forEach(([mod, values]) => {
            uniqueModules.add(mod);
            updatedMarks[student.id][mod] = {
              assignment: values.assignment || "",
              quiz: values.quiz || ""
            };
          });
        });

        setMarksData(updatedMarks);
        setModules([...uniqueModules]);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [companyCode, selectedCourse]);

  const handleMarksChange = (studentId, module, type, value) => {
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
  };

  const handleUpdateMarks = async (studentId) => {
    const marks = marksData[studentId];
    try {
      const studentRef = doc(db, "CorporateClients", companyCode, "studentInfo", studentId);
      const studentDoc = students.find(s => s.id === studentId);

      const existingMarks = studentDoc.marks || {};
      const updatedCourseMarks = {
        ...existingMarks,
        [selectedCourse]: marks
      };

      await updateDoc(studentRef, {
        marks: updatedCourseMarks
      });

      alert("Marks updated successfully!");
    } catch (error) {
      console.error("Error updating marks:", error);
      alert("Failed to update marks.");
    }
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
        updatedMarksData[studentId] = {
          ...studentMarks,
          [newMod]: { assignment: "", quiz: "" }
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
      const newMarks = { ...marks };
      delete newMarks[modToRemove];
      updatedMarks[studentId] = newMarks;
    });
    setMarksData(updatedMarks);
  };

  return (
    <>
      <Navbar />
      <div className="update-container">
        <h2>Update Student Marks - {companyCode}</h2>

        <div className="course-select">
          <label>Select Course:</label>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="Course01">Course01</option>
            <option value="Course02">Course02</option>
          </select>
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
                <th rowSpan="2">Full Name</th>
                {modules.map(mod => (
                  <th key={mod} colSpan="2">{mod}</th>
                ))}
                <th rowSpan="2">Action</th>
              </tr>
              <tr>
                {modules.map(mod => (
                  <>
                    <th key={`${mod}-a`}>Assignment</th>
                    <th key={`${mod}-q`}>Quiz</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.fullName || "-"}</td>
                  {modules.map(mod => (
                    <>
                      <td key={`${student.id}-${mod}-a`}>
                        <input
                          type="number"
                          value={marksData[student.id]?.[mod]?.assignment || ""}
                          onChange={(e) =>
                            handleMarksChange(student.id, mod, "assignment", e.target.value)
                          }
                        />
                      </td>
                      <td key={`${student.id}-${mod}-q`}>
                        <input
                          type="number"
                          value={marksData[student.id]?.[mod]?.quiz || ""}
                          onChange={(e) =>
                            handleMarksChange(student.id, mod, "quiz", e.target.value)
                          }
                        />
                      </td>
                    </>
                  ))}
                  <td>
                    <button className="update-button" onClick={() => handleUpdateMarks(student.id)}>
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default UpdateMarks;
