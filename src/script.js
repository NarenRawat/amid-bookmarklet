{
    const $ = id => document.getElementById(id);

    ///////////////////////////////////////////

    const STORAGE_KEYS = {
        STUDENT: "studentDetails",
        ATTENDANCE: "attendanceRecord"
    }

    function loadStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    function saveStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    ///////////////////////////////////////////

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

    function cleanup() {
        $('amid-container')?.remove();
        $('amid-style')?.remove();
    }

    ///////////////////////////////////////////



    function showAttendanceReport() {
        let held = 0;
        let attended = 0;

        const data = loadStorage(STORAGE_KEYS.ATTENDANCE);

        for (let m in data) {
            for (let s in data[m]) {
                held += data[m][s].held;
                attended += data[m][s].attended;
            }
        }

        const el = document.createElement("h1");
        el.innerText = "Overall attendance: " + String(attended / held * 100);
        document.getElementById("amid-container").appendChild(el);
    }

    function parseAttendanceTable(html) {
        const div = document.createElement("div");
        div.innerHTML = html;

        const rows = Array.from(div.querySelectorAll("tbody tr"));

        return Object.fromEntries(
            rows.map(
                row => {
                    const cells = row.cells;
                    const subject = cells[0].innerHTML.trim();
                    const held = Number(cells[cells.length - 3].innerText);
                    const attended = Number(cells[cells.length - 2].innerText);
                    return [
                        subject,
                        {
                            held: held,
                            attended: attended
                        }
                    ]
                }
            )
        )
    }

    async function fetchAttendanceData(params) {
        const baseUrl = "https://online.uktech.ac.in/ums/Student/Public/ShowStudentAttendanceListByRollNoDOB";
        const url = new URL(baseUrl);
        url.search = new URLSearchParams(params).toString();

        const response = await fetch(url);
        return await response.json();
    }

    async function getMonthAttendance(month, year) {
        const studentDetails = loadStorage(STORAGE_KEYS.STUDENT);
        const response = await fetchAttendanceData({
            ...studentDetails,
            Year: year,
            MonthId: month
        });

        return parseAttendanceTable(response);
    }


    async function populateMonthRangeAttendance(data, startMonth, endMonth, year) {
        for (let m = startMonth; m <= endMonth; m++) {
            if (!(m in data)) {
                data[m] = await getMonthAttendance(m, year);
            }
        }
    }

    async function getCurrentSemesterAttendance(semester) {
        const isOddSem = semester % 2 !== 0;
        const startMonth = isOddSem ? 7 : 1;

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const data = loadStorage(STORAGE_KEYS.ATTENDANCE) ?? {};

        if (startMonth < currentMonth) {
            await populateMonthRangeAttendance(data, startMonth, currentMonth - 1, currentYear);
        } else if (startMonth > currentMonth) {
            await populateMonthRangeAttendance(data, startMonth, 12, currentYear - 1)
            await populateMonthRangeAttendance(data, 1, currentMonth - 1, currentYear);
        }

        const yearForCurrentMonth = startMonth > currentMonth ? currentYear + 1 : currentYear;
        data[currentMonth] = await getMonthAttendance(currentMonth, yearForCurrentMonth);

        return data;
    }

    async function syncAttendanceData() {
        const studentDetails = loadStorage(STORAGE_KEYS.STUDENT);
        const semester = +studentDetails.CourseBranchDurationId;
        const updatedData = await getCurrentSemesterAttendance(semester);
        saveStorage(STORAGE_KEYS.ATTENDANCE, updatedData);
    }

    ///////////////////////////////////////////

    function isStudentDetailsComplete(details) {
        return (
            !!details &&
            typeof details === "object" &&
            Object.values(details).every(Boolean)
        );
    }

    function isBookmarkletConfigured() {
        const data = loadStorage(STORAGE_KEYS.STUDENT);
        return isStudentDetailsComplete(data);
    }

    function getStudentDetailsFromPage() {
        const ids = [
            'hdnCollegeId',
            'hdnCourseId',
            'hdnBranchId',
            'hdnStudentAdmissionId',
            'DateOfBirth',
            'RollNo',
            'CourseBranchDurationId',
            'SessionYear'
        ];

        return Object.fromEntries(
            ids.map(
                id => [
                    id.replace(/^hdn/, ''),
                    $(id)?.value ?? null
                ]
            )
        );

    }

    function configureStudentDetails() {
        const studentDetails = getStudentDetailsFromPage();

        if (!isStudentDetailsComplete(studentDetails)) {
            return false;
        }

        saveStorage(STORAGE_KEYS.STUDENT, studentDetails);
        return true;
    }

    function configureBookmarklet() {

        // The page has student details if this element is available
        const hasStudentDetailsOnPage = $('hdnCollegeId')

        if (!hasStudentDetailsOnPage) {
            alert('Setup required:\n\nPlease view your current semester attendance manually once, then run the bookmarklet again to finish configuration.');
            return false;
        }

        if (!configureStudentDetails()) {
            alert('Configuration failed:\n\nCould not save student details. Please try again after viewing attendance.');
            return false;
        }

        return true;
    }

    ///////////////////////////////////////////

    async function main() {
        cleanup();

        if (!isBookmarkletConfigured()) {
            const success = configureBookmarklet();
            if (!success) return;
        }

        await syncAttendanceData();

        injectHTML();
        injectCSS();

        showAttendanceReport();
    }

    main();
}