import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import "./StudentDashboard.css";
import { FaChalkboardTeacher } from "react-icons/fa";

const StudentDashboard = () => {
  const { companyCode, studentId } = useParams();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");
  const [notesList, setNotesList] = useState([]);
  const [selectedNoteContent, setSelectedNoteContent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRef = doc(
          db,
          "CorporateClients",
          companyCode,
          "studentInfo",
          studentId
        );
        const studentSnap = await getDoc(studentRef);

        const companyRef = doc(db, "CorporateClients", companyCode);
        const companySnap = await getDoc(companyRef);

        const notesSnapshot = await getDocs(
          collection(db, "CorporateClients", companyCode, "notesInfo")
        );

        const notes = notesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "Untitled Note",
            url: data.url || null,
          };
        });

        setNotesList(notes);

        if (studentSnap.exists()) {
          setStudentData(studentSnap.data());
        } else {
          setError("Student data not found.");
        }

        if (companySnap.exists()) {
          setCompanyData(companySnap.data());
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Something went wrong.");
      }
    };

    fetchData();
  }, [companyCode, studentId]);

  const handleViewNote = async (noteUrl) => {
    if (!noteUrl || typeof noteUrl !== "string") {
      console.error("Invalid or missing note URL:", noteUrl);
      setSelectedNoteContent({
        type: "text",
        content: "Invalid or missing note URL.",
      });
      return;
    }

    const fileExtension = noteUrl.split(".").pop().toLowerCase();

    if (noteUrl.includes("docs.google.com/document")) {
      const previewUrl = noteUrl.replace("/edit", "/preview");
      setSelectedNoteContent({ type: "gdoc", url: previewUrl });
    } else if (fileExtension === "pdf") {
      setSelectedNoteContent({ type: "pdf", url: noteUrl });
    } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension)) {
      setSelectedNoteContent({ type: "image", url: noteUrl });
    } else {
      try {
        const response = await fetch(noteUrl);
        const content = await response.text();
        setSelectedNoteContent({ type: "text", content });
      } catch (error) {
        console.error("Error fetching note content:", error);
        setSelectedNoteContent({
          type: "text",
          content: "Unable to load the note content.",
        });
      }
    }
  };

  if (error) return <div className="error">{error}</div>;
  if (!studentData || !companyData)
    return <div className="loading">Loading data...</div>;

  const { attendance = {}, marks = {} } = studentData;
  const { githubUrl, trainerProfile, trainerName } = companyData;

  const marksData = [];
  Object.entries(marks).forEach(([courseName, modules]) => {
    Object.entries(modules).forEach(([moduleName, scores]) => {
      marksData.push({
        course: courseName,
        module: moduleName,
        assignment: parseInt(scores.assignment || 0),
        quiz: parseInt(scores.quiz || 0),
      });
    });
  });

  return (
    <div className={`studentDashboard ${darkMode ? "dark" : ""}`}>
      <div className="header">
        <div className="headerLeft">
          <h1>{studentData.fullName}'s Profile</h1>
          <p className="companyCode">Company Code: {companyCode}</p>
        </div>
        <div className="headerRight">
          <div className="trainerCard">
            <FaChalkboardTeacher size={20} />
            <span>
              Trainer: <strong>{trainerName}</strong>
            </span>
          </div>
          <div className="links">
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
            )}
            {trainerProfile && (
              <a href={trainerProfile} target="_blank" rel="noreferrer">
                Trainer Profile
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "notes" ? "active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          Notes
        </button>
        <button
          className={`tab ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          Attendance
        </button>
        <button
          className={`tab ${activeTab === "marks" ? "active" : ""}`}
          onClick={() => setActiveTab("marks")}
        >
          Marks
        </button>
      </div>

      {activeTab === "notes" ? (
        <div className="notesLayout">
          <div className="notesList glassBox" style={{ flex: 0.7 }}>
            <h3>Notes</h3>
            {notesList.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {notesList.map((note, index) => (
                  <li key={note.id} style={{ marginBottom: "10px" }}>
                    <button
                      onClick={() => handleViewNote(note.url)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        textAlign: "left",
                        backgroundColor: "#f0f0f0",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      {note.title || `Note ${index + 1}`}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No notes available</p>
            )}
          </div>

          <div className="noteContent glassBox" style={{ flex: 2.3 }}>
            <h3>Note Content</h3>
            <div className="content">
              {selectedNoteContent ? (
                selectedNoteContent.type === "gdoc" ? (
                  <iframe
                    src={selectedNoteContent.url}
                    width="100%"
                    height="500px"
                    title="Google Doc Viewer"
                    style={{ border: "none" }}
                  />
                ) : selectedNoteContent.type === "pdf" ? (
                  <iframe
                    src={selectedNoteContent.url}
                    width="100%"
                    height="500px"
                    title="PDF Viewer"
                    style={{ border: "none" }}
                  />
                ) : selectedNoteContent.type === "image" ? (
                  <img
                    src={selectedNoteContent.url}
                    alt="Note"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: "8px",
                    }}
                  />
                ) : (
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                    }}
                  >
                    {selectedNoteContent.content}
                  </pre>
                )
              ) : (
                "Select a note to view content"
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="tabContent glassBox">
          {activeTab === "attendance" && (
            <>
              <h3>Attendance Overview</h3>
              <div className="attendanceGrid">
                {Object.entries(attendance)
                  .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                  .map(([dateStr, status], idx) => {
                    const date = new Date(dateStr).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    });
                    const statusClass = status.toLowerCase().replace(/\s+/g, "");
                    return (
                      <span key={idx} className={`tag ${statusClass}`}>
                        {date}
                      </span>
                    );
                  })}
              </div>
            </>
          )}

          {activeTab === "marks" && (
            <>
              <h3>Marks Table</h3>
              {marksData.length > 0 ? (
                <table className="marksTable">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Module</th>
                      <th>Assignment</th>
                      <th>Quiz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marksData.map((mark, i) => (
                      <tr key={i}>
                        <td>{mark.course}</td>
                        <td>{mark.module}</td>
                        <td>{mark.assignment}</td>
                        <td>{mark.quiz}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No marks available</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
