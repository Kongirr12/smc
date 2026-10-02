const fs = require('fs');
let code = fs.readFileSync('js_schedule.js', 'utf8');

const r1 = /<button class="btn btn-light" onclick="printClassSchedule\(\)">\s*<i class='bx bx-printer'>\\x3c\/i> พิมพ์ตารางสอน\s*\\x3c\/button>/;
const s1 = \`<button class="btn btn-light" onclick="printClassSchedule()">
          <i class='bx bx-printer'>\\x3c/i> พิมพ์ห้องนี้
        \\x3c/button>
        <button class="btn btn-light" onclick="printAllClassSchedules()">
          <i class='bx bx-printer'>\\x3c/i> พิมพ์ทั้งหมด
        \\x3c/button>\`;

code = code.replace(r1, s1);

const r2 = /<button class="btn btn-light" onclick="printTeacherSchedule\(\)">\s*<i class='bx bx-printer'>\\x3c\/i> พิมพ์ตารางสอน\s*\\x3c\/button>/;
const s2 = \`<button class="btn btn-light" onclick="printTeacherSchedule()">
          <i class='bx bx-printer'>\\x3c/i> พิมพ์คนนี้
        \\x3c/button>
        <button class="btn btn-light" onclick="printAllTeacherSchedules()">
          <i class='bx bx-printer'>\\x3c/i> พิมพ์ทั้งหมด
        \\x3c/button>\`;

code = code.replace(r2, s2);
fs.writeFileSync('js_schedule.js', code, 'utf8');
console.log("Done replacing regex");
