document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro");
  const main = document.getElementById("main");
  setTimeout(() => { intro.style.display = "none"; main.classList.remove("hidden"); }, 5000);

  const opsName = document.getElementById("opsName");
  const opsCode = document.getElementById("opsCode");
  const deputyName = document.getElementById("deputyName");
  const deputyCode = document.getElementById("deputyCode");
  const opsError = document.getElementById("opsError");
  const deputyError = document.getElementById("deputyError");

  const fileInput = document.getElementById("fileInput");
  const dropzone = document.getElementById("dropzone");
  const progress = document.getElementById("progress");
  const dataTable = document.getElementById("dataTable").querySelector("tbody");
  const finalOutput = document.getElementById("finalOutput");
  const copyBtn = document.getElementById("copyBtn");
  const copyAlert = document.getElementById("copyAlert");
  const addRowBtn = document.getElementById("addRow");

  // OCR: رفع صورة أو لصق
  async function handleImage(file) {
    progress.classList.remove("hidden");
    let count = 3;
    const interval = setInterval(() => {
      progress.textContent = `جارِ المعالجة (${count})`;
      count--;
      if (count < 0) clearInterval(interval);
    }, 1000);
    const { data: { text } } = await Tesseract.recognize(file, 'ara+eng');
    clearInterval(interval);
    progress.classList.add("hidden");
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach(line => {
      line = line.replace(/[^\u0600-\u06FFa-zA-Z0-9\s\+]/g, ''); // تنظيف الرموز
      let busy = line.includes("مشغول");
      line = line.replace("مشغول", "").trim();
      let parts = line.split("+").map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        const row = createRow(parts.join(" + "), busy);
        dataTable.appendChild(row);
      } else {
        const name = line.replace(/[0-9]/g, '').trim();
        const code = line.replace(/[^0-9]/g, '').trim();
        const row = createRow(`${name} ${code}`, busy);
        dataTable.appendChild(row);
      }
    });
    updateFinalOutput();
  }

  fileInput.addEventListener("change", (e) => { if (e.target.files[0]) handleImage(e.target.files[0]); });
  dropzone.addEventListener("paste", (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
      if (item.type.startsWith("image/")) handleImage(item.getAsFile());
    }
  });

  // إنشاء صف جديد
  function createRow(text, busy=false) {
    if (busy) text += " (مشغول)";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="2">${text}</td>
      <td>
        <button class="btn-edit" onclick="editRow(this)">✏️ تعديل</button>
        <button class="btn-delete" onclick="deleteRow(this)">🗑️ حذف</button>
      </td>`;
    return row;
  }

  addRowBtn.addEventListener("click", () => {
    const row = createRow("اسم كود");
    dataTable.appendChild(row);
    updateFinalOutput();
  });

  // تحديث النتيجة النهائية
  function updateFinalOutput() {
    opsError.textContent = "";
    deputyError.textContent = "";
    if (!opsName.value.trim()) { opsError.textContent = "الرجاء كتابة اسم العمليات"; return; }
    if (!deputyName.value.trim()) { deputyError.textContent = "الرجاء كتابة اسم النائب"; return; }

    let result = "📌 استلام العمليات 📌\n\n";
    result += `اسم العمليات : ${opsName.value} ${opsCode.value}\n`;
    result += `النائب : ${deputyName.value} ${deputyCode.value}\n\n`;

    let rows = [...dataTable.rows].map(r => r.cells[0].innerText);
    result += `عدد واسماء الوحدات في الميدان [${rows.length}]\n\n`;
    rows.forEach(r => { result += r + "\n"; });

    finalOutput.innerText = result;
  }

  // زر النسخ
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(finalOutput.innerText).then(() => {
      copyAlert.classList.remove("hidden");
      setTimeout(() => copyAlert.classList.add("hidden"), 2000);
    });
  });

  // تعديل / حفظ / حذف
  window.editRow = function(btn) {
    const row = btn.parentElement.parentElement;
    const value = row.cells[0].innerText;
    row.cells[0].innerHTML = `<input type="text" value="${value}" style="width:90%">`;
    btn.textContent = "✔️ حفظ";
    btn.className = "btn-save";
    btn.onclick = () => saveRow(btn);
  }

  window.saveRow = function(btn) {
    const row = btn.parentElement.parentElement;
    const input = row.cells[0].querySelector("input");
    row.cells[0].innerText = input.value;
    btn.textContent = "✏️ تعديل";
    btn.className = "btn-edit";
    btn.onclick = () => editRow(btn);
    updateFinalOutput();
  }

  window.deleteRow = function(btn) {
    btn.parentElement.parentElement.remove();
    updateFinalOutput();
  }

  opsName.addEventListener("input", updateFinalOutput);
  opsCode.addEventListener("input", updateFinalOutput);
  deputyName.addEventListener("input", updateFinalOutput);
  deputyCode.addEventListener("input", updateFinalOutput);
});
