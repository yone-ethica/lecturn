/**
 * 選択された画像からPDFを生成し、ダウンロードする関数
 */
async function createPdf() {
    if (selectedFiles.length === 0) {
        alert('PDFに変換する画像ファイルを選択してください。');
        return;
    }

    // ★変更点1：PDFの向きを 'landscape' (横長) に設定
    const pdf = new jsPDF({
        orientation: 'landscape', // 'portrait'(縦) から 'landscape'(横) に変更
        unit: 'mm',
        format: 'a4'
    });

    // 横長A4サイズの寸法
    const a4LandscapeWidth = 297;
    const a4LandscapeHeight = 210;
    const margin = 10; // 左右のマージン

    // 変換中のフィードバック
    convertButton.textContent = 'PDF変換中...';
    convertButton.disabled = true;

    try {
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const imageData = await readFileAsDataURL(file);
            const imgProps = await getImageProperties(imageData);
            
            // ★変更点2：横長のページに合わせて画像サイズを計算
            // 画像の縦横比を維持したまま、A4(横)の幅に合わせる
            const imgWidth = a4LandscapeWidth - (margin * 2);
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            // 新しいページを追加 (最初のページは不要)
            if (i > 0) {
                pdf.addPage();
            }

            // PDFに画像を追加（Y座標は上下中央に配置）
            const yPosition = (a4LandscapeHeight - imgHeight) / 2;
            pdf.addImage(imageData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
        }

        // PDFをダウンロード
        pdf.save('LecTurn-converted-landscape.pdf');

    } catch (error) {
        console.error('PDFの生成中にエラーが発生しました:', error);
        alert('PDFの生成に失敗しました。ファイルが画像形式であることを確認してください。');
    } finally {
        // ボタンの状態を元に戻す
        convertButton.textContent = 'PDFに変換してダウンロード';
        convertButton.disabled = false;
    }
}

// 以下の2つの関数(readFileAsDataURL, getImageProperties)は変更不要です
/**
 * ファイルをDataURLとして非同期で読み込む
 * (以下、変更なし)
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
/**
 * 画像データの縦横サイズを取得する
 * (以下、変更なし)
 */
function getImageProperties(imageDataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = imageDataUrl;
    });
}