document.addEventListener("DOMContentLoaded", () => {
    const formats = [
        "mp4", "avi", "mkv", "mov", "webm", "mts", "flv", "mpeg", "ogv", "ts", "3gp", "wmv", // 動画
        "mp3", "wav", "flac", "aac", "ogg", "m4a", "opus", // 音声
        "jpg", "png", "bmp", "gif", "tiff", "webp", // 画像
        "txt", "srt", "ass", "vtt" // 文書（字幕）
    ];

    const inputFormatSelect = document.getElementById("inputFormat");
    const outputFormatSelect = document.getElementById("outputFormat");

    formats.forEach(format => {
        const option1 = document.createElement("option");
        option1.value = format;
        option1.textContent = format.toUpperCase();
        inputFormatSelect.appendChild(option1);

        const option2 = option1.cloneNode(true);
        outputFormatSelect.appendChild(option2);
    });
});

document.getElementById('convertBtn').addEventListener('click', async () => {
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });

    const inputFormat = document.getElementById('inputFormat').value;
    const outputFormat = document.getElementById('outputFormat').value;
    const inputFiles = document.getElementById('fileInput').files;
    const fileList = document.getElementById("fileList");
    const overallProgress = document.getElementById("overallProgress");
    const downloadAllBtn = document.getElementById("downloadAllBtn");

    if (inputFiles.length === 0) {
        alert("ファイルを選択してください");
        return;
    }

    fileList.innerHTML = "";
    downloadAllBtn.style.display = "none";
    overallProgress.value = 0;

    await ffmpeg.load();

    const convertedFiles = [];
    let completedFiles = 0;

    for (let file of inputFiles) {
        const inputName = file.name;
        if (!inputName.endsWith(`.${inputFormat}`)) {
            alert(`拡張子が .${inputFormat} のファイルを選んでください`);
            continue;
        }

        const outputName = inputName.replace(`.${inputFormat}`, `.${outputFormat}`);

        // 進捗バーを追加
        const listItem = document.createElement("li");
        listItem.textContent = `変換中: ${inputName} → ${outputName}`;
        const progressBar = document.createElement("progress");
        progressBar.value = 0;
        progressBar.max = 100;
        listItem.appendChild(progressBar);
        fileList.appendChild(listItem);

        ffmpeg.FS('writeFile', inputName, await fetchFile(file));

        const logCallback = ({ type, message }) => {
            if (type === 'progress') {
                let progress = Math.min(100, Math.floor(message.percent * 100));
                progressBar.value = progress;
            }
        };

        await ffmpeg.run('-i', inputName, outputName, { log: logCallback });

        const data = ffmpeg.FS('readFile', outputName);
        const blob = new Blob([data.buffer], { type: `video/${outputFormat}` });
        const url = URL.createObjectURL(blob);

        convertedFiles.push({ name: outputName, blob });

        // 変換完了時にダウンロードリンクを表示
        listItem.innerHTML = "";
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = outputName;
        downloadLink.textContent = `ダウンロード: ${outputName}`;
        listItem.appendChild(downloadLink);

        completedFiles++;
        overallProgress.value = (completedFiles / inputFiles.length) * 100;
    }

    if (convertedFiles.length > 0) {
        downloadAllBtn.style.display = "block";
        downloadAllBtn.onclick = () => downloadAllAsZip(convertedFiles);
    }
});

function downloadAllAsZip(files) {
    const zip = new JSZip();
    files.forEach(file => {
        zip.file(file.name, file.blob);
    });

    zip.generateAsync({ type: "blob" }).then(content => {
        const zipBlob = new Blob([content], { type: "application/zip" });
        const zipUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = zipUrl;
        a.download = "converted_files.zip";
        a.click();
    });
}
