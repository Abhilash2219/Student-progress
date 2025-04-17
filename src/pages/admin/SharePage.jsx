import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import "./SharePage.css";
import Navbar from "./Navbar";
import { PieChart } from "react-minimal-pie-chart";


const SharePage = () => {
  const [students, setStudents] = useState([]);
  const [adminEmails, setAdminEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [modules, setModules] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ Present: 0, Absent: 0, Late: 0 });

  const companyCode = localStorage.getItem("companyCode");
  

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

          const studentsRef = collection(db, "CorporateClients", companyCode, "studentInfo");
          const snapshot = await getDocs(studentsRef);

          const studentList = snapshot.docs.map((doc) => {
            const studentData = doc.data();
            return {
              id: doc.id,
              ...studentData,
            };
          });

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


  // attendance summary
  const handleAttendanceShare = (e) => {
    e.preventDefault();

    const tableHeader = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>#</th>
            <th>Name</th>
            <th>Status on ${todayFormatted}</th>
            <th>Days Present</th>
            <th>Days Absent</th>
            <th>Days Late</th>
          </tr>
        </thead>
        <tbody>
    `;

    const tableRows = students
      .map((student, index) => {
        const attendance = student.attendance || {};
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        // Calculate attendance stats
        Object.values(attendance).forEach((status) => {
          if (status === "Present") presentCount++;
          else if (status === "Absent") absentCount++;
          else if (status === "Late Came") lateCount++;
        });

        const todayStatus = attendance[todayFormatted] || "N/A";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${student.fullName || "N/A"}</td>
            <td>${todayStatus}</td>
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
        <p>Hello Admin,</p>
        <p>Here is the <strong>student attendance summary</strong> for <strong>${companyCode}</strong> on <strong>${todayFormatted}</strong>:</p>
        ${tableHeader + tableRows + tableFooter}
        <p>Regards,<br/>Team</p>
      </div>
    `;

    adminEmails.forEach((email) => {
      const templateParams = {
        to_email: email,
        message: messageHtml,
      };

      emailjs
        .send(
          "service_jbps4bn",
          "template_wipt9rg",
          templateParams,
          "OGVGrLXoQYAfmldzC"
        )
        .then(
          () => {
            console.log(`Email sent to ${email}`);
          },
          (error) => {
            console.error(`Failed to send email to ${email}:`, error);
          }
        );
    });

    alert("Attendance emails sent to all admin emails.");
  };

  // marks summary
  const handleMarksShare = (e) => {
    e.preventDefault();

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
          </tr>
        </thead>
        <tbody>
    `;

    let rowCount = 1;
    const tableRows = students
      .map((student) => {
        const fullName = student.fullName || "N/A";
        const courses = student.marks || {};

        return Object.entries(courses)
          .sort(([courseA], [courseB]) => courseA.localeCompare(courseB))
          .map(([course, modules]) => {
            const moduleEntries = Object.entries(modules).sort(([modA], [modB]) => modA.localeCompare(modB));

            return moduleEntries.map(([module, scores], index) => {
              return `
                <tr>
                  ${index === 0 ? `<td rowspan="${moduleEntries.length}">${rowCount++}</td>
                                   <td rowspan="${moduleEntries.length}">${fullName}</td>
                                   <td rowspan="${moduleEntries.length}">${course}</td>` : ""}
                  <td>${module}</td>
                  <td>${scores.assignment || "N/A"}</td>
                  <td>${scores.quiz || "N/A"}</td>
                </tr>
              `;
            }).join("");
          }).join("");
      })
      .join("");

    const tableFooter = `</tbody></table>`;

    const messageHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px;">
        <p>Hello Admin,</p>
        <p>Here is the <strong>student module marks summary</strong> for <strong>${companyCode}</strong>:</p>
        ${tableHeader + tableRows + tableFooter}
        <p>Regards,<br/>Team</p>
      </div>
    `;

    adminEmails.forEach((email) => {
      const templateParams = {
        to_email: email,
        message: messageHtml,
      };

      emailjs
        .send(
          "service_jbps4bn",
          "template_wipt9rg",
          templateParams,
          "OGVGrLXoQYAfmldzC"
        )
        .then(
          () => {
            console.log(`Email sent to ${email}`);
          },
          (error) => {
            console.error(`Failed to send email to ${email}:`, error);
          }
        );
    });

    alert("Module marks emails sent to all admin emails.");
  };

  //overall summary
  // Overall summary
const handleSummaryShare = async (e, companyCode, adminEmails) => {
  e.preventDefault();

  if (!companyCode) {
    alert("Company code is missing.");
    return;
  }

  try {
    // Step 1: Fetch Attendance Data for Students
    const tableHeader = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead style="background-color: #f2f2f2;">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Status on ${todayFormatted}</th>
            <th>Days Present</th>
            <th>Days Absent</th>
            <th>Days Late</th>
          </tr>
        </thead>
        <tbody>
    `;

    const tableRows = students
      .map((student, index) => {
        const attendance = student.attendance || {};
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        // Calculate attendance stats
        Object.values(attendance).forEach((status) => {
          if (status === "Present") presentCount++;
          else if (status === "Absent") absentCount++;
          else if (status === "Late Came") lateCount++;
        });

        const todayStatus = attendance[todayFormatted] || "N/A";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${student.fullName || "N/A"}</td>
            <td>${todayStatus}</td>
            <td>${presentCount}</td>
            <td>${absentCount}</td>
            <td>${lateCount}</td>
          </tr>
        `;
      })
      .join("");

    const tableFooter = `</tbody></table>`;

    // Step 2: Fetch Module Data from Firestore
    const programInfoSnapshot = await getDocs(
      collection(db, `CorporateClients/${companyCode}/programInfo`)
    );
    const courseList = programInfoSnapshot.docs.map((doc) => doc.id);

    const allModules = [];

    // Step 3: Fetch modules for each course
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

    // Step 4: Build Module Summary Table
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
          </tr>
        </thead>
        <tbody>
    `;

    let rowCount = 1;
    const marksTableRows = students
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
                    <td>${scores.assignment || "N/A"}</td>
                    <td>${scores.quiz || "N/A"}</td>
                  </tr>
                `;
              })
              .join("");
          })
          .join("");
      })
      .join("");

    const marksTableFooter = `</tbody></table>`;

    // Step 5: Build Module Summary Table (Module Share)
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

    // Combined Email HTML Content
    const messageHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px;">
        <p>Hello Admin,</p>
        <p>Here is the <strong>attendance and module marks summary</strong> for <strong>${companyCode}</strong>:</p>
        
        <h3>Attendance Summary for ${todayFormatted}:</h3>
        ${tableHeader + tableRows + tableFooter}

        <h3>Module Marks Summary:</h3>
        ${marksTableHeader + marksTableRows + marksTableFooter}

        <h3>Module Summary:</h3>
        ${moduleTableHeader + moduleTableRows + moduleTableFooter}

        <p>Regards,<br/>Team</p>
      </div>
    `;

    // Step 6: Sending Email to All Admins
    for (const email of adminEmails) {
      const templateParams = {
        to_email: email,
        message: messageHtml,
      };

      await emailjs.send(
        "service_jbps4bn",
        "template_wipt9rg",
        templateParams,
        "OGVGrLXoQYAfmldzC"
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
    // Step 1: Get all course names under the company
    const programInfoSnapshot = await getDocs(collection(db, `CorporateClients/${companyCode}/programInfo`));
    const courseList = programInfoSnapshot.docs.map(doc => doc.id);

    const allModules = [];

    // Step 2: Fetch modules for each course
    for (const course of courseList) {
      const modulesSnapshot = await getDocs(collection(db, `CorporateClients/${companyCode}/programInfo/${course}/modules`));
      const modulesData = modulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        course
      }));
      allModules.push(...modulesData);
    }

    if (allModules.length === 0) {
      alert("No modules found.");
      return;
    }

    // Step 3: Build HTML table
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

    const tableRows = allModules.map((module, index) => `
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
        <p>Hello Admin,</p>
        <p>Here is the <strong>module summary</strong> for <strong>${companyCode}</strong>:</p>
        ${tableHeader + tableRows + tableFooter}
        <p>Regards,<br/>Team</p>
      </div>
    `;

    // Step 4: Send email
    for (const email of adminEmails) {
      const templateParams = {
        to_email: email,
        message: messageHtml,
      };

      await emailjs.send(
        "service_jbps4bn",
        "template_wipt9rg",
        templateParams,
        "OGVGrLXoQYAfmldzC"
      );
      console.log(`Email sent to ${email}`);
      console.log(messageHtml);
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
      <Navbar />
      <div className="share-page">
        <h2>📤 Send Summaries to Admins</h2>
        <form className="share-form">
          <button type="button" onClick={handleAttendanceShare}>
            Send Attendance Summary
          </button>
          <button type="button" onClick={handleMarksShare}>
            Send Marks Summary
          </button>
          <button onClick={(e) => handleModuleSummaryShare(e, companyCode, adminEmails)}>
            Send Module Summary
          </button>

          <button type="button" onClick={(e)=> handleSummaryShare(e, companyCode, adminEmails)}>
            Send Overall Summary
          </button>
        </form>
      </div>
    </>
  );
};

export default SharePage;
