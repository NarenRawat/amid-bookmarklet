{
    const $ = id => document.getElementById(id);

    const circularProgressBarHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 100 100">
            <circle class="progress" cx="50" cy="50" r="40" stroke-linecap="round" />
            <circle class="track" cx="50" cy="50" r="40" stroke-linecap="round" />
        </svg>
        <div class="text">0%</div>
    `

    function createCircularProgressBar() {
        const container = document.createElement("div");
        container.classList.add("circularProgressBar");
        container.innerHTML = circularProgressBarHTML;

        const progress = container.getElementsByClassName("progress")[0];

        const r = progress.r.baseVal.value;
        const circumference = 2 * Math.PI * r;

        progress.style.strokeDasharray = circumference;
        progress.style.strokeDashoffset = circumference;

        return container;
    }

    function updateCircularProgressBar(progressBarContainer, percent) {
        const progress = progressBarContainer.getElementsByClassName("progress")[0];
        const r = progress.r.baseVal.value;
        const circumference = 2 * Math.PI * r;

        progress.style.strokeDashoffset = circumference * (1 - percent / 100);

        const text = progressBarContainer.getElementsByClassName("text")[0];
        text.innerText = percent + "%";
    }
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
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="0" height="0">
            <defs>
                <linearGradient id="gradient">
                    <stop offset="0%" stop-color="#DA22FF" />
                    <stop offset="100%" stop-color="#9733EE" />
                </linearGradient>
            </defs>
        </svg>
        <div class="flexCenter" id="overallAttendance">
            <div id="overallAttendanceLabel">Overall</div>
        </div>
        `;

        const container = document.createElement("div");
        container.id = "amid-container";
        container.innerHTML = HTMLContent;
        container.classList.add("flexCenter");

        const overallAttendanceDiv = container.querySelector("#overallAttendance");
        const overallAttendanceProgressBar = createCircularProgressBar();
        overallAttendanceProgressBar.id = "overallAttendanceProgressBar"
        overallAttendanceDiv.insertAdjacentElement("afterbegin", overallAttendanceProgressBar);

        container.appendChild(overallAttendanceDiv);

        document.getElementById("PrintDiv").before(container);
    }

    function injectCSS() {
        const CSSContent = `
        #amid-container {
            box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            margin: 5%;
            padding: 2%;
        }

        .flexCenter {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .circularProgressBar {
            aspect-ratio: 1;
            position: relative;
            flex: 0 0 300px;
        }

        .circularProgressBar .text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            font-weight: bold;
        }
        
        .circularProgressBar svg {
            width: 100%;
            height: 100%;

            transform: rotate(-90deg);
        }

        .circularProgressBar svg circle {
            fill: none;
            stroke-width: 10;
        }

        .circularProgressBar .progress {
            stroke: url("#gradient");
            transition: stroke-dashoffset 400ms cubic-bezier(.22, .9, .37, 1);
        }

        .circularProgressBar .track {
            stroke: #00000033;
        }

        #overallAttendance {
            flex-direction: column;
            gap: 10px;
        }

        #overallAttendanceLabel {
            font-size: 1.5rem;
            font-weight: bold;
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

    function getOverallAttendancePercent() {
        const attendance = loadStorage(STORAGE_KEYS.ATTENDANCE);

        let held = 0;
        let attended = 0;

        for (const m in attendance) {
            const monthAttendance = attendance[m];
            for (const subject in monthAttendance) {
                held += monthAttendance[subject].held;
                attended += monthAttendance[subject].attended;
            }
        }

        return held ? Math.floor(attended / held * 100) : 0;
    }

    function showAttendanceReport() {
        const overallPercent = getOverallAttendancePercent();
        updateCircularProgressBar($("overallAttendanceProgressBar"), overallPercent);
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

        injectHTML();
        injectCSS();

        await syncAttendanceData();

        showAttendanceReport();
    }

    main();
}