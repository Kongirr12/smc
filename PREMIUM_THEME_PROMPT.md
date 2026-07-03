# Prompt สำหรับสร้าง UI แบบ Premium & Glassmorphism

หากต้องการให้ AI (เช่น ChatGPT, Claude หรือตัวอื่นๆ) ช่วยเขียนโค้ดเว็บไซต์ให้ได้หน้าตาและโทนสีที่สวยงามแบบโปรเจกต์นี้ สามารถคัดลอกข้อความด้านล่างนี้ไปสั่งได้เลยครับ:

--------------------------------------------------

**Please build a web application using HTML, Tailwind CSS, and Vanilla JavaScript. I want the UI to have a 'Premium, Modern, and Glassmorphism' aesthetic. Please strictly follow these design guidelines:**

1. **Color Palette & Typography:** 
   - Use a soft, premium background (e.g., `bg-slate-50`).
   - Text colors should be `slate-800` for headings and `slate-500` for secondary text.
   - Primary brand colors should use gradients (e.g., `from-blue-600 to-indigo-600`).
   - Import and use the **'Prompt'** Google Font for both Thai and English.

2. **Glassmorphism Cards (Glass Panels):**
   - Instead of flat white backgrounds, use semi-transparent white backgrounds with backdrop blur (e.g., `bg-white/70 backdrop-blur-md border border-white/50 shadow-sm`).
   - Use highly rounded corners (`rounded-2xl` or `rounded-xl`).

3. **Premium Inputs:**
   - Input fields should have soft backgrounds (`bg-slate-50/80`) with no borders initially.
   - On focus, they should smoothly animate: lift up slightly (`focus:-translate-y-1`), show a glowing border (`focus:border-blue-500`), and cast a colored shadow (`focus:shadow-blue-500/20`).

4. **Premium Buttons:**
   - Primary buttons should use vibrant gradients, rounded corners (`rounded-xl`), and have a subtle hover effect (lift up, increase shadow).
   - Add a click animation (`active:scale-[0.98]`).

5. **Micro-animations:**
   - Apply `transition-all duration-300` to all interactive elements.
   - Cards should have a `hover-lift` effect (moving up slightly with a larger shadow on hover).

**Make sure the overall layout is spacious (generous padding/margins) and looks highly professional and modern.**

--------------------------------------------------

### คำแนะนำเพิ่มเติมสำหรับการเขียน CSS
เพื่อความสะดวก คุณสามารถก๊อปปี้ CSS Classes เหล่านี้ไปใส่ใน `<style type="text/tailwindcss">` ของโปรเจกต์ใหม่ได้เลย:

```css
@layer utilities {
    .glass-panel {
        @apply bg-white/70 backdrop-blur-md border border-white/50 shadow-sm;
    }
    
    .premium-input {
        @apply w-full rounded-xl border-2 border-transparent bg-slate-50/80 px-5 py-3.5 text-base outline-none transition-all duration-300 hover:bg-slate-100 hover:shadow-md focus:-translate-y-1 focus:bg-white focus:border-primary-500 focus:shadow-xl focus:shadow-primary-500/20 placeholder-slate-400;
    }
    
    .premium-btn {
        @apply inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 shadow-md shadow-primary-500/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98];
    }
    
    .premium-btn-outline {
        @apply inline-flex items-center justify-center px-6 py-3 border-2 border-slate-200 text-base font-medium rounded-xl text-slate-700 bg-white hover:border-primary-500 hover:text-primary-600 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98];
    }

    .hover-lift {
        @apply transition-all duration-300 hover:-translate-y-1 hover:shadow-lg;
    }
}
```
