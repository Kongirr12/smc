const fs = require('fs');
let code = fs.readFileSync('code.gs', 'utf8');

const target = `    // หาถ้ามี entry เดิมอยู่ (ห้อง+วัน+คาบ+ปี+เทอม)
    const existIdx = all.findIndex(x =>
      x._kind === 'schedule_entry' &&
      x.classroom === data.classroom &&
      Number(x.day) === Number(data.day) &&
      Number(x.period_no) === Number(data.period_no) &&
      String(x.academic_year) === ay &&
      String(x.semester) === sem
    );`;

const replacement = `    // หาถ้ามี entry เดิมอยู่ (ถ้ามี ID ให้หาจาก ID ก่อน, ถ้าไม่มีและไม่ใช่ 'กิจกรรม' ค่อยหาจาก composite key)
    let existIdx = -1;
    if (data.id) {
      existIdx = all.findIndex(x => x.id === data.id);
    }
    if (existIdx === -1 && data.classroom !== 'กิจกรรม') {
      existIdx = all.findIndex(x =>
        x._kind === 'schedule_entry' &&
        x.classroom === data.classroom &&
        Number(x.day) === Number(data.day) &&
        Number(x.period_no) === Number(data.period_no) &&
        String(x.academic_year) === ay &&
        String(x.semester) === sem
      );
    }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('code.gs', code, 'utf8');
  console.log("existIdx logic replaced");
} else {
  console.log("Target not found");
}
