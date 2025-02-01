$(document).ready(function() {
    let cropper;
    let qrisStaticBase64 = '';
    let currentDynamicQRBase64 = '';
    const $qrisFile = $('#qrisFile');
    const $imagePreview = $('#imagePreview');
    const $cropButton = $('#cropButton');
    const $amount = $('#amount');
    const $generateBtn = $('#generateBtn');
    const $qrisPreview = $('#qris-preview');
    const $downloadBtn = $('#downloadBtn');
    const $addItemBtn = $('#addItemBtn');
    const $qrisList = $('#qris-list');
    const $croppedCanvas = $('#croppedCanvas');
    const $imageContainer = $('#imageContainer');

    $qrisFile.change(function(e) {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $imagePreview.attr('src', e.target.result);
                $imagePreview.show();
                $cropButton.show();

                if (cropper) {
                    cropper.destroy();
                }
                cropper = new Cropper($imagePreview[0], {
                    aspectRatio: 1,
                    viewMode: 1,
                });
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    $cropButton.click(function() {
        const croppedCanvas = cropper.getCroppedCanvas();
        const base64Image = croppedCanvas.toDataURL();
        qrisStaticBase64 = base64Image;
        $qrisPreview.attr('src', base64Image);
        $qrisPreview.show();
        $cropButton.hide();
        $imagePreview.hide();
    });

    function getQrisData() {
        const data = localStorage.getItem('qrisData');
        return data ? JSON.parse(data) : [];
    }

    function saveQrisData(data) {
        localStorage.setItem('qrisData', JSON.stringify(data));
    }

    function renderQrisList() {
        const qrisData = getQrisData();
        $qrisList.empty();

        qrisData.forEach((item, index) => {
            const listItem = `
                <li class="list-group-item">
                    <span>Nominal: Rp ${item.amount}</span>
                    <div>
                        <a href="${item.base64}" class="btn btn-sm btn-success" download="qris_${item.amount}.png">Download</a>
                        <button class="btn btn-sm btn-danger delete-item" data-index="${index}">Hapus</button>
                    </div>
                </li>
            `;
            $qrisList.append(listItem);
        });

        $('.delete-item').click(function() {
            const index = $(this).data('index');
            const qrisData = getQrisData();
            qrisData.splice(index, 1);
            saveQrisData(qrisData);
            renderQrisList();
        });
    }

    function convertQris(qrisStatic, amount, serviceFeeType, serviceFeeAmount) {
        if (!qrisStatic || !amount) {
            return { error: "QRIS statis dan nominal harus diisi." };
        }

        qrisStatic = qrisStatic.slice(0, -4);
        let step1 = qrisStatic.replace("010211", "010212");
        let step2 = step1.split("5802ID");
        let amountStr = "54" + String(amount.length).padStart(2, '0') + amount;
        let serviceFeeStr = "";

        if (serviceFeeType && serviceFeeAmount) {
            if (serviceFeeType === 'r') {
                serviceFeeStr = "55020256" + String(serviceFeeAmount.length).padStart(2, '0') + serviceFeeAmount;
            } else if (serviceFeeType === 'p') {
                serviceFeeStr = "55020357" + String(serviceFeeAmount.length).padStart(2, '0') + serviceFeeAmount;
            } else {
                return { error: "Tipe biaya layanan tidak valid." };
            }
        }

        let qrisDynamic = step2[0] + amountStr + (serviceFeeStr ? serviceFeeStr : "") + "5802ID" + step2[1];
        const crc16 = calculateCRC16(qrisDynamic);
        qrisDynamic += crc16;
        return { qris: qrisDynamic };
    }

    function calculateCRC16(str) {
        let crc = 0xFFFF;
        for (let c = 0; c < str.length; c++) {
            crc ^= str.charCodeAt(c) << 8;
            for (let i = 0; i < 8; i++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc = crc << 1;
                }
            }
        }
        let hex = (crc & 0xFFFF).toString(16).toUpperCase();
        return hex.padStart(4, '0');
    }

    $generateBtn.click(function() {
        const amount = $amount.val();
        const cleanBase64 = qrisStaticBase64.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');

        const qrisResult = convertQris(cleanBase64, amount);

        if (qrisResult.error) {
            alert('Error: ' + qrisResult.error);
            return;
        }

        const qrisDynamic = qrisResult.qris;

        const qrCode = new QRious({
            element: $qrisPreview[0],
            value: qrisDynamic,
            size: 256,
        });

        currentDynamicQRBase64 = qrCode.toDataURL();
        $qrisPreview.attr('src', currentDynamicQRBase64);
        $qrisPreview.show();
        $downloadBtn.attr('href', currentDynamicQRBase64);
        $downloadBtn.show();
        $addItemBtn.show();
    });

    $addItemBtn.click(function() {
        if (!currentDynamicQRBase64) {
            alert('Tidak ada QRIS Dinamis yang di-generate.');
            return;
        }
        const amount = $amount.val();
        const qrisData = getQrisData();
        qrisData.push({ amount: amount, base64: currentDynamicQRBase64 });
        saveQrisData(qrisData);
        renderQrisList();
    });

    $('#downloadSize').change(function() {
        const size = $(this).val();
        if (size === 'wa_sticker') {
            resizeImage(currentDynamicQRBase64, 512, 512, function(resizedBase64) {
                $downloadBtn.attr('href', resizedBase64);
            });
        } else {
            $downloadBtn.attr('href', currentDynamicQRBase64);
        }
    });

    function resizeImage(base64, width, height, callback) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const resizedBase64 = canvas.toDataURL('image/png');
            callback(resizedBase64);
        }
        img.src = base64;
    }

    renderQrisList();
});