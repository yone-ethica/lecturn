// jsPDFライブラリからPDF生成機能を呼び出す準備
const { jsPDF } = window.jspdf;

// HTML要素を取得
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('file-list');
const convertButton = document.getElementById('convertButton');
const outputFilenameInput = document.getElementById('outputFilename');

// 選択されたファイルを保持するグローバルな配列
let selectedFiles = [];

// --- イベントリスナーの設定 ---

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => handleFiles(fileInput.files));

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

dropZone.addEventListener('dragover', () => dropZone.classList.add('drag-over'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

dropZone.addEventListener('drop', (e) => {
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

convertButton.addEventListener('click', createPdf);


// --- 主要な機能の実装 ---

function handleFiles(files) {
    let fileArray = Array.from(files);
    fileArray.sort((a, b) => a.lastModified - b.lastModified);
    selectedFiles = fileArray;
    
    fileList.innerHTML = '';
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '<li>まだファイルが選択されていません</li>';
        return;
    }

    selectedFiles.forEach(file => {
        const listItem = document.createElement('li');
        listItem.textContent = `${file.name} (${new Date(file.lastModified).toLocaleString()})`;
        fileList.appendChild(listItem);
    });
}

/**
 * 選択された画像からPDFを生成し、ダウンロードさせる非同期関数
 */
async function createPdf() {
    if (selectedFiles.length === 0) {
        alert('PDFに変換する画像ファイルを選択してください。');
        return;
    }

    // ★★★ ここから変更 ★★★
    // 選択された向きを取得
    const selectedOrientation = document.querySelector('input[name="orientation"]:checked').value;

    // PDFドキュメントを選択された向きで初期化
    const pdf = new jsPDF({
        orientation: selectedOrientation,
        unit: 'mm',
        format: 'a4'
    });

    // 向きに応じた寸法とマージンを設定
    let pageWidth, pageHeight;
    const margin = 10;
    if (selectedOrientation === 'landscape') {
        pageWidth = 297;
        pageHeight = 210;
    } else { // portrait
        pageWidth = 210;
        pageHeight = 297;
    }
    // ★★★ ここまで変更 ★★★

    convertButton.textContent = 'PDF変換中...';
    convertButton.disabled = true;

    try {
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const imageData = await readFileAsDataURL(file);
            const imgProps = await getImageProperties(imageData);
            
            // ★★★ ここから変更 ★★★
            // 画像の縦横比を維持したまま、ページの幅に合わせる
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            if (i > 0) {
                pdf.addPage();
            }

            // 画像を中央に配置
            const xPosition = margin;
            const yPosition = (pageHeight - imgHeight) / 2;
            pdf.addImage(imageData, 'JPEG', xPosition, yPosition, imgWidth, imgHeight);
            // ★★★ ここまで変更 ★★★
        }

        let filename = outputFilenameInput.value;
        if (filename.trim() === '' || filename.trim().toLowerCase() === '.pdf') {
            filename = 'LecTurn-converted.pdf';
        }
        if (!filename.toLowerCase().endsWith('.pdf')) {
            filename += '.pdf';
        }
        pdf.save(filename);

    } catch (error) {
        console.error('PDFの生成中にエラーが発生しました:', error);
        alert('PDFの生成に失敗しました。ファイルが画像形式であることを確認してください。');
    } finally {
        convertButton.textContent = 'PDFに変換してダウンロード';
        convertButton.disabled = false;
        selectedFiles = [];
        fileList.innerHTML = '<li>まだファイルが選択されていません</li>';
        fileInput.value = '';
    }
}


// --- ヘルパー関数 ---

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function getImageProperties(imageDataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = imageDataUrl;
    });
}
