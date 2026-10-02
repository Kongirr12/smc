const fs = require('fs');
let code = fs.readFileSync('js_schedule.js', 'utf8');

const classTarget = \`        <button class="btn btn-light" onclick="printClassSchedule()">
          <i class='bx bx-printer'>\\x3c/i> พิมพ์ตารางสอน
        \\x3c/button>\`;
        
const classReplace = \`        <button class="btn btn-light" onclick="printClassSchedule()">
          <i class='bx bx-printer'>\\x3c/i> พิมพ์ห้องนี้
        \\x3c/button>
        <button class="btn btn-light" onclick="printAllClassSchedules()">
          <i class='bx bx-printer'>\\x3c/i> พิมพ์ทั้งหมด
        \\x3c/button>\`;

const teacherTarget = \`        <button class="btn btn-light" onclick="printTeacherSchedule()">
          <i class='bx bx-printer'>\\x3c/i> พิมพ์ตารางสอน
        \\x3c/button>\`;
        
const teacherReplace = \`        <button class="btn btn-light" onclick="printTeacherSchedule()">
          <i class='bx bx-printer'>\\x3c/i> พิมพ์คนนี้
        \\x3c/button>
        <button class="btn btn-light" onclick="printAllTeacherSchedules()">
          <i class='bx bx-printer'>\\x3c/i> พิมพ์ทั้งหมด
        \\x3c/button>\`;

if (code.includes(classTarget)) {
  code = code.replace(classTarget, classReplace);
  console.log("Class buttons replaced");
} else {
  console.log("Class buttons not found");
}

if (code.includes(teacherTarget)) {
  code = code.replace(teacherTarget, teacherReplace);
  console.log("Teacher buttons replaced");
} else {
  console.log("Teacher buttons not found");
}

fs.writeFileSync('js_schedule.js', code, 'utf8');
