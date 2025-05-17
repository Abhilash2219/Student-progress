import { useState, useEffect, lazy, Suspense } from "react";
import { db } from "../../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import "./UpdateMarks.css";

const Navbar = lazy(() => import("./Navbar"));
const NavbarApp = lazy(() => import("./NavbarApp"));

const UpdateMarks = () => {
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingStudentId, setPendingStudentId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const NavbarComponent = location.pathname.includes("/app") ? NavbarApp : Navbar;

  const storedCompanyCode = location.state?.companyCode || localStorage.getItem("companyCode");
  const [companyCode, setCompanyCode] = useState(storedCompanyCode || "");

  useEffect(() => {
    if (!storedCompanyCode) {
      alert("Company code missing. Please login again.");
      navigate("/");
    } else {
      localStorage.setItem("companyCode", storedCompanyCode);
    }
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesRef = collection(db, "CorporateClients", companyCode, "programInfo");
        const snapshot = await getDocs(coursesRef);
        const courses = snapshot.docs.map(doc => ({ courseId: doc.id }));
        setCourseOptions(courses);
        if (courses.length > 0) {
          setSelectedCourse(courses[0].courseId);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, [companyCode]);

  useEffect(() => {
    if (selectedCourse) fetchModules(selectedCourse);
  }, [selectedCourse]);

  const fetchModules = async (courseId) => {
    try {
      const modulesRef = collection(db, "CorporateClients", companyCode, "programInfo", courseId, "modules");
      const snapshot = await getDocs(modulesRef);
      const moduleList = snapshot.docs.map(doc => ({
        moduleId: doc.id,
        name: doc.data().name || doc.id,
      }));
      setModules(moduleList);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRef = collection(db, "CorporateClients", companyCode, "studentInfo");
        const snapshot = await getDocs(studentsRef);
        const studentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsList);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [companyCode]);

  useEffect(() => {
    const prepareMarks = () => {
      const marks = {};
      students.forEach(student => {
        const courseMarks = student.marks?.[selectedCourse] || {};
        marks[student.id] = {};

        modules.forEach(module => {
          const moduleId = module.moduleId;
          marks[student.id][moduleId] = {
            assignment: courseMarks[moduleId]?.assignment || "",
            quiz: courseMarks[moduleId]?.quiz || "",
            comment: courseMarks[moduleId]?.comment || "",
          };
        });
      });
      setMarksData(marks);
    };

    if (students.length > 0 && modules.length > 0) {
      prepareMarks();
    }
  }, [students, selectedCourse, modules]);

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
  };

  const handleMarksChange = (studentId, moduleId, type, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [moduleId]: {
          ...prev[studentId]?.[moduleId],
          [type]: value
        }
      }
    }));
  };

  const handleUpdateMarks = (studentId) => {
    setPendingStudentId(studentId);
    setShowConfirmation(true);
  };

  const confirmUpdate = async () => {
    if (!pendingStudentId) return;

    try {
      const studentRef = doc(db, "CorporateClients", companyCode, "studentInfo", pendingStudentId);
      const student = students.find(s => s.id === pendingStudentId);

      const updatedMarks = {
        ...student.marks,
        [selectedCourse]: {
          ...marksData[pendingStudentId]
        }
      };

      await setDoc(studentRef, {
        fullName: student.fullName,
        email: student.email,
        marks: updatedMarks,
        attendance: student.attendance || {},
      }, { merge: true });

      alert("Marks updated successfully!");
    } catch (error) {
      console.error("Error updating marks:", error);
      alert("Failed to update marks.");
    } finally {
      setShowConfirmation(false);
      setPendingStudentId(null);
    }
  };

  return (
    <>
      <Suspense fallback={<div>Loading Navbar...</div>}>
        <NavbarComponent />
      </Suspense>
      <div className="update-container">
        <h2>Update Student Marks - {companyCode}</h2>

        <div className="course-select">
          <label>Select Course:</label>
          <select value={selectedCourse} onChange={handleCourseChange}>
            {courseOptions.map(course => (
              <option key={course.courseId} value={course.courseId}>{course.courseId}</option>
            ))}
          </select>
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
                <th>Comment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {[...students].sort((a, b) => a.fullName.localeCompare(b.fullName)).map(student => {
                const studentMarks = marksData[student.id] || {};
                const rowCount = modules.length || 1;

                return modules.map((module, index) => (
                  <tr key={`${student.id}-${module.moduleId}`}>
                    {index === 0 && (
                      <>
                        <td rowSpan={rowCount}>{student.fullName}</td>
                        <td rowSpan={rowCount}>{selectedCourse}</td>
                      </>
                    )}
                    <td>{module.name}</td>
                    <td>
                      <input
                        type="number"
                        value={studentMarks[module.moduleId]?.assignment || ""}
                        onChange={e => handleMarksChange(student.id, module.moduleId, "assignment", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={studentMarks[module.moduleId]?.quiz || ""}
                        onChange={e => handleMarksChange(student.id, module.moduleId, "quiz", e.target.value)}
                      />
                    </td>
                    <td>
                      <textarea
                        value={studentMarks[module.moduleId]?.comment || ""}
                        onChange={e => handleMarksChange(student.id, module.moduleId, "comment", e.target.value)}
                      />
                    </td>
                    {index === 0 && (
                      <td rowSpan={rowCount}>
                        <button onClick={() => handleUpdateMarks(student.id)}>Update</button>
                      </td>
                    )}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showConfirmation && (
        <div className="modal">
          <div className="modal-content">
            <h2>Are you sure you want to update the marks?</h2>
            <div className="modal-footer">
              <button className="confirm-button" onClick={confirmUpdate}>Yes</button>
              <button className="cancel-button" onClick={() => setShowConfirmation(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UpdateMarks;
