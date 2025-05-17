import React, { useEffect, useState, lazy, Suspense } from "react";
import { db } from "../../firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import "./SharePage.css";
import { useLocation } from "react-router-dom";
import { PieChart } from "react-minimal-pie-chart";

// Lazy load navbars
const Navbar = lazy(() => import("./Navbar"));
const NavbarApp = lazy(() => import("./NavbarApp"));

const SharePage = () => {
  const [students, setStudents] = useState([]);
  const [adminEmails, setAdminEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [modules, setModules] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [programName, setProgramName] = useState("");
  const [attendanceData, setAttendanceData] = useState({
    Present: 0,
    Absent: 0,
    Late: 0,
  });

  const location = useLocation();
  const companyCode = localStorage.getItem("companyCode");
  const NavbarComponent = location.pathname.includes("/app") ? NavbarApp : Navbar;

  const getToday = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayFormatted = getToday();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyDocRef = doc(db, "CorporateClients", companyCode);
        const companySnapshot = await getDoc(companyDocRef);

        if (companySnapshot.exists()) {
          const data = companySnapshot.data();
          const admins = data.adminEmails || [];
          setAdminEmails(admins);

          const companyName = data.companyName || companyCode;
          setCompanyName(companyName);

          const programName = data.programName || "Not Defined";
          setProgramName(programName);
          
          const studentsRef = collection(db, "CorporateClients", companyCode, "studentInfo");
          const snapshot = await getDocs(studentsRef);

          const studentList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setStudents(studentList);
        } else {
          alert("Invalid company code.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyCode]);


  // Student Attendance Summary
  const handleAttendanceShare = (e) => {
    e.preventDefault();
  
    const sortedStudents = [...students].sort((a, b) =>
      (a.fullName || "").localeCompare(b.fullName || "")
    );
  
    const tableHeader = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>#</th>
            <th>Name</th>
            <th>${todayFormatted} (Today)</th>
            <th>Days Present</th>
            <th>Days Absent</th>
            <th>Days Late</th>
          </tr>
        </thead>
        <tbody>
    `;
  
    const tableRows = sortedStudents
      .map((student, index) => {
        const attendance = student.attendance || {};
        const comments = student.comments || {};
  
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
  
        Object.values(attendance).forEach((status) => {
          if (status === "Present") presentCount++;
          else if (status === "Absent") absentCount++;
          else if (status === "Late") lateCount++;
        });
  
        const todayStatus = attendance[todayFormatted] || "N/A";
        const todayComment = comments[todayFormatted]?.trim();
  
        let coloredStatus;
        switch (todayStatus) {
          case "Present":
            coloredStatus = `<span style="color: green; font-weight: bold;">${todayStatus}</span>`;
            break;
          case "Absent":
            coloredStatus = `<span style="color: red; font-weight: bold;">${todayStatus}</span>`;
            break;
          case "Late":
            coloredStatus = `<span style="color: orange; font-weight: bold;">${todayStatus}</span>`;
            break;
          default:
            coloredStatus = `<span>${todayStatus}</span>`;
        }
  
        const statusWithComment = todayComment
          ? `${coloredStatus}<br/><i style="color:gray">(${todayComment})</i>`
          : coloredStatus;
  
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${student.fullName || "N/A"}</td>
            <td>${statusWithComment}</td>
            <td>${presentCount}</td>
            <td>${absentCount}</td>
            <td>${lateCount}</td>
          </tr>
        `;
      })
      .join("");
  
    const tableFooter = `</tbody></table>`;
  
    const messageHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px;">
        <p>Dear Team,</p>
        <p>
        Please find below the <strong>student attendance summary</strong> for <strong>${companyName}</strong> dated <strong>${todayFormatted}</strong>:</p>
        ${tableHeader + tableRows + tableFooter}
        <p>
        If you notice any discrepancies, please don’t hesitate to get in touch.
      </p>
      <p>Best regards,<br/>
      <strong>Naveen Pn</strong><br/>
      Corporate Trainer</p>
      </div>
    `;
  
    adminEmails.forEach((email) => {
      const templateParams = {
        to_email: email,
        message: messageHtml,
        title:"Student Attendance Summary",
      };
  
      emailjs
        .send(
          "service_m0uhadr",
          "template_zniheem",
          templateParams,
          "uKaFTJVfykxCI6cPs"
        )
        .then(() => {
          console.log(`Email sent to ${email}`);
        })
        .catch((error) => {
          console.error(`Failed to send email to ${email}:`, error);
        });
    });
  
    alert("Attendance emails sent to all admin emails.");
  };
  
  
  // Student module marks Summary
const handleMarksShare = (e) => {
  e.preventDefault();

  const sortedStudents = [...students].sort((a, b) =>
    (a.fullName || "").localeCompare(b.fullName || "")
  );

  const tableHeader = `
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
      <thead style="background-color: #f2f2f2;">
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Course</th>
          <th>Module</th>
          <th>Assignment</th>
          <th>Quiz</th>
          <th>Comments</th>
        </tr>
      </thead>
      <tbody>
  `;

  let rowCount = 1;

  const tableRows = sortedStudents
    .map((student) => {
      const fullName = student.fullName || "N/A";
      const courses = student.marks || {};

      return Object.entries(courses)
        .sort(([courseA], [courseB]) => courseA.localeCompare(courseB))
        .map(([course, modules]) => {
          const moduleEntries = Object.entries(modules).sort(
            ([modA], [modB]) => modA.localeCompare(modB)
          );

          return moduleEntries
            .map(([module, scores], index) => {
              return `
                <tr>
                  ${index === 0 ? `<td rowspan="${moduleEntries.length}">${rowCount++}</td>
                                   <td rowspan="${moduleEntries.length}">${fullName}</td>
                                   <td rowspan="${moduleEntries.length}">${course}</td>` : ""}
                  <td>${module}</td>
                  <td>${scores.assignment ?? "N/A"}</td>
                  <td>${scores.quiz ?? "N/A"}</td>
                  <td>${scores.comment ?? ""}</td>
                </tr>
              `;
            })
            .join("");
        })
        .join("");
    })
    .join("");

  const tableFooter = `</tbody></table>`;

  const messageHtml = `
    <div style="font-family: Arial, sans-serif; font-size: 14px;">
      <p>Dear Admin,</p>
      <p>Please find below the <strong>module-wise student marks summary</strong> for <strong>${companyName}</strong>:</p>
      ${tableHeader + tableRows + tableFooter}
      <p>If there are any discrepancies, feel free to reach out.</p>
      <p>Best regards,<br/>
      <strong>Naveen Pn</strong><br/>
      Corporate Trainer</p>
    </div>
  `;

  adminEmails.forEach((email) => {
    const templateParams = {
      to_email: email,
      message: messageHtml,
      title: "Student Assessment Summary"
    };

    emailjs
      .send(
        "service_m0uhadr",
        "template_zniheem",
        templateParams,
        "uKaFTJVfykxCI6cPs"
      )
      .then(() => {
        console.log(`Email sent to ${email}`);
      })
      .catch((error) => {
        console.error(`Failed to send email to ${email}:`, error);
      });
  });

  alert("Module marks emails sent to all admin emails.");
};


  // Comprehensive overall Student Summary
  const handleSummaryShare = async (e, companyCode, adminEmails) => {
    e.preventDefault();
  
    if (!companyCode) {
      alert("Company code is missing.");
      return;
    }
  
    try {
      const sortedStudents = [...students].sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
  
      const tableHeader = `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
          <thead style="background-color: #f2f2f2;">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Days Present</th>
              <th>Days Absent</th>
              <th>Days Late</th>
            </tr>
          </thead>
          <tbody>
      `;
  
      const tableRows = sortedStudents
        .map((student, index) => {
          const attendance = student.attendance || {};
          let presentCount = 0;
          let absentCount = 0;
          let lateCount = 0;
  
          Object.values(attendance).forEach((status) => {
            if (status === "Present") presentCount++;
            else if (status === "Absent") absentCount++;
            else if (status === "Late") lateCount++;
          });
  
          const todayStatus = attendance[todayFormatted] || "N/A";
  
          return `
            <tr>
              <td>${index + 1}</td>
              <td>${student.fullName || "N/A"}</td>
              <td>${presentCount}</td>
              <td>${absentCount}</td>
              <td>${lateCount}</td>
            </tr>
          `;
        })
        .join("");
  
      const tableFooter = `</tbody></table>`;
  
      // Module Marks Table
      const marksTableHeader = `
  <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
    <thead style="background-color: #f2f2f2;">
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Course</th>
        <th>Module</th>
        <th>Assignment</th>
        <th>Quiz</th>
        <th>comment</th>
      </tr>
    </thead>
    <tbody>
`;

let rowCount = 1;

const marksTableRows = sortedStudents
  .map((student) => {
    const fullName = student.fullName || "N/A";
    const courses = student.marks || {};

    return Object.entries(courses)
      .sort(([courseA], [courseB]) => courseA.localeCompare(courseB))
      .map(([course, modules]) => {
        const moduleEntries = Object.entries(modules).sort(
          ([modA], [modB]) => modA.localeCompare(modB)
        );

        return moduleEntries
          .map(([module, scores], index) => {
            return `
              <tr>
                ${
                  index === 0
                    ? `<td rowspan="${moduleEntries.length}">${rowCount++}</td>
                       <td rowspan="${moduleEntries.length}">${fullName}</td>
                       <td rowspan="${moduleEntries.length}">${course}</td>`
                    : ""
                }
                <td>${module}</td>
                <td>${scores.assignment ?? "N/A"}</td>
                <td>${scores.quiz ?? "N/A"}</td>
                <td>${scores.comment ?? ""}</td>
              </tr>
            `;
          })
          .join("");
      })
      .join("");
  })
  .join("");

const marksTableFooter = `</tbody></table>`;

      // Module Summary Table
      const programInfoSnapshot = await getDocs(
        collection(db, `CorporateClients/${companyCode}/programInfo`)
      );
      const courseList = programInfoSnapshot.docs.map((doc) => doc.id);
  
      const allModules = [];
      for (const course of courseList) {
        const modulesSnapshot = await getDocs(
          collection(db, `CorporateClients/${companyCode}/programInfo/${course}/modules`)
        );
        const modulesData = modulesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          course,
        }));
        allModules.push(...modulesData);
      }
  
      if (allModules.length === 0) {
        alert("No modules found.");
        return;
      }
  
      const moduleTableHeader = `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th>#</th>
              <th>Course</th>
              <th>Module Name</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
      `;
  
      const moduleTableRows = allModules
        .map((module, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${module.course || "N/A"}</td>
            <td>${module.name || "N/A"}</td>
            <td>${module.status || "N/A"}</td>
            <td>${module.startDate || "N/A"}</td>
            <td>${module.endDate || "N/A"}</td>
          </tr>
        `)
        .join("");
  
      const moduleTableFooter = `</tbody></table>`;
  
      const messageHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px;">
        <p>Dear Admin,</p>
        
        <p>
          Please find below the <strong>attendance and module marks summary</strong> for <strong>${companyName}</strong>.
        </p>
    
        <h3 style="margin-top: 20px;">Attendance Summary – ${todayFormatted}:</h3>
        ${tableHeader + tableRows + tableFooter}
    
        <h3 style="margin-top: 20px;">Module Marks Summary:</h3>
        ${marksTableHeader + marksTableRows + marksTableFooter}
    
        <h3 style="margin-top: 20px;">Module Overview:</h3>
        ${moduleTableHeader + moduleTableRows + moduleTableFooter}
    
        <p style="margin-top: 20px;">
          Please feel free to reach out in case of any queries or clarifications.
        </p>
    
      <p>Best regards,<br/>
      <strong>Naveen Pn</strong><br/>
      Corporate Trainer</p>
      </div>
    `;
    
  
      for (const email of adminEmails) {
        const templateParams = {
          to_email: email,
          message: messageHtml,
          title:"Comprehensive Student Summary"
        };
  
        await emailjs.send(
          "service_m0uhadr",
          "template_zniheem",
          templateParams,
          "uKaFTJVfykxCI6cPs"
        );
        console.log(`Email sent to ${email}`);
      }
  
      alert("Attendance, marks, and module summary emails sent to all admin emails.");
    } catch (error) {
      console.error("Error fetching/sending data:", error);
      alert("Failed to fetch or send data.");
    }
  };
  

    
  
// module summary
const handleModuleSummaryShare = async (e, companyCode, adminEmails) => {
  e.preventDefault();

  if (!companyCode) {
    alert("Company code is missing.");
    return;
  }

  try {
    const programInfoSnapshot = await getDocs(
      collection(db, `CorporateClients/${companyCode}/programInfo`)
    );
    const courseList = programInfoSnapshot.docs.map((doc) => doc.id);

    const allModules = [];

    for (const course of courseList) {
      const modulesSnapshot = await getDocs(
        collection(db, `CorporateClients/${companyCode}/programInfo/${course}/modules`)
      );
      const modulesData = modulesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        course,
      }));
      allModules.push(...modulesData);
    }

    if (allModules.length === 0) {
      alert("No modules found.");
      return;
    }

    // ✅ Sort modules by name (case-insensitive)
    const sortedModules = [...allModules].sort((a, b) =>
      (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase())
    );

    const tableHeader = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>#</th>
            <th>Course</th>
            <th>Module Name</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>End Date</th>
          </tr>
        </thead>
        <tbody>
    `;

    const tableRows = sortedModules.map((module, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${module.course || "N/A"}</td>
        <td>${module.name || "N/A"}</td>
        <td>${module.status || "N/A"}</td>
        <td>${module.startDate || "N/A"}</td>
        <td>${module.endDate || "N/A"}</td>
      </tr>
    `).join("");

    const tableFooter = `
        </tbody>
      </table>
    `;

    const messageHtml = `
    <div style="font-family: Arial, sans-serif; font-size: 14px;">
      <p>Dear Admin,</p>
      <p>
        Please find below the <strong>module summary</strong> for <strong>${companyName}</strong>.
      </p>
      ${tableHeader + tableRows + tableFooter}
      <p>Best regards,<br/>
      <strong>Naveen Pn</strong><br/>
      Corporate Trainer</p>
    </div>
  `;
  

    for (const email of adminEmails) {
      const templateParams = {
        to_email: email,
        message: messageHtml,
        title:"Module Completion Status "
      };

      await emailjs.send(
        "service_m0uhadr",
        "template_zniheem",
        templateParams,
        "uKaFTJVfykxCI6cPs"
      );
      console.log(`Email sent to ${email}`);
    }

    alert("Module summary emails sent to all admin emails.");
  } catch (error) {
    console.error("Error fetching/sending module data:", error);
    alert("Failed to fetch modules or send emails.");
  }
};


  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Suspense fallback={<div>Loading Navbar...</div>}>
        <NavbarComponent />
      </Suspense>
      <div className="share-page">
        <h2>📤 Send Summaries to Admins</h2>
        <form className="share-form">
          <button type="button" onClick={handleAttendanceShare}>
             Attendance Summary
          </button>
          <button type="button" onClick={handleMarksShare}>
             Marks Summary
          </button>
          <button onClick={(e) => handleModuleSummaryShare(e, companyCode, adminEmails)}>
             Module Summary
          </button>
          <button type="button" onClick={(e) => handleSummaryShare(e, companyCode, adminEmails)}>
             Overall Summary
          </button>
        </form>
      </div>
    </>
  );
};

export default SharePage;