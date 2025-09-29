document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro");
  const main = document.getElementById("main");

  setTimeout(() => {
    intro.style.display = "none";
    main.classList.remove("hidden");
  }, 6000);

  const opsName = document.getElementById("opsName");
  const opsCode = document.getElementById("opsCode");
  const deputyName = document.getElementById("deputyName");
  const deputyCode = document.getElementById("deputyCode");
  const opsError = document.getElementById("opsError");
  const deputyError = document.getElementById("deputyError");

  const fileInput = document.getElementById("fileInput");
  const dataTable = document.getElementById("dataTable").querySelector("tbody");
  const finalOutput = document.getElementById("finalOutput");
  const copyBtn = document.getElementById("copyBtn");
  const copyAlert = document.getElementById("copyAlert");
  const addRowBtn = document.getElementById("addRow");

  const statusOptions = ["في الخدمة", "مشغول", "خارج الخدمة", "مشتركة", "سبيد يونت", "دباب"];
  const locationOptions = ["الشمال", "الجنوب", "الشرق", "الوسط", "الغرب", "ساندي", "بوليتو"];

  // OCR: رفع صورة
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { data: { text } } = await Tesseract.recognize(file, 'ara+eng');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach(line => {
      line = line.replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ''); // تنظيف الرموز
      let name = line.replace(/[0-9]/g, '').trim();
      let code = line.replace(/[^0-9]/g, '').trim();
      const row = createRow(name || "اسم", code || "كود", "في الخدمة", "الشمال");
      dataTable.appendChild(row);
    });
    updateFinalOutput();
  });

  // إنشاء صف جديد
  function createRow(name, code, status, location) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${name}</td>
      <td>${code}</td>
      <td>${status}</td>
      <td>${location}</td>
      <td>
        <button class="btn-edit" onclick="editRow(this)">✏️ تعديل</button>
        <button class="btn-delete" onclick="deleteRow(this)">🗑️ حذف</button>
      </td>`;
    return row;
  }

  // إضافة سطر يدوي
  addRowBtn.addEventListener("click", () => {
    const row = createRow("اسم", "كود", "في الخدمة", "الشمال");
    dataTable.appendChild(row);
    updateFinalOutput();
  });

  // تحديث النتيجة النهائية
  function updateFinalOutput() {
    opsError.textContent = "";
    deputyError.textContent = "";
    if (!opsName.value.trim()) {
      opsError.textContent = "الرجاء كتابة اسم العمليات";
      return;
    }
    if (!deputyName.value.trim()) {
      deputyError.textContent = "الرجاء كتابة اسم النائب";
      return;
    }

    let result = "📌 استلام العمليات 📌\n\n";
    result += `اسم العمليات : ${opsName.value} ${opsCode.value}\n`;
    result += `النائب : ${deputyName.value} ${deputyCode.value}\n\n`;

    let rows = [...dataTable.rows].map(r => ({
      name: r.cells[0].innerText,
      code: r.cells[1].innerText,
      status: r.cells[2].innerText,
      location: r.cells[3].innerText
    }));

    let inField = rows.filter(r => r.status.includes("في الخدمة"));
    let busy = rows.filter(r => r.status.includes("مشغول"));
    let off = rows.filter(r => r.status.includes("خارج الخدمة"));
    let shared = rows.filter(r => r.status.includes("مشتركة"));
    let speed = rows.filter(r => r.status.includes("سبيد"));
    let bikes = rows.filter(r => r.status.includes("دباب"));

    result += `عدد واسماء الوحدات في الميدان [${inField.length + busy.length}]\n\n`;
    inField.forEach(r => { result += `${r.name} ${r.code} - ${r.location} - ${r.status}\n`; });
    busy.forEach(r => { result += `${r.name} ${r.code} - ${r.location} - ${r.status}\n`; });

    if (shared.length) {
      result += "\nوحدات مشتركة\n";
      shared.forEach(r => { result += `${r.name} ${r.code} - ${r.location}\n`; });
    }
    if (speed.length) {
      result += "\nوحدات سبيد يونت\n";
      speed.forEach(r => { result += `${r.name} ${r.code} - ${r.location}\n`; });
    }
    if (bikes.length) {
      result += "\nوحدات دباب\n";
      bikes.forEach(r => { result += `${r.name} ${r.code} - ${r.location}\n`; });
    }
    if (off.length) {
      result += `\nخارج الخدمة [${off.length}]\n`;
      off.forEach(r => { result += `${r.name} ${r.code} - ${r.location}\n`; });
    }

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
    for (let i = 0; i < 4; i++) {
      const cell = row.cells[i];
      const value = cell.innerText;
      if (i === 2) {
        cell.innerHTML = `<select>${statusOptions.map(opt => `<option ${opt===value?'selected':''}>${opt}</option>`).join("")}</select>`;
      } else if (i === 3) {
        cell.innerHTML = `<select>${locationOptions.map(opt => `<option ${opt===value?'selected':''}>${opt}</option>`).join("")}</select>`;
      } else {
        cell.innerHTML = `<input type="text" value="${value}">`;
      }
    }
    btn.textContent = "✔️ حفظ";
    btn.className = "btn-save";
    btn.onclick = () => saveRow(btn);
  }

  window.saveRow = function(btn) {
    const row = btn.parentElement.parentElement;
    for (let i = 0; i < 4; i++) {
      if (i === 2 || i === 3) {
        const select = row.cells[i].querySelector("select");
        row.cells[i].innerText = select.value;
      } else {
        const input = row.cells[i].querySelector("input");
        row.cells[i].innerText = input.value;
      }
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

  // تحديث النتيجة النهائية مباشرة
  opsName.addEventListener("input", updateFinalOutput);
  opsCode.addEventListener("input", updateFinalOutput);
  deputyName.addEventListener("input", updateFinalOutput);
  deputyCode.addEventListener("input", updateFinalOutput);
});
