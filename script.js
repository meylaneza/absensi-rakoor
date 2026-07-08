document.addEventListener("DOMContentLoaded", () => {
    const absensiForm = document.getElementById("absensiForm");
    const statusSelect = document.getElementById("status");
    const buktiGroup = document.getElementById("buktiGroup");
    const buktiInput = document.getElementById("bukti");

    // TENTUKAN URL GOOGLE APPS SCRIPT KAMU DI SINI
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby6uMHwnutPLdqUsNmpBhXmri_HSGZJykMUwDtC_e1YuVdEdNQ5Uf3t9qHvJ3VdkhZV/exec";

    statusSelect.addEventListener("change", () => {
        if (statusSelect.value === "Hadir") {
            buktiGroup.style.display = "none";
            buktiInput.removeAttribute("required");
        } else {
            buktiGroup.style.display = "block";
            buktiInput.setAttribute("required", "required");
        }
    });

    absensiForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // Mengubah teks tombol saat loading kirim data
        const btnSubmit = absensiForm.querySelector(".btn-submit");
        btnSubmit.innerText = "Mengirim Absen...";
        btnSubmit.disabled = true;

        const namaInput = document.getElementById("nama").value;
        const statusInput = document.getElementById("status").value;
        const keteranganInput = document.getElementById("keterangan").value;
        const fileBukti = buktiInput.files[0];

        const sekarang = new Date();
        const waktuString = `${String(sekarang.getHours()).padStart(2, '0')}:${String(sekarang.getMinutes()).padStart(2, '0')}`;

        const kirimKeGoogleSheets = (base64Url = "") => {
            const dataBaru = {
                waktu: waktuString,
                nama: namaInput.toUpperCase(),
                status: statusInput,
                keterangan: keteranganInput,
                buktiUrl: base64Url
            };

            // Mengirim data menggunakan FETCH API ke Google Sheets
            fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(dataBaru),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            })
            .then(response => response.json())
            .then(result => {
                if(result.status === "SUCCESS") {
                    alert("Absensi berhasil dikirim dan dicatat oleh sistem!");
                    absensiForm.reset();
                    buktiGroup.style.display = "none";
                } else {
                    alert("Gagal mengirim absen: " + result.message);
                }
            })
            .catch(error => {
                alert("Terjadi kesalahan jaringan/sistem.");
                console.error(error);
            })
            .finally(() => {
                btnSubmit.innerText = "Submit Absensi";
                btnSubmit.disabled = false;
            });
        };

        if (fileBukti) {
            const reader = new FileReader();
            reader.onloadend = function() {
                kirimKeGoogleSheets(reader.result);
            };
            reader.readAsDataURL(fileBukti);
        } else {
            kirimKeGoogleSheets();
        }
    });
});