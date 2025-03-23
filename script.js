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

    if (inputFiles.length === 0) {
        alert("ファイルを選択してください");
        return;
    }

    await ffmpeg.load();

    for (let file of inputFiles) {
        const inputName = file.name;
        if (!inputName.endsWith(`.${inputFormat}`)) {
            alert(`拡張子が .${inputFormat} のファイルを選んでください`);
            continue;
        }

        const outputName = inputName.replace(`.${inputFormat}`, `.${outputFormat}`);

        ffmpeg.FS('writeFile', inputName, await fetchFile(file));
        await ffmpeg.run('-i', inputName, outputName);
        const data = ffmpeg.FS('readFile', outputName);

        const blob = new Blob([data.buffer], { type: `video/${outputFormat}` });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = outputName;
        a.textContent = `ダウンロード: ${outputName}`;
        document.getElementById('output').appendChild(a);
        document.getElementById('output').appendChild(document.createElement('br'));
    }
});
