import { useState, useEffect } from "react";
import { db } from "../../firebase";
import Navbar from "./Navbar";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import "./RegisterStudent.css";

const RegisterStudent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [companyCode, setCompanyCode] = useState("");
  const [studentsList, setStudentsList] = useState([]);
  const [student, setStudent] = useState({
    studentId: "",
    fullName: "",
    email: "",
  });

  // Set company code from location or localStorage
  useEffect(() => {
    const storedCompanyCode =
      location.state?.companyCode || localStorage.getItem("orgCode") || localStorage.getItem("companyCode");

    if (!storedCompanyCode) {
      alert("Company code missing. Please login again.");
      navigate("/");
    } else {
      setCompanyCode(storedCompanyCode);
      localStorage.setItem("companyCode", storedCompanyCode);
    }
  }, [location, navigate]);

  // Fetch all registered students
  const fetchStudentsList = async () => {
    if (!companyCode) return;
    try {
      const querySnapshot = await getDocs(
        collection(db, `CorporateClients/${companyCode}/studentInfo`)
      );
      const list = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudentsList(list);
    } catch (error) {
      console.error("Error fetching students list:", error);
    }
  };

  // Load selected student details into form
  const handleStudentSelect = async (studentId) => {
    if (!companyCode || !studentId) return;

    try {
      const docRef = doc(
        db,
        `CorporateClients/${companyCode}/studentInfo`,
        studentId
      );
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setStudent({
          studentId: data.studentId || "",
          fullName: data.fullName || "",
          email: data.email || "",
        });
      } else {
        alert("Student not found.");
      }
    } catch (error) {
      console.error("Error fetching student:", error);
    }
  };

  useEffect(() => {
    fetchStudentsList();
  }, [companyCode]);

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !student.studentId.trim() ||
      !student.fullName.trim() ||
      !student.email.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const docRef = doc(
        db,
        `CorporateClients/${companyCode}/studentInfo`,
        student.studentId
      );

      await setDoc(
        docRef,
        {
          studentId: student.studentId,
          fullName: student.fullName,
          email: student.email,
          attendance: {},
          marks: {},
        },
        { merge: true }
      );

      alert("Student registered/updated successfully!");
      setStudent({ studentId: "", fullName: "", email: "" });
      fetchStudentsList();
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Failed to save student.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      await deleteDoc(
        doc(db, `CorporateClients/${companyCode}/studentInfo`, id)
      );
      alert("Student deleted successfully.");
      fetchStudentsList();
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="register-page">
        {/* Left Section */}
        <div className="left-section">
          <h3>Registered Students</h3>
          {studentsList.length > 0 ? (
            studentsList.map((s) => (
              <div
                key={s.studentId}
                className="student-item"
                onClick={() => handleStudentSelect(s.studentId)}
                style={{ cursor: "pointer" }}
              >
                <span>{s.fullName}</span>
                <span className="id">{s.studentId}</span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent select on delete click
                    handleDelete(s.studentId);
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p>No students registered.</p>
          )}
        </div>

        {/* Right Section */}
        <div className="right-section">
          <h2>Register or Update Student</h2>
          <form onSubmit={handleSubmit} className="register-form">
            <input
              type="text"
              name="studentId"
              placeholder="Student ID"
              value={student.studentId}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={student.fullName}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={student.email}
              onChange={handleChange}
              required
            />
            <button type="submit">Register / Update</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegisterStudent;
