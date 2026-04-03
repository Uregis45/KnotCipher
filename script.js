  // Create animated background elements
        function createSignalBackground() {
            const container = document.getElementById('signalBg');
            
            // Create floating rings
            for (let i = 0; i < 12; i++) {
                const ring = document.createElement('div');
                ring.className = 'signal-ring';
                const size = Math.random() * 200 + 50;
                ring.style.width = size + 'px';
                ring.style.height = size + 'px';
                ring.style.left = Math.random() * 100 + '%';
                ring.style.top = Math.random() * 100 + '%';
                ring.style.animationDelay = Math.random() * 5 + 's';
                ring.style.animationDuration = Math.random() * 3 + 3 + 's';
                container.appendChild(ring);
            }
            
            // Create waves
            for (let i = 0; i < 5; i++) {
                const wave = document.createElement('div');
                wave.className = 'signal-wave';
                wave.style.top = Math.random() * 100 + '%';
                wave.style.animationDelay = Math.random() * 5 + 's';
                wave.style.animationDuration = Math.random() * 4 + 2 + 's';
                container.appendChild(wave);
            }
            
            // Create particles
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'signal-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 8 + 's';
                particle.style.animationDuration = Math.random() * 6 + 4 + 's';
                container.appendChild(particle);
            }
        }
        
        createSignalBackground();

        // Password strength meter
        function checkPasswordStrength(password) {
            const bar = document.getElementById('strengthBar');
            if (!password) {
                bar.style.width = '0%';
                bar.style.backgroundColor = '#334155';
                return;
            }
            
            let strength = 0;
            if (password.length >= 8) strength += 25;
            if (password.length >= 12) strength += 25;
            if (/[A-Z]/.test(password)) strength += 25;
            if (/[0-9]/.test(password)) strength += 25;
            if (/[^A-Za-z0-9]/.test(password)) strength += 25;
            
            strength = Math.min(100, strength);
            bar.style.width = strength + '%';
            
            if (strength < 25) bar.style.backgroundColor = '#ef4444';
            else if (strength < 50) bar.style.backgroundColor = '#f59e0b';
            else if (strength < 75) bar.style.backgroundColor = '#eab308';
            else bar.style.backgroundColor = '#22c55e';
        }
        
        document.getElementById('encryptKey').addEventListener('input', (e) => {
            checkPasswordStrength(e.target.value);
        });

        // Convert string to ArrayBuffer
        function stringToArrayBuffer(str) {
            return new TextEncoder().encode(str);
        }
        
        function arrayBufferToString(buffer) {
            return new TextDecoder().decode(buffer);
        }
        
        // Generate random salt
        function generateSalt() {
            return crypto.getRandomValues(new Uint8Array(16));
        }
        
        // Derive key from password and salt
        async function deriveKey(password, salt) {
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                'PBKDF2',
                false,
                ['deriveKey']
            );
            
            return crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        }
        
        // Encrypt function
        async function encryptMessage(message, password) {
            if (!message || !password) {
                throw new Error('Message and knot key are required');
            }
            
            const salt = generateSalt();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const key = await deriveKey(password, salt);
            
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                stringToArrayBuffer(message)
            );
            
            // Combine salt + iv + encrypted data
            const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(new Uint8Array(encrypted), salt.length + iv.length);
            
            // Convert to base64 for easy sharing
            return btoa(String.fromCharCode.apply(null, combined));
        }
        
        // Decrypt function
        async function decryptMessage(encryptedBase64, password) {
            if (!encryptedBase64 || !password) {
                throw new Error('Encrypted message and knot key are required');
            }
            
            try {
                const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
                
                const salt = combined.slice(0, 16);
                const iv = combined.slice(16, 28);
                const encryptedData = combined.slice(28);
                
                const key = await deriveKey(password, salt);
                
                const decrypted = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: iv },
                    key,
                    encryptedData
                );
                
                return arrayBufferToString(decrypted);
            } catch (error) {
                throw new Error('Invalid knot key or corrupted message');
            }
        }
        
        // Encrypt button handler
        document.getElementById('encryptBtn').addEventListener('click', async () => {
            const message = document.getElementById('encryptMessage').value;
            const key = document.getElementById('encryptKey').value;
            const resultDiv = document.getElementById('encryptResult');
            const outputDiv = document.getElementById('encryptedOutput');
            
            if (!message) {
                alert('Please enter a message to encrypt');
                return;
            }
            
            if (!key) {
                alert('Please enter a knot key');
                return;
            }
            
            try {
                const encrypted = await encryptMessage(message, key);
                outputDiv.textContent = encrypted;
                resultDiv.style.display = 'block';
                
                // Scroll to result
                resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } catch (error) {
                alert('Encryption failed: ' + error.message);
            }
        });
        
        // Decrypt button handler
        document.getElementById('decryptBtn').addEventListener('click', async () => {
            const encryptedMsg = document.getElementById('decryptMessage').value;
            const key = document.getElementById('decryptKey').value;
            const resultDiv = document.getElementById('decryptResult');
            const outputDiv = document.getElementById('decryptedOutput');
            
            if (!encryptedMsg) {
                alert('Please paste the encrypted message');
                return;
            }
            
            if (!key) {
                alert('Please enter the knot key');
                return;
            }
            
            try {
                const decrypted = await decryptMessage(encryptedMsg, key);
                outputDiv.textContent = decrypted;
                resultDiv.style.display = 'block';
                
                // Scroll to result
                resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } catch (error) {
                alert('Decryption failed: ' + error.message);
                resultDiv.style.display = 'none';
            }
        });
        
        // Copy buttons
        document.getElementById('copyEncryptBtn').addEventListener('click', async () => {
            const text = document.getElementById('encryptedOutput').textContent;
            if (text) {
                await navigator.clipboard.writeText(text);
                const btn = document.getElementById('copyEncryptBtn');
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = originalText, 2000);
            }
        });
        
        document.getElementById('copyDecryptBtn').addEventListener('click', async () => {
            const text = document.getElementById('decryptedOutput').textContent;
            if (text) {
                await navigator.clipboard.writeText(text);
                const btn = document.getElementById('copyDecryptBtn');
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = originalText, 2000);
            }
        });
        
        // Clear result when typing new message/key
        document.getElementById('encryptMessage').addEventListener('input', () => {
            document.getElementById('encryptResult').style.display = 'none';
        });
        
        document.getElementById('encryptKey').addEventListener('input', () => {
            document.getElementById('encryptResult').style.display = 'none';
        });
        
        document.getElementById('decryptMessage').addEventListener('input', () => {
            document.getElementById('decryptResult').style.display = 'none';
        });
        
        document.getElementById('decryptKey').addEventListener('input', () => {
            document.getElementById('decryptResult').style.display = 'none';
        });



        // ========== SIMPLE VOICE NOTE (No Export) ==========
class SimpleVoiceNote {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordedBlob = null;
        this.setupElements();
        this.setupEventListeners();
    }

    setupElements() {
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopRecordBtn');
        this.statusDiv = document.getElementById('recordingStatus');
        this.voiceKey = document.getElementById('voiceEncryptKey');
        this.encryptBtn = document.getElementById('encryptVoiceBtn');
        this.encryptResultBox = document.getElementById('voiceEncryptResult');
        this.encryptedOutput = document.getElementById('encryptedVoiceResult');
        this.copyBtn = document.getElementById('copyVoiceResultBtn');
        this.decryptInput = document.getElementById('voiceDecryptInput');
        this.decryptKey = document.getElementById('voiceDecryptKey');
        this.decryptBtn = document.getElementById('decryptVoiceBtn');
        this.decryptResultBox = document.getElementById('voiceDecryptResult');
        this.audioPlayer = document.getElementById('decryptedAudioPlayer');
    }

    setupEventListeners() {
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.encryptBtn.addEventListener('click', () => this.encryptVoice());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.decryptBtn.addEventListener('click', () => this.decryptVoice());
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.recordedBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.statusDiv.textContent = '✓ Recording saved! Click "Encrypt Voice Note"';
                this.statusDiv.style.color = '#88ff88';
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.recordBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.statusDiv.textContent = '🔴 Recording... Speak now!';
            this.statusDiv.style.color = '#ff6666';
            
        } catch (error) {
            alert('Microphone access needed for voice recording');
            console.error(error);
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.recordBtn.disabled = false;
            this.stopBtn.disabled = true;
        }
    }

    async encryptVoice() {
        if (!this.recordedBlob) {
            alert('Please record a voice message first');
            return;
        }

        const key = this.voiceKey.value;
        if (!key) {
            alert('Please enter a Knot Key');
            return;
        }

        // Convert audio to base64
        const base64 = await this.blobToBase64(this.recordedBlob);
        
        // Encrypt using your existing system
        const encrypted = await this.encryptWithKey(base64, key);
        
        // Show result
        this.encryptedOutput.textContent = encrypted;
        this.encryptResultBox.style.display = 'block';
        
        // Clear for next recording
        this.recordedBlob = null;
        this.statusDiv.textContent = '✓ Encrypted! Share the text above';
        
        // Hide decrypt box if visible
        this.decryptResultBox.style.display = 'none';
    }

    async decryptVoice() {
        const encryptedText = this.decryptInput.value;
        const key = this.decryptKey.value;
        
        if (!encryptedText || !key) {
            alert('Please paste encrypted voice and enter key');
            return;
        }

        try {
            // Decrypt
            const decryptedBase64 = await this.decryptWithKey(encryptedText, key);
            
            // Convert to audio
            const audioBlob = this.base64ToBlob(decryptedBase64, 'audio/webm');
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play
            this.audioPlayer.src = audioUrl;
            this.decryptResultBox.style.display = 'block';
            
        } catch (error) {
            alert('Decryption failed. Wrong key or corrupted message.');
        }
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    base64ToBlob(base64, mimeType) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: mimeType });
    }

    async encryptWithKey(text, key) {
        // Use your actual encryption function
        if (typeof window.encryptMessage === 'function') {
            return await window.encryptMessage(text, key);
        }
        // Fallback (replace with your cipher)
        return btoa(JSON.stringify({ key, data: text }));
    }

    async decryptWithKey(encrypted, key) {
        // Use your actual decryption function
        if (typeof window.decryptMessage === 'function') {
            return await window.decryptMessage(encrypted, key);
        }
        // Fallback
        const decoded = JSON.parse(atob(encrypted));
        if (decoded.key !== key) throw new Error('Invalid key');
        return decoded.data;
    }

    copyToClipboard() {
        const text = this.encryptedOutput.textContent;
        if (text) {
            navigator.clipboard.writeText(text);
            alert('Encrypted voice copied! Share this text.');
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.simpleVoice = new SimpleVoiceNote();
});