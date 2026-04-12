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



        