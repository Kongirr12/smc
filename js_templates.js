// ============================================================
//  MODULE: แบบฟอร์มงาน 4 ฝ่าย โรงเรียนมหาชัยพิทยาคาร
//  ระบบ MHC Smart School | v2.7.1
//  พัฒนาโดย ครูก้องนที อุ่นเจริญ
// ============================================================

const TEMPLATE_DEPARTMENTS = {
  all: { id: 'all', label: 'ทั้งหมด', icon: 'bxs-grid-alt', count: 30, color: '#4F46E5', badgeBg: '#EEF2FF', badgeText: '#4338CA' },
  academic: { id: 'academic', label: 'ฝ่ายบริหารวิชาการ', icon: 'bxs-book-content', count: 8, color: '#2563EB', badgeBg: '#EFF6FF', badgeText: '#1D4ED8' },
  budget: { id: 'budget', label: 'ฝ่ายบริหารงบประมาณและแผนงาน', icon: 'bxs-wallet', count: 8, color: '#059669', badgeBg: '#ECFDF5', badgeText: '#047857' },
  personnel: { id: 'personnel', label: 'ฝ่ายบริหารงานบุคคล', icon: 'bxs-user-pin', count: 7, color: '#D97706', badgeBg: '#FFFBEB', badgeText: '#B45309' },
  general: { id: 'general', label: 'ฝ่ายบริหารทั่วไป', icon: 'bxs-buildings', count: 7, color: '#7C3AED', badgeBg: '#F5F3FF', badgeText: '#6D28D9' }
};

const FOUR_DEPT_TEMPLATES = [
  {
    id: 'acad_lesson_plan',
    dept: 'academic',
    title: 'ฟอร์มแผนการจัดการเรียนรู้ (Lesson Plan)',
    desc: 'แบบแผนการจัดการเรียนรู้มาตรฐาน สพฐ. ตามแนวทาง Active Learning พร้อมบันทึกหลังสอนและเกณฑ์วัดผล',
    format: 'Word (.doc)',
    icon: 'bxs-book-open',
    tags: ["แผนการสอน", "Active Learning", "วิชาการ", "บันทึกหลังสอน", "หลักสูตร"],
    summary: 'โครงสร้างแผนการจัดการเรียนรู้ที่สมบูรณ์ตามหลักสูตรแกนกลางฯ ประกอบด้วยมาตรฐาน ตัวชี้วัด จุดประสงค์ KPA กิจกรรม 5E และการประเมินผล',
    docBody: `
<div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:4pt; line-height:1.3;">
        แผนการจัดการเรียนรู้ที่ ..... เรื่อง ................................................................
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:12pt; color:#222;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:15pt; font-weight:normal;">กลุ่มสาระการเรียนรู้.................................................... ภาคเรียนที่ ..... ปีการศึกษา ............</span>
      </div>
      <hr style="border:none; border-top:1px solid #000; margin:6pt 0 12pt 0;">
      <p class="no-indent"><strong>รายวิชา:</strong> ............................................................................ <strong>รหัสวิชา:</strong> .................................... <strong>ระดับชั้น:</strong> มัธยมศึกษาปีที่ ...../.....</p>
      <p class="no-indent"><strong>หน่วยการเรียนรู้ที่:</strong> ..... เรื่อง ................................................................................................ <strong>เวลาเรียน:</strong> ..... คาบ/ชั่วโมง</p>
      <p class="no-indent"><strong>ชื่อครูผู้สอน:</strong> ............................................................................ <strong>ตำแหน่ง:</strong> ..............................................................</p>
      <hr style="border:none; border-top:1px dashed #666; margin:8pt 0;">

      <p class="no-indent"><strong>1. มาตรฐานการเรียนรู้ / ตัวชี้วัด / ผลการเรียนรู้</strong></p>
      <p><strong>มาตรฐาน:</strong> .....................................................................................................................................................................</p>
      <p><strong>ตัวชี้วัด/ผลการเรียนรู้:</strong> .................................................................................................................................................</p>

      <p class="no-indent"><strong>2. สาระสำคัญ / ความคิดรวบยอด (Concept)</strong></p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>3. จุดประสงค์การเรียนรู้</strong></p>
      <p>3.1 ด้านความรู้ (Knowledge: K): นักเรียนสามารถ ..........................................................................................................</p>
      <p>3.2 ด้านทักษะ/กระบวนการ (Process: P): นักเรียนสามารถ ..............................................................................................</p>
      <p>3.3 ด้านคุณลักษณะอันพึงประสงค์ (Attitude: A): นักเรียนแสดงออกถึง ..............................................................................</p>

      <p class="no-indent"><strong>4. สาระการเรียนรู้ (Content)</strong></p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>5. สมรรถนะสำคัญของผู้เรียน (5 สมรรถนะหลัก)</strong></p>
      <p>( ) การสื่อสาร&nbsp;&nbsp;&nbsp;&nbsp;( ) การคิด&nbsp;&nbsp;&nbsp;&nbsp;( ) การแก้ปัญหา&nbsp;&nbsp;&nbsp;&nbsp;( ) ทักษะชีวิต&nbsp;&nbsp;&nbsp;&nbsp;( ) การใช้เทคโนโลยี</p>

      <p class="no-indent"><strong>6. กระบวนการจัดการเรียนรู้ (Active Learning: รูปแบบ 5E หรือ GPAS 5 Steps)</strong></p>
      <p><strong>ขั้นที่ 1 ขั้นสร้างความสนใจ / ระบุปัญหา:</strong> .................................................................................................................</p>
      <p><strong>ขั้นที่ 2 ขั้นสำรวจและค้นหา:</strong> .......................................................................................................................................</p>
      <p><strong>ขั้นที่ 3 ขั้นอธิบายและลงข้อสรุป:</strong> ................................................................................................................................</p>
      <p><strong>ขั้นที่ 4 ขั้นขยายความรู้ / ประยุกต์ใช้:</strong> .........................................................................................................................</p>
      <p><strong>ขั้นที่ 5 ขั้นประเมินผล:</strong> .................................................................................................................................................</p>

      <p class="no-indent"><strong>7. สื่อ นวัตกรรม และแหล่งการเรียนรู้</strong></p>
      <p>1) .................................................................................... 2) ....................................................................................</p>

      <p class="no-indent"><strong>8. การวัดและประเมินผลการเรียนรู้</strong></p>
      <table style="width:100%; border-collapse:collapse; margin:6pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:30%;">สิ่งที่ต้องการวัดและประเมิน</th>
            <th style="border:1px solid #000; padding:4pt; width:35%;">วิธีการวัดผล</th>
            <th style="border:1px solid #000; padding:4pt; width:20%;">เครื่องมือวัดผล</th>
            <th style="border:1px solid #000; padding:4pt; width:15%;">เกณฑ์การประเมิน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; padding:4pt;">1. ด้านความรู้ (K)</td>
            <td style="border:1px solid #000; padding:4pt;">ตรวจแบบฝึกหัด / แบบทดสอบ</td>
            <td style="border:1px solid #000; padding:4pt;">แบบประเมินผลงาน</td>
            <td style="border:1px solid #000; padding:4pt; text-align:center;">ร้อยละ 70 ผ่านเกณฑ์</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; padding:4pt;">2. ด้านทักษะกระบวนการ (P)</td>
            <td style="border:1px solid #000; padding:4pt;">สังเกตพฤติกรรมการปฏิบัติงานกลุ่ม</td>
            <td style="border:1px solid #000; padding:4pt;">แบบสังเกตพฤติกรรม</td>
            <td style="border:1px solid #000; padding:4pt; text-align:center;">ระดับคุณภาพ ดี ผ่านเกณฑ์</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; padding:4pt;">3. ด้านคุณลักษณะ (A)</td>
            <td style="border:1px solid #000; padding:4pt;">ประเมินความมีวินัย ใฝ่เรียนรู้</td>
            <td style="border:1px solid #000; padding:4pt;">แบบประเมินคุณลักษณะ</td>
            <td style="border:1px solid #000; padding:4pt; text-align:center;">ระดับคุณภาพ ดี ผ่านเกณฑ์</td>
          </tr>
        </tbody>
      </table>

      <p class="no-indent" style="margin-top:12pt;"><strong>9. บันทึกผลหลังการจัดการเรียนรู้</strong></p>
      <p>9.1 ผลการจัดกิจกรรมการเรียนรู้: ผู้เรียนผ่านเกณฑ์การประเมินจำนวน ..... คน คิดเป็นร้อยละ ..... ไม่ผ่านเกณฑ์ ..... คน</p>
      <p>9.2 ปัญหา / อุปสรรค ที่พบ: ............................................................................................................................................</p>
      <p>9.3 แนวทางแก้ไข / ข้อเสนอแนะ / การสอนซ่อมเสริม: ......................................................................................................</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ครูผู้สอน<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้ากลุ่มสาระการเรียนรู้</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารวิชาการ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'acad_memo_plan_approval',
    dept: 'academic',
    title: 'บันทึกข้อความขออนุมัติใช้แผนการจัดการเรียนรู้',
    desc: 'แบบบันทึกข้อความมาตรฐานราชการ ขออนุมัติใช้แผนการจัดการเรียนรู้ประจำภาคเรียน เสนอผู้อำนวยการ',
    format: 'Word (.doc)',
    icon: 'bxs-file-blank',
    tags: ["บันทึกข้อความ", "อนุมัติแผน", "วิชาการ", "หัวหน้ากลุ่มสาระ"],
    summary: 'แบบบันทึกข้อความมาตรฐานราชการ เสนอผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร เพื่อขออนุมัติใช้แผนการจัดการเรียนรู้ประจำภาคเรียน',
    docBody: `
<table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-bottom:4pt;">
        <tr>
          <td style="width:22%; vertical-align:bottom; border:none !important; padding:0;">
            <img src="data:image/png;base64,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" style="width:58px; height:auto;" alt="ตราครุฑ">
          </td>
          <td style="width:56%; text-align:center; vertical-align:bottom; border:none !important; padding:0;">
            <span style="font-size:29pt; font-weight:bold; font-family:'TH Sarabun New', sans-serif;">บันทึกข้อความ</span>
          </td>
          <td style="width:22%; border:none !important; padding:0;">&nbsp;</td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0; line-height:1.35;">
        <strong>ส่วนราชการ</strong>&nbsp;&nbsp;โรงเรียนมหาชัยพิทยาคาร ตำบลท่างสองคอน อำเภอเมือง จ.มหาสารคาม ๔๔๐๐๐
      </p>
      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin:2pt 0;">
        <tr>
          <td style="width:55%; border:none !important; padding:0; vertical-align:top;">
            <strong>ที่</strong>&nbsp;&nbsp;................................................................
          </td>
          <td style="width:45%; border:none !important; padding:0; vertical-align:top;">
            <strong>วันที่</strong>&nbsp;&nbsp;.....&nbsp;&nbsp;เดือน&nbsp;&nbsp;....................&nbsp;&nbsp;พ.ศ.&nbsp;&nbsp;............
          </td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0 4pt 0;">
        <strong>เรื่อง</strong>&nbsp;&nbsp;ขออนุมัติใช้แผนการจัดการเรียนรู้ ประจำภาคเรียนที่ ..... ปีการศึกษา ............
      </p>
      <hr style="border:none; border-top:1.5pt solid #000; margin:4pt 0 8pt 0;">
      <p class="no-indent" style="margin-bottom:8pt;">
        <strong>เรียน</strong>&nbsp;&nbsp;ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร
      </p>
      <p>ด้วย ข้าพเจ้า .............................................................. ตำแหน่ง .............................................................. วิทยฐานะ .............................................................. สังกัด กลุ่มสาระการเรียนรู้.................................................... ได้รับมอบหมายให้ปฏิบัติหน้าที่การจัดกิจกรรมการเรียนรู้ในภาคเรียนที่ ..... ปีการศึกษา ............ ในรายวิชา ............................................................................ รหัสวิชา .................................... ระดับชั้นมัธยมศึกษาปีที่ ...../..... จำนวน ..... หน่วยกิต เวลาเรียน ..... คาบ/ชั่วโมงต่อสัปดาห์</p>
      
      <p>บัดนี้ ข้าพเจ้าได้ดำเนินการวิเคราะห์หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน และหลักสูตรสถานศึกษาโรงเรียนมหาชัยพิทยาคาร พร้อมทั้งจัดทำแผนการจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ (Active Learning) บูรณาการคุณธรรม จริยธรรม และสมรรถนะสำคัญของผู้เรียน เรียบร้อยแล้ว มีรายละเอียดโครงสร้างหน่วยการเรียนรู้ดังนี้:</p>

      <table style="width:100%; border-collapse:collapse; margin:6pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:10%;">หน่วยที่</th>
            <th style="border:1px solid #000; padding:4pt; width:45%;">ชื่อหน่วยการเรียนรู้</th>
            <th style="border:1px solid #000; padding:4pt; width:25%;">มาตรฐาน / ตัวชี้วัด</th>
            <th style="border:1px solid #000; padding:4pt; width:10%;">เวลา (ชม.)</th>
            <th style="border:1px solid #000; padding:4pt; width:10%;">น้ำหนักคะแนน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; padding:4pt;">..............................................................................</td>
            <td style="border:1px solid #000; padding:4pt;">..................................................</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">2</td>
            <td style="border:1px solid #000; padding:4pt;">..............................................................................</td>
            <td style="border:1px solid #000; padding:4pt;">..................................................</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;" colspan="3"><strong>รวมตลอดภาคเรียน</strong></td>
            <td style="border:1px solid #000; text-align:center;"><strong>..........</strong></td>
            <td style="border:1px solid #000; text-align:center;"><strong>100</strong></td>
          </tr>
        </tbody>
      </table>

      <p>พร้อมนี้ ได้แนบเอกสารหลักฐานประกอบการพิจารณามาด้วยแล้ว ดังนี้:</p>
      <p>( ) โครงสร้างรายวิชาและคำอธิบายรายวิชา&nbsp;&nbsp;&nbsp;&nbsp;( ) กำหนดการสอน (Course Outline)<br>
      ( ) แผนการวัดและประเมินผลการเรียนรู้&nbsp;&nbsp;&nbsp;&nbsp;( ) เล่มแผนการจัดการเรียนรู้ฉบับสมบูรณ์</p>

      <p>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติให้ใช้แผนการจัดการเรียนรู้ดังกล่าว ในการจัดการเรียนการสอนต่อไป</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ครูผู้สอน<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้ากลุ่มสาระการเรียนรู้</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารวิชาการ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'acad_grade_remedial',
    dept: 'academic',
    title: 'แบบขอส่งผลการเรียนและขอสอบแก้ตัว (0, ร, มส)',
    desc: 'แบบฟอร์มรายงานผลการสอนซ่อมเสริมและการขออนุมัติผลการประเมินแก้ตัวสำหรับนักเรียน',
    format: 'Word (.doc)',
    icon: 'bxs-edit-alt',
    tags: ["แก้เกรด", "สอบแก้ตัว", "0 ร มส", "วัดผล", "วิชาการ"],
    summary: 'แบบบันทึกผลการพัฒนาคุณภาพผู้เรียนและการสอบแก้ตัวเพื่อส่งงานวัดและประเมินผล พร้อมลายมือชื่อครูและผู้บริหาร',
    docBody: `
<table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-bottom:4pt;">
        <tr>
          <td style="width:22%; vertical-align:bottom; border:none !important; padding:0;">
            <img src="data:image/png;base64,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" style="width:58px; height:auto;" alt="ตราครุฑ">
          </td>
          <td style="width:56%; text-align:center; vertical-align:bottom; border:none !important; padding:0;">
            <span style="font-size:29pt; font-weight:bold; font-family:'TH Sarabun New', sans-serif;">บันทึกข้อความ</span>
          </td>
          <td style="width:22%; border:none !important; padding:0;">&nbsp;</td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0; line-height:1.35;">
        <strong>ส่วนราชการ</strong>&nbsp;&nbsp;โรงเรียนมหาชัยพิทยาคาร ตำบลท่างสองคอน อำเภอเมือง จ.มหาสารคาม ๔๔๐๐๐
      </p>
      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin:2pt 0;">
        <tr>
          <td style="width:55%; border:none !important; padding:0; vertical-align:top;">
            <strong>ที่</strong>&nbsp;&nbsp;................................................................
          </td>
          <td style="width:45%; border:none !important; padding:0; vertical-align:top;">
            <strong>วันที่</strong>&nbsp;&nbsp;.....&nbsp;&nbsp;เดือน&nbsp;&nbsp;....................&nbsp;&nbsp;พ.ศ.&nbsp;&nbsp;............
          </td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0 4pt 0;">
        <strong>เรื่อง</strong>&nbsp;&nbsp;รายงานผลการจัดกิจกรรมสอนซ่อมเสริมและขอส่งผลการประเมินการแก้ตัว (0, ร, มส, มผ)
      </p>
      <hr style="border:none; border-top:1.5pt solid #000; margin:4pt 0 8pt 0;">
      <p class="no-indent" style="margin-bottom:8pt;">
        <strong>เรียน</strong>&nbsp;&nbsp;ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร
      </p>
      <p>ด้วย ข้าพเจ้า .............................................................. ตำแหน่ง .............................................................. ครูผู้สอนในรายวิชา ............................................................................ รหัสวิชา .................................... ระดับชั้นมัธยมศึกษาปีที่ ...../..... ประจำภาคเรียนที่ ..... ปีการศึกษา ............</p>

      <p>ได้ดำเนินการจัดกิจกรรมสอนซ่อมเสริม มอบหมายงานเพื่อพัฒนาผู้เรียน และดำเนินการวัดและประเมินผลการสอบแก้ตัวสำหรับนักเรียนที่มีผลการเรียนไม่ผ่านเกณฑ์มาตรฐาน ตามระเบียบว่าด้วยการวัดและประเมินผลของสถานศึกษาเรียบร้อยแล้ว มีผลการประเมินดังนี้:</p>

      <table style="width:100%; border-collapse:collapse; margin:6pt 0; font-size:13pt;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:5%;">ที่</th>
            <th style="border:1px solid #000; padding:4pt; width:12%;">เลขประจำตัว</th>
            <th style="border:1px solid #000; padding:4pt; width:25%;">ชื่อ - นามสกุล</th>
            <th style="border:1px solid #000; padding:4pt; width:8%;">ชั้น/ห้อง</th>
            <th style="border:1px solid #000; padding:4pt; width:8%;">ผลเดิม</th>
            <th style="border:1px solid #000; padding:4pt; width:22%;">ภาระงาน / การสอนซ่อมเสริม</th>
            <th style="border:1px solid #000; padding:4pt; width:8%;">คะแนน</th>
            <th style="border:1px solid #000; padding:4pt; width:12%;">ผลประเมินใหม่</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; padding:3pt;">........................................................</td>
            <td style="border:1px solid #000; text-align:center;">ม...../.....</td>
            <td style="border:1px solid #000; text-align:center;">0</td>
            <td style="border:1px solid #000; padding:3pt;">ทำแบบฝึกหัดทบทวน + สอบแก้ตัว</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
            <td style="border:1px solid #000; text-align:center;">1</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">2</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; padding:3pt;">........................................................</td>
            <td style="border:1px solid #000; text-align:center;">ม...../.....</td>
            <td style="border:1px solid #000; text-align:center;">ร</td>
            <td style="border:1px solid #000; padding:3pt;">ส่งชิ้นงานภาระงานครบถ้วน</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">3</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; padding:3pt;">........................................................</td>
            <td style="border:1px solid #000; text-align:center;">ม...../.....</td>
            <td style="border:1px solid #000; text-align:center;">มส</td>
            <td style="border:1px solid #000; padding:3pt;">ทำงานเวลาเรียนชดเชยครบ 80%</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
          </tr>
        </tbody>
      </table>

      <p>สรุปผลการแก้ตัว: นักเรียนที่เข้าดำเนินการสอบแก้ตัวทั้งหมด ..... คน ผ่านเกณฑ์ ..... คน ไม่ผ่านเกณฑ์ ..... คน</p>
      <p>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติผลการประเมินการแก้ตัว เพื่อบันทึกในระบบงานทะเบียนและวัดผลต่อไป</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ครูผู้สอน<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้างานวัดและประเมินผลการเรียน</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารวิชาการ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'acad_sar_template',
    dept: 'academic',
    title: 'แบบรายงานการประเมินตนเองของครูผู้สอน (SAR)',
    desc: 'แบบสรุปรายงานการประเมินตนเองรายบุคคลสำหรับข้าราชการครู เพื่อรองรับการประกันคุณภาพภายใน',
    format: 'Word (.doc)',
    icon: 'bxs-report',
    tags: ["SAR", "ประเมินตนเอง", "ประกันคุณภาพ", "วิชาการ", "ผลงานครู"],
    summary: 'โครงสร้างแบบรายงาน SAR ครอบคลุมภาระงานสอน ผลสัมฤทธิ์ การพัฒนาตนเอง และผลงานดีเด่นรอบปีการศึกษา',
    docBody: `
<div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:4pt; line-height:1.3;">
        แบบรายงานการประเมินตนเองของข้าราชการครู (Self-Assessment Report: SAR)
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:12pt; color:#222;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:15pt; font-weight:normal;">ประจำปีการศึกษา ............ โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <hr style="border:none; border-top:1px solid #000; margin:6pt 0 12pt 0;">
      <p class="no-indent"><strong>ชื่อผู้รายงาน:</strong> ............................................................................ <strong>ตำแหน่ง:</strong> ..............................................................</p>
      <p class="no-indent"><strong>วิทยฐานะ:</strong> ............................................................................ <strong>กลุ่มสาระการเรียนรู้:</strong> .................................................</p>
      <p class="no-indent"><strong>วุฒิการศึกษาสูงสุด:</strong> .................................................................... <strong>อายุราชการ:</strong> ..... ปี ..... เดือน</p>
      <hr style="border:none; border-top:1px dashed #666; margin:8pt 0;">

      <p class="no-indent"><strong>ตอนที่ 1: การจัดการเรียนรู้และภาระงานตามมาตรฐานตำแหน่ง</strong></p>
      <p>1.1 ภาระงานสอนภาคเรียนที่ 1: รายวิชาที่สอน .................................................... จำนวน ..... คาบ/สัปดาห์</p>
      <p>1.2 ภาระงานสอนภาคเรียนที่ 2: รายวิชาที่สอน .................................................... จำนวน ..... คาบ/สัปดาห์</p>
      <p>1.3 กิจกรรมพัฒนาผู้เรียน: กิจกรรมแนะแนว / ลูกเสือ-เนตรนารี / ชุมนุม รวม ..... คาบ/สัปดาห์</p>
      <p>1.4 ภาระงานหน้าที่พิเศษที่ได้รับมอบหมาย: ................................................................................................................</p>

      <p class="no-indent"><strong>ตอนที่ 2: ผลสัมฤทธิ์ทางการเรียนของผู้เรียน</strong></p>
      <table style="width:100%; border-collapse:collapse; margin:6pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt;">รายวิชา / รหัสวิชา</th>
            <th style="border:1px solid #000; padding:4pt;">ชั้น/ห้อง</th>
            <th style="border:1px solid #000; padding:4pt;">จำนวน นร.</th>
            <th style="border:1px solid #000; padding:4pt;">ร้อยละ นร. เกรด 3 ขึ้นไป</th>
            <th style="border:1px solid #000; padding:4pt;">การอ่านคิดวิเคราะห์ (ดีเยี่ยม)</th>
            <th style="border:1px solid #000; padding:4pt;">คุณลักษณะฯ (ดีเยี่ยม)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; padding:4pt;">..................................................</td>
            <td style="border:1px solid #000; text-align:center;">ม...../.....</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:center;">.......... %</td>
            <td style="border:1px solid #000; text-align:center;">.......... %</td>
            <td style="border:1px solid #000; text-align:center;">.......... %</td>
          </tr>
        </tbody>
      </table>

      <p class="no-indent"><strong>ตอนที่ 3: การพัฒนาตนเองและวิชาชีพ (PD / PLC)</strong></p>
      <p>3.1 การอบรม พัฒนาตนเอง: จำนวน ..... ครั้ง รวมเวลา ..... ชั่วโมง</p>
      <p>3.2 การรวมกลุ่มชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC): ชื่อกลุ่ม ........................................................ จำนวน ..... ชั่วโมง</p>
      <p>3.3 นวัตกรรม / สื่อการสอนที่พัฒนาขึ้น: เรื่อง ............................................................................................................</p>

      <p class="no-indent"><strong>ตอนที่ 4: รางวัลและผลงานดีเด่นรอบปีการศึกษา</strong></p>
      <p>1) ...................................................................................................................................................................................</p>
      <p>2) ...................................................................................................................................................................................</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้รายงาน<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้ากลุ่มสาระการเรียนรู้</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารวิชาการ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'acad_classroom_research',
    dept: 'academic',
    title: 'แบบฟอร์มเค้าโครงวิจัยในชั้นเรียน (Action Research)',
    desc: 'แบบเสนอเค้าโครงงานวิจัยปฏิบัติการในชั้นเรียนเพื่อแก้ปัญหาการเรียนรู้ของผู้เรียน',
    format: 'Word (.doc)',
    icon: 'bxs-graduation',
    tags: ["วิจัยในชั้นเรียน", "เค้าโครง", "Action Research", "วิชาการ", "นวัตกรรม"],
    summary: 'แบบฟอร์มเค้าโครงวิจัยเพื่อแก้ปัญหาและยกระดับผลสัมฤทธิ์ทางการเรียนของนักเรียนรายบุคคลหรือรายกลุ่ม',
    docBody: `
<div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:4pt; line-height:1.3;">
        แบบฟอร์มเค้าโครงวิจัยในชั้นเรียน (Classroom Action Research)
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:12pt; color:#222;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:15pt; font-weight:normal;">เพื่อแก้ไขปัญหาและยกระดับผลสัมฤทธิ์ทางการเรียนรู้ของผู้เรียน</span>
      </div>
      <hr style="border:none; border-top:1px solid #000; margin:6pt 0 12pt 0;">
      <p class="no-indent"><strong>ชื่อเรื่องการวิจัย:</strong> ....................................................................................................................................................</p>
      <p class="no-indent"><strong>ผู้วิจัย:</strong> ............................................................................ <strong>ตำแหน่ง:</strong> ..............................................................</p>
      <p class="no-indent"><strong>กลุ่มสาระการเรียนรู้:</strong> ............................................................................ <strong>ภาคเรียนที่:</strong> ..... <strong>ปีการศึกษา:</strong> ............</p>
      <hr style="border:none; border-top:1px dashed #666; margin:8pt 0;">

      <p class="no-indent"><strong>1. ความเป็นมาและความสำคัญของปัญหา</strong></p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>2. วัตถุประสงค์ของการวิจัย</strong></p>
      <p>1) เพื่อ .............................................................................................................................................................................</p>
      <p>2) เพื่อเปรียบเทียบผลสัมฤทธิ์ทางการเรียนก่อนเรียนและหลังเรียนด้วยนวัตกรรม .........................................................</p>

      <p class="no-indent"><strong>3. กลุ่มเป้าหมายในการวิจัย</strong></p>
      <p>นักเรียนระดับชั้นมัธยมศึกษาปีที่ ...../..... โรงเรียนมหาชัยพิทยาคาร จำนวน ..... คน</p>

      <p class="no-indent"><strong>4. นวัตกรรมหรือรูปแบบการจัดกิจกรรมการเรียนรู้ที่นำมาใช้</strong></p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>5. เครื่องมือที่ใช้ในการวิจัย</strong></p>
      <p>1) แผนการจัดการเรียนรู้โดยใช้ .................................................................................... จำนวน ..... แผน</p>
      <p>2) นวัตกรรม / สื่อแบบฝึกทักษะ เรื่อง ........................................................................................................................</p>
      <p>3) แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน แบบปรนัย / อัตนัย จำนวน ..... ข้อ</p>

      <p class="no-indent"><strong>6. การวิเคราะห์ข้อมูลและสถิติที่ใช้</strong></p>
      <p>ค่าเฉลี่ย (Mean), ส่วนเบี่ยงเบนมาตรฐาน (S.D.), และการทดสอบค่าที (t-test Dependent Samples)</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้วิจัย<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้างานวิจัยและพัฒนาการเรียนรู้</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารวิชาการ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'acad_plc_log',
    dept: 'academic',
    title: 'แบบบันทึกชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC Log)',
    desc: 'แบบบันทึกการประชุมชุมชนแห่งการเรียนรู้ทางวิชาชีพเพื่อแก้ปัญหาและพัฒนาการจัดการเรียนรู้',
    format: 'Word (.doc)',
    icon: 'bxs-group',
    tags: ["PLC", "ชุมชนแห่งการเรียนรู้", "พัฒนาวิชาชีพ", "วิชาการ", "สะท้อนคิด"],
    summary: 'บันทึกการประชุมกลุ่ม PLC ตามกระบวนการ AAR วิเคราะห์ปัญหา ออกแบบการสอน และสะท้อนผลการปฏิบัติงาน',
    docBody: `
<div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:4pt; line-height:1.3;">
        แบบบันทึกชุมชนแห่งการเรียนรู้ทางวิชาชีพ (Professional Learning Community: PLC)
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:12pt; color:#222;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:15pt; font-weight:normal;">โรงเรียนมหาชัยพิทยาคาร สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม</span>
      </div>
      <hr style="border:none; border-top:1px solid #000; margin:6pt 0 12pt 0;">
      <p class="no-indent"><strong>กลุ่ม PLC ชื่อ:</strong> ....................................................................................................................................................</p>
      <p class="no-indent"><strong>วงรอบที่ (Cycle):</strong> ..... <strong>ครั้งที่:</strong> ..... <strong>วันที่:</strong> ..... เดือน .................... พ.ศ. ........ <strong>เวลา:</strong> ............. - ............. น. (..... ชม.)</p>
      <p class="no-indent"><strong>สถานที่ประชุม:</strong> ....................................................................................................................................................</p>
      <hr style="border:none; border-top:1px dashed #666; margin:8pt 0;">

      <p class="no-indent"><strong>1. รายชื่อสมาชิกและบทบาทหน้าที่</strong></p>
      <table style="width:100%; border-collapse:collapse; margin:4pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:10%;">ที่</th>
            <th style="border:1px solid #000; padding:4pt; width:40%;">ชื่อ - สกุล</th>
            <th style="border:1px solid #000; padding:4pt; width:30%;">บทบาทหน้าที่</th>
            <th style="border:1px solid #000; padding:4pt; width:20%;">ลายมือชื่อ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; padding:4pt;">............................................................</td>
            <td style="border:1px solid #000; padding:4pt;">ครูผู้สอนหลัก (Model Teacher)</td>
            <td style="border:1px solid #000;">&nbsp;</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">2</td>
            <td style="border:1px solid #000; padding:4pt;">............................................................</td>
            <td style="border:1px solid #000; padding:4pt;">ครูร่วมเรียนรู้ (Buddy Teacher)</td>
            <td style="border:1px solid #000;">&nbsp;</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">3</td>
            <td style="border:1px solid #000; padding:4pt;">............................................................</td>
            <td style="border:1px solid #000; padding:4pt;">ผู้เชี่ยวชาญ / นิเทศ (Mentor/Expert)</td>
            <td style="border:1px solid #000;">&nbsp;</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">4</td>
            <td style="border:1px solid #000; padding:4pt;">............................................................</td>
            <td style="border:1px solid #000; padding:4pt;">ผู้บันทึกข้อมูล (Recorder)</td>
            <td style="border:1px solid #000;">&nbsp;</td>
          </tr>
        </tbody>
      </table>

      <p class="no-indent" style="margin-top:8pt;"><strong>2. ประเด็นปัญหา / สิ่งที่ต้องการพัฒนาในชั้นเรียน</strong></p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>3. แนวทางแก้ไขและนวัตกรรมที่กลุ่มร่วมกันออกแบบ</strong></p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>4. ผลการสังเกตการจัดการเรียนรู้และการสะท้อนคิด (After Action Review: AAR)</strong></p>
      <p><strong>จุดเด่น / สิ่งที่ทำได้ดี:</strong> ..............................................................................................................................................</p>
      <p><strong>จุดที่ควรพัฒนา / ข้อค้นพบ:</strong> .......................................................................................................................................</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้บันทึกข้อมูล<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้ากลุ่มสาระการเรียนรู้</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารวิชาการ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'acad_substitute_teach',
    dept: 'academic',
    title: 'แบบฟอร์มขออนุญาตสอนแทน / แลกเปลี่ยนคาบสอน',
    desc: 'แบบขออนุมัติจัดครูสอนแทน หรือแลกเปลี่ยนคาบสอนกรณีไปราชการ ลาป่วย หรือลากิจ',
    format: 'Word (.doc)',
    icon: 'bxs-user-voice',
    tags: ["สอนแทน", "แลกคาบ", "ไปราชการ", "ลา", "วิชาการ"],
    summary: 'แบบฟอร์มขออนุมัติสอนแทนพร้อมตารางรายวิชา ห้องเรียน คาบสอน และลายมือชื่อยินยอมของครูผู้สอนแทน',
    docBody: `
<table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-bottom:4pt;">
        <tr>
          <td style="width:22%; vertical-align:bottom; border:none !important; padding:0;">
            <img src="data:image/png;base64,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" style="width:58px; height:auto;" alt="ตราครุฑ">
          </td>
          <td style="width:56%; text-align:center; vertical-align:bottom; border:none !important; padding:0;">
            <span style="font-size:29pt; font-weight:bold; font-family:'TH Sarabun New', sans-serif;">บันทึกข้อความ</span>
          </td>
          <td style="width:22%; border:none !important; padding:0;">&nbsp;</td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0; line-height:1.35;">
        <strong>ส่วนราชการ</strong>&nbsp;&nbsp;โรงเรียนมหาชัยพิทยาคาร ตำบลท่างสองคอน อำเภอเมือง จ.มหาสารคาม ๔๔๐๐๐
      </p>
      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin:2pt 0;">
        <tr>
          <td style="width:55%; border:none !important; padding:0; vertical-align:top;">
            <strong>ที่</strong>&nbsp;&nbsp;................................................................
          </td>
          <td style="width:45%; border:none !important; padding:0; vertical-align:top;">
            <strong>วันที่</strong>&nbsp;&nbsp;.....&nbsp;&nbsp;เดือน&nbsp;&nbsp;....................&nbsp;&nbsp;พ.ศ.&nbsp;&nbsp;............
          </td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0 4pt 0;">
        <strong>เรื่อง</strong>&nbsp;&nbsp;ขออนุญาตสอนแทน / แลกเปลี่ยนคาบสอน เพื่อไม่ให้เกิดความเสียหายต่อทางราชการ
      </p>
      <hr style="border:none; border-top:1.5pt solid #000; margin:4pt 0 8pt 0;">
      <p class="no-indent" style="margin-bottom:8pt;">
        <strong>เรียน</strong>&nbsp;&nbsp;ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร
      </p>
      <p>ด้วย ข้าพเจ้า .............................................................. ตำแหน่ง .............................................................. กลุ่มสาระการเรียนรู้.................................................... มีความจำเป็นต้อง ( ) ไปราชการ ( ) ลาป่วย ( ) ลากิจส่วนตัว ในวันที่ ..... เดือน .................... พ.ศ. ........ ถึงวันที่ ..... เดือน .................... พ.ศ. ........ รวมเป็นเวลา ..... วัน</p>

      <p>เพื่อให้การจัดการเรียนการสอนดำเนินไปด้วยความเรียบร้อยและไม่ส่งผลกระทบต่อนักเรียน ข้าพเจ้าได้ติดต่อประสานงานและได้รับความยินยอมจากครูผู้สอนท่านอื่นในการปฏิบัติหน้าที่สอนแทน/แลกเปลี่ยนคาบสอน ดังรายละเอียดต่อไปนี้:</p>

      <table style="width:100%; border-collapse:collapse; margin:6pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:8%;">ที่</th>
            <th style="border:1px solid #000; padding:4pt; width:15%;">วัน/เดือน/ปี</th>
            <th style="border:1px solid #000; padding:4pt; width:10%;">คาบที่</th>
            <th style="border:1px solid #000; padding:4pt; width:12%;">รหัสวิชา</th>
            <th style="border:1px solid #000; padding:4pt; width:10%;">ชั้น/ห้อง</th>
            <th style="border:1px solid #000; padding:4pt; width:25%;">ชื่อครูผู้สอนแทน</th>
            <th style="border:1px solid #000; padding:4pt; width:20%;">ลายมือชื่อผู้สอนแทน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; text-align:center;">...../...../.....</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
            <td style="border:1px solid #000; text-align:center;">...............</td>
            <td style="border:1px solid #000; text-align:center;">ม...../.....</td>
            <td style="border:1px solid #000; padding:3pt;">................................................</td>
            <td style="border:1px solid #000;">&nbsp;</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">2</td>
            <td style="border:1px solid #000; text-align:center;">...../...../.....</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
            <td style="border:1px solid #000; text-align:center;">...............</td>
            <td style="border:1px solid #000; text-align:center;">ม...../.....</td>
            <td style="border:1px solid #000; padding:3pt;">................................................</td>
            <td style="border:1px solid #000;">&nbsp;</td>
          </tr>
        </tbody>
      </table>

      <p>ทั้งนี้ ข้าพเจ้าได้จัดเตรียมใบงาน/เอกสารประกอบการเรียนรู้มอบหมายไว้แก่นักเรียนเรียบร้อยแล้ว จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้ขออนุมัติ<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้ากลุ่มสาระการเรียนรู้</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารวิชาการ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'acad_student_competition',
    dept: 'academic',
    title: 'แบบขออนุญาตนำนักเรียนเข้าร่วมกิจกรรม / แข่งขันภายนอก',
    desc: 'แบบขออนุมัติพานักเรียนไปแข่งขันงานศิลปหัตถกรรม งานวิชาการ หรือกิจกรรมนอกสถานศึกษา',
    format: 'Word (.doc)',
    icon: 'bxs-trophy',
    tags: ["พานักเรียน", "แข่งขัน", "ศิลปหัตถกรรม", "กิจกรรมภายนอก", "วิชาการ"],
    summary: 'แบบบันทึกข้อความขออนุมัติพานักเรียนเข้าร่วมกิจกรรมภายนอก พร้อมรายชื่อนักเรียน ครูผู้ควบคุม และมาตรการความปลอดภัย',
    docBody: `
<table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-bottom:4pt;">
        <tr>
          <td style="width:22%; vertical-align:bottom; border:none !important; padding:0;">
            <img src="data:image/png;base64,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" style="width:58px; height:auto;" alt="ตราครุฑ">
          </td>
          <td style="width:56%; text-align:center; vertical-align:bottom; border:none !important; padding:0;">
            <span style="font-size:29pt; font-weight:bold; font-family:'TH Sarabun New', sans-serif;">บันทึกข้อความ</span>
          </td>
          <td style="width:22%; border:none !important; padding:0;">&nbsp;</td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0; line-height:1.35;">
        <strong>ส่วนราชการ</strong>&nbsp;&nbsp;โรงเรียนมหาชัยพิทยาคาร ตำบลท่างสองคอน อำเภอเมือง จ.มหาสารคาม ๔๔๐๐๐
      </p>
      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin:2pt 0;">
        <tr>
          <td style="width:55%; border:none !important; padding:0; vertical-align:top;">
            <strong>ที่</strong>&nbsp;&nbsp;................................................................
          </td>
          <td style="width:45%; border:none !important; padding:0; vertical-align:top;">
            <strong>วันที่</strong>&nbsp;&nbsp;.....&nbsp;&nbsp;เดือน&nbsp;&nbsp;....................&nbsp;&nbsp;พ.ศ.&nbsp;&nbsp;............
          </td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0 4pt 0;">
        <strong>เรื่อง</strong>&nbsp;&nbsp;ขออนุมัตินำนักเรียนเข้าร่วมกิจกรรม / การแข่งขันภายนอกสถานศึกษา
      </p>
      <hr style="border:none; border-top:1.5pt solid #000; margin:4pt 0 8pt 0;">
      <p class="no-indent" style="margin-bottom:8pt;">
        <strong>เรียน</strong>&nbsp;&nbsp;ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร
      </p>
      <p>อ้างถึง หนังสือเชิญ/ประกาศการจัดกิจกรรม ที่ ................................................................ ลงวันที่ ..... เดือน .................... พ.ศ. ............ เรื่อง .....................................................................................................................................................................</p>

      <p>ด้วย กลุ่มสาระการเรียนรู้.................................................... มีความประสงค์ขอนำนักเรียนโรงเรียนมหาชัยพิทยาคาร เข้าร่วมการแข่งขัน/กิจกรรม ................................................................................. ณ ................................................................................. ในวันที่ ..... เดือน .................... พ.ศ. ........ ถึงวันที่ ..... เดือน .................... พ.ศ. ........ รวมเป็นเวลา ..... วัน</p>

      <p class="no-indent"><strong>1. รายชื่อนักเรียนตัวแทนเข้าร่วมกิจกรรม (จำนวน ..... คน)</strong></p>
      <table style="width:100%; border-collapse:collapse; margin:4pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:10%;">ที่</th>
            <th style="border:1px solid #000; padding:4pt; width:15%;">เลขประจำตัว</th>
            <th style="border:1px solid #000; padding:4pt; width:45%;">ชื่อ - นามสกุล</th>
            <th style="border:1px solid #000; padding:4pt; width:15%;">ชั้น/ห้อง</th>
            <th style="border:1px solid #000; padding:4pt; width:15%;">รายการแข่งขัน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; padding:3pt;">เด็กชาย/เด็กหญิง/นาย/นางสาว ................................................</td>
            <td style="border:1px solid #000; text-align:center;">ม...../.....</td>
            <td style="border:1px solid #000; padding:3pt;">............................</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">2</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; padding:3pt;">เด็กชาย/เด็กหญิง/นาย/นางสาว ................................................</td>
            <td style="border:1px solid #000; text-align:center;">ม...../.....</td>
            <td style="border:1px solid #000; padding:3pt;">............................</td>
          </tr>
        </tbody>
      </table>

      <p class="no-indent" style="margin-top:8pt;"><strong>2. รายชื่อครูผู้ควบคุมและฝึกซ้อม</strong></p>
      <p>1) ............................................................................ ตำแหน่ง ............................................ (ครูผู้ควบคุม โทร. ..........................)<br>
      2) ............................................................................ ตำแหน่ง ............................................ (ครูผู้ฝึกซ้อม โทร. ..........................)</p>

      <p class="no-indent"><strong>3. ยานพาหนะและงบประมาณ</strong></p>
      <p>เดินทางโดย: ( ) รถยนต์ส่วนกลางของโรงเรียน ( ) รถยนต์ส่วนบุคคล ทะเบียน ......................... ( ) รถโดยสารประจำทาง<br>
      งบประมาณ: ( ) ขอรับการสนับสนุนงบประมาณจากโรงเรียน จำนวน .................... บาท ( ) ไม่ขอรับการสนับสนุน</p>

      <p>ทั้งนี้ ได้รับหนังสือยินยอมจากผู้ปกครองของนักเรียนทุกคนเรียบร้อยแล้ว จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ครูผู้ควบคุม<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้ากลุ่มสาระการเรียนรู้</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารวิชาการ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'budget_procurement_memo',
    dept: 'budget',
    title: 'บันทึกข้อความขออนุมัติจัดซื้อ / จัดจ้าง (พัสดุ)',
    desc: 'แบบรายงานขอซื้อขอจ้างตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างฯ พ.ศ. 2560 ข้อ 22',
    format: 'Word (.doc)',
    icon: 'bxs-cart-add',
    tags: ["จัดซื้อจัดจ้าง", "พัสดุ", "ขอซื้อขอจ้าง", "งบประมาณ", "เฉพาะเจาะจง"],
    summary: 'แบบรายงานขอซื้อขอจ้างมาตรฐานระเบียบพัสดุ พร้อมตารางรายการพัสดุ แหล่งเงิน และแต่งตั้งผู้ตรวจรับ',
    docBody: `
<table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-bottom:4pt;">
        <tr>
          <td style="width:22%; vertical-align:bottom; border:none !important; padding:0;">
            <img src="data:image/png;base64,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" style="width:58px; height:auto;" alt="ตราครุฑ">
          </td>
          <td style="width:56%; text-align:center; vertical-align:bottom; border:none !important; padding:0;">
            <span style="font-size:29pt; font-weight:bold; font-family:'TH Sarabun New', sans-serif;">บันทึกข้อความ</span>
          </td>
          <td style="width:22%; border:none !important; padding:0;">&nbsp;</td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0; line-height:1.35;">
        <strong>ส่วนราชการ</strong>&nbsp;&nbsp;โรงเรียนมหาชัยพิทยาคาร ตำบลท่างสองคอน อำเภอเมือง จ.มหาสารคาม ๔๔๐๐๐
      </p>
      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin:2pt 0;">
        <tr>
          <td style="width:55%; border:none !important; padding:0; vertical-align:top;">
            <strong>ที่</strong>&nbsp;&nbsp;................................................................
          </td>
          <td style="width:45%; border:none !important; padding:0; vertical-align:top;">
            <strong>วันที่</strong>&nbsp;&nbsp;.....&nbsp;&nbsp;เดือน&nbsp;&nbsp;....................&nbsp;&nbsp;พ.ศ.&nbsp;&nbsp;............
          </td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0 4pt 0;">
        <strong>เรื่อง</strong>&nbsp;&nbsp;รายงานขอซื้อ / ขอจ้าง พัสดุเพื่อใช้ในการปฏิบัติราชการ
      </p>
      <hr style="border:none; border-top:1.5pt solid #000; margin:4pt 0 8pt 0;">
      <p class="no-indent" style="margin-bottom:8pt;">
        <strong>เรียน</strong>&nbsp;&nbsp;ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร
      </p>
      <p>ด้วย กลุ่มงาน/ฝ่าย/กลุ่มสาระการเรียนรู้ .................................................... มีความจำเป็นต้องดำเนินการจัดซื้อ/จัดจ้าง พัสดุเพื่อใช้ในการจัดกิจกรรมการเรียนรู้ / การบริหารจัดการสถานศึกษา ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 ข้อ 22 จึงขอรายงานรายละเอียดดังต่อไปนี้:</p>

      <p class="no-indent"><strong>1. เหตุผลและความจำเป็น:</strong> เพื่อ ....................................................................................................................</p>
      
      <p class="no-indent"><strong>2. รายละเอียดพัสดุที่จะซื้อ / จ้าง:</strong></p>
      <table style="width:100%; border-collapse:collapse; margin:4pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:8%;">ลำดับ</th>
            <th style="border:1px solid #000; padding:4pt; width:45%;">รายการพัสดุ / คุณลักษณะเฉพาะ</th>
            <th style="border:1px solid #000; padding:4pt; width:12%;">จำนวน</th>
            <th style="border:1px solid #000; padding:4pt; width:10%;">หน่วยนับ</th>
            <th style="border:1px solid #000; padding:4pt; width:12%;">ราคาต่อหน่วย</th>
            <th style="border:1px solid #000; padding:4pt; width:13%;">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; padding:3pt;">..............................................................................</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">................</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">................</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">2</td>
            <td style="border:1px solid #000; padding:3pt;">..............................................................................</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">................</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">................</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;" colspan="5"><strong>รวมเป็นเงินทั้งสิ้น (รวมภาษีมูลค่าเพิ่มแล้ว)</strong></td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;"><strong>................</strong></td>
          </tr>
        </tbody>
      </table>
      <p class="no-indent" style="text-align:right;">(ตัวอักษร: ....................................................................................................................)</p>

      <p class="no-indent"><strong>3. แหล่งเงินงบประมาณ:</strong> ( ) เงินอุดหนุนรายหัว&nbsp;&nbsp;( ) เงินรายได้สถานศึกษา&nbsp;&nbsp;( ) เงินกิจกรรมพัฒนาคุณภาพผู้เรียน</p>
      <p class="no-indent"><strong>4. วิธีการจัดซื้อจัดจ้าง:</strong> ดำเนินการโดยวิธีเฉพาะเจาะจง ตามมาตรา 56 (2)(ข) แห่ง พ.ร.บ. การจัดซื้อจัดจ้างฯ พ.ศ. 2560</p>
      <p class="no-indent"><strong>5. กำหนดเวลาส่งมอบ:</strong> ภายใน ..... วัน นับถัดจากวันที่ได้รับใบสั่งซื้อ/สั่งจ้าง</p>
      <p class="no-indent"><strong>6. ผู้ตรวจรับพัสดุ:</strong> ขอเสนอแต่งตั้ง .............................................................. ตำแหน่ง ....................................................</p>

      <p>จึงเรียนมาเพื่อโปรดพิจารณาเห็นชอบและอนุมัติให้ดำเนินการจัดซื้อ/จัดจ้าง ตามระเบียบราชการต่อไป</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................เจ้าหน้าที่ / ผู้ขอจัดซื้อ<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้าเจ้าหน้าที่พัสดุ</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารงบประมาณ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'budget_quotation_spec',
    dept: 'budget',
    title: 'แบบฟอร์มใบเสนอราคา / ตารางสืบราคา (Quotation)',
    desc: 'แบบตารางเปรียบเทียบราคาพัสดุจากการสืบราคาผู้ประกอบการ 3 ราย เพื่อประกอบการจัดซื้อจัดจ้าง',
    format: 'Word (.doc)',
    icon: 'bxs-spreadsheet',
    tags: ["ใบเสนอราคา", "สืบราคา", "เปรียบเทียบราคา", "พัสดุ", "งบประมาณ"],
    summary: 'ตารางเปรียบเทียบราคาสืบราคาตามระเบียบพัสดุ แสดงรายชื่อร้านค้า ราคาต่อหน่วย และสรุปผลการพิจารณา',
    docBody: `
<div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:4pt; line-height:1.3;">
        ตารางเปรียบเทียบราคาและผลการสืบราคาพัสดุ
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:12pt; color:#222;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:15pt; font-weight:normal;">ประกอบรายงานขอซื้อ/ขอจ้าง โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <hr style="border:none; border-top:1px solid #000; margin:6pt 0 12pt 0;">
      <p class="no-indent"><strong>งาน / โครงการ:</strong> ....................................................................................................................................................</p>
      <p class="no-indent"><strong>วันที่ทำการสืบราคา:</strong> ..... เดือน .................... พ.ศ. ........</p>
      <hr style="border:none; border-top:1px dashed #666; margin:6pt 0;">

      <table style="width:100%; border-collapse:collapse; margin:6pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:6%;" rowspan="2">ที่</th>
            <th style="border:1px solid #000; padding:4pt; width:34%;" rowspan="2">รายการ / คุณลักษณะเฉพาะ</th>
            <th style="border:1px solid #000; padding:4pt; width:8%;" rowspan="2">จำนวน</th>
            <th style="border:1px solid #000; padding:4pt; width:8%;" rowspan="2">หน่วย</th>
            <th style="border:1px solid #000; padding:4pt; width:22%;" colspan="2">1. ร้าน ................................</th>
            <th style="border:1px solid #000; padding:4pt; width:22%;" colspan="2">2. ร้าน ................................</th>
          </tr>
          <tr style="background:#F8F8F8; text-align:center;">
            <th style="border:1px solid #000; padding:3pt; width:11%;">ราคา/หน่วย</th>
            <th style="border:1px solid #000; padding:3pt; width:11%;">รวมเงิน</th>
            <th style="border:1px solid #000; padding:3pt; width:11%;">ราคา/หน่วย</th>
            <th style="border:1px solid #000; padding:3pt; width:11%;">รวมเงิน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; padding:3pt;">............................................................</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">..........</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">..........</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">..........</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">..........</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;" colspan="5"><strong>รวมเป็นเงินทั้งสิ้น</strong></td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;"><strong>..........</strong></td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;" colspan="2"><strong>..........</strong></td>
          </tr>
        </tbody>
      </table>

      <p class="no-indent" style="margin-top:10pt;"><strong>สรุปผลการพิจารณา:</strong></p>
      <p>คณะกรรมการ/ผู้สืบราคา ได้พิจารณาแล้วเห็นควรจัดซื้อจาก <strong>ร้าน ............................................................................</strong> เนื่องจากเสนอราคาต่ำสุด เป็นเงิน .................... บาท และมีคุณลักษณะถูกต้องตรงตามความต้องการของทางราชการ</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................เจ้าหน้าที่ผู้สืบราคา<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้าเจ้าหน้าที่พัสดุ</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารงบประมาณ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'budget_loan_agreement',
    dept: 'budget',
    title: 'สัญญายืมเงินทดรองราชการ (Loan Agreement)',
    desc: 'สัญญายืมเงินทดรองราชการตามระเบียบกระทรวงการคลัง พร้อมเงื่อนไขการส่งใช้เงินยืมและใบรับเงิน',
    format: 'Word (.doc)',
    icon: 'bxs-bank',
    tags: ["ยืมเงิน", "สัญญายืมเงิน", "ทดรองราชการ", "การเงิน", "งบประมาณ"],
    summary: 'สัญญายืมเงินราชการมาตรฐาน กรมบัญชีกลาง พร้อมบันทึกข้อตกลง การอนุมัติ และหลักฐานการรับเงิน',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,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" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        สัญญายืมเงินทดรองราชการ
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">สัญญาเลขที่ ............ / ............</span>
      </div>
      <p class="no-indent" style="text-align:right;">ยื่นต่อ: ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>วันที่ ..... เดือน .................... พ.ศ. ............</p>

      <p>ข้าพเจ้า .............................................................. ตำแหน่ง .............................................................. วิทยฐานะ .................................................... สังกัด โรงเรียนมหาชัยพิทยาคาร สพม.มหาสารคาม ได้รับเงินเดือนอันดับ .................... อัตราเงินเดือน .................... บาท มีความประสงค์ขอยืมเงินจาก โรงเรียนมหาชัยพิทยาคาร เพื่อใช้จ่ายในการ ....................................................................................................................................................................................................</p>

      <p>เป็นจำนวนเงินทั้งสิ้น <strong>........................................ บาท (ตัวอักษร: .............................................................................................)</strong> โดยมีกำหนดส่งใช้เงินยืมคืนคลังสถานศึกษาภายใน ..... วัน นับแต่วันที่ได้รับเงิน หรือภายในวันที่ ..... เดือน .................... พ.ศ. ........</p>

      <p class="no-indent"><strong>เงื่อนไขและข้อตกลงแห่งสัญญา:</strong></p>
      <p>1. ข้าพเจ้าสัญญาว่าจะปฏิบัติตามระเบียบกระทรวงการคลังว่าด้วยการเบิกจ่ายเงินทดรองราชการอย่างเคร่งครัด<br>
      2. เมื่อเสร็จสิ้นภารกิจ ข้าพเจ้าจะรวบรวมใบเสร็จรับเงิน/หลักฐานการจ่ายเงิน พร้อมส่งคืนเงินเหลือจ่าย (ถ้ามี) ภายในกำหนดเวลา<br>
      3. หากข้าพเจ้ามิได้ส่งใช้เงินยืมตามกำหนด ข้าพเจ้ายินยอมให้ทางราชการหักเงินเดือน เงินบำเหน็จบำนาญ หรือเงินอื่นใดที่ข้าพเจ้าพึงได้รับจากทางราชการเพื่อชดใช้เงินยืมจนครบถ้วน</p>

      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-top:15pt; table-layout:fixed;">
        <tr>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้ยืมเงิน<br>
          (........................................................)<br>
          วันที่ ...../...../..........
          </td>
          <td style="width:4%; border:none !important; padding:0;">&nbsp;</td>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................เจ้าหน้าที่การเงิน<br>
          (........................................................)<br>
          วันที่ ...../...../..........
          </td>
        </tr>
      </table>

      <div style="margin-top:15pt; border:1px solid #000; padding:8pt; font-size:14pt;">
        <strong>คำสั่ง / การอนุมัติ:</strong> ( ) อนุมัติให้ยืมเงินได้ จำนวน .................... บาท ( ) ไม่อนุมัติ<br><br>
        <div style="text-align:center;">
          ลงชื่อ..............................................................ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
          (นายอธิการ สุขศรี)<br>
          วันที่ ..... เดือน .................... พ.ศ. ........
        </div>
      </div>

      <p class="no-indent" style="margin-top:10pt;"><strong>ใบรับเงิน:</strong> ข้าพเจ้าได้รับเงินยืมจำนวน .................... บาท (................................................................) ไปถูกต้องครบถ้วนแล้ว เมื่อวันที่ ...../...../..........</p>
      <p style="text-align:right;">(ลงชื่อ)........................................................ผู้รับเงินยืม</p>
    `
  },
  {
    id: 'budget_expense_reimbursement',
    dept: 'budget',
    title: 'แบบขออนุมัติเบิกจ่ายเงินและค่าใช้จ่ายเดินทางไปราชการ',
    desc: 'ใบเบิกค่าใช้จ่ายในการเดินทางไปราชการ (แบบ 8708) ตามระเบียบกระทรวงการคลัง',
    format: 'Word (.doc)',
    icon: 'bxs-receipt',
    tags: ["เบิกเงิน", "แบบ 8708", "ค่าเดินทาง", "เบี้ยเลี้ยง", "ที่พัก", "งบประมาณ"],
    summary: 'แบบขอเบิกค่าใช้จ่ายในการเดินทางไปราชการ คำนวณเบี้ยเลี้ยง ที่พัก พาหนะ พร้อมใบรับรองการจ่ายเงิน',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,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" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        ใบเบิกค่าใช้จ่ายในการเดินทางไปราชการ (แบบ 8708)
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">ที่ทำการ โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <p class="no-indent" style="text-align:right;">วันที่ ..... เดือน .................... พ.ศ. ............</p>
      <p class="no-indent"><strong>เรื่อง:</strong> ขออนุมัติเบิกจ่ายค่าใช้จ่ายในการเดินทางไปราชการ</p>
      <p class="no-indent"><strong>เรียน:</strong> ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร</p>

      <p>ตามที่ได้รับอนุมัติให้ ข้าพเจ้า .............................................................. ตำแหน่ง .............................................................. สังกัด โรงเรียนมหาชัยพิทยาคาร พร้อมคณะ เดินทางไปปฏิบัติราชการเรื่อง ................................................................................. ณ ................................................................................. ตามหนังสือขออนุมัติ ที่ ................................................................ ลงวันที่ ...../...../.......... นั้น</p>

      <p>บัดนี้ การปฏิบัติราชการได้เสร็จสิ้นลงแล้ว ข้าพเจ้าจึงขออนุมัติเบิกจ่ายค่าใช้จ่ายในการเดินทางไปราชการ ตามระเบียบกระทรวงการคลัง ดังนี้:</p>

      <table style="width:100%; border-collapse:collapse; margin:6pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:8%;">ลำดับ</th>
            <th style="border:1px solid #000; padding:4pt; width:47%;">รายการค่าใช้จ่าย</th>
            <th style="border:1px solid #000; padding:4pt; width:20%;">จำนวนวัน / หน่วย</th>
            <th style="border:1px solid #000; padding:4pt; width:25%;">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; padding:3pt;">ค่าเบี้ยเลี้ยงการเดินทาง (วันละ ......... บาท)</td>
            <td style="border:1px solid #000; text-align:center;">..... วัน</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">....................</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">2</td>
            <td style="border:1px solid #000; padding:3pt;">ค่าเช่าที่พัก (คืนละ ......... บาท)</td>
            <td style="border:1px solid #000; text-align:center;">..... คืน</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">....................</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">3</td>
            <td style="border:1px solid #000; padding:3pt;">ค่าพาหนะ / ค่าน้ำมันเชื้อเพลิง (ตามใบเสร็จแนบ)</td>
            <td style="border:1px solid #000; text-align:center;">-</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">....................</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;" colspan="3"><strong>รวมเป็นเงินทั้งสิ้น</strong></td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;"><strong>....................</strong></td>
          </tr>
        </tbody>
      </table>
      <p class="no-indent" style="text-align:right;">(ตัวอักษร: ....................................................................................................................)</p>

      <p class="no-indent">ข้าพเจ้าขอรับรองว่ารายการค่าใช้จ่ายดังกล่าวข้างต้นเกิดขึ้นจริงในการเดินทางไปปฏิบัติราชการเพื่อประโยชน์ของทางราชการ</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้ขอเบิกเงิน<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. การตรวจสอบของเจ้าหน้าที่การเงิน</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารงบประมาณ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'budget_receipt_voucher',
    dept: 'budget',
    title: 'ใบสำคัญรับเงินสำหรับวิทยากร / ผู้รับเงิน (Receipt Voucher)',
    desc: 'ใบสำคัญรับเงิน (แบบ บก.111) สำหรับจ่ายเงินค่าตอบแทนวิทยากร หรือผู้ไม่มีใบเสร็จรับเงิน',
    format: 'Word (.doc)',
    icon: 'bxs-coupon',
    tags: ["ใบสำคัญรับเงิน", "บก.111", "วิทยากร", "ค่าตอบแทน", "การเงิน"],
    summary: 'แบบใบสำคัญรับเงินมาตรฐานกรมบัญชีกลาง พร้อมเลขประจำตัวประชาชน ที่อยู่ และรายละเอียดเงินที่ได้รับ',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,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" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        ใบสำคัญรับเงิน (Receipt Voucher)
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">ที่ทำการ โรงเรียนมหาชัยพิทยาคาร สพม.มหาสารคาม</span>
      </div>
      <p class="no-indent" style="text-align:right;">วันที่ ..... เดือน .................... พ.ศ. ............</p>

      <p>ข้าพเจ้า ............................................................................ เลขประจำตัวประชาชน 13 หลัก: <strong>[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</strong><br>
      อยู่บ้านเลขที่ .................... หมู่ที่ ..... ตำบล ........................................ อำเภอ ........................................ จังหวัด ........................................ รหัสไปรษณีย์ .................... โทรศัพท์ ........................................</p>

      <p>ได้รับเงินจาก <strong>โรงเรียนมหาชัยพิทยาคาร</strong> สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม ดังรายการต่อไปนี้:</p>

      <table style="width:100%; border-collapse:collapse; margin:6pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:10%;">ลำดับ</th>
            <th style="border:1px solid #000; padding:4pt; width:65%;">รายการ</th>
            <th style="border:1px solid #000; padding:4pt; width:25%;">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; padding:4pt;">
              ค่าตอบแทนวิทยากรบรรยาย / ปฏิบัติการ ในโครงการ ........................................................................................................<br>
              ในวันที่ ..... เดือน .................... พ.ศ. ........ เวลา ............. - ............. น. (จำนวน ..... ชั่วโมง x ..... บาท)
            </td>
            <td style="border:1px solid #000; text-align:right; padding:4pt; vertical-align:bottom;">....................</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;" colspan="2"><strong>จำนวนเงินรวมทั้งสิ้น (ตัวอักษร: ...................................................................................................)</strong></td>
            <td style="border:1px solid #000; text-align:right; padding:4pt;"><strong>....................</strong></td>
          </tr>
        </tbody>
      </table>

      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-top:25pt; table-layout:fixed;">
        <tr>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้รับเงิน<br>
          (........................................................)<br>
          วันที่ ...../...../..........
          </td>
          <td style="width:4%; border:none !important; padding:0;">&nbsp;</td>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้จ่ายเงิน<br>
          (........................................................)<br>
          เจ้าหน้าที่การเงิน โรงเรียนมหาชัยพิทยาคาร
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'budget_project_proposal',
    dept: 'budget',
    title: 'แบบเสนอขออนุมัติโครงการตามแผนปฏิบัติการประจำปี',
    desc: 'แบบเสนอโครงการโรงเรียนตามมาตรฐานแผนปฏิบัติการ (Action Plan) พร้อมตารางงบประมาณและตัวชี้วัด',
    format: 'Word (.doc)',
    icon: 'bxs-folder-plus',
    tags: ["เสนอโครงการ", "แผนปฏิบัติการ", "Action Plan", "งบประมาณ", "แผนงาน"],
    summary: 'แบบฟอร์มจัดทำโครงการสถานศึกษา ระบุหลักการ เหตุผล วัตถุประสงค์ ตัวชี้วัด และการประมาณการงบประมาณ',
    docBody: `
<div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:4pt; line-height:1.3;">
        แบบเสนอขออนุมัติโครงการตามแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. ............
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:12pt; color:#222;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:15pt; font-weight:normal;">โรงเรียนมหาชัยพิทยาคาร สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม</span>
      </div>
      <hr style="border:none; border-top:1px solid #000; margin:6pt 0 12pt 0;">
      <p class="no-indent"><strong>1. ชื่อโครงการ:</strong> ....................................................................................................................................................</p>
      <p class="no-indent"><strong>2. กลุ่มงาน / ฝ่ายที่รับผิดชอบ:</strong> ............................................................................ <strong>ผู้รับผิดชอบโครงการ:</strong> ..............................................................</p>
      <p class="no-indent"><strong>3. ความสอดคล้องกับยุทธศาสตร์:</strong> กลยุทธ์ สพฐ. ที่ ..... กลยุทธ์โรงเรียนมหาชัยพิทยาคาร ที่ .....</p>
      <hr style="border:none; border-top:1px dashed #666; margin:6pt 0;">

      <p class="no-indent"><strong>4. หลักการและเหตุผล:</strong></p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>5. วัตถุประสงค์:</strong></p>
      <p>1) เพื่อ .............................................................................................................................................................................<br>
      2) เพื่อ .............................................................................................................................................................................</p>

      <p class="no-indent"><strong>6. เป้าหมายของโครงการ:</strong></p>
      <p>เชิงปริมาณ: นักเรียน/ครู เข้าร่วมกิจกรรมจำนวน ..... คน คิดเป็นร้อยละ .....<br>
      เชิงคุณภาพ: ผู้เข้าร่วมโครงการมีความพึงพอใจและมีผลสัมฤทธิ์ในระดับ ดี ขึ้นไป ร้อยละ .....</p>

      <p class="no-indent"><strong>7. รายละเอียดงบประมาณจำแนกตามหมวดรายจ่าย:</strong></p>
      <table style="width:100%; border-collapse:collapse; margin:4pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:10%;">หมวด</th>
            <th style="border:1px solid #000; padding:4pt; width:55%;">รายการค่าใช้จ่าย</th>
            <th style="border:1px solid #000; padding:4pt; width:20%;">จำนวนเงิน (บาท)</th>
            <th style="border:1px solid #000; padding:4pt; width:15%;">แหล่งเงิน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; padding:3pt;">ค่าตอบแทน (วิทยากร / คณะทำงาน)</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">....................</td>
            <td style="border:1px solid #000; text-align:center;">เงินอุดหนุน</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">2</td>
            <td style="border:1px solid #000; padding:3pt;">ค่าใช้สอย (อาหารว่าง เครื่องดื่ม ค่าเช่าสถานที่)</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">....................</td>
            <td style="border:1px solid #000; text-align:center;">เงินอุดหนุน</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">3</td>
            <td style="border:1px solid #000; padding:3pt;">ค่าวัสดุ (เอกสาร อุปกรณ์กิจกรรม ป้ายโครงการ)</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">....................</td>
            <td style="border:1px solid #000; text-align:center;">เงินอุดหนุน</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;" colspan="2"><strong>รวมงบประมาณทั้งสิ้น</strong></td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;"><strong>....................</strong></td>
            <td style="border:1px solid #000;">&nbsp;</td>
          </tr>
        </tbody>
      </table>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้เสนอโครงการ<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้างานแผนงานและงบประมาณ</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารงบประมาณ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'budget_project_eval',
    dept: 'budget',
    title: 'แบบรายงานผลและประเมินผลโครงการ (Project Evaluation)',
    desc: 'แบบสรุปรายงานผลการดำเนินโครงการ การบรรลุเป้าหมาย และการประเมินความคุ้มค่างบประมาณ',
    format: 'Word (.doc)',
    icon: 'bxs-pie-chart-alt-2',
    tags: ["สรุปโครงการ", "ประเมินโครงการ", "งบประมาณ", "แผนงาน", "รายงานผล"],
    summary: 'แบบรายงานผลหลังดำเนินโครงการ สรุปการใช้จ่ายงบประมาณ ปัญหา อุปสรรค และผลความพึงพอใจ',
    docBody: `
<div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:4pt; line-height:1.3;">
        แบบรายงานผลและประเมินผลการดำเนินงานโครงการ
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:12pt; color:#222;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:15pt; font-weight:normal;">ประจำปีงบประมาณ พ.ศ. ............ โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <hr style="border:none; border-top:1px solid #000; margin:6pt 0 12pt 0;">
      <p class="no-indent"><strong>ชื่อโครงการ:</strong> ....................................................................................................................................................</p>
      <p class="no-indent"><strong>ผู้รับผิดชอบโครงการ:</strong> .............................................................. <strong>ฝ่าย/กลุ่มงาน:</strong> ..............................................................</p>
      <p class="no-indent"><strong>ระยะเวลาดำเนินการ:</strong> วันที่ ..... ถึง ..... เดือน .................... พ.ศ. ........ <strong>สถานที่จัด:</strong> ....................................................</p>
      <hr style="border:none; border-top:1px dashed #666; margin:6pt 0;">

      <p class="no-indent"><strong>1. สรุปผลการบรรลุเป้าหมายตามตัวชี้วัดความสำเร็จ</strong></p>
      <table style="width:100%; border-collapse:collapse; margin:4pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:45%;">ตัวชี้วัดความสำเร็จ</th>
            <th style="border:1px solid #000; padding:4pt; width:20%;">ค่าเป้าหมาย</th>
            <th style="border:1px solid #000; padding:4pt; width:20%;">ผลการดำเนินงานจริง</th>
            <th style="border:1px solid #000; padding:4pt; width:15%;">ผลการประเมิน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; padding:3pt;">1. จำนวนผู้เข้าร่วมกิจกรรม</td>
            <td style="border:1px solid #000; text-align:center;">..... คน</td>
            <td style="border:1px solid #000; text-align:center;">..... คน</td>
            <td style="border:1px solid #000; text-align:center;">( ) บรรลุ ( ) ไม่บรรลุ</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; padding:3pt;">2. ความพึงพอใจของผู้เข้าร่วมโครงการ</td>
            <td style="border:1px solid #000; text-align:center;">ร้อยละ 80</td>
            <td style="border:1px solid #000; text-align:center;">ร้อยละ .....</td>
            <td style="border:1px solid #000; text-align:center;">( ) บรรลุ ( ) ไม่บรรลุ</td>
          </tr>
        </tbody>
      </table>

      <p class="no-indent" style="margin-top:8pt;"><strong>2. สรุปการใช้จ่ายงบประมาณ</strong></p>
      <p>งบประมาณที่ได้รับอนุมัติ: .................... บาท | งบประมาณที่จ่ายจริง: .................... บาท | งบประมาณคงเหลือส่งคืน: .................... บาท</p>

      <p class="no-indent"><strong>3. ปัญหา อุปสรรค และข้อเสนอแนะในการปรับปรุง:</strong></p>
      <p>....................................................................................................................................................................................................</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้รายงานผลโครงการ<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้างานแผนงานและงบประมาณ</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารงบประมาณ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'budget_cct_disbursement',
    dept: 'budget',
    title: 'แบบขออนุมัติเบิกจ่ายเงินปัจจัยพื้นฐานนักเรียนยากจน (CCT)',
    desc: 'แบบขออนุมัติเบิกจ่ายเงินทุนการศึกษา เงินอุดหนุนปัจจัยพื้นฐาน และเงินนักเรียนยากจนพิเศษ กสศ.',
    format: 'Word (.doc)',
    icon: 'bxs-wallet',
    tags: ["CCT", "ปัจจัยพื้นฐาน", "นักเรียนยากจน", "กสศ.", "ทุนการศึกษา", "งบประมาณ"],
    summary: 'แบบฟอร์มขออนุมัติเบิกจ่ายเงินช่วยเหลือนักเรียนยากจนพิเศษ กสศ. พร้อมหลักฐานการจ่ายเงินและรายชื่อนักเรียน',
    docBody: `
<table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-bottom:4pt;">
        <tr>
          <td style="width:22%; vertical-align:bottom; border:none !important; padding:0;">
            <img src="data:image/png;base64,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" style="width:58px; height:auto;" alt="ตราครุฑ">
          </td>
          <td style="width:56%; text-align:center; vertical-align:bottom; border:none !important; padding:0;">
            <span style="font-size:29pt; font-weight:bold; font-family:'TH Sarabun New', sans-serif;">บันทึกข้อความ</span>
          </td>
          <td style="width:22%; border:none !important; padding:0;">&nbsp;</td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0; line-height:1.35;">
        <strong>ส่วนราชการ</strong>&nbsp;&nbsp;โรงเรียนมหาชัยพิทยาคาร ตำบลท่างสองคอน อำเภอเมือง จ.มหาสารคาม ๔๔๐๐๐
      </p>
      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin:2pt 0;">
        <tr>
          <td style="width:55%; border:none !important; padding:0; vertical-align:top;">
            <strong>ที่</strong>&nbsp;&nbsp;................................................................
          </td>
          <td style="width:45%; border:none !important; padding:0; vertical-align:top;">
            <strong>วันที่</strong>&nbsp;&nbsp;.....&nbsp;&nbsp;เดือน&nbsp;&nbsp;....................&nbsp;&nbsp;พ.ศ.&nbsp;&nbsp;............
          </td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0 4pt 0;">
        <strong>เรื่อง</strong>&nbsp;&nbsp;ขออนุมัติเบิกจ่ายเงินอุดหนุนปัจจัยพื้นฐานนักเรียนยากจน / นักเรียนยากจนพิเศษ (กสศ.)
      </p>
      <hr style="border:none; border-top:1.5pt solid #000; margin:4pt 0 8pt 0;">
      <p class="no-indent" style="margin-bottom:8pt;">
        <strong>เรียน</strong>&nbsp;&nbsp;ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร
      </p>
      <p>ด้วย งานระบบดูแลช่วยเหลือนักเรียน โรงเรียนมหาชัยพิทยาคาร ได้รับการจัดสรรเงินอุดหนุนปัจจัยพื้นฐานนักเรียนยากจนพิเศษแบบมีเงื่อนไข จากสำนักงานกองทุนเพื่อความเสมอภาคทางการศึกษา (กสศ.) / สพฐ. ประจำภาคเรียนที่ ..... ปีการศึกษา ............</p>

      <p>เพื่อนำเงินดังกล่าวไปจัดสรรช่วยเหลือเป็นค่าครองชีพ ค่าอาหารกลางวัน และค่าใช้จ่ายในการเรียนของนักเรียนกลุ่มเป้าหมาย มีรายละเอียดการขออนุมัติเบิกจ่ายดังนี้:</p>

      <table style="width:100%; border-collapse:collapse; margin:6pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:10%;">ที่</th>
            <th style="border:1px solid #000; padding:4pt; width:35%;">ระดับชั้น</th>
            <th style="border:1px solid #000; padding:4pt; width:15%;">จำนวนนักเรียน (คน)</th>
            <th style="border:1px solid #000; padding:4pt; width:20%;">อัตราต่อคน (บาท)</th>
            <th style="border:1px solid #000; padding:4pt; width:20%;">รวมเป็นเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; padding:3pt;">มัธยมศึกษาตอนต้น (ม.1 - ม.3)</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">..........</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">....................</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">2</td>
            <td style="border:1px solid #000; padding:3pt;">มัธยมศึกษาตอนปลาย (ม.4 - ม.6)</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">..........</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;">....................</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;" colspan="2"><strong>รวมทั้งสิ้น</strong></td>
            <td style="border:1px solid #000; text-align:center;"><strong>.....</strong></td>
            <td style="border:1px solid #000;">&nbsp;</td>
            <td style="border:1px solid #000; text-align:right; padding:3pt;"><strong>....................</strong></td>
          </tr>
        </tbody>
      </table>
      <p class="no-indent" style="text-align:right;">(ตัวอักษร: ....................................................................................................................)</p>

      <p class="no-indent"><strong>วิธีการจ่ายเงิน:</strong> ( ) โอนเข้าบัญชีเงินฝากธนาคารของผู้ปกครอง&nbsp;&nbsp;( ) จ่ายเป็นเงินสดผ่านคณะกรรมการตามแบบ กสศ.06</p>
      <p>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติการเบิกจ่ายเงินดังกล่าว</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้รับผิดชอบงาน CCT<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้างานระบบดูแลช่วยเหลือนักเรียน</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารงบประมาณ</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'pers_official_leave',
    dept: 'personnel',
    title: 'แบบใบลาข้าราชการและบุคลากร (ลาป่วย / ลากิจ / พักผ่อน)',
    desc: 'แบบใบลามาตรฐานของข้าราชการครูและบุคลากรทางการศึกษา ตามระเบียบสำนักนายกรัฐมนตรี',
    format: 'Word (.doc)',
    icon: 'bxs-id-card',
    tags: ["ใบลา", "ลาป่วย", "ลากิจ", "ลาพักผ่อน", "งานบุคคล", "วันลา"],
    summary: 'แบบฟอร์มการขอลาหยุดราชการ พร้อมตารางสถิติวันลาในรอบปีงบประมาณและข้อมูลผู้ปฏิบัติราชการแทน',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,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" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        แบบใบลาป่วย ลากิจส่วนตัว ลาพักผ่อน
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">ข้าราชการครูและบุคลากรทางการศึกษา</span>
      </div>
      <p class="no-indent" style="text-align:right;">เขียนที่: โรงเรียนมหาชัยพิทยาคาร<br>วันที่ ..... เดือน .................... พ.ศ. ............</p>
      <p class="no-indent"><strong>เรื่อง:</strong> ขอลา ( ) ป่วย&nbsp;&nbsp;( ) กิจส่วนตัว&nbsp;&nbsp;( ) พักผ่อน</p>
      <p class="no-indent"><strong>เรียน:</strong> ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร</p>

      <p>ข้าพเจ้า .............................................................. ตำแหน่ง .............................................................. วิทยฐานะ .................................................... สังกัด กลุ่มสาระการเรียนรู้/ฝ่าย .................................................... โรงเรียนมหาชัยพิทยาคาร สพม.มหาสารคาม</p>

      <p>ขอลา ( ) ป่วย ( ) กิจส่วนตัว ( ) พักผ่อน เนื่องจาก .................................................................................................................... ตั้งแต่วันที่ ..... เดือน .................... พ.ศ. ........ ถึงวันที่ ..... เดือน .................... พ.ศ. ........ มีกำหนด ..... วันทำการ</p>
      <p>ข้าพเจ้าได้ลา ( ) ป่วย ( ) กิจส่วนตัว ครั้งสุดท้ายตั้งแต่วันที่ ..... เดือน .................... พ.ศ. ........ ถึงวันที่ ..... เดือน .................... พ.ศ. ........ มีกำหนด ..... วัน ในระหว่างลาสามารถติดต่อข้าพเจ้าได้ที่ บ้านเลขที่ .................... หมู่ที่ ..... ตำบล ........................................ อำเภอ ........................................ จังหวัด ........................................ โทรศัพท์ ........................................</p>

      <p>และในระหว่างการลา ได้มอบหมายให้ .............................................................. ตำแหน่ง .................................................... ปฏิบัติหน้าที่ราชการแทน</p>

      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-top:15pt; table-layout:fixed;">
        <tr>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้ปฏิบัติหน้าที่แทน<br>
          (........................................................)<br>
          วันที่ ...../...../..........
          </td>
          <td style="width:4%; border:none !important; padding:0;">&nbsp;</td>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้ขอลา<br>
          (........................................................)<br>
          วันที่ ...../...../..........
          </td>
        </tr>
      </table>

      <p class="no-indent" style="margin-top:12pt;"><strong>สถิติการลาในรอบปีงบประมาณนี้ (ตรวจสอบโดยเจ้าหน้าที่งานบุคคล):</strong></p>
      <table style="width:100%; border-collapse:collapse; margin:4pt 0; font-size:13pt;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt;">ประเภทการลา</th>
            <th style="border:1px solid #000; padding:4pt;">ลามาแล้ว (วันทำการ)</th>
            <th style="border:1px solid #000; padding:4pt;">ลาครั้งนี้ (วันทำการ)</th>
            <th style="border:1px solid #000; padding:4pt;">รวมเป็น (วันทำการ)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; padding:3pt;">( ) ป่วย</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; padding:3pt;">( ) กิจส่วนตัว</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; padding:3pt;">( ) พักผ่อน</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
            <td style="border:1px solid #000; text-align:center;">..........</td>
          </tr>
        </tbody>
      </table>

      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-top:15pt; table-layout:fixed; font-size:14pt;">
        <tr>
          <td style="width:48%; text-align:center; vertical-align:top; border:1px solid #000; padding:6pt;">
            <strong>ความเห็นผู้บังคับบัญชาชั้นต้น:</strong><br>
          ( ) เห็นควรอนุญาต&nbsp;&nbsp;( ) อื่นๆ ....................<br><br>
          ลงชื่อ..............................................................<br>
          (..............................................................)<br>
          ตำแหน่ง หัวหน้ากลุ่มสาระฯ/หัวหน้างาน<br>
          วันที่ ...../...../..........
          </td>
          <td style="width:4%; border:none !important; padding:0;">&nbsp;</td>
          <td style="width:48%; text-align:center; vertical-align:top; border:1px solid #000; padding:6pt;">
            <strong>คำสั่งผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร:</strong><br>
          ( ) อนุญาต&nbsp;&nbsp;( ) ไม่อนุญาต<br><br>
          ลงชื่อ..............................................................<br>
          (นายอธิการ สุขศรี)<br>
          ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
          วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'pers_duty_memo',
    dept: 'personnel',
    title: 'บันทึกข้อความขออนุมัติไปราชการ / ประชุม / อบรม',
    desc: 'แบบบันทึกข้อความขออนุมัติเดินทางไปราชการ ประชุม สัมมนา หรือพัฒนาตนเองนอกสถานที่',
    format: 'Word (.doc)',
    icon: 'bxs-briefcase',
    tags: ["ไปราชการ", "อบรม", "ประชุมสัมมนา", "พัฒนาตนเอง", "งานบุคคล"],
    summary: 'แบบบันทึกข้อความมาตรฐานราชการ ขออนุมัติไปปฏิบัติหน้าที่ราชการ พร้อมระบุสิทธิ์การขอเบิกจ่ายงบประมาณและการใช้ยานพาหนะ',
    docBody: `
<table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-bottom:4pt;">
        <tr>
          <td style="width:22%; vertical-align:bottom; border:none !important; padding:0;">
            <img src="data:image/png;base64,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" style="width:58px; height:auto;" alt="ตราครุฑ">
          </td>
          <td style="width:56%; text-align:center; vertical-align:bottom; border:none !important; padding:0;">
            <span style="font-size:29pt; font-weight:bold; font-family:'TH Sarabun New', sans-serif;">บันทึกข้อความ</span>
          </td>
          <td style="width:22%; border:none !important; padding:0;">&nbsp;</td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0; line-height:1.35;">
        <strong>ส่วนราชการ</strong>&nbsp;&nbsp;โรงเรียนมหาชัยพิทยาคาร ตำบลท่างสองคอน อำเภอเมือง จ.มหาสารคาม ๔๔๐๐๐
      </p>
      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin:2pt 0;">
        <tr>
          <td style="width:55%; border:none !important; padding:0; vertical-align:top;">
            <strong>ที่</strong>&nbsp;&nbsp;................................................................
          </td>
          <td style="width:45%; border:none !important; padding:0; vertical-align:top;">
            <strong>วันที่</strong>&nbsp;&nbsp;.....&nbsp;&nbsp;เดือน&nbsp;&nbsp;....................&nbsp;&nbsp;พ.ศ.&nbsp;&nbsp;............
          </td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0 4pt 0;">
        <strong>เรื่อง</strong>&nbsp;&nbsp;ขออนุมัติเดินทางไปปฏิบัติราชการ / เข้าร่วมการประชุมสัมมนา / อบรมพัฒนาวิชาชีพ
      </p>
      <hr style="border:none; border-top:1.5pt solid #000; margin:4pt 0 8pt 0;">
      <p class="no-indent" style="margin-bottom:8pt;">
        <strong>เรียน</strong>&nbsp;&nbsp;ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร
      </p>
      <p>ด้วย ข้าพเจ้า .............................................................. ตำแหน่ง .............................................................. วิทยฐานะ .................................................... สังกัด กลุ่มสาระการเรียนรู้/ฝ่าย .................................................... ได้รับหนังสือเชิญ / มอบหมายจาก ................................................................................. ให้เข้าร่วมกิจกรรม/การประชุม/อบรม เรื่อง ................................................................................................................................................................. ณ ................................................................................. ในวันที่ ..... เดือน .................... พ.ศ. ........ ถึงวันที่ ..... เดือน .................... พ.ศ. ........ รวมเป็นเวลา ..... วัน</p>

      <p class="no-indent">ในการเดินทางไปปฏิบัติราชการครั้งนี้ ข้าพเจ้ามีความประสงค์ขออนุมัติ:</p>
      <p><strong>1. การเบิกจ่ายงบประมาณ:</strong><br>
      ( ) ขอเบิกค่าใช้จ่ายในการเดินทางไปราชการตามระเบียบ จากงบพัฒนาบุคลากร โรงเรียนมหาชัยพิทยาคาร<br>
      ( ) หน่วยงานผู้จัดเป็นผู้รับผิดชอบค่าใช้จ่ายทั้งหมด<br>
      ( ) ไม่ขอเบิกค่าใช้จ่ายในการเดินทางไปราชการแต่อย่างใด</p>

      <p><strong>2. พาหนะในการเดินทาง:</strong><br>
      ( ) รถยนต์ส่วนบุคคล หมายเลขทะเบียน ......................... เนื่องจากมีความจำเป็นเร่งด่วนและเพื่อความคล่องตัวในการปฏิบัติงาน<br>
      ( ) รถโดยสารประจำทาง&nbsp;&nbsp;&nbsp;&nbsp;( ) รถยนต์ส่วนกลางของโรงเรียน</p>

      <p><strong>3. การจัดการเรียนการสอน:</strong><br>
      ( ) ได้จัดทำแบบขออนุญาตสอนแทนแนบมาพร้อมนี้&nbsp;&nbsp;&nbsp;&nbsp;( ) มอบหมายใบงานไว้ล่วงหน้า&nbsp;&nbsp;&nbsp;&nbsp;( ) ตรงกับวันหยุดราชการ</p>

      <p>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติให้ไปปฏิบัติราชการตามกำหนดเวลาดังกล่าว</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้ขออนุมัติ<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้าฝ่ายวิชาการ (การสอนแทน)</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารงานบุคคล</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'pers_duty_report',
    dept: 'personnel',
    title: 'แบบรายงานผลการไปราชการและการขยายผล',
    desc: 'แบบสรุปรายงานผลหลังเสร็จสิ้นการไปปฏิบัติราชการ อบรม สัมมนา และแนวทางการขยายผล',
    format: 'Word (.doc)',
    icon: 'bxs-file',
    tags: ["รายงานไปราชการ", "ขยายผล", "อบรมสัมมนา", "PLC", "งานบุคคล"],
    summary: 'เอกสารรายงานสิ่งที่ได้เรียนรู้จากการไปราชการ ประโยชน์ที่ได้รับ และแนวทางนำมาประยุกต์ใช้ในโรงเรียนมหาชัยพิทยาคาร',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,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" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        แบบรายงานผลการเดินทางไปปฏิบัติราชการ / อบรมสัมมนา
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">โรงเรียนมหาชัยพิทยาคาร สพม.มหาสารคาม</span>
      </div>
      <p class="no-indent"><strong>ชื่อผู้รายงาน:</strong> ............................................................................ <strong>ตำแหน่ง:</strong> ..............................................................</p>
      <p class="no-indent"><strong>หัวข้อการประชุม/อบรม:</strong> ....................................................................................................................................................</p>
      <p class="no-indent"><strong>หน่วยงานผู้จัด:</strong> ......................................................... <strong>สถานที่จัด:</strong> .............................................................</p>
      <p class="no-indent"><strong>ระยะเวลา:</strong> วันที่ ..... ถึง ..... เดือน .................... พ.ศ. ........ รวม ..... วัน</p>
      <p class="no-indent"><strong>ตามหนังสืออนุมัติไปราชการ ที่:</strong> ................................................................ ลงวันที่ ...../...../..........</p>
      <hr style="border:none; border-top:1px dashed #666; margin:8pt 0;">

      <p class="no-indent"><strong>1. สรุปสาระสำคัญและองค์ความรู้ที่ได้รับ:</strong></p>
      <p>....................................................................................................................................................................................................</p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>2. ประโยชน์ที่ได้รับต่อตนเองและการจัดการเรียนรู้:</strong></p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>3. ประโยชน์ที่ได้รับต่อสถานศึกษาและการพัฒนาองค์กร:</strong></p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>4. แผนการนำความรู้มาขยายผลและต่อยอด (Action Plan / PLC):</strong></p>
      <p>( ) จัดกิจกรรม PLC ขยายผลให้แก่ครูในกลุ่มสาระการเรียนรู้ ในวันที่ ...../...../..........<br>
      ( ) ผลิตสื่อนวัตกรรมการจัดการเรียนรู้เพื่อนำไปใช้ในห้องเรียน<br>
      ( ) นำเสนอผลการอบรมในการประชุมครูประจำเดือนของโรงเรียน</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้รายงาน<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้ากลุ่มบริหารงานบุคคล</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารงานบุคคล</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'pers_pa_agreement',
    dept: 'personnel',
    title: 'แบบข้อตกลงในการพัฒนางาน (PA - Performance Agreement)',
    desc: 'แบบข้อตกลงในการพัฒนางานตามเกณฑ์ ว.PA ของข้าราชการครูและบุคลากรทางการศึกษา',
    format: 'Word (.doc)',
    icon: 'bxs-badge-check',
    tags: ["ว.PA", "ข้อตกลงพัฒนางาน", "วิทยฐานะ", "ประเด็นท้าทาย", "งานบุคคล"],
    summary: 'ฟอร์มข้อตกลง PA มาตรฐาน ก.ค.ศ. แบ่งเป็นส่วนภาระงานตามมาตรฐานตำแหน่ง และส่วนประเด็นท้าทายในการพัฒนาผลลัพธ์การเรียนรู้',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,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" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        แบบข้อตกลงในการพัฒนางาน (Performance Agreement: PA)
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">สำหรับข้าราชการครูและบุคลากรทางการศึกษา ประจำปีงบประมาณ พ.ศ. ............</span>
      </div>
      <p class="no-indent"><strong>ผู้จัดทำข้อตกลง:</strong> .............................................................. <strong>ตำแหน่ง:</strong> ....................................................</p>
      <p class="no-indent"><strong>วิทยฐานะ:</strong> .............................................................. <strong>กลุ่มสาระการเรียนรู้:</strong> .................................................</p>
      <p class="no-indent"><strong>รับเงินเดือนในอันดับ:</strong> .................... <strong>อัตราเงินเดือน:</strong> .................... บาท</p>
      <hr style="border:none; border-top:1px dashed #666; margin:8pt 0;">

      <p class="no-indent"><strong>ส่วนที่ 1: ข้อตกลงในการพัฒนางานตามมาตรฐานตำแหน่ง (ภาระงานสอน ..... คาบ/สัปดาห์)</strong></p>
      <p><strong>1. ด้านการจัดการเรียนรู้:</strong> สร้างและพัฒนาหลักสูตร, ออกแบบหน่วยการเรียนรู้, จัดกิจกรรมการเรียนรู้แบบ Active Learning, พัฒนาสื่อ นวัตกรรม เทคโนโลยี และการวัดประเมินผล</p>
      <p><strong>2. ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้:</strong> จัดทำข้อมูลสารสนเทศของผู้เรียนและรายวิชา, ดำเนินการตามระบบดูแลช่วยเหลือนักเรียน, งานประสานความร่วมมือกับผู้ปกครอง</p>
      <p><strong>3. ด้านการพัฒนาตนเองและวิชาชีพ:</strong> พัฒนาตนเองอย่างเป็นระบบและต่อเนื่อง (การอบรม PD), มีส่วนร่วมในชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) เพื่อแก้ปัญหาการจัดการเรียนรู้</p>

      <p class="no-indent" style="margin-top:12pt;"><strong>ส่วนที่ 2: ข้อตกลงในการพัฒนางานที่เป็นประเด็นท้าทาย (Challenge Issue)</strong></p>
      <p><strong>ชื่อประเด็นท้าทาย:</strong> เรื่อง ....................................................................................................................................................</p>
      <p><strong>1. สภาพปัญหาการจัดการเรียนรู้และคุณภาพการเรียนรู้ของผู้เรียน:</strong> ................................................................................</p>
      <p><strong>2. วิธีการดำเนินการให้บรรลุผล:</strong> ใช้รูปแบบ/นวัตกรรม .....................................................................................................</p>
      <p><strong>3. ผลลัพธ์การพัฒนาที่คาดหวัง:</strong><br>
      - เชิงปริมาณ: ผู้เรียนร้อยละ ..... มีผลสัมฤทธิ์ทางการเรียนตามเกณฑ์มาตรฐาน<br>
      - เชิงคุณภาพ: ผู้เรียนเกิดทักษะและสมรรถนะสำคัญตามหลักสูตรอย่างเป็นรูปธรรม</p>

      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-top:25pt; table-layout:fixed;">
        <tr>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้จัดทำข้อตกลง<br>
          (........................................................)<br>
          ตำแหน่ง ....................................................<br>
          วันที่ ...../...../..........
          </td>
          <td style="width:4%; border:none !important; padding:0;">&nbsp;</td>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้รับข้อตกลง<br>
          (นายอธิการ สุขศรี)<br>
          ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
          วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'pers_guard_shift_swap',
    dept: 'personnel',
    title: 'แบบขออนุมัติสับเปลี่ยนการปฏิบัติหน้าที่เวรยาม',
    desc: 'แบบคำขอสับเปลี่ยนหน้าที่อยู่เวรรักษาการณ์สถานที่ราชการ (เวรกลางวัน / เวรกลางคืน)',
    format: 'Word (.doc)',
    icon: 'bxs-shield',
    tags: ["สลับเวร", "เวรยาม", "รักษาการณ์", "งานบุคคล", "ความปลอดภัย"],
    summary: 'เอกสารขอสับเปลี่ยนเวรรักษาการณ์พร้อมลายมือชื่อผู้ยินยอมเข้าเวรแทน เพื่อความปลอดภัยของสถานศึกษา',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,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" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        แบบขออนุมัติสับเปลี่ยนการปฏิบัติหน้าที่เวรรักษาการณ์สถานที่ราชการ
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <p class="no-indent" style="text-align:right;">วันที่ ..... เดือน .................... พ.ศ. ............</p>
      <p class="no-indent"><strong>เรื่อง:</strong> ขออนุมัติสับเปลี่ยนหน้าที่การอยู่เวรรักษาการณ์สถานที่ราชการ</p>
      <p class="no-indent"><strong>เรียน:</strong> ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร</p>

      <p>ตามคำสั่งโรงเรียนมหาชัยพิทยาคาร ที่ ..................../.................... ลงวันที่ ...../...../.......... เรื่อง แต่งตั้งบุคลากรอยู่เวรรักษาการณ์สถานที่ราชการประจำเดือน ........................................ พ.ศ. ............ นั้น</p>

      <p>ข้าพเจ้า .............................................................. ตำแหน่ง .............................................................. มีหน้าที่ปฏิบัติเวรรักษาการณ์ ( ) เวรกลางวัน ( ) เวรกลางคืน ประจำจุด .................................................... ในวันที่ ..... เดือน .................... พ.ศ. ........ มีความจำเป็นเนื่องจาก ................................................................................. จึงไม่สามารถปฏิบัติหน้าที่ได้</p>

      <p>ข้าพเจ้าได้ตกลงสับเปลี่ยนหน้าที่เวรรักษาการณ์กับ .............................................................. ตำแหน่ง .............................................................. ซึ่งมีหน้าที่เข้าเวรในวันที่ ..... เดือน .................... พ.ศ. ........ โดยข้าพเจ้าทั้งสองฝ่ายได้ยินยอมสับเปลี่ยนหน้าที่ซึ่งกันและกัน และขอรับรองว่าจะปฏิบัติหน้าที่ดูแลรักษาความปลอดภัยของสถานที่ราชการอย่างเคร่งครัด</p>

      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-top:20pt; table-layout:fixed;">
        <tr>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้ขอเปลี่ยนเวร<br>
          (........................................................)<br>
          วันที่ ...../...../..........
          </td>
          <td style="width:4%; border:none !important; padding:0;">&nbsp;</td>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้ยินยอมเปลี่ยนเวร<br>
          (........................................................)<br>
          วันที่ ...../...../..........
          </td>
        </tr>
      </table>

      <div style="margin-top:20pt; border:1px solid #000; padding:8pt; font-size:14pt;">
        <strong>คำสั่งผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร:</strong> ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br><br>
        <div style="text-align:center;">
          ลงชื่อ..............................................................ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
          (นายอธิการ สุขศรี)<br>
          วันที่ ..... เดือน .................... พ.ศ. ........
        </div>
      </div>
    `
  },
  {
    id: 'pers_cert_request',
    dept: 'personnel',
    title: 'แบบขอหนังสือรับรองเงินเดือน / หนังสือรับรองการทำงาน',
    desc: 'แบบคำร้องขอให้ออกหนังสือรับรองเงินเดือน หรือหนังสือรับรองการเป็นบุคลากรของโรงเรียน',
    format: 'Word (.doc)',
    icon: 'bxs-certification',
    tags: ["รับรองเงินเดือน", "รับรองการทำงาน", "ธุรกรรม", "ขอหนังสือรับรอง", "งานบุคคล"],
    summary: 'แบบฟอร์มคำขอหนังสือรับรองเพื่อนำไปใช้ประกอบการติดต่อธนาคาร ศึกษาต่อ หรือทำธุรกรรมทางการเงิน',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,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" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        แบบคำร้องขอหนังสือรับรอง (เงินเดือน / การปฏิบัติงาน)
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <p class="no-indent" style="text-align:right;">วันที่ ..... เดือน .................... พ.ศ. ............</p>
      <p class="no-indent"><strong>เรื่อง:</strong> ขอหนังสือรับรอง ( ) เงินเดือน&nbsp;&nbsp;( ) การปฏิบัติงาน/การทำงาน</p>
      <p class="no-indent"><strong>เรียน:</strong> ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร</p>

      <p>ข้าพเจ้า .............................................................. เลขประจำตัวประชาชน: <strong>[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</strong><br>
      ตำแหน่ง .............................................................. วิทยฐานะ .................................................... สังกัด โรงเรียนมหาชัยพิทยาคาร สพม.มหาสารคาม เริ่มปฏิบัติราชการเมื่อวันที่ ..... เดือน .................... พ.ศ. ........ รวมเวลารับราชการ ..... ปี ..... เดือน ได้รับเงินเดือนอันดับ .................... อัตราเงินเดือน .................... บาท เงินวิทยฐานะ/ค่าตอบแทน .................... บาท</p>

      <p class="no-indent">มีความประสงค์ขอรับหนังสือรับรอง ดังนี้:</p>
      <p>( ) หนังสือรับรองเงินเดือน (ระบุรายได้ เงินประจำตำแหน่ง และเงินเพิ่มพิเศษ) จำนวน ..... ฉบับ<br>
      ( ) หนังสือรับรองการปฏิบัติงาน / สถานภาพการเป็นบุคลากร จำนวน ..... ฉบับ<br>
      ( ) หนังสือรับรองภาษาอังกฤษ (Certificate of Employment) จำนวน ..... ฉบับ</p>

      <p>เพื่อนำไปใช้ประโยชน์ในเรื่อง: ( ) ยื่นขอสินเชื่อธนาคาร/สถาบันการเงิน ........................................ ( ) ศึกษาต่อ ( ) ยื่นขอวีซ่า ( ) อื่นๆ ....................................................................................................</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้ยื่นคำร้อง<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <div style="margin-top:15pt; border:1px solid #000; padding:8pt; font-size:14pt;">
        <strong>การตรวจสอบของงานบุคคล:</strong> ได้ตรวจสอบข้อมูลแล้ว ถูกต้องตามทะเบียนประวัติ ออกหนังสือรับรองเลขที่ ..................../....................<br><br>
        <strong>คำสั่ง / การอนุมัติ:</strong> ( ) อนุมัติและลงนามแล้ว&nbsp;&nbsp;( ) ไม่อนุมัติ<br><br>
        <div style="text-align:center;">
          ลงชื่อ..............................................................ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
          (นายอธิการ สุขศรี)<br>
          วันที่ ..... เดือน .................... พ.ศ. ........
        </div>
      </div>
    `
  },
  {
    id: 'pers_late_justification',
    dept: 'personnel',
    title: 'แบบบันทึกเหตุผลความจำเป็นกรณีมาปฏิบัติราชการสาย',
    desc: 'แบบชี้แจงเหตุผลความจำเป็นในการลงเวลาปฏิบัติราชการล่าช้าตามระเบียบงานบุคคล',
    format: 'Word (.doc)',
    icon: 'bxs-alarm-exclamation',
    tags: ["มาสาย", "ชี้แจงมาสาย", "ลงเวลา", "ระเบียบวินัย", "งานบุคคล"],
    summary: 'เอกสารชี้แจงเหตุจำเป็นกรณีลงเวลาปฏิบัติงานล่าช้าเพื่อเสนอผู้บริหารพิจารณาบันทึกในประวัติการลงเวลา',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,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" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        แบบบันทึกเหตุผลความจำเป็นกรณีมาปฏิบัติราชการสาย
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <p class="no-indent" style="text-align:right;">วันที่ ..... เดือน .................... พ.ศ. ............</p>
      <p class="no-indent"><strong>เรื่อง:</strong> ชี้แจงเหตุผลความจำเป็นกรณีมาปฏิบัติราชการสาย</p>
      <p class="no-indent"><strong>เรียน:</strong> ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร</p>

      <p>ข้าพเจ้า .............................................................. ตำแหน่ง .............................................................. กลุ่มสาระการเรียนรู้/ฝ่าย .................................................... ได้มาลงเวลาปฏิบัติราชการในวันที่ ..... เดือน .................... พ.ศ. ........ เวลา ............. น. ซึ่งถือเป็นการมาปฏิบัติราชการสายเกินเวลาที่สถานศึกษากำหนด</p>

      <p>ข้าพเจ้าขอชี้แจงเหตุผลความจำเป็นตามความเป็นจริง เนื่องจาก ........................................................................................................................................................................................................................................................................................................................</p>

      <p>ทั้งนี้ ในช่วงเวลาดังกล่าว ข้าพเจ้ามิได้ละทิ้งหน้าที่การสอน และได้ ( ) มอบหมายงานแก่นักเรียนไว้ล่วงหน้า ( ) มีครูสอนแทน ( ) จัดการสอนชดเชยเรียบร้อยแล้ว จึงใคร่ขอความอนุเคราะห์โปรดพิจารณาผ่อนผันและรับรองเวลาการปฏิบัติราชการในครั้งนี้</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้ชี้แจง<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้ากลุ่มสาระการเรียนรู้ / หัวหน้างาน</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. การบันทึกสถิติของเจ้าหน้าที่งานบุคคล</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'gen_vehicle_request',
    dept: 'general',
    title: 'แบบฟอร์มขออนุญาตใช้ยานพาหนะของโรงเรียน',
    desc: 'แบบขออนุมัติใช้รถตู้ รถยนต์ หรือรถบัสของโรงเรียนในการเดินทางไปปฏิบัติราชการหรือพานักเรียนไปกิจกรรม',
    format: 'Word (.doc)',
    icon: 'bxs-car',
    tags: ["ขอใช้รถ", "ยานพาหนะ", "รถตู้โรงเรียน", "เดินทาง", "ทั่วไป"],
    summary: 'แบบฟอร์มขออนุมัติการใช้ยานพาหนะส่วนกลางของสถานศึกษา พร้อมกำหนดการเดินทาง เส้นทาง และจำนวนผู้โดยสาร',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE4AAABWCAYAAABhL6DrAAAQAElEQVR4AezcBbScV9UG4PNerHjw4i3uBHcoXjy4Q/HixYu3uBPcpbhT3CG4S3Gnxb3FPfnn2ZMz+e7k5mZmbkr+tUrW2nPc9tl+vpul9r9/C2FgacvUvyOPPHLLF7/4xS2j2bZs3rx5qvWYUdy8efOWE5zgBFv22GOPLX//+9+3O/QIN21CcaNW5Xayk52sXeQiF2k3vvGNW5KqO6b9JGlHHXVUGyGtrVu3bsXjTxD3pz/9qRD1yU9+sl3hCldob3jDG1YccEypPM5xjtP22Weftvfee7cPfvCD2x27EIfaIOxb3/pWu8xlLtPe+973btfxmFjxnve8p8HJGc94xvbud797GQoKcUnaNa95zXauc52rGv/zn/9Uekz/6Xg4+9nP3t7ylrcsQ0ch7qIXvWi74Q1vOEHcsh7/K7STnvSk7SUveckyTBTi/vrXv7bjHve47S9/+cuyxt1Z+NznPrc7l1+29kMe8pB2q1vdqu25556T+qXPfOYzxcevfe1r209/+tNJw+7OXOISl9jdW5isf6973au96lWvKoujVy7tscce7YADDmgbNmxoJz7xiav+hCc8YaMwqjDjzxOe8IQZe87Wbf369e3Rj370bJ1n6PXgBz+4PfCBD5yh57YuBx98cBXg49rXvna76lWv2jZt2lR1Sxe60IWaSX/+85+3P/7xj1WZpEyTKuzk55znPGf1NUcyHnfPe96z/fvf/97JyNWbXeQjH/nI1Tut0mp9+0jGe3KxT37yk2uvn/70p1sX/KtM0Z7+9Ke3W9ziFu3Pf/5ze+c739ke9KAH1Xhjlu5+97vXJGSKDjpqeN/73idZBne+853bj370o6ojLJO07373u1X2w4w5/vGP35797Gc3dpC6RSBJyVxU/9nPfnaRKWp9+zD4bne7W9u4caNsHfzSl750O8lJTlKX6zzOVY2DH+eH/H/9619taWlp0DLOLvEQNm/eXCWIu+xlL9ts+BWveEXVDX9e9KIXtXOc4xy1+B3veMdJ001ucpMas++++zYLGd9h0mnODAoeuT3t85///JwjW+2lr28/z33ucxu263UQQSG63POe97zNuaYXeeUrX9n+9re/tStd6Uoryv5CpYkMvMMd7tAg4da3vnU78sgjVW0HrOjHPOYxVc89U7ahjRs3NtRho8o6JJHMBH3Mu971rmILg2h5Ho38PJBsW/fYxz52IfLAAw9sZzvb2doTn/jE9oUvfKGmc46vf/3r7QUveEGV/bztbW9rt7zlLYs4cM/tb3/7RhxpG0IhbuTYtw9/+MNlHZ/iFKdoH/vYx9r1r3/9Gny7292u+juYg5CFD33oQ+smfv/737eb3/zm7UQnOlEpmItf/OLVN9m28aqY4SdJrXfUyEckiK11xBFHlNy1ptufYZoddqEYvv/975ec+sc//lHIdA6X7ax9INn6iU98op3lLGdpDF9mmjYX8Itf/EK2YEmFw1/qUpdqH/nIR9qNbnSjZsMEqx4vf/nL2w1ucIM61LGOdaxmUfUf+tCHmtsiMF/60peqWjOc/OQnb/e5z31KpriMvfbaqxHqpz/96duhhx665vld/ne+852iqD5Zknad61ynFyvlEDz2sY8t+f3Vr361veMd7ygqvdjFLlayV6cRly41jcySs571rO3Nb35zRQXwuA7St771rbJNn/3226/yfs5//vMXZcqvFQ455JCa/41vfGMjc+0Da1mzH3itaySZyOg+181udrMiAOUkZa9xr9i1qPywww4rxD784Q/XZQLFqkqsY2wif8lLXrLCSoxj5Im6UAM21t7BwZB0L8+bQkgfA0E/+9nPKjKTpKj8e9/7XiFRH8JdCq573etKFgaXMxxs7ac85SlFYfbg3JTmBS94wYqMcPSH/eUniPvyl7/cUBCBD8vkDOudbKBZrnjFKxYLGdRhePBeN0+ajOUaSnfzybhs3h//+MclHpgESdr5zne+CbX85Cc/mWeZ7fqyXU93utNN6omgUfC25id6nJvJ8oEPfKA95znPaYIfv/nNbyb9ZSaIo/7PcIYzNAJfA+127nOfW7YGIt8RX1e5/zhgz8+busWurYS0GKfDOc585jNXEdvKHH744UUR17jGNcpFJPfULwIuCbcYy9z57W9/2173utcpFpznPOdpF77whRsZS9ZCMiqsxq0/S31jgpfI1E1DyKlPfer27W9/u7qZSOZXv/pVUUEypgw3pV5/6Twgusp4tsFDDz20EQnD8f1gvY6WTdLEyIgSmra3zZOSW6jr4x//eJ2FJdBxgMv4pQjG2fq5pvdmvSWBy6Gc6jf9wx/+sPXNuRWdp4EMOt7xjlcbmG6btewQtDpWHI4x97DsEAKKtPqmTZsa7hi2z5I3B5ZjlqzU/ytf+Up75jOfWabZM57xjOqCXfmqzBQV3VUrVv3nP/+proAjm6RZ4LSnPW276U1vWpbz1a9+9WpPUmn/MZZ87OV5U0J/3bp15S9z//r4ZPk6j3jEIxrZ46IYrotEcpI0hJEsn9uaV7va1eqc8uxarliSph61Oycu4FnpU4gjbAl/0RF+nYa9R7F2aed9vtsf/vCHMhzdHErVjrWxm8XUq5sFeBjMoIMOOqi6u6ih60P9m6+7do961KPa+9///ur7sIc9bCGKoylNYF5AKSkDRq/0gAMOkJQBLPOmN71JUk4Baq/C6KcQN0rL+OXesKKZJuqStKtc5SrlMF/gAheoSCgFkaQR6Pqc6UxnkjTmCrarwgw/qJnC6fIF5dmYA4mKuGWXSIF0l0j0hkNOTs1LcaiZf9q3lqT94Ac/6MXW24ioZEyR9vS4xz2uRBE/HpH0ARPE8dF6pc4OoMyGQx1uXLkfVJ5a10+7lGXdN6B9NSCvXvziF9emzIkNCGSON6t948aN5XwzD+5yl7tMpkI1rP9+cZOGHWTsJ0mZFUJD9grIyZWGvP3tb69q1O8Cv/SlLxWXDfGjwwRxXC8VwktStgtkQI4y4TgxGUYVd7rTnZpJR9lmrL6ogCDdkTLRdwgM6iRlHzIRIJLdBl72spdV2AdSOdvPe97zGo33rGc9qz3+8Y9vZF3byT/7sB/7sr8ktVcXxF7twzn+Pe+8+vaQVK83puelS34A8scK1DNEuFVsCUHaDXzAAx4gW4u7kSps/UnS2FYWNQe2c+itzSsm+vITIVCURSTC2uC2t71trZOkQlV3vetdG6dcn/vd734VQ1xx0q2V1rcPa9hXMmY/zUkar8A6IiFPe9rT2n3ve9/mjM6bpHECtOsPD9IhTBDnlUtwD1sQkJx7myVnpPvss0979atf3dwg+WMSrgptY3PKHSDdZvYcPW6gEmq+t02nNPLvfve7EvzmoQywkjmk9uLC1J/mNKdpKJ927VEL8xkntY71hMe4UOZQ36H34yGpIy+ZYi6Cd8TUcF5tgh3Wtu6Bo5DUtLk0QZzOJmbsQRAZwt1QL4RM1kEqIYn01btVLJNsu031gp08kV//+tcNayH/JA37aR+CQKJ1iQEW/POf//ySe5RCkgpfk7kOZdw3vvENyQTsB2ULelrHekwO1Gkfk46jTJKaW1RnVGwCnJDrYhi/9qGeqHDpkE980Kzm1NZhGeJUsugZvljRkxheR300rTYhJrdE2+qfpKhQvi8sPw1MHRrYTbINb3Ob2zRayiE6KxDAoiLDsT2U73sW9cJduAMViNSYF0sRNUl0KdlYmakfiOpVKEgY7Wtf+1oh01m1oVrzOTcTjFKEXG1D2A5xOiepmLyJ73GPe9RjtQn4bVwV7EomscMgq286GW98uEDPM3UYk+w11CFcJRqDTZM0cg7LQIoxtKm+5BNXkDmhnuwRaLXPQ0ahKL61fSYp7ceeBPoOgdIbzuHC2K7f/OY3S9HYD4pfv359DcN1jP5pSqvG0c92iBvVFQWhAhsmU051qlOVoObPMoyF1zm9bDsLQl6yjfLMsRKgqI9+9KPFsmSgPjZn/Gte85oKbTsQf5SBDUFSBjpWclFsL32M5UvTjuQvO1IdkYJi5M0rpZHJRXlAMUgFMogEIgfCnJO5Iyq8//7761LvDpWZ+lkRcSYTTmKkAhuAMAen4lnwPgtARUjcrSWpRZI0yqSvk6TC64ePohsorNeTISx3l0NGQZBXMizEDxW2FlzglfiuxSEJfVRPSZjH3qSAIpGSa+aTT1Js2AW+OvOicsb3ta51rYq4sCFRqXOa+3rXu14FdK1Prhs3DSsijgdgIoqCHHFArpdQkDbCkrwjXwh37EWVW9gCXr2lQJ1o6l6jMDh7TB2weQf0cOIw2J9jz2+l9UQoACEPyQQ4dkNN3kfM0f1G+U996lOSSVhMARVJh2A/2J+hrZ78si6KF4Nzkc5trWlFpH+HFRGnkReQpAKI2IOB6ibcfJKSC/qRNSjO7VkY29B0SUr467MSkJ3cG1r0lKc8ZXNI7x4oIclkCFFgfk5+kmZfLhMCsO6k49YMceLSk9STgGrG/OUvf/kGrEMpsR+14Z4kzSV4qHaGJPWyZQ19VoKllSrV4XUyBCUoO+Qvf/nL5gAOiIzJCmy1bhTdEI5m0aMk/cGOBKu2DsI3NkjoYzMhH1TV26WoGnWTq+Sdg9ubcdqBA0tRKWTLd2A+uXzmkXXEGp2F9UBL60eWUzQoPEk9WiXbLlCfIewQcTqRdVKhJvKHH+emLLLv6PHZBsgmURM3dvDBBzcmhzErAaGrvrOVPMMTQshPcpRR2uWVdhSC4lxSMpaf9oPVkpQM009ZCqFS4OIglyyGPMiHeB4SWUZGameCOAsTy/5FmY1fDVZFnIHY4ojR+6YoLTZkjlic5kPmDGXyjtHIAOVIGzcEVEUTMnI595Dd29lL8kwBstPcqIEiQAHsOLIGpUAYircuuWscZDss9rz3ve9dIiSJpmYu3hCuICcpNhTJbYNEbZScy2E4k9+Xu9zlGnFUE6zys1PEsfYJa6Edt2ODzATmAUM2ST3rWfSpT31qS8ab1hdSre1A2uWvfOUrS7YDiGACOSRqgAwmBjOCWDAfypb2waKzAo7ECopzQUwLfXCIS3QxBD6bkIIiCmhmCsx7MHtUf9ZBkqauz79aulPEGcyaZ7u5IQsxYPmr/b1Vn2nQF4WotxlOuzzhLyWopR0I9S5P1ZFH1pjul2y7GFSjr8uFMHkAEUQJlqPUIBy7M4mwLU+IogOUDXOEjEbpxs8CMyHORK9//eubRVFekvrGRMxM2UZ9pS4FLHp92V9MEe4SI5TMVG8+wnooy5gD6jugFBfUy1J2INNBnqigpOTJ1yc96Un1uWmS1udCibQ2SkSdfG+URp4maWS1aAjzw6ceKN18s8DMiDMZkieHIIcQZ1hiTyyGIrELsAn99fUQQ7CzxMkqYwGNxq5DFfpie+lqQB6hDtTD/NHXBRhrTbJL1ESoSNSGphXhEIbnwtkvlkRp9kCWyQt24grzzQpzIc77IlaDDELbewHL2m0i/65twgAADGRJREFUf8If2IwNOBz1Lp+kUTRJ6tsNBq2IB1mUpHHBaGXgS8wkpTFpOtSkH39ZxIJ5Yk5IRF2+7eAuJalvW7Afz8fliOyI5Ioq25txfGL7T1Kfe0Ai0DYrzIU4k3qTwH5kkNcmm3A4Ny4YCLACW8yN6tM3xftQ77D9EOYEDuoiAAShYvWbNm2qL4xQ5kEHHbTsc1SCHjURI+YFxrD6IQzCURykuShrQCYuwZ72JVpjTBLJzDA34vrMIhJkzgtf+MIKAPBPUZfwk81iDeZAkqIclKQOhfY5pL7s9JaJipWBQ5Jb8uxGKbCWvmQV7auugwAmJEJeMl4zSTWzAIgWl2s9no39V+OCPwsjznrUuggpIe8wqMvtkl0+z9pr5J/qBzq76KfcgVxivaNCNh5trA+jWB8sqk6eINeXrMKa6jpgdWuwJ3tdT3EAyiXHPC0OtXfvM2+6JsRZLBnfqjy/VQp55Jewk/IQkm39kzQxsd7OlWI6AAYvDSiwoIytgL68AEpBHiTb5lQGQ7eLwc3cYY5o2xWwZsTZBMWQpImt0bz91chHgkLrNKpDdzCmuzsoAcLUDQErQuqQapMxgiCT29T7mxfVS62nnvbE/uq5U8whXgYFp32tsGbEUQZkh42QS9iNLFP2LTHD1OaVh8BE6eUuoJUhkv0HscI/osZMHW0ANauT70BmkW29LIVESox5xFDn7bAnlYfr6bsIrAlxwsu0l02Sdw7t5QuLic8R1trIHYrCBln7/EGySxmIySVp4v+ojHFLa7PkUR6rnmJI0sgoY4Zgbb4uo9lF0crJmDqtry+XDtIY1bSxGKD6RWFhxImnYQcLJ6k/onDrjEmsK0jpIJDG9eJ76uvPF4WfRFqUk/FbgfxQJjogx5w7pW1aGydjxLAr+cRieswVfb2weVOV5+tKUS/lInriQiGPHahtEVgYcYQ3y7zfqNTNSzn0NsxcQUW02mGHHVYfRmNnwtrnqPxe/W0ckiBeHqAw6Y7AOBQv1G4f1uE1CLWbRyQES5OH+pqn24aUDZtyqGC0zwMLI84iDE1hGuaHCAaXSDASu4imsq0cBJLINOEphzTWH6D4UFF0g3mALVFnf8Lrh9V3Gsg/hxa1EXNjuqBWkRuXBnFJGvYl/zxnmqPLYiErzr+6RWFhxPEFvW16ZyXXbBzCOPLYNUl9pGdjYngQQUjLJ6lv3bg9Du5wkOgC2GjGTLOmOggwD+ufhoQ4cb7u7JOFSepbXv1chHFYGaWTx+QvO9GFaVsUFkYcc4BPSbAL/6Awvim/0WawKWsdW2A7h+wIdSgIZlclY1nFlXMYWtN4Hoh2ecCtEr5Pxv2TNHLQ3yRoJzrYjvL9/ZQssxZ5ZyzziFzWTpTouygsjDiWO5nhHZN84q8KJ7HlbMY7hJvGvsqQIK5njMCmICMkOQQK0FdYh6zSn5XfP/bjnSRjJcL/dWHJ+DmSS0aBsB+FiYyluKQQR7uLntDSIsreRFww0aHPorAw4rzei0JgBwasTyZsgtYU3hZOJ5zdOG2GHdl169evb+JjwvAEOJmmH4RwrQht83DCUYfxLsQnE0wZhza/PtooHjKP7acOqE9SX6ejQv6pfbIxaXdr8Xmtr/8isDDiLEo5MD0s7GY3bNhQDj87jNwjU5LUB4LYCrtiqSQVbPRI4pCCocyK/fbbr/6QLhmzozZzM6BZ/OQe41pwUpsoB9tMtFc/8laajKkzSb1BsAX3GvnN3k2SNHO5QHJS/0VgaZFBfYzXKpoKEtWJkEghNEn9pR4X6P73v399KkqQawfkX9d+vA9UgQpoW0jRp4M5IF0sDuKxIoSZFyX1fqhPXsgqScOqLpBiICqEphjClAxt73sV/ReBNSGONnNQLGtx8S5pMr5xioKmdWAURxZpB0nq40Ayj3GapMJPZBzEAf2AOTj2SRqPA7KAtiSSAqJARljKeLKQckKh6o0RPbZvl65uUVgT4ixqszbJrEANNqqMddlKEIMyaFSsaIwXeH2YFTwMdcJLDFgmCtZMtiHEOwX7TL8hoFjzcPXUd7EhvNXnVW8v9sHgZkYJcKpfC6wZcX1xrEBJeJ+0cQ85WMoBUJx+TAwpm48SIdSVAS1Ku3qMcVB1HSCy54epeu8aNHqSJlannT8LUT4KpIiYIpTEjp4mjZkXdhniLExriQLbOKShBqAN+LKSUFZH3vAVk22URfuiLhpY/w4+5fJi1cvSJI0N54MfCCT8XZo2Pqs1UDHvhSZVvythlyJuemM23+v4sYKLvvlVx8nmNg37qGcss/0cmjkChJV4Bdo7GEcUCFCqQ1V8V+zLfFG3Ghi/WvvO2hZCHEEtTAQYngzLlRZKUgJfG4qABHnG5/KwjtrlQJFABJhGmp5JGjYlCmhNiCAfUT0PJNm2tv4d9LdvL/u0qrFkbW+fNZ0bcWSXzVEE7DC2kA1wYTqr9MXVyzNeaUt5lEY58Fl7nfpFQNDAPLQkh94cKK8/T/Jo1HWgZbl6lAivhEVArlJsDPHeb5Z0LsRxxPl7ZBAKgrTObr5E8pKVjG86SX3kh7qwjvCO79S4PjbGjhI14aNym7DyUCnQxCIm7ET9pwGFUUbkHOWDioSrrMPQFaXhFibj/TB6XSzlQwxoZxuSucwUb8PmnF5nR+W5ENcncUhfDPmel+D1QExDunXGMIcfoAZUycIXdkJ5NimYKJSEpcxJ+GNjbKQMIAPFYFllgNJFiOVpTeYLo9c6LlPIyjpC5r60RNF8YHvAjkLmKI4nYS3rd9OEi3i0Ic4N+p4Nslj7HHSL+bSBb2ljDuAPcQH54ZCQJd5P+/mIxm0bB4SasAwjlcfR/VDBA2vpA0m0Larq76EOro3xbB3zWkckxDOhdQFk2ic7kNYWaODBiOjwSPQB5rGO/CwwF8WhKN/fYhGsKpqBKjrYFCqYXph/KfzETBi20ZbKSST1mar3AgURFGyNmiGJg68eYH8sRqsqQ6CU/CUyIE5kWB2gXCCJm6ZMa0Mo2di9HQa6tllhLsRZXNhIimrIPHKogwOI03HYyRk3iBKSlHbF2qiCPElSXz8xP/TBzsNNowrARRrWi8J0xYT1KSWXyaBmYCdpUmzN0Pa2QWz4M3bKBNVSTqLG9sub4Bp6EB+us7P8XIhzU3xFviMZgtJQgnAQINwZtsJEWBOl2HDfhHpsJVVn85x9mtY3KOp4ENJpcDh1ZJQU+LSBiMDmZCQDWz2OEKGBIJTJlyY6UKLwk9CUMv+ZYgLGzQNzIc7EXqik7DBhbrIHlQFujVukPAhliCWn9AfYECuhFBThcOrZglgfJdJ46mhLaQeH094NXjYbJJJVzJ7OtvonYwp3qQxua9GqxIX9dcCelIsx88LciPP05m0AiXdBPr0oqvGKjpWHLEDWYV/Ug2XIGGPJMr6uZ0ShJRSNmpLUn0PqI/io3boQYF5KikYWVlfWD0CMlBjYsGFDI+OUVwJaWmBipbbV6uZGnE25qdUm9YqkHwGdpLp62JHBvt4jhH445fr5RIGQZowKbZOhLkd/eSwFWViRow58AcoOE50xXz+8dcg9Y9mV5t+RZ6MPF42YkZ8H5kZcMkbELIt0Cx41+HrJzTsI5LGfsLPIhrLvTQRCmTzmhkgp9ndR5JN2dZBEI4t8iMSI/JqX9W8dyNSPGYKVtSnvSpgbcTtb3CYphCT1x7sisNhWPZkockL2JeP/KAHrJeNoLTb2Ij9cA0KVk9R/7smjINPIRBoaMKhRmsivdSgM1EZ2Quz+W/+gzTy7CnY54pLU/7vmAAxaFjkWJMc41gxnee1Yz6dhSZoDUjRsxWWH21rQX5ZHgZ3JRJ6BOiYLG5EngMLISPIX9XVlpt+uhF2OuOHmHBb46I+xrA1bcpHkOdeojwzzUIwamRbagLHSIXhSVMamWJIi8tQIWSiOESxGp8/RCUcr4pKxPOyBAIjwmQKqYMRiJXYWCmKHQQYqSsbj9Hd43kjPC5SiWJ4FjSoIQENz57CxdjaacUcnHK2IW2nj7CkxNi9Qvd2h+3uqOkhifsgzNbwTyAPUSoH4qxt50RWKYxHNaL5F4b+OOFERTj1XCIL83yUO7bVd2IkMVM/ccCh9leWZJoIISRr5CeGCBOxFVKnPfwv+64ibPpg/nOPDQpRYGnmoD5bmvqEsZcijaLC5pz3vo+p3F+x2xDk4J59dJt8B0vjF/Ep1yVjuEfzd41C/u+D/BeJWOjxjN0kb+qAr9dtddf8HAAD//xILQAIAAAAGSURBVAMAd3qJjWCkwlIAAAAASUVORK5CYII=" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        แบบขออนุญาตใช้ยานพาหนะส่วนกลางของสถานศึกษา
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <p class="no-indent" style="text-align:right;">วันที่ ..... เดือน .................... พ.ศ. ............</p>
      <p class="no-indent"><strong>เรื่อง:</strong> ขออนุญาตใช้ยานพาหนะส่วนกลางของโรงเรียน</p>
      <p class="no-indent"><strong>เรียน:</strong> ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร ผ่านหัวหน้ากลุ่มบริหารทั่วไป</p>

      <p>ข้าพเจ้า .............................................................. ตำแหน่ง .............................................................. กลุ่มสาระการเรียนรู้/ฝ่าย .................................................... เบอร์โทรศัพท์ ........................................ มีความประสงค์ขอใช้รถยนต์ส่วนกลางของโรงเรียนมหาชัยพิทยาคาร ประเภท: ( ) รถตู้โรงเรียน&nbsp;&nbsp;( ) รถกระบะ&nbsp;&nbsp;( ) รถโดยสารขนาดใหญ่</p>

      <p class="no-indent"><strong>1. วัตถุประสงค์เพื่อ:</strong> ....................................................................................................................................................</p>
      <p class="no-indent"><strong>2. สถานที่ปลายทาง:</strong> ................................................................................. จังหวัด .................................................</p>
      <p class="no-indent"><strong>3. กำหนดการเดินทาง:</strong></p>
      <p>- ออกเดินทางวันที่ ..... เดือน .................... พ.ศ. ........ เวลา ............. น.<br>
      - เดินทางกลับวันที่ ..... เดือน .................... พ.ศ. ........ เวลา ............. น.</p>
      
      <p class="no-indent"><strong>4. จำนวนผู้โดยสาร:</strong> ครูและบุคลากร ..... คน, นักเรียน ..... คน รวมทั้งสิ้น ..... คน (มีรายชื่อแนบ)</p>
      <p class="no-indent"><strong>5. ผู้ควบคุมรถ:</strong> .............................................................. ตำแหน่ง .................................................... โทร. ..........................</p>
      <p class="no-indent"><strong>6. ค่าน้ำมันเชื้อเพลิง:</strong> ( ) ขอเบิกจ่ายจากงบประมาณของโรงเรียน&nbsp;&nbsp;( ) ผู้ขอใช้เป็นผู้รับผิดชอบเอง</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้ขออนุญาต<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>

      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-top:15pt; table-layout:fixed; font-size:14pt;">
        <tr>
          <td style="width:48%; text-align:center; vertical-align:top; border:1px solid #000; padding:6pt;">
            <strong>ความเห็นหัวหน้างานยานพาหนะ:</strong><br>
          ( ) รถพร้อมใช้งาน มอบหมายพนักงานขับรถ: ........................................<br>
          ( ) รถไม่พร้อมใช้งาน เนื่องจาก ....................................................<br><br>
          ลงชื่อ..............................................................<br>
          (..............................................................)<br>
          วันที่ ...../...../..........
          </td>
          <td style="width:4%; border:none !important; padding:0;">&nbsp;</td>
          <td style="width:48%; text-align:center; vertical-align:top; border:1px solid #000; padding:6pt;">
            <strong>คำสั่งผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร:</strong><br>
          ( ) อนุญาต&nbsp;&nbsp;( ) ไม่อนุญาต<br><br>
          ลงชื่อ..............................................................<br>
          (นายอธิการ สุขศรี)<br>
          ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
          วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'gen_facility_booking',
    dept: 'general',
    title: 'แบบฟอร์มขออนุญาตใช้อาคารสถานที่และห้องประชุม',
    desc: 'แบบขอใช้หอประชุม ห้องประชุมวิทยพัฒน์ อาคารอเนกประสงค์ หรือสนามกีฬาของโรงเรียน',
    format: 'Word (.doc)',
    icon: 'bxs-building',
    tags: ["ขอใช้สถานที่", "ห้องประชุม", "หอประชุม", "จองสถานที่", "ทั่วไป"],
    summary: 'แบบฟอร์มจองและขออนุญาตใช้งานสถานที่ราชการ เครื่องเสียง และระบบปรับอากาศสำหรับจัดประชุมหรือกิจกรรม',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,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" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        แบบขออนุญาตใช้อาคารสถานที่และห้องประชุม
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <p class="no-indent" style="text-align:right;">วันที่ ..... เดือน .................... พ.ศ. ............</p>
      <p class="no-indent"><strong>เรื่อง:</strong> ขออนุญาตใช้อาคารสถานที่และอุปกรณ์ส่วนกลาง</p>
      <p class="no-indent"><strong>เรียน:</strong> ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร</p>

      <p>ข้าพเจ้า / หน่วยงาน .............................................................. ผู้ประสานงาน .............................................................. เบอร์โทรศัพท์ ........................................ มีความประสงค์ขอใช้อาคารสถานที่ของโรงเรียนมหาชัยพิทยาคาร ดังนี้:</p>
      <p>( ) หอประชุมใหญ่&nbsp;&nbsp;( ) ห้องประชุมวิทยพัฒน์&nbsp;&nbsp;( ) อาคารอเนกประสงค์&nbsp;&nbsp;( ) สนามกีฬา&nbsp;&nbsp;( ) ห้องปฏิบัติการคอมพิวเตอร์</p>

      <p class="no-indent"><strong>1. เพื่อจัดกิจกรรม / การประชุม:</strong> ....................................................................................................................</p>
      <p class="no-indent"><strong>2. กำหนดวันและเวลาที่ใช้:</strong> วันที่ ..... เดือน .................... พ.ศ. ........ เวลา ............. - ............. น.</p>
      <p class="no-indent"><strong>3. จำนวนผู้เข้าร่วมกิจกรรม:</strong> ประมาณ ..... คน</p>
      <p class="no-indent"><strong>4. อุปกรณ์ที่ขอรับการสนับสนุน:</strong></p>
      <p>( ) เครื่องเสียง / ไมโครโฟน ..... ตัว&nbsp;&nbsp;( ) เครื่องฉายโปรเจกเตอร์&nbsp;&nbsp;( ) โต๊ะเก้าอี้ ..... ชุด&nbsp;&nbsp;( ) ระบบปรับอากาศ&nbsp;&nbsp;( ) เจ้าหน้าที่ควบคุมเทคนิค</p>

      <p class="no-indent"><strong>ข้อตกลง:</strong> ข้าพเจ้ายินดีดูแลรักษาความสะอาด ความปลอดภัย และหากเกิดความเสียหายใด ๆ ต่อทรัพย์สินของทางราชการ ข้าพเจ้ายินดีรับผิดชอบชดใช้ค่าเสียหายตามระเบียบ</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้ขออนุญาต<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้างานอาคารสถานที่</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารทั่วไป</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'gen_repair_request',
    dept: 'general',
    title: 'แบบฟอร์มแจ้งซ่อมแซมอาคารสถานที่และระบบสาธารณูปโภค',
    desc: 'แบบคำขอแจ้งซ่อมบำรุงไฟฟ้า ประปา พัดลม แอร์ เครื่องปรับอากาศ โต๊ะเก้าอี้ ประตูหน้าต่าง',
    format: 'Word (.doc)',
    icon: 'bxs-wrench',
    tags: ["แจ้งซ่อม", "ซ่อมบำรุง", "สาธารณูปโภค", "อาคารสถานที่", "ทั่วไป"],
    summary: 'ใบแจ้งซ่อมแซมวัสดุ อุปกรณ์ และอาคารสถานที่เพื่อส่งต่องานซ่อมบำรุงดำเนินการแก้ไขอย่างรวดเร็ว',
    docBody: `
<div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:4pt; line-height:1.3;">
        แบบแจ้งซ่อมแซมอาคารสถานที่และระบบสาธารณูปโภค
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:12pt; color:#222;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:15pt; font-weight:normal;">งานซ่อมบำรุง กลุ่มบริหารทั่วไป โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <hr style="border:none; border-top:1px solid #000; margin:6pt 0 12pt 0;">
      <p class="no-indent"><strong>วันที่แจ้งซ่อม:</strong> ..... เดือน .................... พ.ศ. ............ <strong>เวลา:</strong> ............. น.</p>
      <p class="no-indent"><strong>ผู้แจ้งซ่อม:</strong> .............................................................. <strong>ตำแหน่ง/ห้องเรียน:</strong> .................................................... <strong>โทร.:</strong> ..........................</p>
      <hr style="border:none; border-top:1px dashed #666; margin:6pt 0;">

      <table style="width:100%; border-collapse:collapse; margin:6pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:8%;">ที่</th>
            <th style="border:1px solid #000; padding:4pt; width:32%;">สถานที่ชำรุด (อาคาร / ชั้น / ห้อง)</th>
            <th style="border:1px solid #000; padding:4pt; width:45%;">รายการชำรุด / อาการผิดปกติ</th>
            <th style="border:1px solid #000; padding:4pt; width:15%;">ความเร่งด่วน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; padding:3pt;">อาคาร ..... ชั้น ..... ห้องเรียน .....</td>
            <td style="border:1px solid #000; padding:3pt;">หลอดไฟไม่ติด / พัดลมเพดานมีเสียงดังผิดปกติ</td>
            <td style="border:1px solid #000; text-align:center;">( ) ด่วน</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">2</td>
            <td style="border:1px solid #000; padding:3pt;">............................................................</td>
            <td style="border:1px solid #000; padding:3pt;">....................................................................................</td>
            <td style="border:1px solid #000; text-align:center;">( ) ปกติ</td>
          </tr>
        </tbody>
      </table>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้แจ้งซ่อม<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>

      <div style="margin-top:15pt; border:1px solid #000; padding:8pt; font-size:14pt;">
        <strong>การตรวจสอบและการดำเนินการของงานซ่อมบำรุง:</strong><br>
        ( ) ซ่อมแซมได้เองทันที&nbsp;&nbsp;( ) ต้องจัดซื้ออุปกรณ์เพิ่มเติม เป็นเงินประมาณ .................... บาท&nbsp;&nbsp;( ) ต้องจ้างช่างภายนอก<br>
        <strong>ผลการซ่อม:</strong> ดำเนินการซ่อมแซมเสร็จสิ้นเมื่อวันที่ ...../...../.......... ทดสอบแล้วใช้งานได้ตามปกติ<br><br>
        <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-top:12pt; table-layout:fixed;">
        <tr>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            ลงชื่อ................................................ช่างผู้ซ่อม<br>
            (................................................)<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:4%; border:none !important; padding:0;">&nbsp;</td>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            ลงชื่อ................................................ผู้ตรวจรับงานซ่อม<br>
            (................................................)<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
      </div>
    `
  },
  {
    id: 'gen_asset_loan',
    dept: 'general',
    title: 'แบบฟอร์มขอยืม - คืน พัสดุ ครุภัณฑ์ และอุปกรณ์โสตฯ',
    desc: 'แบบบันทึกการยืมและส่งคืนพัสดุ ครุภัณฑ์ อุปกรณ์เครื่องเสียง กล้องถ่ายรูป หรือโน้ตบุ๊กของโรงเรียน',
    format: 'Word (.doc)',
    icon: 'bxs-box',
    tags: ["ยืมพัสดุ", "คืนพัสดุ", "ครุภัณฑ์", "อุปกรณ์โสต", "ทั่วไป"],
    summary: 'เอกสารควบคุมการเบิกยืมและคืนทรัพย์สินของทางราชการ พร้อมสภาพอุปกรณ์ก่อนและหลังการใช้งาน',
    docBody: `
<div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:4pt; line-height:1.3;">
        แบบขอยืม - คืน พัสดุ ครุภัณฑ์ และอุปกรณ์ส่วนกลาง
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:12pt; color:#222;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:15pt; font-weight:normal;">โรงเรียนมหาชัยพิทยาคาร สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม</span>
      </div>
      <hr style="border:none; border-top:1px solid #000; margin:6pt 0 12pt 0;">
      <p class="no-indent"><strong>วันที่ขอยืม:</strong> ..... เดือน .................... พ.ศ. ............ <strong>กำหนดส่งคืนวันที่:</strong> ..... เดือน .................... พ.ศ. ........</p>
      <p class="no-indent"><strong>ผู้ขอยืม:</strong> .............................................................. <strong>ตำแหน่ง:</strong> .................................................... <strong>ฝ่าย/กลุ่มสาระ:</strong> .................................................</p>
      <p class="no-indent"><strong>วัตถุประสงค์ในการยืมใช้งาน:</strong> เพื่อ ....................................................................................................................</p>
      <hr style="border:none; border-top:1px dashed #666; margin:6pt 0;">

      <table style="width:100%; border-collapse:collapse; margin:6pt 0;">
        <thead>
          <tr style="background:#F2F2F2; text-align:center;">
            <th style="border:1px solid #000; padding:4pt; width:8%;">ที่</th>
            <th style="border:1px solid #000; padding:4pt; width:42%;">รายการพัสดุ / ครุภัณฑ์ / อุปกรณ์</th>
            <th style="border:1px solid #000; padding:4pt; width:20%;">หมายเลขครุภัณฑ์</th>
            <th style="border:1px solid #000; padding:4pt; width:10%;">จำนวน</th>
            <th style="border:1px solid #000; padding:4pt; width:20%;">สภาพเมื่อส่งคืน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #000; text-align:center;">1</td>
            <td style="border:1px solid #000; padding:3pt;">ชุดไมโครโฟนไร้สาย พร้อมตัวรับสัญญาณ</td>
            <td style="border:1px solid #000; text-align:center;">มค-01/69</td>
            <td style="border:1px solid #000; text-align:center;">1 ชุด</td>
            <td style="border:1px solid #000; text-align:center;">( ) ปกติ</td>
          </tr>
          <tr>
            <td style="border:1px solid #000; text-align:center;">2</td>
            <td style="border:1px solid #000; padding:3pt;">..............................................................................</td>
            <td style="border:1px solid #000; text-align:center;">...............</td>
            <td style="border:1px solid #000; text-align:center;">.....</td>
            <td style="border:1px solid #000; text-align:center;">( ) ปกติ</td>
          </tr>
        </tbody>
      </table>

      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-top:20pt; table-layout:fixed;">
        <tr>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้ขอยืม<br>
          (........................................................)<br>
          วันที่ ...../...../..........
          </td>
          <td style="width:4%; border:none !important; padding:0;">&nbsp;</td>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................เจ้าหน้าที่ผู้จ่ายพัสดุ<br>
          (........................................................)<br>
          วันที่ ...../...../..........
          </td>
        </tr>
      </table>

      <div style="margin-top:15pt; border:1px solid #000; padding:6pt; font-size:14pt;">
        <strong>บันทึกการส่งคืนพัสดุ:</strong> ได้รับพัสดุครุภัณฑ์ตามรายการข้างต้นคืนครบถ้วน สภาพเรียบร้อย เมื่อวันที่ ...../...../..........<br><br>
        <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-top:12pt; table-layout:fixed;">
        <tr>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้ส่งคืน<br>
            (........................................................)
          </td>
          <td style="width:4%; border:none !important; padding:0;">&nbsp;</td>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้รับคืน<br>
            (........................................................)
          </td>
        </tr>
      </table>
      </div>
    `
  },
  {
    id: 'gen_external_memo',
    dept: 'general',
    title: 'บันทึกข้อความขอความอนุเคราะห์ / ประสานงานภายนอก',
    desc: 'แบบบันทึกข้อความขอความอนุเคราะห์วิทยากร สถานที่ หรือความร่วมมือกับหน่วยงานภายนอก',
    format: 'Word (.doc)',
    icon: 'bxs-envelope',
    tags: ["ขอความอนุเคราะห์", "ติดต่อประสานงาน", "หน่วยงานภายนอก", "หนังสือราชการ", "ทั่วไป"],
    summary: 'แบบฟอร์มขอความอนุเคราะห์มาตรฐาน สำหรับเสนอผู้อำนวยการเพื่อลงนามในหนังสือราชการภายนอก',
    docBody: `
<table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-bottom:4pt;">
        <tr>
          <td style="width:22%; vertical-align:bottom; border:none !important; padding:0;">
            <img src="data:image/png;base64,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" style="width:58px; height:auto;" alt="ตราครุฑ">
          </td>
          <td style="width:56%; text-align:center; vertical-align:bottom; border:none !important; padding:0;">
            <span style="font-size:29pt; font-weight:bold; font-family:'TH Sarabun New', sans-serif;">บันทึกข้อความ</span>
          </td>
          <td style="width:22%; border:none !important; padding:0;">&nbsp;</td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0; line-height:1.35;">
        <strong>ส่วนราชการ</strong>&nbsp;&nbsp;โรงเรียนมหาชัยพิทยาคาร ตำบลท่างสองคอน อำเภอเมือง จ.มหาสารคาม ๔๔๐๐๐
      </p>
      <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin:2pt 0;">
        <tr>
          <td style="width:55%; border:none !important; padding:0; vertical-align:top;">
            <strong>ที่</strong>&nbsp;&nbsp;................................................................
          </td>
          <td style="width:45%; border:none !important; padding:0; vertical-align:top;">
            <strong>วันที่</strong>&nbsp;&nbsp;.....&nbsp;&nbsp;เดือน&nbsp;&nbsp;....................&nbsp;&nbsp;พ.ศ.&nbsp;&nbsp;............
          </td>
        </tr>
      </table>
      <p class="no-indent" style="margin:2pt 0 4pt 0;">
        <strong>เรื่อง</strong>&nbsp;&nbsp;ขอความอนุเคราะห์ออกหนังสือราชการภายนอก เพื่อประสานงานความร่วมมือ
      </p>
      <hr style="border:none; border-top:1.5pt solid #000; margin:4pt 0 8pt 0;">
      <p class="no-indent" style="margin-bottom:8pt;">
        <strong>เรียน</strong>&nbsp;&nbsp;ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร
      </p>
      <p>ด้วย กลุ่มงาน/ฝ่าย/กลุ่มสาระการเรียนรู้ .................................................... โรงเรียนมหาชัยพิทยาคาร มีความประสงค์จะดำเนินกิจกรรม / โครงการ ................................................................................. ในวันที่ ..... เดือน .................... พ.ศ. ........ ณ .................................................................................</p>

      <p>เพื่อให้การจัดกิจกรรมดังกล่าวบรรลุตามวัตถุประสงค์และเกิดประสิทธิภาพสูงสุด จึงใคร่ขอความอนุเคราะห์ออกหนังสือราชการภายนอกของโรงเรียน ไปยัง <strong>....................................................................................................................</strong> เพื่อขอความอนุเคราะห์ในเรื่อง:</p>

      <p>( ) ขอความอนุเคราะห์วิทยากรผู้เชี่ยวชาญบรรยายให้ความรู้<br>
      ( ) ขอความอนุเคราะห์ใช้สถานที่ / ห้องประชุม / สนามกีฬา<br>
      ( ) ขอความอนุเคราะห์ยานพาหนะ / วัสดุอุปกรณ์สนับสนุน<br>
      ( ) ขอความร่วมมือในการส่งบุคลากรเข้าร่วมกิจกรรม</p>

      <p>ทั้งนี้ ข้าพเจ้าได้แนบร่างหนังสือราชการภายนอกพร้อมกำหนดการจัดกิจกรรมมาพร้อมบันทึกข้อความฉบับนี้แล้ว</p>
      <p>จึงเรียนมาเพื่อโปรดพิจารณาและลงนามในหนังสือราชการภายนอกดังกล่าวต่อไป</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้ขออนุเคราะห์<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้างานสารบรรณ</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารทั่วไป</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'gen_incident_safety',
    dept: 'general',
    title: 'แบบรายงานอุบัติเหตุและความปลอดภัยในสถานศึกษา',
    desc: 'แบบบันทึกรายงานอุบัติเหตุ การเจ็บป่วยฉุกเฉิน หรือเหตุการณ์ด้านความปลอดภัยของนักเรียนและบุคลากร',
    format: 'Word (.doc)',
    icon: 'bxs-first-aid',
    tags: ["อุบัติเหตุ", "ความปลอดภัย", "พยาบาล", "เหตุฉุกเฉิน", "ทั่วไป"],
    summary: 'เอกสารรายงานเหตุการณ์ฉุกเฉิน บันทึกการปฐมพยาบาล หรือการส่งตัวรักษาต่อโรงพยาบาลเพื่อรายงานผู้บริหาร',
    docBody: `
<div style="text-align:center; margin-bottom:4pt;">
        <img src="data:image/png;base64,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" style="width:78px; height:auto;" alt="ตราครุฑ">
      </div>
      <div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:2pt; line-height:1.2;">
        แบบรายงานอุบัติเหตุและเหตุฉุกเฉินด้านความปลอดภัยในสถานศึกษา
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:10pt;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:14pt; font-weight:normal;">โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <p class="no-indent" style="text-align:right;">วันที่เกิดเหตุ: ..... เดือน .................... พ.ศ. ........ <strong>เวลา:</strong> ............. น.</p>
      <p class="no-indent"><strong>สถานที่เกิดเหตุ:</strong> ....................................................................................................................................................</p>
      <p class="no-indent"><strong>ชื่อผู้ประสบเหตุ:</strong> .............................................................. <strong>สถานะ:</strong> ( ) นักเรียน ชั้น ม...../..... เลขที่ .....&nbsp;&nbsp;( ) บุคลากร</p>
      <hr style="border:none; border-top:1px dashed #666; margin:6pt 0;">

      <p class="no-indent"><strong>1. รายละเอียดเหตุการณ์และสาเหตุ:</strong></p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>2. ลักษณะการบาดเจ็บ / อาการเบื้องต้น:</strong></p>
      <p>....................................................................................................................................................................................................</p>

      <p class="no-indent"><strong>3. การดำเนินการช่วยเหลือและปฐมพยาบาล:</strong></p>
      <p>( ) ปฐมพยาบาลเบื้องต้น ณ ห้องพยาบาลโรงเรียนมหาชัยพิทยาคาร โดย ....................................................<br>
      ( ) นำส่งโรงพยาบาล / สถานีอนามัย .................................................... เวลา ............. น. โดยมี .................................................... เป็นผู้ควบคุมนำส่ง</p>

      <p class="no-indent"><strong>4. การประสานงานผู้ปกครอง:</strong></p>
      <p>แจ้งผู้ปกครองแล้ว เมื่อเวลา ............. น. ทางโทรศัพท์หมายเลข ........................................ ผู้รับแจ้งชื่อ ....................................................</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ครูผู้รายงาน / ครูเวรประจำวัน<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>
      
      <table style="width:100%; border-collapse:collapse; margin-top:20pt; font-size:14pt;">
        <tr>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>1. ความเห็นหัวหน้างานความปลอดภัยในสถานศึกษา</strong><br>
            ( ) เห็นชอบ / เห็นควรอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง ........................................<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:34%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>2. ความเห็นรองผู้อำนวยการกลุ่มบริหารทั่วไป</strong><br>
            ( ) เห็นควรพิจารณาอนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (................................................)<br>
            ตำแหน่ง รองผู้อำนวยการกลุ่มบริหารงาน...<br>
            วันที่ ...../...../..........
          </td>
          <td style="width:33%; border:1px solid #000; padding:6pt; vertical-align:top;">
            <strong>3. คำสั่ง / การอนุมัติ</strong><br>
            ( ) อนุมัติ&nbsp;&nbsp;&nbsp;&nbsp;( ) ไม่อนุมัติ<br>
            ( ) อื่นๆ ........................................<br><br>
            ลงชื่อ................................................<br>
            (นายอธิการ สุขศรี)<br>
            ตำแหน่ง ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร<br>
            วันที่ ...../...../..........
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'gen_printing_service',
    dept: 'general',
    title: 'แบบฟอร์มขอรับบริการผลิตสื่อสิ่งพิมพ์และถ่ายเอกสาร',
    desc: 'แบบคำขอถ่ายเอกสาร โรเนียว อัดสำเนาข้อสอบ หรือผลิตสื่อสิ่งพิมพ์ของโรงเรียน',
    format: 'Word (.doc)',
    icon: 'bxs-printer',
    tags: ["ถ่ายเอกสาร", "ข้อสอบ", "โรเนียว", "สื่อสิ่งพิมพ์", "ทั่วไป"],
    summary: 'แบบฟอร์มขอบริการถ่ายเอกสารและข้อสอบ พร้อมระบบกำกับการรักษาความลับของข้อสอบวัดผล',
    docBody: `
<div style="text-align:center; font-weight:bold; font-size:22pt; margin-bottom:4pt; line-height:1.3;">
        แบบขอรับบริการผลิตสื่อสิ่งพิมพ์ ถ่ายเอกสาร และอัดสำเนาข้อสอบ
      </div>
      <div style="text-align:center; font-size:16pt; margin-bottom:12pt; color:#222;">
        โรงเรียนมหาชัยพิทยาคาร&nbsp;&nbsp;สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม<br><span style="font-size:15pt; font-weight:normal;">งานผลิตสื่อสิ่งพิมพ์ กลุ่มบริหารทั่วไป โรงเรียนมหาชัยพิทยาคาร</span>
      </div>
      <hr style="border:none; border-top:1px solid #000; margin:6pt 0 12pt 0;">
      <p class="no-indent"><strong>วันที่ขอรับบริการ:</strong> ..... เดือน .................... พ.ศ. ............ <strong>กำหนดรับงาน:</strong> วันที่ ...../...../.......... เวลา ............. น.</p>
      <p class="no-indent"><strong>ผู้ขอรับบริการ:</strong> .............................................................. <strong>ตำแหน่ง:</strong> .................................................... <strong>ฝ่าย/กลุ่มสาระ:</strong> .................................................</p>
      <p class="no-indent"><strong>ชื่องาน / เอกสาร:</strong> ....................................................................................................................................................</p>
      <hr style="border:none; border-top:1px dashed #666; margin:6pt 0;">

      <p class="no-indent"><strong>1. ประเภทงาน:</strong> ( ) ถ่ายเอกสารทั่วไป&nbsp;&nbsp;( ) ใบงาน/แบบฝึกหัด&nbsp;&nbsp;( ) ข้อสอบกลางภาค/ปลายภาค (งานลับ)&nbsp;&nbsp;( ) แผ่นพับ/วารสาร</p>
      <p class="no-indent"><strong>2. รายละเอียดการพิมพ์:</strong></p>
      <p>- ขนาดกระดาษ: ( ) A4&nbsp;&nbsp;( ) F14 (กระดาษยาว)&nbsp;&nbsp;( ) A3<br>
      - รูปแบบ: ( ) หน้าเดียว&nbsp;&nbsp;( ) หน้า-หลัง (สองหน้า)&nbsp;&nbsp;( ) เย็บแม็กมุมบน&nbsp;&nbsp;( ) พับครึ่งมุงหลังคา<br>
      - จำนวนต้นฉบับ: ..... หน้า&nbsp;&nbsp;<strong>จำนวนชุดที่ต้องการ: ..... ชุด</strong>&nbsp;&nbsp;<strong>รวมพิมพ์ทั้งสิ้น: ..... หน้า</strong></p>

      <p class="no-indent"><strong>คำรับรองกรณีข้อสอบ:</strong> ข้าพเจ้าขอรับรองว่าเป็นข้อสอบวัดผล และข้าพเจ้าจะควบคุมการจัดพิมพ์และรับเอกสารด้วยตนเองอย่างเคร่งครัด</p>

      
      <div style="margin-top:20pt; text-align:right;">
        ลงชื่อ..............................................................ผู้ขอรับบริการ<br>
        (..............................................................)<br>
        ตำแหน่ง ..............................................................<br>
        วันที่ ..... เดือน .................... พ.ศ. ........
      </div>

      <div style="margin-top:15pt; border:1px solid #000; padding:6pt; font-size:14pt;">
        <strong>การส่งมอบงาน:</strong> เจ้าหน้าที่ได้ดำเนินการพิมพ์เรียบร้อยแล้ว ส่งมอบงานเมื่อวันที่ ...../...../..........<br><br>
        <table class="borderless" style="width:100%; border:none !important; border-collapse:collapse; margin-top:12pt; table-layout:fixed;">
        <tr>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้ผลิตเอกสาร<br>
            (........................................................)
          </td>
          <td style="width:4%; border:none !important; padding:0;">&nbsp;</td>
          <td style="width:48%; text-align:center; vertical-align:top; border:none !important; padding:0;">
            (ลงชื่อ)........................................................ผู้รับงานเอกสาร<br>
            (........................................................)
          </td>
        </tr>
      </table>
      </div>
    `
  }
];

/* ============================================================
 *  STATE & TEMPLATE MANAGEMENT (FULL CRUD)
 * ============================================================ */
let TemplatesState = {
  activeDept: 'all',
  searchQuery: '',
  customTemplates: [],
  overrides: {},
  deletedIds: [],
  loaded: false
};

/**
 * รวมแบบฟอร์มทั้งหมด (Custom + Built-in) โดยกรองอันที่ถูกลบออก และแทนที่ด้วยอันที่ถูกแก้ไข
 */
function getEffectiveTemplates() {
  // 1. Custom Templates (อัพโหลดเพิ่มเอง)
  const customList = (TemplatesState.customTemplates || [])
    .filter(t => !TemplatesState.deletedIds.includes(t.id))
    .map(t => {
      const ov = TemplatesState.overrides[t.id];
      return ov ? Object.assign({}, t, ov, { is_modified: true }) : t;
    });

  // 2. Built-in Templates (30 แบบฟอร์มมาตรฐาน)
  const builtInList = FOUR_DEPT_TEMPLATES
    .filter(t => !TemplatesState.deletedIds.includes(t.id))
    .map(t => {
      const ov = TemplatesState.overrides[t.id];
      return ov ? Object.assign({}, t, ov, { is_modified: true }) : t;
    });

  return [...customList, ...builtInList];
}

function renderTemplateHeaderActions() {
  const container = document.getElementById('templateHeaderActions');
  if (!container) return;
  const isAdmin = typeof APP !== 'undefined' && APP.role && APP.role !== 'teacher';
  if (!isAdmin) {
    container.innerHTML = '';
    return;
  }
  const hasChanges = (TemplatesState.deletedIds && TemplatesState.deletedIds.length > 0) ||
                     (TemplatesState.overrides && Object.keys(TemplatesState.overrides).length > 0);
  container.innerHTML = `
    <button type="button" class="btn bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2" onclick="openTemplateModal()">
      <i class='bx bx-plus-circle text-base'></i> เพิ่มแบบฟอร์มใหม่
    </button>
    ${hasChanges ? `
      <button type="button" class="btn bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5" onclick="resetTemplateDefaultsConfirm()" title="คืนค่าแบบฟอร์มเริ่มต้นทั้งหมด">
        <i class='bx bx-reset'></i> คืนค่าเริ่มต้น
      </button>
    ` : ''}
  `;
}

/**
 * อัพเดตตัวเลขจำนวนแบบฟอร์มในแต่ละฝ่าย และอัพเดตปุ่มแท็บ
 */
function updateTemplateCounts() {
  const allList = getEffectiveTemplates();
  TEMPLATE_DEPARTMENTS.all.count = allList.length;
  Object.keys(TEMPLATE_DEPARTMENTS).forEach(k => {
    if (k !== 'all') {
      TEMPLATE_DEPARTMENTS[k].count = allList.filter(t => t.dept === k).length;
    }
  });

  const tabsContainer = document.getElementById('templateDeptTabs');
  if (tabsContainer) {
    tabsContainer.innerHTML = Object.values(TEMPLATE_DEPARTMENTS).map(d => `
      <button type="button"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${TemplatesState.activeDept === d.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
              onclick="switchTemplateDept('${d.id}')">
        <i class='bx ${d.icon}'></i>
        <span>${d.label}</span>
        <span class="ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${TemplatesState.activeDept === d.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'}">
          ${d.count}
        </span>
      </button>
    `).join('');
  }

  renderTemplateHeaderActions();
}

/**
 * เรนเดอร์การ์ดสรุปจำนวนแบบฟอร์ม 4 ฝ่าย
 */
function renderTemplateStats() {
  const area = document.getElementById('templateStatsArea');
  if (!area) return;
  area.innerHTML = `
    <div class="stat-card" style="border-left:4px solid #3B82F6;">
      <div class="text-xs font-semibold text-slate-500">ฝ่ายบริหารวิชาการ</div>
      <div class="text-2xl font-bold text-blue-600 mt-1">${TEMPLATE_DEPARTMENTS.academic.count} <span class="text-xs font-normal text-slate-400">ฟอร์ม</span></div>
    </div>
    <div class="stat-card" style="border-left:4px solid #10B981;">
      <div class="text-xs font-semibold text-slate-500">ฝ่ายบริหารงบประมาณ</div>
      <div class="text-2xl font-bold text-emerald-600 mt-1">${TEMPLATE_DEPARTMENTS.budget.count} <span class="text-xs font-normal text-slate-400">ฟอร์ม</span></div>
    </div>
    <div class="stat-card" style="border-left:4px solid #F59E0B;">
      <div class="text-xs font-semibold text-slate-500">ฝ่ายบริหารงานบุคคล</div>
      <div class="text-2xl font-bold text-amber-600 mt-1">${TEMPLATE_DEPARTMENTS.personnel.count} <span class="text-xs font-normal text-slate-400">ฟอร์ม</span></div>
    </div>
    <div class="stat-card" style="border-left:4px solid #8B5CF6;">
      <div class="text-xs font-semibold text-slate-500">ฝ่ายบริหารทั่วไป</div>
      <div class="text-2xl font-bold text-purple-600 mt-1">${TEMPLATE_DEPARTMENTS.general.count} <span class="text-xs font-normal text-slate-400">ฟอร์ม</span></div>
    </div>
  `;
}

/**
 * โหลดแบบฟอร์ม Custom / Overrides / Deleted จาก LocalStorage และ Backend
 */
function loadCustomTemplates() {
  // 1. โหลดจาก LocalStorage ก่อนเพื่อให้แสดงผลทันที
  try {
    const cachedCustom = localStorage.getItem('mhc_custom_templates');
    if (cachedCustom) TemplatesState.customTemplates = JSON.parse(cachedCustom) || [];

    const cachedOverrides = localStorage.getItem('mhc_template_overrides');
    if (cachedOverrides) TemplatesState.overrides = JSON.parse(cachedOverrides) || {};

    const cachedDeleted = localStorage.getItem('mhc_deleted_templates');
    if (cachedDeleted) TemplatesState.deletedIds = JSON.parse(cachedDeleted) || [];

    updateTemplateCounts();
    renderTemplateStats();
    renderTemplateCards();
  } catch (_) {}

  // 2. ดึงข้อมูลล่าสุดจาก Google Apps Script Backend
  const token = (typeof APP !== 'undefined' && APP.token) || '';
  if (typeof google !== 'undefined' && google.script && google.script.run && token) {
    google.script.run
      .withSuccessHandler(res => {
        if (res && res.status === 'success' && Array.isArray(res.data)) {
          const customList = [];
          const overridesMap = {};
          const deletedList = [];

          res.data.forEach(item => {
            if (item.is_deleted) {
              deletedList.push(item.id);
            } else if (item.is_override) {
              overridesMap[item.id] = item;
            } else {
              customList.push(item);
            }
          });

          TemplatesState.customTemplates = customList;
          TemplatesState.overrides = overridesMap;
          TemplatesState.deletedIds = deletedList;

          try {
            localStorage.setItem('mhc_custom_templates', JSON.stringify(customList));
            localStorage.setItem('mhc_template_overrides', JSON.stringify(overridesMap));
            localStorage.setItem('mhc_deleted_templates', JSON.stringify(deletedList));
          } catch (_) {}

          updateTemplateCounts();
          renderTemplateStats();
          renderTemplateCards();
        }
      })
      .withFailureHandler(err => {
        console.warn('Cannot load custom templates from backend:', err);
      })
      .getCustomTemplates(token);
  }
}

/* ============================================================
 *  RENDER TEMPLATES PAGE
 * ============================================================ */
function renderTemplates() {
  const container = document.getElementById('mainContent') || document.getElementById('content');
  if (!container) return;

  const isAdmin = typeof APP !== 'undefined' && APP.role && APP.role !== 'teacher';
  const hasChanges = (TemplatesState.deletedIds && TemplatesState.deletedIds.length > 0) ||
                     (TemplatesState.overrides && Object.keys(TemplatesState.overrides).length > 0);

  container.innerHTML = `
    <div class="space-y-5 animate-fade-in pb-16">

      <!-- Header Card -->
      <div class="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div class="absolute -right-8 -bottom-8 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <i class='bx bxs-folder-open'></i> ศูนย์รวมแบบฟอร์มเอกสาร 4 ฝ่าย
            </div>
            <h1 class="text-xl md:text-2xl font-bold tracking-tight">แบบฟอร์มงาน 4 ฝ่าย โรงเรียนมหาชัยพิทยาคาร</h1>
            <p class="text-xs md:text-sm text-blue-100 mt-1 max-w-2xl font-light">
              ดาวน์โหลดตัวอย่างเอกสาร Word (.doc) พิมพ์ขนาด A4 คัดลอกข้อความราชการมาตรฐาน และอัพโหลด/แก้ไขแบบฟอร์มของโรงเรียน
            </p>
          </div>
          <div class="flex items-center gap-2 flex-wrap" id="templateHeaderActions">
            ${isAdmin ? `
              <button type="button" class="btn bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2" onclick="openTemplateModal()">
                <i class='bx bx-plus-circle text-base'></i> เพิ่มแบบฟอร์มใหม่
              </button>
              ${hasChanges ? `
                <button type="button" class="btn bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5" onclick="resetTemplateDefaultsConfirm()" title="คืนค่าแบบฟอร์มเริ่มต้นทั้งหมด">
                  <i class='bx bx-reset'></i> คืนค่าเริ่มต้น
                </button>
              ` : ''}
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Stats Area -->
      <div id="templateStatsArea" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Rendered by renderTemplateStats() -->
      </div>

      <!-- Filter Tabs & Search Bar -->
      <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm space-y-3">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <!-- Department Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none" id="templateDeptTabs">
            ${Object.values(TEMPLATE_DEPARTMENTS).map(d => `
              <button type="button"
                      class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${TemplatesState.activeDept === d.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
                      onclick="switchTemplateDept('${d.id}')">
                <i class='bx ${d.icon}'></i>
                <span>${d.label}</span>
                <span class="ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${TemplatesState.activeDept === d.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'}">
                  ${d.count}
                </span>
              </button>
            `).join('')}
          </div>

          <!-- Search Box -->
          <div class="relative w-full md:w-72 flex-shrink-0">
            <i class='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none'></i>
            <input type="text"
                   id="templateSearchInput"
                   class="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                   placeholder="ค้นหาชื่อแบบฟอร์ม, แท็ก, คีย์เวิร์ด..."
                   value="${escapeHTML(TemplatesState.searchQuery)}"
                   oninput="handleTemplateSearch(this.value)">
            ${TemplatesState.searchQuery ? `
              <button type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm" onclick="clearTemplateSearch()">
                <i class='bx bx-x'></i>
              </button>
            ` : ''}
          </div>

        </div>
      </div>

      <!-- Templates Grid List -->
      <div id="templatesListGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Rendered by renderTemplateCards() -->
      </div>

    </div>
  `;

  updateTemplateCounts();
  renderTemplateStats();
  renderTemplateCards();
  loadCustomTemplates();
}

/**
 * สลับแท็บฝ่าย
 */
function switchTemplateDept(deptId) {
  TemplatesState.activeDept = deptId;
  const tabs = document.querySelectorAll('#templateDeptTabs button');
  tabs.forEach(btn => {
    btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200';
  });
  renderTemplateCards();

  // Highlight active tab
  const activeBtn = Array.from(document.querySelectorAll('#templateDeptTabs button')).find(b => b.textContent.includes(TEMPLATE_DEPARTMENTS[deptId].label));
  if (activeBtn) {
    activeBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 bg-blue-600 text-white shadow-sm';
  }
}

/**
 * ค้นหาแบบฟอร์ม
 */
function handleTemplateSearch(val) {
  TemplatesState.searchQuery = (val || '').trim().toLowerCase();
  renderTemplateCards();
}

function clearTemplateSearch() {
  TemplatesState.searchQuery = '';
  const inp = document.getElementById('templateSearchInput');
  if (inp) inp.value = '';
  renderTemplateCards();
}

function getIconByFormat(format) {
  if (!format) return 'bxs-file';
  const f = format.toLowerCase();
  if (f.includes('word') || f.includes('doc')) return 'bxs-file-doc';
  if (f.includes('pdf')) return 'bxs-file-pdf';
  if (f.includes('excel') || f.includes('sheet') || f.includes('xls')) return 'bxs-spreadsheet';
  return 'bxs-file-blank';
}

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '';
  const kb = bytes / 1024;
  if (kb < 1000) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

/**
 * เรนเดอร์การ์ดแบบฟอร์มทั้งหมด (มีปุ่ม เพิ่ม / ลบ / แก้ไข ครบ)
 */
function renderTemplateCards() {
  const grid = document.getElementById('templatesListGrid');
  if (!grid) return;

  const q = TemplatesState.searchQuery;
  const dept = TemplatesState.activeDept;
  const isAdmin = typeof APP !== 'undefined' && APP.role && APP.role !== 'teacher';

  const allTemplates = getEffectiveTemplates();

  const filtered = allTemplates.filter(t => {
    const matchDept = dept === 'all' || t.dept === dept;
    const matchQuery = !q ||
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.desc && t.desc.toLowerCase().includes(q)) ||
      (t.summary && t.summary.toLowerCase().includes(q)) ||
      (t.tags && Array.isArray(t.tags) && t.tags.some(tag => tag.toLowerCase().includes(q)));
    return matchDept && matchQuery;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <i class='bx bx-search-alt text-5xl mb-2'></i>
        <div class="text-base font-semibold text-slate-600">ไม่พบแบบฟอร์มที่ค้นหา</div>
        <div class="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกแท็บงานฝ่ายอื่น</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(t => {
    const dInfo = TEMPLATE_DEPARTMENTS[t.dept] || TEMPLATE_DEPARTMENTS.general;
    const isCustom = !!t.is_custom;
    const isModified = !!t.is_modified;
    const hasFile = !!(t.download_url || t.view_url);

    return `
      <div class="tmpl-card">
        <div>
          <!-- Header -->
          <div class="flex items-start gap-3 mb-2.5">
            <div class="tmpl-icon-box" style="background:${dInfo.badgeBg}; color:${dInfo.color};">
              <i class='bx ${t.icon || getIconByFormat(t.format)}'></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background:${dInfo.badgeBg}; color:${dInfo.badgeText};">
                  ${dInfo.label}
                </span>
                ${isCustom ? `
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <i class='bx bx-cloud-upload'></i> อัพโหลดโดยโรงเรียน
                  </span>
                ` : isModified ? `
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <i class='bx bx-edit-alt'></i> ปรับปรุงโดยโรงเรียน
                  </span>
                ` : `
                  <span class="text-[10px] text-slate-400 font-medium">Word .doc</span>
                `}
              </div>
              <h3 class="text-sm font-bold text-slate-800 leading-snug truncate" title="${escapeHTML(t.title)}">
                ${escapeHTML(t.title)}
              </h3>
            </div>
          </div>

          <!-- Description -->
          <p class="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2">
            ${escapeHTML(t.desc || t.summary || 'แบบฟอร์มเอกสารมาตรฐาน')}
          </p>

          ${isCustom && t.uploader_name ? `
            <div class="text-[10px] text-slate-400 mb-2">
              โดย: ${escapeHTML(t.uploader_name)} ${t.file_size ? '· ' + formatFileSize(t.file_size) : ''}
            </div>
          ` : ''}

          <!-- Tags -->
          <div class="flex flex-wrap gap-1 mb-3">
            ${(t.tags || []).slice(0, 3).map(tag => `
              <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">#${escapeHTML(tag)}</span>
            `).join('')}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
          ${hasFile ? `
            <a href="${t.download_url || t.view_url}" target="_blank" download class="btn btn-blue btn-sm flex-1 text-xs justify-center" style="text-decoration:none;">
              <i class='bx bxs-download'></i> ดาวน์โหลด (${escapeHTML(t.format || 'ไฟล์')})
            </a>
            ${t.view_url ? `
              <button type="button" class="btn btn-light btn-sm text-xs px-2.5" onclick="window.open('${t.view_url}','_blank')" title="เปิดดูตัวอย่าง">
                <i class='bx bx-show'></i>
              </button>
            ` : ''}
          ` : `
            <button type="button" class="btn btn-blue btn-sm flex-1 text-xs justify-center" onclick="downloadTemplateDoc('${t.id}')">
              <i class='bx bxs-file-doc'></i> Word
            </button>
            <button type="button" class="btn btn-light btn-sm text-xs px-2.5" onclick="previewTemplatePrint('${t.id}')" title="ดูตัวอย่าง / พิมพ์ A4">
              <i class='bx bx-printer'></i>
            </button>
            <button type="button" class="btn btn-light btn-sm text-xs px-2.5" onclick="copyTemplateContent('${t.id}')" title="คัดลอกข้อความ">
              <i class='bx bx-copy'></i>
            </button>
          `}

          <!-- Admin Edit & Delete Buttons -->
          ${isAdmin ? `
            <button type="button" class="btn btn-light btn-sm text-xs px-2 text-blue-600 hover:bg-blue-50" onclick="openTemplateModal('${t.id}')" title="แก้ไขแบบฟอร์ม">
              <i class='bx bx-edit-alt'></i>
            </button>
            <button type="button" class="btn btn-light btn-sm text-xs px-2 text-red-600 hover:bg-red-50" onclick="deleteTemplateConfirm('${t.id}')" title="ลบแบบฟอร์มนี้">
              <i class='bx bx-trash'></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
 *  MODAL: เพิ่ม / แก้ไข แบบฟอร์ม (UNIFIED MODAL)
 * ============================================================ */
function openTemplateModal(editId = null) {
  const isAdmin = typeof APP !== 'undefined' && APP.role && APP.role !== 'teacher';
  if (!isAdmin) {
    return showToast('warning', 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่มหรือแก้ไขแบบฟอร์มได้');
  }

  const existing = editId ? getEffectiveTemplates().find(x => x.id === editId) : null;
  const isEdit = !!existing;

  const currentTitle = isEdit ? (existing.title || '') : '';
  const currentDept = isEdit ? (existing.dept || 'academic') : (TemplatesState.activeDept !== 'all' ? TemplatesState.activeDept : 'academic');
  const currentDesc = isEdit ? (existing.desc || existing.summary || '') : '';
  const currentTags = isEdit && Array.isArray(existing.tags) ? existing.tags.join(', ') : '';
  const currentFormat = isEdit ? (existing.format || 'Word (.doc)') : 'Word (.docx / .doc)';

  const modalHtml = `
    <div style="text-align:left; font-size:13px; line-height:1.4;">
      <p style="color:#64748B; margin-bottom:12px;">
        ${isEdit ? 'แก้ไขข้อมูลแบบฟอร์มสำหรับโรงเรียนมหาชัยพิทยาคาร' : 'อัพโหลดหรือเพิ่มแบบฟอร์มเอกสาร 4 ฝ่ายเข้าสู่ระบบ'}
      </p>

      <div style="margin-bottom:10px;">
        <label style="display:block; font-weight:600; margin-bottom:4px; color:#1E293B;">ชื่อแบบฟอร์ม <span style="color:#EF4444;">*</span></label>
        <input type="text" id="swalTmplTitle" class="swal2-input" style="width:100%; margin:0; padding:8px 12px; font-size:13px; height:auto; border-radius:8px;" value="${escapeHTML(currentTitle)}" placeholder="เช่น บันทึกข้อความขออนุมัติโครงการ..." />
      </div>

      <div style="margin-bottom:10px;">
        <label style="display:block; font-weight:600; margin-bottom:4px; color:#1E293B;">ฝ่ายที่รับผิดชอบ <span style="color:#EF4444;">*</span></label>
        <select id="swalTmplDept" class="swal2-select" style="width:100%; margin:0; padding:8px 12px; font-size:13px; height:auto; border-radius:8px;">
          <option value="academic" ${currentDept === 'academic' ? 'selected' : ''}>ฝ่ายบริหารวิชาการ</option>
          <option value="budget" ${currentDept === 'budget' ? 'selected' : ''}>ฝ่ายบริหารงบประมาณและแผนงาน</option>
          <option value="personnel" ${currentDept === 'personnel' ? 'selected' : ''}>ฝ่ายบริหารงานบุคคล</option>
          <option value="general" ${currentDept === 'general' ? 'selected' : ''}>ฝ่ายบริหารทั่วไป</option>
        </select>
      </div>

      <div style="margin-bottom:10px;">
        <label style="display:block; font-weight:600; margin-bottom:4px; color:#1E293B;">คำอธิบายโดยย่อ</label>
        <textarea id="swalTmplDesc" class="swal2-textarea" style="width:100%; margin:0; padding:8px 12px; font-size:13px; height:60px; border-radius:8px;" placeholder="อธิบายวัตถุประสงค์ หรือขั้นตอนการใช้งานย่อๆ...">${escapeHTML(currentDesc)}</textarea>
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block; font-weight:600; margin-bottom:4px; color:#1E293B;">แท็ก / คำค้นหา (คั่นด้วยจุลภาค)</label>
        <input type="text" id="swalTmplTags" class="swal2-input" style="width:100%; margin:0; padding:8px 12px; font-size:13px; height:auto; border-radius:8px;" value="${escapeHTML(currentTags)}" placeholder="บันทึกข้อความ, ขออนุมัติ, การเงิน" />
      </div>

      <div style="background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:8px; padding:10px; margin-bottom:10px;">
        <label style="display:block; font-weight:600; margin-bottom:4px; color:#1E293B;">
          ${isEdit ? 'เปลี่ยนไฟล์แนบ (ถ้าต้องการ)' : 'ไฟล์เอกสาร (Word / PDF / Excel)'}
        </label>
        <input type="file" id="swalTmplFile" accept=".doc,.docx,.pdf,.xls,.xlsx" style="font-size:12px; width:100%;" />
        <div style="font-size:11px; color:#94A3B8; margin-top:4px;">
          ${isEdit && existing.file_name ? `ไฟล์เดิม: <strong>${escapeHTML(existing.file_name)}</strong>` : 'รองรับไฟล์ .doc, .docx, .pdf, .xls, .xlsx (ขนาดไม่เกิน 15MB)'}
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: isEdit ? 'แก้ไขแบบฟอร์ม' : 'เพิ่มแบบฟอร์มงาน 4 ฝ่าย',
    html: modalHtml,
    width: '540px',
    showCancelButton: true,
    confirmButtonText: isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มแบบฟอร์ม',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#2563EB',
    focusConfirm: false,
    preConfirm: () => {
      const title = document.getElementById('swalTmplTitle').value.trim();
      const dept = document.getElementById('swalTmplDept').value;
      const desc = document.getElementById('swalTmplDesc').value.trim();
      const tagsStr = document.getElementById('swalTmplTags').value.trim();
      const fileInput = document.getElementById('swalTmplFile');
      const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

      if (!title) {
        Swal.showValidationMessage('กรุณาระบุชื่อแบบฟอร์ม');
        return false;
      }
      if (!isEdit && !file) {
        Swal.showValidationMessage('กรุณาเลือกไฟล์เอกสารที่ต้องการอัพโหลด');
        return false;
      }

      const tags = tagsStr ? tagsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
      return { title, dept, desc, tags, file };
    }
  }).then(async (result) => {
    if (!result.isConfirmed || !result.value) return;

    const { title, dept, desc, tags, file } = result.value;
    showLoading(file ? 'กำลังอัพโหลดไฟล์เข้า Google Drive...' : 'กำลังบันทึกข้อมูล...');

    try {
      let fileData = {};
      if (file) {
        if (typeof uploadFileToGAS === 'function') {
          const upRes = await uploadFileToGAS(file, 'templates');
          fileData = {
            file_id: upRes.file_id || '',
            file_name: file.name,
            file_size: file.size,
            format: file.name.endsWith('.pdf') ? 'PDF' : (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) ? 'Excel' : 'Word (.docx)',
            download_url: upRes.download_url || upRes.view_url || '',
            view_url: upRes.view_url || ''
          };
        } else {
          fileData = {
            file_name: file.name,
            file_size: file.size,
            format: 'Word (.doc)',
            download_url: '#',
            view_url: '#'
          };
        }
      }

      const isBuiltIn = isEdit && !existing.is_custom;
      const templateData = Object.assign({
        id: isEdit ? existing.id : ('cust_tmpl_' + Date.now()),
        title: title,
        dept: dept,
        desc: desc,
        tags: tags,
        format: fileData.format || (existing ? existing.format : 'Word (.doc)'),
        is_custom: isBuiltIn ? false : true,
        is_override: isBuiltIn ? true : false,
        uploader_name: (typeof APP !== 'undefined' && APP.user && (APP.user.name || APP.user.username)) || 'Admin',
        updated_at: new Date().toISOString()
      }, fileData);

      // Save locally
      if (isBuiltIn) {
        TemplatesState.overrides[existing.id] = templateData;
        try {
          localStorage.setItem('mhc_template_overrides', JSON.stringify(TemplatesState.overrides));
        } catch (_) {}
      } else if (isEdit) {
        const idx = TemplatesState.customTemplates.findIndex(x => x.id === existing.id);
        if (idx !== -1) TemplatesState.customTemplates[idx] = Object.assign(TemplatesState.customTemplates[idx], templateData);
        try {
          localStorage.setItem('mhc_custom_templates', JSON.stringify(TemplatesState.customTemplates));
        } catch (_) {}
      } else {
        templateData.created_at = new Date().toISOString();
        TemplatesState.customTemplates.unshift(templateData);
        try {
          localStorage.setItem('mhc_custom_templates', JSON.stringify(TemplatesState.customTemplates));
        } catch (_) {}
      }

      updateTemplateCounts();
      renderTemplateStats();
      renderTemplateCards();

      // Sync to Google Apps Script backend
      const token = (typeof APP !== 'undefined' && APP.token) || '';
      if (typeof google !== 'undefined' && google.script && google.script.run && token) {
        google.script.run
          .withSuccessHandler(saveRes => {
            hideLoading();
            showToast('success', isEdit ? 'แก้ไขแบบฟอร์มสำเร็จ' : 'เพิ่มแบบฟอร์มใหม่สำเร็จ');
          })
          .withFailureHandler(err => {
            hideLoading();
            showToast('info', (isEdit ? 'แก้ไข' : 'เพิ่ม') + 'แบบฟอร์มสำเร็จ (บันทึกในเครื่องแล้ว)');
          })
          .saveCustomTemplate(templateData, token);
      } else {
        hideLoading();
        showToast('success', isEdit ? 'แก้ไขแบบฟอร์มสำเร็จ' : 'เพิ่มแบบฟอร์มใหม่สำเร็จ');
      }

    } catch (err) {
      hideLoading();
      Swal.fire({ icon:'error', title:'เกิดข้อผิดพลาด', text: err.message || err });
    }
  });
}

/**
 * ลบแบบฟอร์ม (รองรับทั้งแบบฟอร์ม Custom และแบบฟอร์ม Built-in)
 */
function deleteTemplateConfirm(id) {
  const isAdmin = typeof APP !== 'undefined' && APP.role && APP.role !== 'teacher';
  if (!isAdmin) {
    return showToast('warning', 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบแบบฟอร์มได้');
  }

  const all = getEffectiveTemplates();
  const item = all.find(x => x.id === id);
  const title = item ? item.title : 'แบบฟอร์มนี้';
  const isBuiltIn = FOUR_DEPT_TEMPLATES.some(x => x.id === id);

  Swal.fire({
    title: 'ยืนยันการลบแบบฟอร์ม?',
    html: `
      <div style="font-size:14px; text-align:center; color:#334155;">
        คุณต้องการลบ <strong>"${escapeHTML(title)}"</strong> ออกจากระบบใช่หรือไม่?
        ${isBuiltIn ? '<br><span style="font-size:12px; color:#64748B; margin-top:6px; display:inline-block;">(สามารถคลิกปุ่ม "คืนค่าเริ่มต้น" เพื่อกู้คืนแบบฟอร์มมาตรฐานกลับมาได้ภายหลัง)</span>' : ''}
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบแบบฟอร์ม',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#DC2626'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบแบบฟอร์ม...');

    // 1. ลบจาก Local state
    if (isBuiltIn) {
      if (!TemplatesState.deletedIds.includes(id)) {
        TemplatesState.deletedIds.push(id);
      }
      delete TemplatesState.overrides[id];
      try {
        localStorage.setItem('mhc_deleted_templates', JSON.stringify(TemplatesState.deletedIds));
        localStorage.setItem('mhc_template_overrides', JSON.stringify(TemplatesState.overrides));
      } catch (_) {}
    } else {
      TemplatesState.customTemplates = TemplatesState.customTemplates.filter(x => x.id !== id);
      try {
        localStorage.setItem('mhc_custom_templates', JSON.stringify(TemplatesState.customTemplates));
      } catch (_) {}
    }

    updateTemplateCounts();
    renderTemplateStats();
    renderTemplateCards();

    // 2. ซิงค์ไปยัง Google Apps Script Backend
    const token = (typeof APP !== 'undefined' && APP.token) || '';
    if (typeof google !== 'undefined' && google.script && google.script.run && token) {
      google.script.run
        .withSuccessHandler(res => {
          hideLoading();
          showToast('success', 'ลบแบบฟอร์มเรียบร้อย');
        })
        .withFailureHandler(err => {
          hideLoading();
          showToast('success', 'ลบแบบฟอร์มเรียบร้อย (ลบในเครื่องแล้ว)');
        })
        .deleteCustomTemplate(id, token);
    } else {
      hideLoading();
      showToast('success', 'ลบแบบฟอร์มเรียบร้อย');
    }
  });
}

/**
 * คืนค่าแบบฟอร์มเริ่มต้นทั้งหมด (Reset Defaults)
 */
function resetTemplateDefaultsConfirm() {
  const isAdmin = typeof APP !== 'undefined' && APP.role && APP.role !== 'teacher';
  if (!isAdmin) return;

  Swal.fire({
    title: 'คืนค่าแบบฟอร์มเริ่มต้น?',
    text: 'ระบบจะนำแบบฟอร์มมาตรฐาน 30 รายการทั้งหมดกลับมาแสดงตามค่าเริ่มต้นของระบบ',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ยืนยันคืนค่า',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#2563EB'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังคืนค่าแบบฟอร์ม...');

    TemplatesState.deletedIds = [];
    TemplatesState.overrides = {};
    try {
      localStorage.removeItem('mhc_deleted_templates');
      localStorage.removeItem('mhc_template_overrides');
    } catch (_) {}

    updateTemplateCounts();
    renderTemplateStats();
    renderTemplateCards();

    const token = (typeof APP !== 'undefined' && APP.token) || '';
    if (typeof google !== 'undefined' && google.script && google.script.run && token) {
      google.script.run
        .withSuccessHandler(res => {
          hideLoading();
          showToast('success', 'คืนค่าแบบฟอร์มเริ่มต้นสำเร็จ');
        })
        .withFailureHandler(err => {
          hideLoading();
          showToast('success', 'คืนค่าแบบฟอร์มเริ่มต้นสำเร็จ');
        })
        .resetCustomTemplates(token);
    } else {
      hideLoading();
      showToast('success', 'คืนค่าแบบฟอร์มเริ่มต้นสำเร็จ');
    }
  });
}

/* ============================================================
 *  DOWNLOAD TEMPLATE (WORD .DOC)
 * ============================================================ */
function downloadTemplateDoc(templateId) {
  const t = getEffectiveTemplates().find(x => x.id === templateId);
  if (!t) return showToast('error', 'ไม่พบแบบฟอร์มที่ระบุ');

  if (t.download_url && t.download_url !== '#') {
    window.open(t.download_url, '_blank');
    return;
  }

  const contentHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office'
        xmlns:w='urn:schemas-microsoft-com:office:word'
        xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>${escapeHTML(t.title)}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page Section1 {
        size: 210mm 297mm;
        margin: 25mm 20mm 20mm 25mm;
        mso-header-margin: 35.4pt;
        mso-footer-margin: 35.4pt;
        mso-paper-source: 0;
      }
      div.Section1 {
        page: Section1;
        width: 100%;
        max-width: 165mm;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      * { box-sizing: border-box; }
      body {
        font-family: 'TH Sarabun New', 'TH Sarabun PSK', 'Cordia New', 'Angsana New', sans-serif;
        font-size: 16pt;
        line-height: 1.35;
        color: #000000;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      h1, h2, h3 {
        font-family: 'TH Sarabun New', 'TH Sarabun PSK', sans-serif;
        text-align: center;
        margin: 0 0 6pt 0;
      }
      p { margin: 0 0 3pt 0; text-indent: 1.8cm; line-height: 1.35; }
      p.no-indent { text-indent: 0; margin: 0 0 3pt 0; }
      p.center { text-indent: 0; text-align: center; }
      .memo-header-line { margin: 0 0 2pt 0; text-indent: 0; }
      hr.memo-divider { border: none; border-top: 1.5pt solid #000; margin: 4pt 0 6pt 0; }
      table {
        width: 100% !important;
        max-width: 100% !important;
        border-collapse: collapse;
        table-layout: fixed;
        margin: 6pt 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      th, td {
        border: 1px solid #000;
        padding: 3pt 4pt;
        font-size: 13.5pt;
        vertical-align: top;
        word-break: break-all;
        overflow-wrap: anywhere;
      }
      th { background: #F0F0F0; font-weight: bold; text-align: center; }
      table.borderless, table.borderless td, table.borderless th {
        border: none !important;
        padding: 0 !important;
      }
      .sign-block { text-align: center; margin-top: 16pt; }
      .footer-note {
        font-size: 9.5pt;
        color: #666666;
        text-align: right;
        margin-top: 24pt;
        padding-top: 4pt;
        border-top: 0.5px solid #CCCCCC;
      }
    </style>
  </head>
  <body>
    <div class="Section1">
      ${t.docBody || `<div style="text-align:center; padding:50px;"><h3>${escapeHTML(t.title)}</h3><p>${escapeHTML(t.desc || '')}</p></div>`}
      <div class="footer-note">
        ระบบ MHC Smart School | โรงเรียนมหาชัยพิทยาคาร | พัฒนาโดย ครูก้องนที อุ่นเจริญ
      </div>
    </div>
  </body>
  </html>`;

  const blob = new Blob(['\ufeff', contentHtml], {
    type: 'application/msword;charset=utf-8'
  });
  const filename = `${t.title.replace(/[\/\\?%*:|"<>]/g, '_')}_โรงเรียนมหาชัยพิทยาคาร.doc`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  showToast('success', `ดาวน์โหลด "${filename}" สำเร็จ`);
}

/* ============================================================
 *  PREVIEW & PRINT TEMPLATE (A4)
 * ============================================================ */
function previewTemplatePrint(templateId) {
  const t = getEffectiveTemplates().find(x => x.id === templateId);
  if (!t) return showToast('error', 'ไม่พบแบบฟอร์มที่ระบุ');

  if (t.view_url && t.view_url !== '#') {
    window.open(t.view_url, '_blank');
    return;
  }

  const printTimeStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(t.title)} - โรงเรียนมหาชัยพิทยาคาร</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 20mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
      margin: 0;
      padding: 0;
      color: #000000;
      background: #F1F5F9;
      font-size: 15pt;
      line-height: 1.35;
    }
    .print-doc {
      width: 100%;
      max-width: 210mm;
      min-height: 297mm;
      margin: 16px auto;
      background: #FFFFFF;
      padding: 20mm 16mm 20mm 20mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
      border-radius: 2px;
      box-sizing: border-box;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1E293B;
      color: white;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-size: 14px;
    }
    .btn-print {
      background: #8B0000;
      color: white;
      border: none;
      padding: 7px 20px;
      border-radius: 6px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover { background: #600018; }
    p { margin: 0 0 3pt 0; text-indent: 1.8cm; line-height: 1.35; }
    p.no-indent { text-indent: 0; margin: 0 0 3pt 0; }
    p.center { text-indent: 0; text-align: center; }
    hr.memo-divider { border: none; border-top: 1.5pt solid #000; margin: 4pt 0 6pt 0; }
    table {
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 6pt 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    th, td {
      border: 1px solid #000;
      padding: 3pt 4pt;
      font-size: 13pt;
      vertical-align: top;
      word-break: break-all;
      overflow-wrap: anywhere;
    }
    th { background: #F0F0F0; font-weight: bold; text-align: center; }
    table.borderless, table.borderless td, table.borderless th {
      border: none !important;
      padding: 0 !important;
    }
    .print-footer {
      margin-top: 24pt;
      padding-top: 6pt;
      border-top: 1px solid #CCCCCC;
      display: flex;
      justify-content: space-between;
      font-size: 9.5pt;
      color: #555555;
      page-break-inside: avoid;
    }
    @media print {
      html, body {
        background: #fff !important;
        font-size: 15pt !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print { display: none !important; }
      .print-doc {
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: auto !important;
        overflow: visible !important;
      }
      table, tr, td, th {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="no-print no-print-bar">
    <div>
      <strong>ตัวอย่างก่อนพิมพ์: ${escapeHTML(t.title)}</strong>
      <span style="font-size:12px; opacity:0.8; margin-left:8px;">(กระดาษ A4)</span>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn-print" onclick="window.print()">
        🖨 พิมพ์ / บันทึกเป็น PDF
      </button>
    </div>
  </div>

  <div class="print-doc">
    ${t.docBody || `<div style="text-align:center; padding:50px;"><h3>${escapeHTML(t.title)}</h3><p>${escapeHTML(t.desc || '')}</p></div>`}

    <div class="print-footer">
      <div>ระบบ MHC Smart School | โรงเรียนมหาชัยพิทยาคาร | พัฒนาโดย ครูก้องนที อุ่นเจริญ</div>
      <div>พิมพ์เมื่อ: ${printTimeStr} น.</div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;

  if (typeof openHTMLDocument === 'function') {
    openHTMLDocument(html);
  } else {
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Popup ถูกปิด',
        text: 'กรุณาอนุญาตให้เปิด pop-up จาก URL นี้เพื่อพิมพ์เอกสาร'
      });
    }
  }
}

/* ============================================================
 *  COPY TEMPLATE TEXT TO CLIPBOARD
 * ============================================================ */
function copyTemplateContent(templateId) {
  const t = getEffectiveTemplates().find(x => x.id === templateId);
  if (!t) return showToast('error', 'ไม่พบแบบฟอร์มที่ระบุ');

  const tmp = document.createElement('div');
  tmp.innerHTML = t.docBody || t.desc || '';
  const textContent = (tmp.innerText || tmp.textContent || '').trim();

  if (!textContent) {
    return showToast('warning', 'ไม่มีข้อความในแบบฟอร์มนี้');
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textContent)
      .then(() => showToast('success', `คัดลอก "${t.title}" เรียบร้อย`))
      .catch(() => fallbackCopyText(textContent, t.title));
  } else {
    fallbackCopyText(textContent, t.title);
  }
}

function fallbackCopyText(text, title) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('success', `คัดลอก "${title}" เรียบร้อย`);
  } catch (err) {
    showToast('error', 'ไม่สามารถคัดลอกข้อความได้');
  }
  document.body.removeChild(ta);
}

// Window global exports
window.renderTemplates = renderTemplates;
window.switchTemplateDept = switchTemplateDept;
window.handleTemplateSearch = handleTemplateSearch;
window.clearTemplateSearch = clearTemplateSearch;
window.downloadTemplateDoc = downloadTemplateDoc;
window.previewTemplatePrint = previewTemplatePrint;
window.copyTemplateContent = copyTemplateContent;
window.openTemplateModal = openTemplateModal;
window.deleteTemplateConfirm = deleteTemplateConfirm;
window.resetTemplateDefaultsConfirm = resetTemplateDefaultsConfirm;
