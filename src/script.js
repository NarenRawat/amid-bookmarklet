function injectHTML() {
    const HTMLContent = `
    <hr>
    `;

    const element = document.createElement("div");
    element.id = "amid-container";
    element.className = "row";
    element.innerHTML = HTMLContent;
    document.getElementById("PrintDiv").before(element);
}

function injectCSS() {
    const CSSContent = `
    #amid-container {
        display: flex;
        align-items: center;
        justify-contents: center;
        min-height: 200px;
    }
    `;

    const style = document.createElement("style");
    style.id = "amid-style"
    style.innerText = CSSContent;
    document.head.appendChild(style);
}

function isStudentDetailsComplete(details) {
    return (
        !!details &&
        typeof details === "object" &&
        Object.values(details).every(Boolean)
    );
}

function isBookmarkletConfigured() {
    const data = localStorage.getItem('student_details');

    if (!data) {
        return false;
    }

    try {
        const studentDetails = JSON.parse(data);
        return isStudentDetailsComplete(studentDetails);
    } catch {
        return false;
    }
}

function getElementValueById(id) {
    const element = document.getElementById(id)
    return element?.value ?? null;
}

function getStudentDetailsFromPage() {
    return {
        CollegeId: getElementValueById('hdnCollegeId'),
        CourseId: getElementValueById('hdnCourseId'),
        BranchId: getElementValueById('hdnBranchId'),
        StudentAdmissionId: getElementValueById('hdnStudentAdmissionId'),
        DateOfBirth: getElementValueById('DateOfBirth'),
        RollNo: getElementValueById('RollNo'),
        CourseBranchDurationId: getElementValueById('CourseBranchDurationId'),
        SessionYear: getElementValueById('SessionYear')
    };
}

function configureBookmarklet() {
    const studentDetails = getStudentDetailsFromPage();

    if (!isStudentDetailsComplete(studentDetails)) {
        return false;
    }

    localStorage.setItem("student_details", JSON.stringify(studentDetails));

    return isBookmarkletConfigured();
}

function cleanup() {
    const container = document.getElementById("amid-container");
    if (container) {
        container.remove();
    }

    const style = document.getElementById("amid-style");
    if (style) {
        style.remove();
    }
}
// const baseUrl = "https://online.uktech.ac.in/ums/Student/Public/ShowStudentAttendanceListByRollNoDOB";

// const url = new URL(baseUrl);
// url.search = new URLSearchParams(params).toString();

// async function get_attendance() {
//     const response = await fetch(url);
//     const data = await response.json();

//     console.log(data);
//     document.querySelector("body").innerHTML = data;
// }

// get_attendance();

function parseTable(html) {
    const data = {};
    const div = document.createElement("div");
    div.innerHTML = html;
    const table = div.querySelector("tbody");
    const rows = table.rows;
    for (let row of rows) {
        const cells = row.cells;
        const subject = cells[0].innerText;
        data[subject] = {
            held: Number(cells[cells.length - 3].innerText),
            attended: Number(cells[cells.length - 2].innerText)
        }
    }
    return data;
}

async function fetchAttendance(url) {
    const response = await fetch(url);
    const data = await response.json();

    return parseTable(data);
}

async function getMonthAttendance(month, year) {
    const studentDetails = JSON.parse(localStorage.getItem("student_details"));
    studentDetails.Year = year;
    studentDetails.MonthId = month;

    const baseUrl = "https://online.uktech.ac.in/ums/Student/Public/ShowStudentAttendanceListByRollNoDOB";
    const url = new URL(baseUrl);
    url.search = new URLSearchParams(studentDetails).toString();

    const response = await fetchAttendance(url);
    return response;
}

async function syncAttendanceData() {
    const studentDetails = JSON.parse(localStorage.getItem("student_details"));
    const semester = Number(studentDetails.CourseBranchDurationId);
    const isOddSem = !!(semester % 2);

    let attendanceData = localStorage.getItem("attendance_data");
    if (!attendanceData) {
        localStorage.setItem("attendance_data", JSON.stringify({}));
        attendanceData = localStorage.getItem("attendance_data");
    }
    attendanceData = JSON.parse(attendanceData);

    const startMonth = isOddSem ? 7 : 1;
    const currentFullDate = new Date(Date.now());
    const currentMonth = currentFullDate.getMonth() + 1;

    if (startMonth <= currentMonth) {
        for (let i = startMonth; i < currentMonth; i++) {
            const monthAttendance = attendanceData[i];
            if (!monthAttendance) {
                attendanceData[i] = await getMonthAttendance(i, currentFullDate.getFullYear());
            }
        }
    }

    attendanceData[currentMonth] = await getMonthAttendance(currentMonth, currentFullDate.getFullYear());
    localStorage.setItem("attendance_data", JSON.stringify(attendanceData));
}

function showAttendanceReport() {
    let held = 0;
    let attended = 0;

    const data = JSON.parse(localStorage.getItem("attendance_data"));

    for (let m in data) {
        for (let s in data[m]) {
            held += Number(data[m][s].held);
            attended += Number(data[m][s].attended);
        }
    }

    const el = document.createElement("h1");
    el.innerText = "Overall attendance: " + String(attended / held * 100);
    document.getElementById("amid-container").appendChild(el);
}

async function main() {
    cleanup();
    if (!isBookmarkletConfigured()) {
        const hasStudentDetailsOnPage = getElementValueById('hdnCollegeId');

        if (!hasStudentDetailsOnPage) {
            alert('Setup required:\n\nPlease view your current semester attendance manually once, then run the bookmarklet again to finish configuration.');
            return;
        }

        const configured = configureBookmarklet();
        if (!configured) {
            alert('Configuration failed:\n\nCould not save student details. Please try again after viewing attendance.');
            return;
        }
    }

    // document.getElementById("PrintDiv").hidden = true;
    await syncAttendanceData();

    injectHTML();
    injectCSS();


    showAttendanceReport();
}

main();