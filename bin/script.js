const GradePoints = ['4.00', '3.75', '3.50', '3.00', '2.50', '2.00', '1.50', '1.00', '0.00']
const Grades = ['A', 'A-', 'B+', 'B', 'C', 'C+', 'D', 'D+', 'F']
let TotalRecord = new Object();
let ID = 0;
let SemesterCount = 0;

function CreateElement(element, attributes, content = '') {
    let e = document.createElement(element)
    for (let key in attributes) { e.setAttribute(key, attributes[key]) }
    e.innerText = content
    return e
}

function RemoveCourse(Semester, ID) {
    let List = document.getElementsByClassName('semester')[Semester - 1].children[2]
    document.getElementById(`sem-${Semester}-course-${ID}`).remove()
    CalculateSGPA(`${Semester}`)
    if (List.childElementCount < 2) { RemoveSemester(Semester) }
}

function CreateCourse(semester) {
    let item = CreateElement('li', { class: "course", id: `sem-${semester}-course-${ID}` })
    item.appendChild(CreateElement('input', { class: "course-title", type: "text", placeholder: "Course Title", oninput: `SaveData()` }))
    let select = CreateElement('select', { name: 'grade', class: "course-grade", oninput: `CalculateSGPA(${semester})`, })
    select.appendChild(CreateElement('option', { selected: "selected", hidden: "hidden", disabled: "disabled", }, "Grade"))
    for (let i = 0; i < GradePoints.length; ++i) { select.appendChild(CreateElement('option', { value: GradePoints[i], }, Grades[i])); }
    item.appendChild(select);
    item.appendChild(CreateElement('span', { class: "break", }))
    item.appendChild(CreateElement('input', { class: "course-credit-hours", type: "number", placeholder: "Credit Hours", min: "1", oninput: `CalculateSGPA(${semester})`, }))
    item.appendChild(CreateElement('button', { class: "remove-course-button", onclick: `RemoveCourse(${semester},${ID})`, }, "Remove  \u2716"))
    document.getElementById(`sem-${semester}`).insertBefore(item, document.getElementById(`end-${semester}`))
    ID++
}

function CreateSemester() {
    let item = CreateElement('div', { class: "semester shadow", })
    item.appendChild(CreateElement('h1', { id: "semester-title", }, `Semester ${++SemesterCount < 9 ? "0" + SemesterCount : SemesterCount}`))
    item.appendChild(CreateElement('button', { class: "remove-semester-button", onclick: `RemoveSemester(${SemesterCount})` }, '\u2716'))
    let Semester = CreateElement('ul', { class: "semester-courses", id: `sem-${SemesterCount}` })
    let SemesterEnd = CreateElement('div', { class: "semester-end", id: `end-${SemesterCount}` })
    let Result = CreateElement('h3', { class: "semester-result", }, "SGPA: ")
    Result.appendChild(CreateElement('span', {}, "0.00"))
    SemesterEnd.appendChild(Result)
    SemesterEnd.appendChild(CreateElement('button', { class: "add-course-button", onclick: `CreateCourse(${SemesterCount})` }, "Add Course"))
    Semester.appendChild(SemesterEnd)
    item.appendChild(Semester)
    document.getElementById("main-container").appendChild(item)
    for (let i = 0; i < 3; ++i) { CreateCourse(SemesterCount) }
    UpdateProgress()
}

function RemoveSemester(Sem) {
    delete TotalRecord[`sem-${Sem}`]
    CalculateCGPA()
    document.getElementById(`sem-${Sem}`).parentNode.remove()
    ReNumberSemesters()
}

function ReNumberSemesters() {
    SemesterCount = 0
    let Semsesters = document.getElementsByClassName('semester')
    for (let i = 0; i < Semsesters.length; ++i) { Semsesters[i].children[0].innerText = `Semester ${++SemesterCount < 9 ? "0" + SemesterCount : SemesterCount}` }
}

function CalculateSGPA(e) {
    let Course = document.getElementsByClassName('semester')[e - 1].children[2].children, X = 0, Y = 0
    for (let i = 0; i < Course.length - 1; ++i) {
        let P = parseFloat(Course[i].children[1].value) // Points
        let Credits = parseFloat(Course[i].children[3].value) // Credit Hours
        X += ((isNaN(P) ? 0 : P) * (isNaN(Credits) ? 0 : Credits))
        Y += isNaN(Credits) ? 0 : Credits
    }
    let GPA = X / Y, CGPA = 0;
    document.getElementsByClassName('semester-result')[e - 1].children[0].innerText = (isNaN(GPA) ? 0 : GPA).toFixed(2);

    TotalRecord[`sem-${e}`] = { Points: X, Credits: Y }
    CalculateCGPA()

    let Patch = document.getElementsByClassName('course-grade')
    for (Key in Patch) {
        if (Patch[Key].value === 'Grade') {
            Patch[Key].setAttribute('name', 'earnedGrade')
        }
    }
}

function CalculateCGPA() {
    let PreviousRecord = JSON.parse(localStorage.getItem('previous-data'))
    let A = 0, B = 0,
        C = parseInt(PreviousRecord.creditHours),
        D = parseFloat(PreviousRecord.currentCGPA)
    for (key in TotalRecord) {
        A += TotalRecord[key].Points
        B += TotalRecord[key].Credits
    }
    CGPA = (A + (C * D)) / (B + C)
    // SOURCE: https://stackoverflow.com/questions/4187146/truncate-number-to-two-decimal-places-without-rounding
    CGPA = CGPA.toString().match(new RegExp('^-?\\d+(?:\.\\d{0,' + (2 || -1) + '})?'))[0]
    UpdateProgress(isNaN(CGPA) ? 0 : CGPA)
    SaveData()
}

function SetProgressBar(e, percent) {
    let circle = document.getElementsByClassName(e)[0];
    let radius = circle.r.baseVal.value;
    let circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference - percent / 100 * circumference;
}

function UpdateProgress(CGPA = 0) {
    SetProgressBar('x-bar', 75);
    SetProgressBar('y-bar', CGPA * 18.75);
    SetProgressBar('z-bar', 25);
    document.getElementsByClassName('CGPA-earned')[0].innerHTML = Number(CGPA).toFixed(2)
}

function ReadData() {
    let Data = {}
    let Entries = document.getElementsByClassName('semester-courses')
    for (let i = 0, k = 0; i < Entries.length; i++) {
        let a = new Object();
        for (let j = 0; j < Entries[i].children.length - 1; j++) {
            let t = new Object();
            t.title = Entries[i].children[j].children[0].value
            t.grade = Entries[i].children[j].children[1].value
            let u = Entries[i].children[j].children[3].value
            t.credits = isNaN(u) ? -1 : u
            a[k++] = t;
        }
        Data[i] = a
    }
    return Data
}

function PreviousRecord() {
    let Data = {}
    Data.name = document.getElementsByClassName('student-name')[0].value
    Data.currentCGPA = document.getElementsByClassName('currentCgpa')[0].value
    Data.creditHours = document.getElementsByClassName('totalCredits')[0].value
    localStorage.removeItem('previous-data')
    localStorage.setItem('previous-data', JSON.stringify(Data))
}

function SaveData() {
    PreviousRecord()
    localStorage.removeItem('course-data')
    localStorage.setItem('course-data', JSON.stringify(ReadData()))
}

function UpdateData() {
    let Data = JSON.parse(localStorage.getItem('course-data'))
    let PreviousRecord = JSON.parse(localStorage.getItem('previous-data'))
    document.getElementsByClassName('student-name')[0].value = PreviousRecord.name
    document.getElementsByClassName('currentCgpa')[0].value = PreviousRecord.currentCGPA
    document.getElementsByClassName('totalCredits')[0].value = PreviousRecord.creditHours
    let Entries = document.getElementsByClassName('semester-courses')
    let i = 0, j = 0
    for (Semester in Data) {
        if (i > 0) { CreateSemester() }
        j = 0
        for (Course in Data[Semester]) {
            if (Entries[i].children[j].children[1].value !== undefined) {
                let a = Data[Semester][Course].title
                let b = Data[Semester][Course].grade
                let c = Data[Semester][Course].credits
                if (!(a === '' && b === 'Grade' && c === '')) {
                    if (j > 2) { CreateCourse(i + 1) }
                    Entries[i].children[j].children[0].value = a
                    if (b !== 'Grade') { Entries[i].children[j].children[1].value = b }
                    if (c !== -1) { Entries[i].children[j].children[3].value = c }
                    j++
                }
            }
        }
        CalculateSGPA(parseInt(1 + i))
        i++
    }
}

function ChangeColorMode() {
    let Previous = getComputedStyle(document.documentElement).getPropertyValue('--mode')
    let Page = document.documentElement.style;
    if (Previous == 1) {
        Page.setProperty('--mode', '0')
        Page.setProperty('--bg-color', '#0f0f0f')
        Page.setProperty('--fg-color', '#F5F5F5')
        Page.setProperty('--fg-color-uf', '#ababab')
        Page.setProperty('--header-bg', '#252525')
        Page.setProperty('--header-fg', '#F5F5F5')
        Page.setProperty('--shadow-color', '#252525')
        document.getElementById('colorMode').innerText = 'Light Mode'
    } else {
        Page.setProperty('--mode', '1')
        Page.setProperty('--bg-color', '#ffffff')
        Page.setProperty('--fg-color', '#000000')
        Page.setProperty('--fg-color-uf', '#808080')
        Page.setProperty('--header-bg', '#000000')
        Page.setProperty('--header-fg', '#ffffff')
        Page.setProperty('--shadow-color', '#cecece')
        document.getElementById('colorMode').innerText = 'Dark Mode'
    }
}

(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.getElementById('colorMode').innerText = 'Light Mode'
    }
    CreateSemester();
    UpdateData();
}
)();