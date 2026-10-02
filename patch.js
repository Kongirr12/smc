const fs = require('fs');
let code = fs.readFileSync('code.gs', 'utf8');

// For Classroom Schedule Print
let targetClassroom = `    const rows = [1,2,3,4,5].map((d, index) => {
      const rowCells = periods.map(p => {
        if (p.is_break) {
          const text = (p.label && p.label.includes('เสาธง')) ? '' : 'พัก';
          return \`<td style="border:1px solid #000; background:#F1F5F9; text-align:center; font-size:11px; color:#64748B; width:30px; vertical-align:middle;">\${text}\x3c/td>\`;
        }
        const e = grid[d][p.no];
        if (!e) return '<td style="border:1px solid #000; min-height:60px;">\x3c/td>';
        return \`
          <td style="border:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
            <div style="margin:3px; padding:5px 6px; min-height:52px;">
              <div style="font-weight:700; font-size:11px; color:#000; line-height:1.3;">
                \${e.subject_code ? \`<span style="font-size:9px; color:#475569; display:block;">\${escapeHTMLServer_(e.subject_code)}</span>\` : ''}
                \${escapeHTMLServer_(e.subject_name || e.activity_label || '')}
              \x3c/div>
              \${e.activity_label ? '' : \`<div style="font-size:10px; color:#000; margin-top:2px; line-height:1.3;">
                \${escapeHTMLServer_(e.teacher_short || e.teacher_name || '')}
              \x3c/div>\`}
              \${e.room_name ? \`<div style="font-size:9px; color:#000;">\${escapeHTMLServer_(e.room_name)}\x3c/div>\` : ''}
            \x3c/div>
          \x3c/td>\`;
      });
      return \`
        <tr>
          <td style="background:#FFF; color:#000; padding:4px 8px; border:1px solid #000;
                     white-space:nowrap; font-size:12px; font-weight:bold; text-align:center; width:60px; vertical-align:middle;">
            วัน\${dayLabels[index]}
          \x3c/td>
          \${rowCells.join('')}
        \x3c/tr>\`;
    });`;

let replaceClassroom = `    const rows = [1,2,3,4,5].map((d, index) => {
      const rowCells = [];
      for (let i = 0; i < periods.length; i++) {
        const p = periods[i];
        if (p.is_break) {
          const text = (p.label && p.label.includes('เสาธง')) ? '' : 'พัก';
          rowCells.push(\`<td style="border:1px solid #000; background:#F1F5F9; text-align:center; font-size:11px; color:#64748B; width:30px; vertical-align:middle;">\${text}\x3c/td>\`);
          continue;
        }
        
        const e = grid[d][p.no];
        if (!e) {
          rowCells.push('<td style="border:1px solid #000; min-height:60px;">\x3c/td>');
          continue;
        }

        let colspan = 1;
        while (i + 1 < periods.length) {
          const nextP = periods[i + 1];
          if (nextP.is_break) break;
          const nextE = grid[d][nextP.no];
          if (!nextE) break;
          
          const isSame = (e.subject_code === nextE.subject_code) && 
                         (e.subject_name === nextE.subject_name) && 
                         (e.activity_label === nextE.activity_label) && 
                         (e.room_name === nextE.room_name) && 
                         (e.teacher_id === nextE.teacher_id);
                         
          if (isSame) {
            colspan++;
            i++;
          } else {
            break;
          }
        }

        const colAttr = colspan > 1 ? \` colspan="\${colspan}"\` : '';
        rowCells.push(\`
          <td\${colAttr} style="border:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
            <div style="margin:3px; padding:5px 6px; min-height:52px;">
              <div style="font-weight:700; font-size:11px; color:#000; line-height:1.3;">
                \${e.subject_code ? \`<span style="font-size:9px; color:#475569; display:block;">\${escapeHTMLServer_(e.subject_code)}</span>\` : ''}
                \${escapeHTMLServer_(e.subject_name || e.activity_label || '')}
              \x3c/div>
              \${e.activity_label ? '' : \`<div style="font-size:10px; color:#000; margin-top:2px; line-height:1.3;">
                \${escapeHTMLServer_(e.teacher_short || e.teacher_name || '')}
              \x3c/div>\`}
              \${e.room_name ? \`<div style="font-size:9px; color:#000;">\${escapeHTMLServer_(e.room_name)}\x3c/div>\` : ''}
            \x3c/div>
          \x3c/td>\`);
      }
      return \`
        <tr>
          <td style="background:#FFF; color:#000; padding:4px 8px; border:1px solid #000;
                     white-space:nowrap; font-size:12px; font-weight:bold; text-align:center; width:60px; vertical-align:middle;">
            วัน\${dayLabels[index]}
          \x3c/td>
          \${rowCells.join('')}
        \x3c/tr>\`;
    });`;

if (code.indexOf(targetClassroom) !== -1) {
    code = code.replace(targetClassroom, replaceClassroom);
    console.log("Classroom code replaced.");
} else {
    console.log("Classroom code NOT found.");
}


// For Teacher Schedule Print
let targetTeacher = `    const rows = [1,2,3,4,5].map((d, index) => {
      const rowCells = periods.map(p => {
        if (p.is_break) {
          const text = (p.label && p.label.includes('เสาธง')) ? '' : 'พัก';
          return \`<td style="border:1px solid #000; background:#F1F5F9; text-align:center; font-size:11px; color:#64748B; width:30px; vertical-align:middle;">\${text}\x3c/td>\`;
        }
        const e = grid[d][p.no];
        if (!e) return '<td style="border:1px solid #000; min-height:60px;">\x3c/td>';
        return \`
          <td style="border:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
            <div style="margin:3px;padding:5px 6px;min-height:52px;">
              <div style="font-weight:700;font-size:11px;color:#000;">
                \${e.subject_code ? \`<span style="font-size:9px; color:#475569; display:block;">\${escapeHTMLServer_(e.subject_code)}</span>\` : ''}
                \${escapeHTMLServer_(e.subject_name||e.activity_label||'')}
              \x3c/div>
              <div style="font-size:10px;color:#000;margin-top:2px;">
                \${e.classroom !== 'กิจกรรม' ? escapeHTMLServer_(e.classroom) : ''}
              \x3c/div>
              \${e.room_name ? \`<div style="font-size:9px;color:#000;">\${escapeHTMLServer_(e.room_name)}\x3c/div>\` : ''}
            \x3c/div>
          \x3c/td>\`;
      });
      return \`
        <tr>
          <td style="background:#FFF; color:#000; padding:4px 8px; border:1px solid #000;
                     white-space:nowrap; font-size:12px; font-weight:bold; text-align:center; width:60px; vertical-align:middle;">
            วัน\${dayLabels[index]}
          \x3c/td>
          \${rowCells.join('')}
        \x3c/tr>\`;
    });`;


let replaceTeacher = `    const rows = [1,2,3,4,5].map((d, index) => {
      const rowCells = [];
      for (let i = 0; i < periods.length; i++) {
        const p = periods[i];
        if (p.is_break) {
          const text = (p.label && p.label.includes('เสาธง')) ? '' : 'พัก';
          rowCells.push(\`<td style="border:1px solid #000; background:#F1F5F9; text-align:center; font-size:11px; color:#64748B; width:30px; vertical-align:middle;">\${text}\x3c/td>\`);
          continue;
        }
        
        const e = grid[d][p.no];
        if (!e) {
          rowCells.push('<td style="border:1px solid #000; min-height:60px;">\x3c/td>');
          continue;
        }

        let colspan = 1;
        while (i + 1 < periods.length) {
          const nextP = periods[i + 1];
          if (nextP.is_break) break;
          const nextE = grid[d][nextP.no];
          if (!nextE) break;
          
          const isSame = (e.subject_code === nextE.subject_code) && 
                         (e.subject_name === nextE.subject_name) && 
                         (e.activity_label === nextE.activity_label) && 
                         (e.room_name === nextE.room_name) && 
                         (e.classroom === nextE.classroom);
                         
          if (isSame) {
            colspan++;
            i++;
          } else {
            break;
          }
        }

        const colAttr = colspan > 1 ? \` colspan="\${colspan}"\` : '';
        rowCells.push(\`
          <td\${colAttr} style="border:1px solid #000; padding:0; vertical-align:middle; text-align:center;">
            <div style="margin:3px;padding:5px 6px;min-height:52px;">
              <div style="font-weight:700;font-size:11px;color:#000;">
                \${e.subject_code ? \`<span style="font-size:9px; color:#475569; display:block;">\${escapeHTMLServer_(e.subject_code)}</span>\` : ''}
                \${escapeHTMLServer_(e.subject_name||e.activity_label||'')}
              \x3c/div>
              <div style="font-size:10px;color:#000;margin-top:2px;">
                \${e.classroom !== 'กิจกรรม' ? escapeHTMLServer_(e.classroom) : ''}
              \x3c/div>
              \${e.room_name ? \`<div style="font-size:9px;color:#000;">\${escapeHTMLServer_(e.room_name)}\x3c/div>\` : ''}
            \x3c/div>
          \x3c/td>\`);
      }
      return \`
        <tr>
          <td style="background:#FFF; color:#000; padding:4px 8px; border:1px solid #000;
                     white-space:nowrap; font-size:12px; font-weight:bold; text-align:center; width:60px; vertical-align:middle;">
            วัน\${dayLabels[index]}
          \x3c/td>
          \${rowCells.join('')}
        \x3c/tr>\`;
    });`;


if (code.indexOf(targetTeacher) !== -1) {
    code = code.replace(targetTeacher, replaceTeacher);
    console.log("Teacher code replaced.");
} else {
    // If not found, let's fix the </div> to \x3c/div> since that might be the difference
    let targetTeacher2 = targetTeacher.replace(/<\/div>/g, '\\x3c/div>').replace(/<\/td>/g, '\\x3c/td>').replace(/<\/tr>/g, '\\x3c/tr>');
    if (code.indexOf(targetTeacher2) !== -1) {
         code = code.replace(targetTeacher2, replaceTeacher);
         console.log("Teacher code replaced (variant 2).");
    } else {
         console.log("Teacher code NOT found.");
    }
}

fs.writeFileSync('code.gs', code, 'utf8');

