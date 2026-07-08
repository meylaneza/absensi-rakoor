document.addEventListener("DOMContentLoaded", () => {
    const absensiForm = document.getElementById("absensiForm");
    const statusSelect = document.getElementById("status");
    const buktiGroup = document.getElementById("buktiGroup");
    const buktiInput = document.getElementById("bukti");
    const tabelBody = document.querySelector("#tabelAbsensi tbody");
    const btnClear = document.getElementById("btnClear");

    // Ambil data yang tersimpan dari LocalStorage
    let dataAbsensi = JSON.parse(localStorage.getItem("dataAbsensi")) || [];

    // Munculkan/sembunyikan input file bukti secara dinamis
    statusSelect.addEventListener("change", () => {
        if (statusSelect.value === "Hadir") {
            buktiGroup.style.display = "none";
            buktiInput.removeAttribute("required");
        } else {
            buktiGroup.style.display = "block";
            buktiInput.setAttribute("required", "required");
        }
    });

    // Fungsi menampilkan data ke tabel
    function renderTabel() {
        tabelBody.innerHTML = "";

        if (dataAbsensi.length === 0) {
            tabelBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #a0aec0; padding: 20px;">Belum ada data absensi.</td></tr>`;
            return;
        }

        dataAbsensi.forEach((absen, index) => {
            const row = document.createElement("tr");

            let badgeClass = "badge-hadir";
            if (absen.status === "Telat") badgeClass = "badge-telat";
            if (absen.status === "Izin") badgeClass = "badge-izin";
            if (absen.status === "Tanpa Keterangan") badgeClass = "badge-alfa";

            // Tombol "Lihat Bukti" langsung membuka tab baru berisi gambar asli
            let buktiCell = "-";
            if (absen.buktiUrl && absen.buktiUrl !== "-") {
                buktiCell = `<a href="${absen.buktiUrl}" target="_blank" class="btn-view">Lihat Bukti</a>`;
            }

            row.innerHTML = `
                <td>${index + 1}.</td>
                <td>${absen.waktu}</td>
                <td><strong>${absen.nama}</strong></td>
                <td><span class="badge ${badgeClass}">${absen.status}</span></td>
                <td>${absen.keterangan || "-"}</td>
                <td>${buktiCell}</td>
            `;
            tabelBody.appendChild(row);
        });
    }

    // Submit Absensi Form
    absensiForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const namaInput = document.getElementById("nama").value;
        const statusInput = statusSelect.value;
        const keteranganInput = document.getElementById("keterangan").value;
        const fileBukti = buktiInput.files[0];

        const sekarang = new Date();
        const waktuString = `${String(sekarang.getHours()).padStart(2, '0')}:${String(sekarang.getMinutes()).padStart(2, '0')}`;

        const simpanData = (base64Url = "-") => {
            const dataBaru = {
                waktu: waktuString,
                nama: namaInput.toUpperCase(),
                status: statusInput,
                keterangan: keteranganInput,
                buktiUrl: base64Url
            };

            dataAbsensi.push(dataBaru);
            localStorage.setItem("dataAbsening", JSON.stringify(dataAbsensi)); // cadangan lokal aman
            localStorage.setItem("dataAbsensi", JSON.stringify(dataAbsensi));
            
            absensiForm.reset();
            buktiGroup.style.display = "none";
            renderTabel();
            alert("Absensi berhasil disimpan!");
        };

        // Jika ada file bukti, ubah ke URL lokal (Base64) tanpa butuh server internet
        if (fileBukti) {
            const reader = new FileReader();
            reader.onloadend = function() {
                simpanData(reader.result);
            };
            reader.readAsDataURL(fileBukti);
        } else {
            simpanData();
        }
    });

    // Reset Data Amandengan Password Admin
    btnClear.addEventListener("click", () => {
        const passwordBenar = "admin123"; // Password bebas diganti
        const inputPassword = prompt("Masukkan Password Admin untuk mereset semua data:");

        if (inputPassword === null) return; 

        if (inputPassword === passwordBenar) {
            if (confirm("Apakah Anda yakin ingin menghapus seluruh data riwayat absensi?")) {
                dataAbsensi = [];
                localStorage.removeItem("dataAbsensi");
                renderTabel();
                alert("Semua data berhasil dibersihkan!");
            }
        } else {
            alert("Password SALAH! Anda tidak punya akses.");
        }
    });

    renderTabel();
});