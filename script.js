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
      line = line.replace(/[^\u0600-\u06FFa-zA-Z0-9\s\+]/g, '');
      const row = createRow(line, "", "في الخدمة", "لا شيء");
      dataTable.appendChild(row);
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
  function createRow(name, code, state="في الخدمة", location="لا شيء") {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${name}</td>
      <td>${code}</td>
      <td>
        <select>
          <option ${state==="في الخدمة"?"selected":""}>في الخدمة</option>
          <option ${state==="مشغول"?"selected":""}>مشغول</option>
          <option ${state==="مشتركة"?"selected":""}>مشتركة</option>
          <option ${state==="سبيد يونت"?"selected":""}>سبيد يونت</option>
          <option ${state==="دباب"?"selected":""}>دباب</option>
          <option ${state==="خارج الخدمة"?"selected":""}>خارج الخدمة</option>
        </select>
      </td>
      <td>
        <select>
          <option ${location==="لا شيء"?"selected":""}>لا شيء</option>
          <option>الشمال</option>
          <option>الجنوب</option>
          <option>الشرق</option>
          <option>الغرب</option>
          <option>وسط</option>
          <option>ساندي</option>
          <option>بوليتو</option>
        </select>
      </td>
      <td>
        <button class="btn-edit" onclick="editRow(this)">✏️ تعديل</button>
        <button class="btn-delete" onclick="deleteRow(this)">🗑️ حذف</button>
      </td>`;
    return row;
  }

  addRowBtn.addEventListener("click", () => {
    const row = createRow("اسم", "كود");
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

    let rows = [...dataTable.rows].map(r => ({
      name: r.cells[0].innerText,
      code: r.cells[1].innerText,
      state: r.cells[2].querySelector("select").value
    }));

    const sections = {
      "في الخدمة": "🚓 في الخدمة",
      "مشغول": "⏳ مشغول",
      "مشتركة": "🔗 وحدات مشتركة",
      "سبيد يونت": "⚡ وحدات سبيد يونت",
      "دباب": "🏍️ وحدات دباب",
      "خارج الخدمة": "❌ خارج الخدمة"
    };

    Object.keys(sections).forEach(state => {
      const filtered = rows.filter(r => r.state === state);
      if (state === "خارج الخدمة") {
        result += `\n${sections[state]} [${filtered.length}]\n`;
        if (filtered.length) {
          filtered.forEach(r => result += `${r.name} ${r.code}\n`);
        } else {
          result += "(0)\n";
        }
      } else if (filtered.length) {
        result += `\n${sections[state]} [${filtered.length}]\n`;
        filtered.forEach(r => result += `${r.name} ${r.code}\n`);
      }
    });

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
    for (let i = 0; i < 2; i++) {
      const cell = row.cells[i];
      const value = cell.innerText;
      cell.innerHTML = `<input type="text" value="${value}">`;
    }
    btn.textContent = "✔️ حفظ";
    btn.className = "btn-save";
    btn.onclick = () => saveRow(btn);
  }

  window.saveRow = function(btn) {
    const row = btn.parentElement.parentElement;
    for (let i = 0; i < 2; i++) {
      const input = row.cells[i].querySelector("input");
      row.cells[i].innerText = input.value;
    }
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

  // مؤشر الليزر
  const cursor = document.getElementById("cursor");
  document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.pageX + "px";
    cursor.style.top = e.pageY + "px";
  });
});
