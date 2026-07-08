document.addEventListener("DOMContentLoaded", () => {
    const absensiForm = document.getElementById("absensiForm");
    const statusSelect = document.getElementById("status");
    const buktiGroup = document.getElementById("buktiGroup");
    const buktiInput = document.getElementById("bukti");
    const tabelBody = document.querySelector("#tabelAbsensi tbody");
    const btnClear = document.getElementById("btnClear");

    // === MASUKKAN LINK URL DARI MOCKAPI KAMU DI SINI ===
    const BASE_URL = "https://6a4e1a54e785c9ef536c4a84.mockapi.io/absensi";
    // ===================================================

    // 1. Ambil data terpusat dari internet agar semua HP bisa melihat daftar yang sama
    function muatDataGlobal() {
        fetch(BASE_URL)
        .then(res => {
            if (!res.ok) throw new Error("Gagal konek database");
            return res.json();
        })
        .then(data => {
            renderTabel(data);
        })
        .catch(err => {
            console.error("Error muat data: ", err);
            tabelBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #e50914; padding: 20px;">Gagal memuat data dari server.</td></tr>`;
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

    function renderTabel(dataAbsensi) {
        tabelBody.innerHTML = "";
        if (!dataAbsensi || dataAbsensi.length === 0) {
            tabelBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #a0aec0; padding: 20px;">Belum ada riwayat kehadiran anggota.</td></tr>`;
            return;
        }

        dataAbsensi.forEach((absen, index) => {
            const row = document.createElement("tr");
            let badgeClass = "badge-hadir";
            if (absen.status === "Telat") badgeClass = "badge-telat";
            if (absen.status === "Izin") badgeClass = "badge-izin";
            if (absen.status === "Tanpa Keterangan") badgeClass = "badge-alfa";

            let buktiCell = "-";
            if (absen.buktiUrl && absen.buktiUrl !== "-") {
                // Link file bukti aman bisa langsung didownload/dilihat siapa saja
                buktiCell = `<a href="${absen.buktiUrl}" target="_blank" class="btn-view" download="${absen.fileName || 'bukti'}">Lihat Bukti</a>`;
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

    // 2. Kirim data absensi ke server database cloud
    absensiForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const btnSubmit = absensiForm.querySelector(".btn-submit");
        btnSubmit.innerText = "Mengirim...";
        btnSubmit.disabled = true;

        const namaInput = document.getElementById("nama").value.toUpperCase();
        const statusInput = statusSelect.value;
        const keteranganInput = document.getElementById("keterangan").value;
        const fileBukti = buktiInput.files[0];

        const sekarang = new Date();
        const waktuString = `${String(sekarang.getHours()).padStart(2, '0')}:${String(sekarang.getMinutes()).padStart(2, '0')}`;

        const kirimKeDatabase = (base64Url = "-", namaFile = "") => {
            const dataBaru = {
                waktu: waktuString,
                nama: namaInput,
                status: statusInput,
                keterangan: keteranganInput || "-",
                buktiUrl: base64Url,
                fileName: namaFile
            };

            fetch(BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataBaru)
            })
            .then(res => {
                if (!res.ok) throw new Error("Server menolak data");
                return res.json();
            })
            .then(() => {
                alert("Absensi BERHASIL dikirim dan tercatat di riwayat global!");
                absensiForm.reset();
                buktiGroup.style.display = "none";
                muatDataGlobal(); // Langsung refresh tabel
            })
            .catch(err => {
                alert("Gagal mengirim absen. Masalah: " + err.message);
            })
            .finally(() => {
                btnSubmit.innerText = "Submit Absensi";
                btnSubmit.disabled = false;
            });
        };

        // Membaca segala jenis format file (Image, PDF, Word, dll)
        if (fileBukti) {
            const reader = new FileReader();
            reader.onloadend = function() {
                kirimKeDatabase(reader.result, fileBukti.name);
            };
            reader.readAsDataURL(fileBukti);
        } else {
            kirimKeDatabase();
        }
    });

    // 3. Tombol Reset Khusus Admin
    btnClear.addEventListener("click", () => {
        const inputPassword = prompt("Masukkan Password Admin PELCAR untuk menghapus seluruh data:");
        if (inputPassword === "admin123") {
            if (confirm("Apakah Anda yakin ingin menghapus TOTAL seluruh riwayat data absensi di server?")) {
                // Mengambil semua item lalu menghapusnya satu per satu dari server
                fetch(BASE_URL)
                .then(res => res.json())
                .then(data => {
                    const deletePromises = data.map(item => 
                        fetch(`${BASE_URL}/${item.id}`, { method: 'DELETE' })
                    );
                    return Promise.all(deletePromises);
                })
                .then(() => {
                    alert("Seluruh database berhasil dikosongkan!");
                    muatDataGlobal();
                });
            }
        } else if (inputPassword !== null) {
            alert("Password SALAH!");
        }
    });

    // Jalankan penarikan data terpusat saat web diakses pertama kali
    muatDataGlobal();
    
    // Auto-refresh tabel setiap 7 detik agar semua HP selalu update daftarnya secara real-time
    setInterval(muatDataGlobal, 7000);
});