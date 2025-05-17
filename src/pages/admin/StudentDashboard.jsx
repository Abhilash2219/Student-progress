import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import "./StudentDashboard.css";
import { FaChalkboardTeacher } from "react-icons/fa";

const StudentDashboard = () => {
  const params = useParams();
  const orgCode = localStorage.getItem("orgCode") || params.companyCode;
  
  const studentId = localStorage.getItem("studentId");

  const [studentData, setStudentData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("attendance");
  const [notesList, setNotesList] = useState([]);
  const [selectedNoteContent, setSelectedNoteContent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
		console.log("🔥 orgCode:", orgCode);
		console.log("🔥 studentId:", studentId);
      try {
        const studentRef = doc(
          db,
          "CorporateClients",
          orgCode,
          "studentInfo",
          studentId
        );
		console.log("🔥 orgCode:", orgCode);
		console.log("🔥 studentId:", studentId);

        const studentSnap = await getDoc(studentRef);

        const companyRef = doc(db, "CorporateClients", orgCode);
        const companySnap = await getDoc(companyRef);

        const notesSnapshot = await getDocs(
          collection(db, "CorporateClients", orgCode, "notesInfo")
        );

        const notes = notesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "Untitled Note",
            url: typeof data.url === "string" ? data.url : "", // Fix for undefined .includes
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
        console.error("🔥 Error fetching data:", err);
        setError("Something went wrong.");
      }
    };

    fetchData();
  }, [orgCode, studentId]);

  const handleViewNote = async (noteUrl) => {
    if (!noteUrl || typeof noteUrl !== "string" || noteUrl.trim() === "") {
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
Object.entries(marks).forEach(([courseName, modulesAndComment]) => {
  const courseComment = modulesAndComment.comments || "—";

  Object.entries(modulesAndComment).forEach(([moduleName, scores]) => {
    if (moduleName !== "comments") {
      marksData.push({
        course: courseName,
        module: moduleName,
        assignment: parseInt(scores.assignment || 0),
        quiz: parseInt(scores.quiz || 0),
        comment: courseComment,
      });
    }
  });
});


  return (
    <div className="studentDashboard">
      <div className="header">
        <div className="headerLeft">
          <h1>{studentData.fullName}'s Profile</h1>
          <p className="orgCode">Company Code: {orgCode}</p>
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
        {["notes", "attendance", "marks"].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
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
      <div className="table-container">
        <table className="marksTable">
          <thead>
            <tr>
              <th>Course</th>
              <th>Module</th>
              <th>Assignment</th>
              <th>Quiz</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const courseCounts = {};
              marksData.forEach((mark) => {
                courseCounts[mark.course] =
                  (courseCounts[mark.course] || 0) + 1;
              });

              const printedCourses = {};

              return marksData.map((mark, i) => {
                const showCourseCell = !printedCourses[mark.course];
                if (showCourseCell) printedCourses[mark.course] = true;

                return (
                  <tr key={i}>
                    {showCourseCell && (
                      <>
                        <td
                          rowSpan={courseCounts[mark.course]}
                          style={{ verticalAlign: "middle", textAlign: "center" }}
                        >
                          {mark.course}
                        </td>
                      </>
                    )}
                    <td>{mark.module}</td>
                    <td>{mark.assignment}</td>
                    <td>{mark.quiz}</td>
                    {showCourseCell ? (
                      <td
                        rowSpan={courseCounts[mark.course]}
                        style={{ verticalAlign: "middle", textAlign: "center" }}
                      >
                        {mark.comment}
                      </td>
                    ) : null}
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
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
