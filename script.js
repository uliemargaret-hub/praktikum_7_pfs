const API_BASE = "backend";

const form = document.getElementById("mahasiswa-form");
const formTitle = document.getElementById("form-title");
const idInput = document.getElementById("mahasiswa-id");
const namaInput = document.getElementById("nama");
const nimInput = document.getElementById("nim");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const tableBody = document.getElementById("mahasiswa-list");
const totalDataText = document.getElementById("total-data");
const searchInput = document.getElementById("search-input");
const toastEl = document.getElementById("toast");

let allMahasiswa = [];

function showToast(message, isError = false) {
    toastEl.textContent = message;
    toastEl.className = isError ? "toast error show" : "toast show";
    setTimeout(() => {
        toastEl.classList.remove("show");
    }, 3000);
}

async function loadMahasiswa() {
    try {
        const res = await fetch(`${API_BASE}/read.php`);
        const json = await res.json();

        if (json.success) {
            allMahasiswa = json.data;
            renderTable(allMahasiswa);
        } else {
            totalDataText.textContent = json.message || "Gagal memuat data";
            showToast(json.message || "Gagal memuat data", true);
        }
    } catch (err) {
        totalDataText.textContent = "Gagal terhubung ke server PHP";
        showToast("Pastikan URL dibuka via http://localhost/praktikum_7_php/", true);
    }
}

function renderTable(data) {
    totalDataText.textContent = `Total ${data.length} mahasiswa terdaftar`;

    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    Belum ada data mahasiswa yang ditemukan.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = data
        .map(
            (mhs, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(mhs.nama)}</strong></td>
                <td><span class="nim-badge">${escapeHtml(mhs.nim)}</span></td>
                <td class="time-text">${mhs.created_at || "-"}</td>
                <td class="text-center">
                    <div class="action-group">
                        <button class="btn-sm btn-edit" onclick="editMode(${mhs.id}, '${escapeAttr(mhs.nama)}', '${escapeAttr(mhs.nim)}')">
                            Edit
                        </button>
                        <button class="btn-sm btn-delete" onclick="deleteMahasiswa(${mhs.id})">
                            Hapus
                        </button>
                    </div>
                </td>
            </tr>
        `
        )
        .join("");
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = idInput.value;
    const nama = namaInput.value.trim();
    const nim = nimInput.value.trim();

    if (!nama || !nim) {
        showToast("Nama dan NIM wajib diisi!", true);
        return;
    }

    const endpoint = id ? `${API_BASE}/update.php` : `${API_BASE}/create.php`;
    const payload = id ? { id: Number(id), nama, nim } : { nama, nim };

    submitBtn.disabled = true;
    submitBtn.textContent = "Menyimpan...";

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (json.success) {
            showToast(json.message);
            resetForm();
            loadMahasiswa();
        } else {
            showToast(json.message || "Terjadi kesalahan", true);
        }
    } catch (err) {
        showToast("Gagal mengirim data ke server", true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = idInput.value ? "Update Data" : "Simpan Data";
    }
});

window.editMode = function (id, nama, nim) {
    idInput.value = id;
    namaInput.value = nama;
    nimInput.value = nim;

    formTitle.textContent = "Edit Data Mahasiswa";
    submitBtn.textContent = "Update Data";
    cancelBtn.classList.remove("hidden");
    namaInput.focus();
};

cancelBtn.addEventListener("click", resetForm);

function resetForm() {
    form.reset();
    idInput.value = "";
    formTitle.textContent = "Tambah Mahasiswa";
    submitBtn.textContent = "Simpan Data";
    cancelBtn.classList.add("hidden");
}

window.deleteMahasiswa = async function (id) {
    if (!confirm("Yakin ingin menghapus data mahasiswa ini?")) return;

    try {
        const res = await fetch(`${API_BASE}/delete.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: Number(id) }),
        });
        const json = await res.json();

        if (json.success) {
            showToast(json.message);
            if (Number(idInput.value) === Number(id)) {
                resetForm();
            }
            loadMahasiswa();
        } else {
            showToast(json.message || "Gagal menghapus data", true);
        }
    } catch (err) {
        showToast("Gagal menghubungi server", true);
    }
};

searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = allMahasiswa.filter(
        (mhs) =>
            mhs.nama.toLowerCase().includes(keyword) ||
            mhs.nim.toLowerCase().includes(keyword)
    );
    renderTable(filtered);
});

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return String(text).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

loadMahasiswa();