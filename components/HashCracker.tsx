import React, { useState, useCallback, useRef } from 'react';

// Helper function to convert ArrayBuffer to hex string
const bufferToHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * A simple, self-contained MD5 implementation for educational purposes.
 * Based on the public domain implementation by Joseph Myers.
 * IMPORTANT: MD5 is cryptographically broken and should not be used for security.
 */
const md5 = (str: string): string => {
    function rotateLeft(lValue: number, iShiftBits: number) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }

    function addUnsigned(lX: number, lY: number) {
        let lX4, lY4, lX8, lY8, lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        if (lX4 | lY4) {
            if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    }

    function F(x: number, y: number, z: number) { return (x & y) | ((~x) & z); }
    function G(x: number, y: number, z: number) { return (x & z) | (y & (~z)); }
    function H(x: number, y: number, z: number) { return (x ^ y ^ z); }
    function I(x: number, y: number, z: number) { return (y ^ (x | (~z))); }

    function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function convertToWordArray(str: string) {
        let lWordCount;
        const lMessageLength = str.length;
        const lNumberOfWords_temp1 = lMessageLength + 8;
        const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        const lWordArray = Array(lNumberOfWords - 1);
        let lBytePosition = 0;
        let lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }

    function wordToHex(lValue: number) {
        let wordToHexValue = "", wordToHexValue_temp = "", lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            wordToHexValue_temp = "0" + lByte.toString(16);
            wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
        }
        return wordToHexValue;
    }

    const x = convertToWordArray(str);
    let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
    const S11=7,  S12=12, S13=17, S14=22;
    const S21=5,  S22=9,  S23=14, S24=20;
    const S31=4,  S32=11, S33=16, S34=23;
    const S41=6,  S42=10, S43=15, S44=21;

    for (let i = 0; i < x.length; i += 16) {
        const AA = a, BB = b, CC = c, DD = d;
        a=FF(a,b,c,d,x[i+0], S11,0xD76AA478); d=FF(d,a,b,c,x[i+1], S12,0xE8C7B756); c=FF(c,d,a,b,x[i+2], S13,0x242070DB); b=FF(b,c,d,a,x[i+3], S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[i+4], S11,0xF57C0FAF); d=FF(d,a,b,c,x[i+5], S12,0x4787C62A); c=FF(c,d,a,b,x[i+6], S13,0xA8304613); b=FF(b,c,d,a,x[i+7], S14,0xFD469501);
        a=FF(a,b,c,d,x[i+8], S11,0x698098D8); d=FF(d,a,b,c,x[i+9], S12,0x8B44F7AF); c=FF(c,d,a,b,x[i+10],S13,0xFFFF5BB1); b=FF(b,c,d,a,x[i+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[i+12],S11,0x6B901122); d=FF(d,a,b,c,x[i+13],S12,0xFD987193); c=FF(c,d,a,b,x[i+14],S13,0xA679438E); b=FF(b,c,d,a,x[i+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[i+1], S21,0xF61E2562); d=GG(d,a,b,c,x[i+6], S22,0xC040B340); c=GG(c,d,a,b,x[i+11],S23,0x265E5A51); b=GG(b,c,d,a,x[i+0], S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[i+5], S21,0xD62F105D); d=GG(d,a,b,c,x[i+10],S22,0x2441453);  c=GG(c,d,a,b,x[i+15],S23,0xD8A1E681); b=GG(b,c,d,a,x[i+4], S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[i+9], S21,0x21E1CDE6); d=GG(d,a,b,c,x[i+14],S22,0xC33707D6); c=GG(c,d,a,b,x[i+3], S23,0xF4D50D87); b=GG(b,c,d,a,x[i+8], S24,0x455A14ED);
        a=GG(a,b,c,d,x[i+13],S21,0xA9E3E905); d=GG(d,a,b,c,x[i+2], S22,0xFCEFA3F8); c=GG(c,d,a,b,x[i+7], S23,0x676F02D9); b=GG(b,c,d,a,x[i+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[i+5], S31,0xFFFA3942); d=HH(d,a,b,c,x[i+8], S32,0x8771F681); c=HH(c,d,a,b,x[i+11],S33,0x6D9D6122); b=HH(b,c,d,a,x[i+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[i+1], S31,0xA4BEEA44); d=HH(d,a,b,c,x[i+4], S32,0x4BDECFA9); c=HH(c,d,a,b,x[i+7], S33,0xF6BB4B60); b=HH(b,c,d,a,x[i+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[i+13],S31,0x289B7EC6); d=HH(d,a,b,c,x[i+0], S32,0xEAA127FA); c=HH(c,d,a,b,x[i+3], S33,0xD4EF3085); b=HH(b,c,d,a,x[i+6], S34,0x4881D05);
        a=HH(a,b,c,d,x[i+9], S31,0xD9D4D039); d=HH(d,a,b,c,x[i+12],S32,0xE6DB99E5); c=HH(c,d,a,b,x[i+15],S33,0x1FA27CF8); b=HH(b,c,d,a,x[i+2], S34,0xC4AC5665);
        a=II(a,b,c,d,x[i+0], S41,0xF4292244); d=II(d,a,b,c,x[i+7], S42,0x432AFF97); c=II(c,d,a,b,x[i+14],S43,0xAB9423A7); b=II(b,c,d,a,x[i+5], S44,0xFC93A039);
        a=II(a,b,c,d,x[i+12],S41,0x655B59C3); d=II(d,a,b,c,x[i+3], S42,0x8F0CCC92); c=II(c,d,a,b,x[i+10],S43,0xFFEFF47D); b=II(b,c,d,a,x[i+1], S44,0x85845DD1);
        a=II(a,b,c,d,x[i+8], S41,0x6FA87E4F); d=II(d,a,b,c,x[i+15],S42,0xFE2CE6E0); c=II(c,d,a,b,x[i+6], S43,0xA3014314); b=II(b,c,d,a,x[i+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[i+4], S41,0xF7537E82); d=II(d,a,b,c,x[i+11],S42,0xBD3AF235); c=II(c,d,a,b,x[i+2], S43,0x2AD7D2BB); b=II(b,c,d,a,x[i+9], S44,0xEB86D391);
        a=addUnsigned(a,AA); b=addUnsigned(b,BB); c=addUnsigned(c,CC); d=addUnsigned(d,DD);
    }
    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
};


type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

const hashWord = async (word: string, algorithm: HashAlgorithm): Promise<string> => {
    if (algorithm === 'MD5') {
        return md5(word); // Use JS implementation for MD5
    }
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(word);
        const hashBuffer = await window.crypto.subtle.digest(algorithm, data);
        return bufferToHex(hashBuffer);
    } catch (e) {
        console.error(`Hashing with ${algorithm} failed:`, e);
        throw new Error(`Hashing failed. This browser may not support ${algorithm}.`);
    }
};

/**
 * An efficient, non-blocking generator that yields password combinations
 * for brute-force attacks.
 * @param {string} charset - The character set to use for combinations.
 * @param {number} maxLength - The maximum length of passwords to generate.
 */
function* combinationGenerator(charset: string, maxLength: number) {
    for (let len = 1; len <= maxLength; len++) {
        const indices = new Array(len).fill(0);
        while (true) {
            let word = '';
            for (const index of indices) {
                word += charset[index];
            }
            yield {word, length: len};

            let i = len - 1;
            while (i >= 0) {
                indices[i]++;
                if (indices[i] < charset.length) break;
                indices[i] = 0;
                i--;
            }
            if (i < 0) break;
        }
    }
}

// Calculates total combinations for brute-force to aid progress tracking.
const calculateTotalCombinations = (charset: string, maxLength: number): number => {
    const n = charset.length;
    if (n === 0) return 0;
    if (n === 1) return maxLength;
    // Sum of a geometric series: n * (n^maxLength - 1) / (n - 1)
    // Use BigInt for intermediate calcs to prevent overflow for large numbers.
    try {
        const nBig = BigInt(n);
        const total = nBig * (nBig ** BigInt(maxLength) - 1n) / (nBig - 1n);
        return Number(total); // Convert back. May be Infinity if too large.
    } catch (e) {
        return Infinity;
    }
};


const HashCracker: React.FC = () => {
    const [attackMode, setAttackMode] = useState<'dictionary' | 'bruteforce'>('dictionary');
    const [targetHash, setTargetHash] = useState<string>('');
    const [wordlist, setWordlist] = useState<string>('');
    const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
    const [isCracking, setIsCracking] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [foundPassword, setFoundPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [bruteForceOpts, setBruteForceOpts] = useState({
        useLower: true,
        useUpper: false,
        useDigits: false,
        useSymbols: false,
        maxLength: 4,
    });
    
    const crackingRef = useRef(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setWordlist(event.target?.result as string);
            };
            reader.onerror = () => {
                setError(`Error reading file: ${reader.error?.message}`);
                e.target.value = '';
            };
            reader.readAsText(file);
        }
    };
    
    const stopCracking = () => {
        crackingRef.current = false;
        setIsCracking(false);
        setStatusMessage('Cracking stopped by user.');
    };

    const startCracking = async () => {
        if (!targetHash) {
            setError('Target hash cannot be empty.');
            return;
        }

        setError('');
        setFoundPassword('');
        setIsCracking(true);
        setStatusMessage('Starting...');
        setProgress(0);
        crackingRef.current = true;
        
        try {
            if (attackMode === 'dictionary') {
                await startDictionaryAttack();
            } else {
                await startBruteForceAttack();
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred during cracking.');
            setIsCracking(false);
            crackingRef.current = false;
        }
    };

    const startDictionaryAttack = async () => {
        if (!wordlist) {
            throw new Error('Wordlist cannot be empty for a dictionary attack.');
        }
        const words = wordlist.split(/\r?\n/).filter(w => w);
        const totalWords = words.length;
        if (totalWords === 0) {
             throw new Error('Wordlist is empty or invalid.');
        }
        const normalizedTargetHash = targetHash.toLowerCase().trim();
        const CHUNK_SIZE = 1000;
        
        for (let i = 0; i < totalWords; i += CHUNK_SIZE) {
            if (!crackingRef.current) break;
            
            const chunk = words.slice(i, i + CHUNK_SIZE);
            const promises = chunk.map(word => hashWord(word, algorithm));
            const hashes = await Promise.all(promises);

            for (let j = 0; j < hashes.length; j++) {
                if (hashes[j] === normalizedTargetHash) {
                    setFoundPassword(chunk[j]);
                    setStatusMessage(`Password found after checking ${i + j + 1} words!`);
                    setProgress(100);
                    setIsCracking(false);
                    crackingRef.current = false;
                    return;
                }
            }
            
            const wordsChecked = Math.min(i + CHUNK_SIZE, totalWords);
            setProgress((wordsChecked / totalWords) * 100);
            setStatusMessage(`Checked ${wordsChecked} / ${totalWords} words...`);
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
        }
        
        if (crackingRef.current) {
            setStatusMessage(`Finished checking ${totalWords} words. Password not found.`);
            setProgress(100);
        }
        setIsCracking(false);
        crackingRef.current = false;
    };

    const startBruteForceAttack = async () => {
        let charset = '';
        if (bruteForceOpts.useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (bruteForceOpts.useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (bruteForceOpts.useDigits) charset += '0123456789';
        if (bruteForceOpts.useSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

        if (!charset) {
             throw new Error('Please select at least one character set for brute-force attack.');
        }

        const normalizedTargetHash = targetHash.toLowerCase().trim();
        const totalCombinations = calculateTotalCombinations(charset, bruteForceOpts.maxLength);
        
        const generator = combinationGenerator(charset, bruteForceOpts.maxLength);
        let checkedCount = 0;
        const CHUNK_SIZE = 5000;
        let chunk: string[] = [];

        for (const item of generator) {
            if (!crackingRef.current) break;
            
            chunk.push(item.word);

            if (chunk.length >= CHUNK_SIZE) {
                const promises = chunk.map(w => hashWord(w, algorithm));
                const hashes = await Promise.all(promises);

                for (let j = 0; j < hashes.length; j++) {
                    if (hashes[j] === normalizedTargetHash) {
                        setFoundPassword(chunk[j]);
                        setStatusMessage(`Password found after checking ${(checkedCount + j + 1).toLocaleString()} combinations!`);
                        setProgress(100);
                        setIsCracking(false);
                        crackingRef.current = false;
                        return;
                    }
                }
                checkedCount += chunk.length;
                chunk = [];
                if (isFinite(totalCombinations) && totalCombinations > 0) {
                     setProgress((checkedCount / totalCombinations) * 100);
                }
                setStatusMessage(`Checked ${checkedCount.toLocaleString()} combinations... Trying length ${item.length}.`);
                await new Promise(resolve => setTimeout(resolve, 1)); // Yield to main thread
            }
        }

        if (crackingRef.current && chunk.length > 0) {
            const promises = chunk.map(w => hashWord(w, algorithm));
            const hashes = await Promise.all(promises);
             for (let j = 0; j < hashes.length; j++) {
                if (hashes[j] === normalizedTargetHash) {
                    setFoundPassword(chunk[j]);
                    setStatusMessage(`Password found after checking ${(checkedCount + j + 1).toLocaleString()} combinations!`);
                    setProgress(100);
                    setIsCracking(false);
                    crackingRef.current = false;
                    return;
                }
            }
            checkedCount += chunk.length;
        }
        
        if (crackingRef.current) {
            setStatusMessage(`Finished checking ${checkedCount.toLocaleString()} combinations. Password not found.`);
            setProgress(100);
        }
        setIsCracking(false);
        crackingRef.current = false;
    };
    
    const AttackModeButton = ({ label, value }: { label: string, value: 'dictionary' | 'bruteforce' }) => (
        <button
            onClick={() => setAttackMode(value)}
            className={`flex-1 text-center p-3 rounded-lg transition-colors ${attackMode === value ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
            {label}
        </button>
    );

    const BruteForceOptionCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
        <label className="flex items-center space-x-2 p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors text-sm">
            <input type="checkbox" checked={checked} onChange={onChange} className="form-checkbox h-4 w-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500" />
            <span>{label}</span>
        </label>
    );


    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Hash Cracker</h2>
            <p className="text-gray-400 mb-6 text-sm">Demonstrates dictionary and brute-force attacks against hashes.</p>
            
            <div className="p-4 mb-6 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                <strong>For Educational Use Only:</strong> This tool is for learning purposes to understand password vulnerability. Do not use it for malicious activities.
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="target-hash" className="block text-sm font-medium text-gray-300 mb-2">Target Hash</label>
                        <input id="target-hash" placeholder="Paste hash here" value={targetHash} onChange={(e) => setTargetHash(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 font-mono text-sm text-white focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                     <div>
                        <label htmlFor="algorithm" className="block text-sm font-medium text-gray-300 mb-2">Algorithm</label>
                        <select id="algorithm" value={algorithm} onChange={(e) => setAlgorithm(e.target.value as HashAlgorithm)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500">
                            <option value="MD5">MD5 (Insecure)</option>
                            <option value="SHA-1">SHA-1</option>
                            <option value="SHA-256">SHA-256</option>
                            <option value="SHA-512">SHA-512</option>
                        </select>
                    </div>
                </div>
                {algorithm === 'MD5' && (
                    <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200 text-xs">
                        <strong>Warning:</strong> MD5 is cryptographically broken and highly vulnerable to collisions. It should not be used for any security-related purpose in modern applications.
                    </div>
                )}

                <div className="flex bg-gray-900 rounded-lg p-1 space-x-1">
                    <AttackModeButton label="Dictionary Attack" value="dictionary" />
                    <AttackModeButton label="Brute-Force Attack" value="bruteforce" />
                </div>

                {attackMode === 'dictionary' ? (
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-2">
                        <label htmlFor="wordlist" className="block text-sm font-medium text-gray-300">Wordlist (one word per line)</label>
                        <textarea id="wordlist" placeholder={"Paste a list of passwords here, or upload a file.\n\npassword\n123456\n..."} value={wordlist} onChange={(e) => setWordlist(e.target.value)} rows={8} className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-white font-mono text-sm focus:ring-blue-500 focus:border-blue-500 resize-y"/>
                        <label htmlFor="file-upload" className="text-sm text-blue-400 hover:underline cursor-pointer pt-1 inline-block">
                            Or upload a wordlist file
                            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.dic" />
                        </label>
                    </div>
                ) : (
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-4">
                        <p className="text-sm text-gray-300">Select character sets and max length for brute-force:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                           <BruteForceOptionCheckbox label="a-z" checked={bruteForceOpts.useLower} onChange={e => setBruteForceOpts(o => ({...o, useLower: e.target.checked}))} />
                           <BruteForceOptionCheckbox label="A-Z" checked={bruteForceOpts.useUpper} onChange={e => setBruteForceOpts(o => ({...o, useUpper: e.target.checked}))} />
                           <BruteForceOptionCheckbox label="0-9" checked={bruteForceOpts.useDigits} onChange={e => setBruteForceOpts(o => ({...o, useDigits: e.target.checked}))} />
                           <BruteForceOptionCheckbox label="Symbols" checked={bruteForceOpts.useSymbols} onChange={e => setBruteForceOpts(o => ({...o, useSymbols: e.target.checked}))} />
                        </div>
                        <div>
                            <label htmlFor="max-length" className="block text-sm font-medium text-gray-300 mb-2">Max Length (Warning: &gt;8 can be very slow)</label>
                            <input type="number" id="max-length" min="1" max="10" value={bruteForceOpts.maxLength} onChange={e => setBruteForceOpts(o => ({...o, maxLength: parseInt(e.target.value, 10) || 1}))} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2" />
                        </div>
                    </div>
                )}
                
                 <button onClick={isCracking ? stopCracking : startCracking} className={`w-full font-bold py-3 px-4 rounded-lg transition-colors text-lg flex items-center justify-center ${isCracking ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    {isCracking ? 'Stop Cracking' : 'Start Cracking'}
                </button>

                {isCracking && (
                    <div className="w-full bg-gray-700 rounded-full h-3 mt-4">
                        <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}

                {error && <p className="text-red-400 text-center">{error}</p>}

                {(statusMessage || foundPassword) && (
                    <div className="space-y-4 pt-4 border-t border-gray-700">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Status</h4>
                            <p className="bg-gray-900 p-3 rounded-md text-sm text-gray-300">{statusMessage}</p>
                        </div>
                        {foundPassword && (
                            <div>
                                <h4 className="text-sm font-semibold text-green-400 mb-1">Password Found!</h4>
                                <p className="bg-green-900/50 p-3 rounded-md font-mono text-lg text-green-300 break-all">{foundPassword}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HashCracker;