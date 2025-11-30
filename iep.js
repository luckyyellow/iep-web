// IEP JS: Encrypt / Decrypt image pixel-by-pixel in browser

async function fileToBytes(file) {
    return new Uint8Array(await file.arrayBuffer());
}

function strToBytes(str) {
    return new TextEncoder().encode(str);
}
function bytesToStr(bytes) {
    return new TextDecoder().decode(bytes);
}

function compressBytes(bytes) {
    return pako.deflate(bytes);
}
function decompressBytes(bytes) {
    return pako.inflate(bytes);
}

async function deriveKey(password, length) {
    let pwBytes = strToBytes(password);
    let key = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        key[i] = pwBytes[i % pwBytes.length] ^ ((i*31) & 0xff);
    }
    return key;
}

function xorBytes(data, key) {
    let out = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        out[i] = data[i] ^ key[i % key.length];
    }
    return out;
}

// ---- encrypt image ----
document.getElementById("encrypt-btn").onclick = async () => {
    const fileInput = document.getElementById("enc-file");
    const password = document.getElementById("enc-password").value;
    if (!fileInput.files.length || !password) return alert("Select file and enter password");

    const file = fileInput.files[0];
    const imgBytes = await fileToBytes(file);

    let compressed = compressBytes(imgBytes);
    let key = await deriveKey(password, compressed.length);
    let cipher = xorBytes(compressed, key);
    let b64 = btoa(String.fromCharCode(...cipher));
    document.getElementById("enc-output").value = b64;
}

// ---- decrypt image ----
document.getElementById("decrypt-btn").onclick = async () => {
    const b64 = document.getElementById("dec-input").value;
    const password = document.getElementById("dec-password").value;
    if (!b64 || !password) return alert("Paste cipher and enter password");

    let cipher = Uint8Array.from(atob(b64), c=>c.charCodeAt(0));
    let key = await deriveKey(password, cipher.length);
    let compressed = xorBytes(cipher, key);
    let plain = decompressBytes(compressed);

    const blob = new Blob([plain]);
    const img = new Image();
    img.onload = () => {
        const canvas = document.getElementById("dec-canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img,0,0);
    }
    img.src = URL.createObjectURL(blob);
}