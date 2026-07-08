document.addEventListener("DOMContentLoaded", () => {
    const absensiForm = document.getElementById("absensiForm");
    const statusSelect = document.getElementById("status");
    const buktiGroup = document.getElementById("buktiGroup");
    const buktiInput = document.getElementById("bukti");
    const tabelBody = document.querySelector("#tabelAbsensi tbody");
    const btnClear = document.getElementById("btnClear");

    // Jalur penyimpanan relai data tabel global biar sinkron antar HP
    const BIN_URL = "https://api.keyvalue.xyz/6c8e21ba/pelcar_rakoor_sponsorship";
    let dataAbsensi = [];

    // Muat data global dari internet agar semua orang melihat data yang sama
    function muatDataGlobal() {
        fetch(BIN_URL)
        .then(res => res.text())
        .then(text => {
            if (text && text.trim() !== "") {
                dataAbsensi = JSON.parse(text);
                renderTabel();
            }
        })
        .catch(() => {
            dataAbsensi = JSON.parse(localStorage.getItem("dataAbsensi")) || [];
            renderTabel();
        });
    }

    statusSelect.addEventListener("change", () => {
        if (statusSelect.value === "Hadir") {
            buktiGroup.style.display = "none";
            buktiInput.removeAttribute("required");
        } else {
            buktiGroup.style.display = "block";
            buktiInput.setAttribute("required", "required");
        }
    });

    function renderTabel() {
        tabelBody.innerHTML = "";
        if (dataAbsensi.length === 0) {
            tabelBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #a0aec0; padding: 20px;">Belum ada riwayat kehadiran.</td></tr>`;
            return;
        }

        dataAbsensi.forEach((absen, index) => {
            const row = document.createElement("tr");
            let badgeClass = "badge-hadir";
            if (absen.status === "Telat") badgeClass = "badge-telat";
            if (absen.status === "Izin") badgeClass = "badge-izin";
            if (absen.status === "Tanpa Keterangan") badgeClass = "badge-alfa";

            let buktiCell = "-";
            if (absen.hasBukti) {
                // Memberikan catatan ke admin bahwa file tersimpan di sistem
                buktiCell = `<span style="color:#a0aec0; font-style:italic;">Tersedia di Dashboard</span>`;
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
    absensiForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const btnSubmit = absensiForm.querySelector(".btn-submit");
        btnSubmit.innerText = "Mengirim...";
        btnSubmit.disabled = true;

        const namaInput = document.getElementById("nama").value.toUpperCase();
        const statusInput = statusSelect.value;
        const keteranganInput = document.getElementById("keterangan").value;
        const hasFile = buktiInput.files.length > 0;

        const sekarang = new Date();
        const waktuString = `${String(sekarang.getHours()).padStart(2, '0')}:${String(sekarang.getMinutes()).padStart(2, '0')}`;

        // Kirim file berkas asli fisik langsung ke server Formspree agar anti eror
        fetch(absensiForm.action, {
            method: 'POST',
            body: new FormData(absensiForm),
            headers: { 'Accept': 'application/json' }
        })
        .then(response => {
            if (response.ok) {
                // Jika sukses terkirim ke server, update list tabel global
                fetch(BIN_URL)
                .then(res => res.text())
                .then(text => {
                    let listTerbaru = [];
                    if (text && text.trim() !== "") {
                        listTerbaru = JSON.parse(text);
                    }
                    listTerbaru.push({
                        waktu: waktuString,
                        nama: namaInput,
                        status: statusInput,
                        keterangan: keteranganInput || "-",
                        hasBukti: hasFile
                    });

                    // Kirim pembaruan tabel ke internet
                    return fetch(BIN_URL + "/" + JSON.stringify(listTerbaru), { method: "POST" });
                })
                .then(() => {
                    alert("Absensi & File Bukti berhasil dikirim masuk database!");
                    absensiForm.reset();
                    buktiGroup.style.display = "none";
                    muatDataGlobal();
                });
            } else {
                alert("Gagal mengirim data ke server form.");
            }
        })
        .catch(() => {
            alert("Terjadi masalah jaringan.");
        })
        .finally(() => {
            btnSubmit.innerText = "Submit Absensi";
            btnSubmit.disabled = false;
        });
    });

    // Kunci tombol reset khusus admin
    btnClear.addEventListener("click", () => {
        const inputPassword = prompt("Masukkan Password Admin PELCAR untuk mereset data:");
        if (inputPassword === "admin123") {
            if (confirm("Hapus seluruh daftar kehadiran?")) {
                fetch(BIN_URL + "/[]", { method: "POST" }).then(() => muatDataGlobal());
            }
        } else if (inputPassword !== null) {
            alert("Password SALAH!");
        }
    });

    muatDataGlobal();
    setInterval(muatDataGlobal, 10000); // Sinkronisasi otomatis setiap 10 detik
});