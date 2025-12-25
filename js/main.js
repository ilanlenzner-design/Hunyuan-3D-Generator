const csInterface = new CSInterface();
const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('image-input');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const importBtn = document.getElementById('import-btn');
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const apiKeyInput = document.getElementById('api-key');
const saveApiKeyBtn = document.getElementById('save-api-key');
const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');
const resultSection = document.getElementById('result-section');
const advancedToggle = document.getElementById('show-advanced');
const advancedControls = document.getElementById('advanced-controls');
const logsBox = document.getElementById('logs');

let currentImageBase64 = null;
let currentModelUrl = null;
let currentModelPath = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Load API Key
    const savedKey = localStorage.getItem('replicate_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }

    // Sync Range & Number inputs
    syncInputs('steps-range', 'steps');
    syncInputs('guidance-range', 'guidance');
});

// Settings
settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
});

saveApiKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('replicate_api_key', key);
        alert('API Key Saved');
        settingsPanel.classList.add('hidden');
    }
});

// Advanced Toggle
advancedToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        advancedControls.classList.remove('hidden');
    } else {
        advancedControls.classList.add('hidden');
    }
});

// File Handling
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-color)';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
    const files = e.dataTransfer.files;
    if (files.length) handleFile(files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
});

removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentImageBase64 = null;
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    removeImageBtn.classList.add('hidden');
    dropZone.classList.remove('has-image');
    document.querySelector('#drop-zone p').style.display = 'block';
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageBase64 = e.target.result;
        imagePreview.src = currentImageBase64;
        imagePreview.classList.remove('hidden');
        removeImageBtn.classList.remove('hidden');
        dropZone.classList.add('has-image');
    };
    reader.readAsDataURL(file);
}

// Helpers
function syncInputs(rangeId, numberId) {
    const range = document.getElementById(rangeId);
    const number = document.getElementById(numberId);

    range.addEventListener('input', () => number.value = range.value);
    number.addEventListener('input', () => range.value = number.value);
}

function log(msg) {
    const div = document.createElement('div');
    div.textContent = `> ${msg}`;
    logsBox.appendChild(div);
    logsBox.scrollTop = logsBox.scrollHeight;
    console.log(msg);
}

// Generation Logic
generateBtn.addEventListener('click', async () => {
    const apiKey = localStorage.getItem('replicate_api_key');
    if (!apiKey) {
        alert('Please save your Replicate API Key first.');
        settingsPanel.classList.remove('hidden');
        return;
    }

    if (!currentImageBase64) {
        alert('Please select an image first.');
        return;
    }

    // UI Updates
    generateBtn.disabled = true;
    statusContainer.classList.remove('hidden');
    resultSection.classList.add('hidden');
    logsBox.classList.remove('hidden');
    logsBox.innerHTML = ''; // Clear logs
    statusText.textContent = "Initiating generation...";
    log("Starting generation process...");

    try {
        // Prepare Payload
        const steps = parseInt(document.getElementById('steps').value);
        const guidance_scale = parseFloat(document.getElementById('guidance').value);
        const octree_resolution = parseInt(document.getElementById('octree').value);
        const remove_background = document.getElementById('remove-bg').checked;
        const generate_texture = document.getElementById('gen-texture').checked;

        let seed = parseInt(document.getElementById('seed').value);
        if (seed === -1) seed = Math.floor(Math.random() * 1000000);

        const max_facenum = parseInt(document.getElementById('max-facenum').value);
        const num_chunks = parseInt(document.getElementById('num-chunks').value);

        log(`Parameters: Steps=${steps}, Guidance=${guidance_scale}, Res=${octree_resolution}`);

        const input = {
            image: currentImageBase64,
            steps: steps,
            guidance_scale: guidance_scale,
            octree_resolution: octree_resolution,
            remove_background: remove_background,
            generate_texture: generate_texture,
            seed: seed,
            max_facenum: max_facenum,
            num_chunks: num_chunks
        };

        // Create Prediction
        log("Sending request to Replicate API...");
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                version: "895e514f953d39e8b5bfb859df9313481ad3fa3a8631e5c54c7e5c9c85a6aa9f",
                input: input
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to create prediction");
        }

        const prediction = await response.json();
        const predictionId = prediction.id;
        log(`Prediction created ID: ${predictionId}`);

        // Poll for completion
        await pollPrediction(predictionId, apiKey);

    } catch (error) {
        log(`Error: ${error.message}`);
        statusText.textContent = "Error occurred.";
        alert(`Error: ${error.message}`);
        generateBtn.disabled = false;
    }
});

async function pollPrediction(id, apiKey) {
    const pollInterval = setInterval(async () => {
        try {
            const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
                headers: {
                    "Authorization": `Token ${apiKey}`,
                }
            });

            const status = await res.json();
            log(`Status: ${status.status}`);

            if (status.status === "succeeded") {
                clearInterval(pollInterval);
                statusText.textContent = "Generation Complete!";

                // Log full output for debugging
                console.log("Full Output:", JSON.stringify(status.output));
                log("Output received: " + JSON.stringify(status.output));

                let meshUrl = null;

                if (typeof status.output === 'string') {
                    meshUrl = status.output;
                } else if (typeof status.output === 'object') {
                    if (status.output.mesh) meshUrl = status.output.mesh;
                    // Fallback: check if it's an array or just grab the first value if it looks like a url
                    else if (Array.isArray(status.output) && status.output.length > 0) meshUrl = status.output[0];
                    // Fallback to values if it's a generic dictionary
                    else {
                        const values = Object.values(status.output);
                        if (values.length > 0) meshUrl = values[0];
                    }
                }

                if (meshUrl && (meshUrl.startsWith('http') || meshUrl.startsWith('https'))) {
                    currentModelUrl = meshUrl;
                    log(`Model URL found: ${meshUrl}`);
                    onGenerationSuccess();
                } else {
                    log("Error: Could not parse mesh URL from output.");
                    alert("Generation finished but could not find model URL.");
                }

            } else if (status.status === "failed" || status.status === "canceled") {
                clearInterval(pollInterval);
                throw new Error("Prediction failed or canceled.");
            } else {
                // updates logs (optional)
                if (status.logs) {
                    // split logs and take last line?
                    // log(status.logs);
                }
            }

        } catch (e) {
            clearInterval(pollInterval);
            log(`Polling Error: ${e.message}`);
            generateBtn.disabled = false;
        }
    }, 2000);
}

function onGenerationSuccess() {
    generateBtn.disabled = false;
    statusContainer.classList.add('hidden');
    resultSection.classList.remove('hidden');

    // Set preview URL
    const modelViewer = document.getElementById('model-preview');
    if (modelViewer && currentModelUrl) {
        modelViewer.src = currentModelUrl;
    }
}

// Download & Import
downloadBtn.addEventListener('click', () => {
    if (currentModelUrl) {
        csInterface.openURLInDefaultBrowser(currentModelUrl);
    }
});

importBtn.addEventListener('click', async () => {
    if (!currentModelUrl) {
        alert("No model URL to import.");
        return;
    }

    importBtn.textContent = "Processing...";
    importBtn.disabled = true;

    try {
        const homeDir = os.homedir();
        const downloadsDir = path.join(homeDir, 'Downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        const timestamp = new Date().getTime();
        const fileName = `hunyuan_${timestamp}.glb`;
        const downloadPath = path.join(downloadsDir, fileName);

        // Strategy A: Enforce Repackage via Model Viewer
        // We know the raw file crashes AE, so we MUST repackage it.
        const modelViewer = document.getElementById('model-preview');

        if (!modelViewer) {
            throw new Error("Preview element not found. Cannot repackage.");
        }

        log("Waiting for model to be ready for repackaging...");

        // Wait up to 10 seconds for model to load if it hasn't already
        if (!modelViewer.loaded) {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error("Timeout waiting for model to load")), 10000);
                modelViewer.addEventListener('load', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
            });
        }

        let fileBuffer = null;
        let method = "Repackaged (Viewer)"; // Default method now

        try {
            log("Repackaging model to standard GLB...");
            // exportScene returns a Blob
            const blob = await modelViewer.exportScene({ binary: true });
            if (!blob) throw new Error("Export returned null blob");

            const arrayBuffer = await blob.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
            log(`Repackaging successful. New size: ${fileBuffer.length}`);
        } catch (err) {
            console.error(err);
            throw new Error(`Failed to repackage model: ${err.message}. Raw file is incompatible with AE.`);
        }

        // Write the repackaged buffer
        fs.writeFileSync(downloadPath, fileBuffer);
        log(`Saved to: ${downloadPath} (${method})`);

        if (!fs.existsSync(downloadPath)) {
            throw new Error("File not found on disk.");
        }

        // Validate Magic Bytes
        const fd = fs.openSync(downloadPath, 'r');
        const header = Buffer.alloc(4);
        fs.readSync(fd, header, 0, 4, 0);
        fs.closeSync(fd);

        const magic = header.toString('ascii');
        if (magic !== 'glTF') {
            throw new Error("Invalid file format after repackage. Header: " + magic);
        }

        currentModelPath = downloadPath;

        // Trigger Import
        importBtn.textContent = "Importing...";
        const cleanPath = currentModelPath.split(path.sep).join("/");
        const script = `importModel('${cleanPath}')`;

        // Increased delay to 1500ms to ensure file system flush and AE availability
        setTimeout(() => {
            csInterface.evalScript(script, (res) => {
                log(`AE Response: ${res}`);
                if (res.toString().indexOf("Error") !== -1) {
                    alert(res);
                } else {
                    alert(`Import Successful!\nModel saved to Downloads folder.`);
                }
                importBtn.textContent = "Import to After Effects";
                importBtn.disabled = false;
            });
        }, 1500);

    } catch (e) {
        log(`Import Error: ${e.message}`);
        console.error(e);
        alert("Failed: " + e.message);
        importBtn.textContent = "Retry Import";
        importBtn.disabled = false;
    }
});

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);

        const handleResponse = (response) => {
            // Handle Redirects
            if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
                const redirectUrl = response.headers.location;
                log(`Redirecting to: ${redirectUrl}`);
                https.get(redirectUrl, handleResponse).on('error', (err) => {
                    fs.unlink(dest, () => { });
                    reject(err);
                });
                return;
            }

            if (response.statusCode !== 200) {
                fs.unlink(dest, () => { });
                reject(new Error(`Failed to download. Status Code: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(dest));
            });
        };

        https.get(url, handleResponse).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}
