import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
type AttackMode = 'dictionary' | 'bruteforce' | 'ai' | 'rulebased' | 'mask' | 'verification';
const STORAGE_KEY = 'cyber-security-toolkit-cracker-state';


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

const formatSeconds = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};


// GENERATORS
function* combinationGenerator(charset: string, maxLength: number, resumeState?: { length: number; index: number }) {
    const base = charset.length;
    let startLen = resumeState ? resumeState.length : 1;

    for (let len = startLen; len <= maxLength; len++) {
        const totalForLen = Math.pow(base, len);
        let startIndex = (len === startLen && resumeState) ? resumeState.index : 0;
        
        for (let i = startIndex; i < totalForLen; i++) {
            let temp = i;
            let word = '';
            for (let j = 0; j < len; j++) {
                word = charset[temp % base] + word;
                temp = Math.floor(temp / base);
            }
            yield { word, length: len, indexInLength: i };
        }
    }
}


function* ruleBasedGenerator(word: string) {
    if (!word) return;
    yield word; // Original word
    yield word.charAt(0).toUpperCase() + word.slice(1); // Capitalize
    
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 3; year <= currentYear; year++) {
        yield `${word}${year}`; // Append recent years
    }
    
    // Leetspeak
    yield word.replace(/a/g, '@').replace(/o/g, '0').replace(/e/g, '3').replace(/i/g, '1').replace(/s/g, '$');
}

function* maskGenerator(mask: string, startIndex = 0) {
    const mapping = {
        '?l': 'abcdefghijklmnopqrstuvwxyz',
        '?u': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        '?d': '0123456789',
        '?s': '!@#$%^&*()_+~`|}{[]:;?><,./-=',
        '?a': 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-='
    };
    const parts = mask.match(/\?l|\?u|\?d|\?s|\?a/g);
    if (!parts) {
        if (mask && startIndex === 0) yield { word: mask, index: 0 };
        return;
    }
    const charsets = parts.map(p => mapping[p as keyof typeof mapping]);
    const total = charsets.reduce((acc, cs) => acc * cs.length, 1);
    if (total === 0) return;

    for (let i = startIndex; i < total; i++) {
        let temp = i;
        let word = '';
        for (let j = 0; j < charsets.length; j++) {
            word += charsets[j][temp % charsets[j].length];
            temp = Math.floor(temp / charsets[j].length);
        }
        yield { word, index: i };
    }
}


// TOTAL CALCULATION HELPERS
const calculateTotalCombinations = (charset: string, maxLength: number): number => {
    const n = charset.length;
    if (n === 0) return 0;
    if (n === 1) return maxLength;
    try {
        const nBig = BigInt(n);
        let total = 0n;
        for (let i = 1; i <= maxLength; i++) {
            total += nBig ** BigInt(i);
        }
        return Number(total);
    } catch (e) {
        return Infinity;
    }
};

const calculateMaskCombinations = (mask: string): number => {
     const mapping = { '?l': 26, '?u': 26, '?d': 10, '?s': 32, '?a': 94 };
     const parts = mask.match(/\?l|\?u|\?d|\?s|\?a/g);
     if (!parts) return mask ? 1 : 0;
     return parts.reduce((acc, p) => acc * (mapping[p as keyof typeof mapping] || 1), 1);
};


const HashCracker: React.FC = () => {
    const [attackMode, setAttackMode] = useState<AttackMode>('dictionary');
    const [targetHash, setTargetHash] = useState<string>('');
    const [wordlist, setWordlist] = useState<string>('');
    const [mask, setMask] = useState<string>('?l?l?l?l?l?l');
    const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
    const [isCracking, setIsCracking] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [foundPassword, setFoundPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [progress, setProgress] = useState<number>(0);
    const [eta, setEta] = useState<string>('');
    const [hashesPerSecond, setHashesPerSecond] = useState<number>(0);
    const [bruteForceOpts, setBruteForceOpts] = useState({
        useLower: true,
        useUpper: false,
        useDigits: false,
        useSymbols: false,
        maxLength: 4,
    });
    const [aiHints, setAiHints] = useState<string>('');
    const [aiWordlistSize, setAiWordlistSize] = useState<number>(200);

    const [passwordToVerify, setPasswordToVerify] = useState<string>('');
    const [verificationResult, setVerificationResult] = useState<'match' | 'no_match' | 'error' | null>(null);
    const [verificationSalt, setVerificationSalt] = useState<string>('');
    const [verificationIterations, setVerificationIterations] = useState<number>(260000);

    const [analysisInput, setAnalysisInput] = useState('password\n123456\nadmin\nqwerty\n123456789\npassword123\nfootball\niloveyou\ndragon\n111111');
    const [chartData, setChartData] = useState<Array<{ name: string; 'Unique Hashes': number }>>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [savedStateExists, setSavedStateExists] = useState(false);

    const crackingRef = useRef(false);
    const crackingStartTime = useRef<number>(0);
    const progressRef = useRef<any>({});
    
    useEffect(() => {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            setSavedStateExists(!!savedState);
        } catch (e) {
            console.error("Could not check for saved state in localStorage.", e);
        }
    }, []);

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
    
    const saveState = () => {
        const state = {
            attackMode, targetHash, algorithm, wordlist, mask, bruteForceOpts,
            progress: progressRef.current,
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            setSavedStateExists(true);
        } catch (e) {
            console.error("Failed to save state:", e);
        }
    };

    const clearSavedState = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            setSavedStateExists(false);
            setStatusMessage('Cleared saved attack state.');
        } catch (e) {
            console.error("Failed to clear state:", e);
        }
    };

    const stopCracking = () => {
        crackingRef.current = false;
        setIsCracking(false);
        setStatusMessage('Cracking stopped by user. Saving state...');
        saveState();
    };
    
    const generateAiWordlist = async (): Promise<string[]> => {
        if (!aiHints) {
            throw new Error('Please provide some hints for the AI to generate a wordlist.');
        }
        setStatusMessage('Generating smart wordlist with AI...');
        setProgress(0);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `You are a password security expert creating a highly targeted and diverse wordlist. Generate a list of ${aiWordlistSize} potential passwords based on the following hints.

**HINTS:**
"${aiHints}"

**GENERATION STRATEGIES (USE A MIX OF THESE):**
1.  **Core Information Mutation:** Combine the hints in various ways (e.g., name+year, pet+hobby).
2.  **Common Patterns:** Append/prepend common numbers (1, 123, 12345), recent years, and symbols (!, @, #, $, *).
3.  **Leet Speak (L33t):** Make substitutions like 'e'->'3', 'a'->'@', 'o'->'0', 's'->'5', 'i'->'1', 't'->'7'.
4.  **Common Misspellings:** Intentionally misspell names or words from the hints.
5.  **Keyboard Patterns:** Integrate simple keyboard sequences like 'qwerty' or '12345' into passwords.
6.  **Contextual Content:** If hints mention interests (e.g., movies, books, games), incorporate related character names, locations, or famous quotes (can be short and without spaces).

**OUTPUT FORMAT:**
- Return ONLY the list of passwords.
- Each password must be on a new line.
- Do not include any explanations, titles, or markdown formatting.`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });

            const text = response.text;
            if (!text) {
                throw new Error('AI returned an empty response.');
            }

            const words = text.split(/\r?\n/).filter(w => w.trim() !== '');
            setStatusMessage(`AI generated ${words.length} passwords. Starting attack...`);
            return words;

        } catch (e: any) {
             console.error("AI wordlist generation failed:", e);
             if (e.message?.includes('API key')) {
                throw new Error('AI wordlist generation failed. Please ensure your API key is correctly configured and valid.');
            }
            throw new Error('Failed to generate wordlist with AI. The service might be unavailable or the request was blocked.');
        }
    };


    const startCracking = async (resumeState: any = null) => {
        if (!targetHash) {
            setError('Target hash cannot be empty.');
            return;
        }

        setError('');
        setFoundPassword('');
        setIsCracking(true);
        setStatusMessage(resumeState ? 'Resuming attack...' : 'Starting...');
        setProgress(resumeState?.progress?.checkedCount ? (resumeState.progress.checkedCount / resumeState.progress.total) * 100 : 0);
        setEta('');
        setHashesPerSecond(0);
        crackingRef.current = true;
        crackingStartTime.current = performance.now();
        progressRef.current = resumeState?.progress || {};
        
        try {
            if (attackMode === 'dictionary' || attackMode === 'ai') {
                const words = attackMode === 'ai' ? await generateAiWordlist() : wordlist.split(/\r?\n/).filter(w => w);
                if (crackingRef.current) await startDictionaryAttack(words, resumeState);
            } else if (attackMode === 'bruteforce') {
                await startBruteForceAttack(resumeState);
            } else if (attackMode === 'rulebased') {
                await startRuleBasedAttack(wordlist.split(/\r?\n/).filter(w => w));
            } else if (attackMode === 'mask') {
                await startMaskAttack(resumeState);
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred during cracking.');
            setIsCracking(false);
            crackingRef.current = false;
        }
    };

    const handleResume = () => {
        try {
            const savedStateJSON = localStorage.getItem(STORAGE_KEY);
            if (!savedStateJSON) {
                setError("No saved state found.");
                return;
            }
            const savedState = JSON.parse(savedStateJSON);
            
            // Restore UI state
            setAttackMode(savedState.attackMode);
            setTargetHash(savedState.targetHash);
            setAlgorithm(savedState.algorithm);
            if (savedState.wordlist) setWordlist(savedState.wordlist);
            if (savedState.mask) setMask(savedState.mask);
            if (savedState.bruteForceOpts) setBruteForceOpts(savedState.bruteForceOpts);

            // Start cracking with the resume state
            startCracking(savedState);

        } catch (e) {
            setError("Failed to load or parse saved state.");
            console.error(e);
        }
    };
    
    const updateProgress = (checked: number, total: number) => {
        const elapsedMs = performance.now() - crackingStartTime.current;
        const hps = elapsedMs > 0 ? (checked / elapsedMs) * 1000 : 0;
        setHashesPerSecond(hps);
        
        if (isFinite(total) && total > 0) {
            setProgress((checked / total) * 100);
            if (hps > 0) {
                const remaining = total - checked;
                const remainingSeconds = remaining / hps;
                setEta(formatSeconds(remainingSeconds));
            }
            setStatusMessage(`Checked ${checked.toLocaleString()} / ${total.toLocaleString()}...`);
        } else {
            // For attacks with unknown total (like rule-based)
            setProgress(0); // Or base progress on the source wordlist
            setEta('N/A');
            setStatusMessage(`Checked ${checked.toLocaleString()} combinations...`);
        }
    };

    // FIX: Explicitly type the generator parameter to allow for yielded items that are either strings or objects with a 'word' property.
    const runAttackLoop = async (generator: Generator<{ word: string; [key: string]: any; }>, total: number, initialChecked = 0) => {
        const normalizedTargetHash = targetHash.toLowerCase().trim();
        const CHUNK_SIZE = 5000;
        let checkedCount = initialChecked;
        let chunk: string[] = [];
        let chunkProgress: any[] = [];
        
        progressRef.current.total = total;

        for (const item of generator) {
            if (!crackingRef.current) break;
            chunk.push(item.word);
            chunkProgress.push(item);

            if (chunk.length >= CHUNK_SIZE) {
                const promises = chunk.map(w => hashWord(w, algorithm));
                const hashes = await Promise.all(promises);

                for (let j = 0; j < hashes.length; j++) {
                    if (hashes[j] === normalizedTargetHash) {
                        setFoundPassword(chunk[j]);
                        setStatusMessage(`Password found after checking ${(checkedCount + j + 1).toLocaleString()} combinations!`);
                        setProgress(100); setIsCracking(false); crackingRef.current = false; return;
                    }
                }
                checkedCount += chunk.length;
                progressRef.current = { ...chunkProgress[chunkProgress.length - 1], checkedCount, total };
                chunk = [];
                chunkProgress = [];
                updateProgress(checkedCount, total);
                await new Promise(resolve => setTimeout(resolve, 1)); // Yield
            }
        }
        
        // Process remaining items in the last chunk
        if (crackingRef.current && chunk.length > 0) {
            const promises = chunk.map(w => hashWord(w, algorithm));
            const hashes = await Promise.all(promises);
            for (let j = 0; j < hashes.length; j++) {
                if (hashes[j] === normalizedTargetHash) {
                    setFoundPassword(chunk[j]);
                    setStatusMessage(`Password found after checking ${(checkedCount + j + 1).toLocaleString()} combinations!`);
                    setProgress(100); setIsCracking(false); crackingRef.current = false; return;
                }
            }
            checkedCount += chunk.length;
        }

        if (crackingRef.current) {
            setStatusMessage(`Finished checking ${checkedCount.toLocaleString()} combinations. Password not found.`);
            setProgress(100);
            clearSavedState(); // Attack completed, clear state
        }
        setIsCracking(false);
        crackingRef.current = false;
    };


    const startDictionaryAttack = (words: string[], resumeState: any) => {
        if (!words || words.length === 0) throw new Error('Wordlist is empty.');
        const startIndex = resumeState?.progress?.index || 0;
        const generator = (function*() {
            for (let i = startIndex; i < words.length; i++) {
                yield { word: words[i], index: i };
            }
        })();
        return runAttackLoop(generator, words.length, startIndex);
    };

    const startBruteForceAttack = (resumeState: any) => {
        let charset = '';
        if (bruteForceOpts.useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (bruteForceOpts.useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (bruteForceOpts.useDigits) charset += '0123456789';
        if (bruteForceOpts.useSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
        if (!charset) throw new Error('Please select at least one character set.');
        
        const total = calculateTotalCombinations(charset, bruteForceOpts.maxLength);
        const resumePoint = resumeState?.progress?.length ? { length: resumeState.progress.length, index: resumeState.progress.indexInLength + 1 } : undefined;
        
        let initialChecked = 0;
        if (resumePoint) {
            for (let i = 1; i < resumePoint.length; i++) {
                initialChecked += Math.pow(charset.length, i);
            }
            initialChecked += resumePoint.index;
        }

        return runAttackLoop(combinationGenerator(charset, bruteForceOpts.maxLength, resumePoint), total, initialChecked);
    };
    
    const startRuleBasedAttack = (words: string[]) => {
        if (!words || words.length === 0) throw new Error('Wordlist is empty for rule-based attack.');
        const generator = (function*() {
            for (const word of words) {
                for (const ruleWord of ruleBasedGenerator(word)) {
                     yield { word: ruleWord };
                }
            }
        })();
        return runAttackLoop(generator, Infinity);
    };
    
    const startMaskAttack = (resumeState: any) => {
        if (!mask) throw new Error('Mask cannot be empty.');
        const total = calculateMaskCombinations(mask);
        const startIndex = resumeState?.progress?.index ? resumeState.progress.index + 1 : 0;
        return runAttackLoop(maskGenerator(mask, startIndex), total, startIndex);
    };

    const handleVerify = async () => {
        if (!passwordToVerify || !targetHash) {
            setVerificationResult('error');
            setError("Password and target hash fields cannot be empty for verification.");
            return;
        }
        setError('');
        let generatedHash = '';

        // If salt is provided for a PBKDF2-compatible algorithm, use the advanced hashing.
        if (verificationSalt.trim() && ['SHA-256', 'SHA-512'].includes(algorithm)) {
            try {
                // 1. Convert hex salt to ArrayBuffer
                const saltBytes = new Uint8Array(verificationSalt.trim().match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
                
                // 2. Encode password to ArrayBuffer
                const encoder = new TextEncoder();
                const passwordBuffer = encoder.encode(passwordToVerify);

                // 3. Import key material for PBKDF2
                const keyMaterial = await window.crypto.subtle.importKey(
                    'raw',
                    passwordBuffer,
                    { name: 'PBKDF2' },
                    false,
                    ['deriveBits']
                );
                
                // 4. Derive the key bits
                const keyLength = algorithm === 'SHA-256' ? 256 : 512;
                const derivedBits = await window.crypto.subtle.deriveBits(
                    {
                        name: 'PBKDF2',
                        salt: saltBytes,
                        iterations: verificationIterations,
                        hash: algorithm
                    },
                    keyMaterial,
                    keyLength
                );
                
                generatedHash = bufferToHex(derivedBits);

            } catch (e: any) {
                setError(`PBKDF2 hashing failed: ${e.message}. Ensure salt is valid hex.`);
                setVerificationResult('error');
                return;
            }
        } else {
            // Use simple hashing for MD5, SHA-1, or if no salt is provided
            generatedHash = await hashWord(passwordToVerify, algorithm);
        }

        if (generatedHash.toLowerCase() === targetHash.toLowerCase().trim()) {
            setVerificationResult('match');
        } else {
            setVerificationResult('no_match');
        }
    };
    
    const analyzeHashes = async () => {
        const words = analysisInput.split(/\r?\n/).filter(w => w.trim());
        if (words.length === 0) {
            setChartData([]);
            return;
        };
        setIsAnalyzing(true);
        
        const algorithms: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];
        const uniqueHashes: Record<HashAlgorithm, Set<string>> = {
            'MD5': new Set(), 'SHA-1': new Set(), 'SHA-256': new Set(), 'SHA-512': new Set()
        };
    
        for (const word of words) {
            const hashPromises = algorithms.map(alg => hashWord(word, alg));
            const hashes = await Promise.all(hashPromises);
            hashes.forEach((hash, index) => {
                uniqueHashes[algorithms[index]].add(hash);
            });
        }
    
        const data = algorithms.map(alg => ({
            name: alg,
            'Unique Hashes': uniqueHashes[alg].size
        }));
        setChartData(data);
        setIsAnalyzing(false);
    };

    const AttackModeButton = ({ label, value }: { label: string, value: AttackMode }) => (
        <button
            onClick={() => setAttackMode(value)}
            className={`flex-1 text-center p-3 rounded-lg transition-colors text-sm sm:text-base ${attackMode === value ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
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
            <h2 className="text-2xl font-bold text-white mb-2">Hash Cracker & Verifier</h2>
            <p className="text-gray-400 mb-6 text-sm">Demonstrates attacks against common hash algorithms and verifies hashes.</p>
            
            <div className="p-4 mb-6 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                <strong>For Educational Use Only:</strong> This tool is for learning purposes to understand password vulnerability. Do not use it for malicious activities.
            </div>
             {savedStateExists && (
                <div className="p-3 mb-6 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200 text-sm flex justify-between items-center">
                    <span>An incomplete attack session was found.</span>
                    <div>
                        <button onClick={handleResume} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded-lg transition-colors text-xs mr-2">
                            Resume Attack
                        </button>
                        <button onClick={clearSavedState} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded-lg transition-colors text-xs">
                            Clear
                        </button>
                    </div>
                </div>
            )}

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
                {algorithm === 'MD5' && attackMode !== 'verification' && (
                    <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200 text-xs">
                        <strong>Warning:</strong> MD5 is cryptographically broken and highly vulnerable to collisions. It should not be used for any security-related purpose in modern applications.
                    </div>
                )}

                <div className="flex bg-gray-900 rounded-lg p-1 space-x-1 flex-wrap">
                    <AttackModeButton label="Dictionary" value="dictionary" />
                    <AttackModeButton label="Rule-Based" value="rulebased" />
                    <AttackModeButton label="AI-Powered" value="ai" />
                    <AttackModeButton label="Brute-Force" value="bruteforce" />
                    <AttackModeButton label="Mask" value="mask" />
                    <AttackModeButton label="Verification" value="verification" />
                </div>

                {attackMode === 'verification' && (
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-4">
                         <div>
                            <label htmlFor="password-to-verify" className="block text-sm font-medium text-gray-300 mb-2">Password to Verify</label>
                            <input
                                id="password-to-verify"
                                type="password"
                                placeholder="Enter password to check against the hash"
                                value={passwordToVerify}
                                onChange={e => setPasswordToVerify(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2"
                            />
                        </div>

                        {['SHA-256', 'SHA-512'].includes(algorithm) && (
                            <>
                                <div className="p-2 bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200 text-xs">
                                    For modern hashes, you can provide a salt and iterations to verify a PBKDF2-derived key. Leave salt blank for a simple, unsalted hash check.
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label htmlFor="verification-salt" className="block text-sm font-medium text-gray-300 mb-2">Salt (Hex)</label>
                                        <input
                                            id="verification-salt"
                                            placeholder="e.g., 2d9a..."
                                            value={verificationSalt}
                                            onChange={e => setVerificationSalt(e.target.value)}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 font-mono text-sm"
                                        />
                                    </div>
                                    <div className="sm:w-1/3">
                                        <label htmlFor="verification-iterations" className="block text-sm font-medium text-gray-300 mb-2">Iterations</label>
                                        <input
                                            id="verification-iterations"
                                            type="number"
                                            value={verificationIterations}
                                            onChange={e => setVerificationIterations(parseInt(e.target.value, 10) || 1)}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        
                        <button onClick={handleVerify} className="w-full font-bold py-3 px-4 rounded-lg transition-colors text-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                            Verify Password
                        </button>
                        {verificationResult && (
                            <div className={`p-4 rounded-lg text-center font-bold text-xl ${
                                verificationResult === 'match' ? 'bg-green-900/50 text-green-300' :
                                verificationResult === 'no_match' ? 'bg-red-900/50 text-red-300' :
                                'bg-yellow-900/50 text-yellow-300'
                            }`}>
                                {verificationResult === 'match' && '✅ HASH MATCH'}
                                {verificationResult === 'no_match' && '❌ HASH DOES NOT MATCH'}
                                {verificationResult === 'error' && `⚠️ ${error || 'Please fill all fields'}`}
                            </div>
                        )}
                    </div>
                )}
                
                {['dictionary', 'rulebased'].includes(attackMode) && (
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-2">
                        <label htmlFor="wordlist" className="block text-sm font-medium text-gray-300">Wordlist (one word per line)</label>
                        <textarea id="wordlist" placeholder={"Paste a list of passwords here, or upload a file.\n\npassword\n123456\n..."} value={wordlist} onChange={(e) => setWordlist(e.target.value)} rows={8} className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-white font-mono text-sm focus:ring-blue-500 focus:border-blue-500 resize-y"/>
                        <label htmlFor="file-upload" className="text-sm text-blue-400 hover:underline cursor-pointer pt-1 inline-block">
                            Or upload a wordlist file
                            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.dic" />
                        </label>
                    </div>
                )}

                {attackMode === 'ai' && (
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-4">
                        <label htmlFor="ai-hints" className="block text-sm font-medium text-gray-300">
                            AI Hints (Describe the password's owner)
                        </label>
                        <textarea
                            id="ai-hints"
                            placeholder="e.g., A developer who loves their dog 'Rex', enjoys Star Wars, and was born in 1995."
                            value={aiHints}
                            onChange={(e) => setAiHints(e.target.value)}
                            rows={4}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-white text-sm focus:ring-blue-500 focus:border-blue-500 resize-y"
                        />
                        <div>
                            <label htmlFor="ai-wordlist-size" className="block text-sm font-medium text-gray-300 mb-2">
                                Wordlist Size: {aiWordlistSize}
                            </label>
                            <input
                                type="range"
                                id="ai-wordlist-size"
                                min="50"
                                max="1000"
                                step="50"
                                value={aiWordlistSize}
                                onChange={(e) => setAiWordlistSize(parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>
                )}
                
                {attackMode === 'bruteforce' && (
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-4">
                        <p className="text-sm text-gray-300">Select character sets and max length for brute-force:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                           <BruteForceOptionCheckbox label="a-z" checked={bruteForceOpts.useLower} onChange={e => setBruteForceOpts(o => ({...o, useLower: e.target.checked}))} />
                           <BruteForceOptionCheckbox label="A-Z" checked={bruteForceOpts.useUpper} onChange={e => setBruteForceOpts(o => ({...o, useUpper: e.target.checked}))} />
                           <BruteForceOptionCheckbox label="0-9" checked={bruteForceOpts.useDigits} onChange={e => setBruteForceOpts(o => ({...o, useDigits: e.target.checked}))} />
                           <BruteForceOptionCheckbox label="Symbols" checked={bruteForceOpts.useSymbols} onChange={e => setBruteForceOpts(o => ({...o, useSymbols: e.target.checked}))} />
                        </div>
                        <div>
                            <label htmlFor="max-length" className="block text-sm font-medium text-gray-300 mb-2">Max Length</label>
                            <input type="number" id="max-length" min="1" max="14" value={bruteForceOpts.maxLength} onChange={e => setBruteForceOpts(o => ({...o, maxLength: Math.min(14, parseInt(e.target.value, 10) || 1)}))} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2" />
                            {bruteForceOpts.maxLength > 10 && (
                                <div className="mt-2 p-2 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200 text-xs">
                                    <strong>Warning:</strong> Lengths greater than 10 can take an extremely long time (hours, days, or longer) to complete, depending on your character set and computer's performance.
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {attackMode === 'mask' && (
                     <div className="bg-gray-900/50 p-4 rounded-lg space-y-4">
                        <div>
                            <label htmlFor="mask-input" className="block text-sm font-medium text-gray-300 mb-2">Mask Pattern</label>
                            <input type="text" id="mask-input" value={mask} onChange={e => setMask(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 font-mono" />
                        </div>
                        <div className="text-xs text-gray-400 p-2 bg-gray-900 rounded-md">
                            <p className="font-bold">Placeholders:</p>
                            <p>?l = lowercase, ?u = uppercase, ?d = digits, ?s = symbols, ?a = all</p>
                            <p>Example: <span className="font-mono">?u?l?l?l?d?d?s</span> for a password like 'Pass12!'</p>
                        </div>
                    </div>
                )}
                
                {attackMode !== 'verification' && (
                 <button onClick={isCracking ? stopCracking : () => startCracking()} className={`w-full font-bold py-3 px-4 rounded-lg transition-colors text-lg flex items-center justify-center ${isCracking ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    {isCracking ? 'Stop Cracking' : 'Start Cracking'}
                </button>
                )}

                {isCracking && (
                    <div className="mt-4 space-y-2">
                        <div className="w-full bg-gray-700 rounded-full h-3">
                            <div
                                className="bg-blue-500 h-3 rounded-full transition-all duration-100"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-center text-gray-400 flex justify-between">
                            <span>{Math.round(hashesPerSecond).toLocaleString()} H/s</span>
                            <span>{progress.toFixed(2)}%</span>
                            <span>ETA: {eta}</span>
                        </div>
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
            
            <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Hash Collision Demonstrator</h3>
                <p className="text-gray-400 mb-4 text-sm">
                    Enter a list of passwords to see how many unique hashes each algorithm produces. Weaker algorithms like MD5 are more likely to produce "collisions" (the same hash for different inputs), resulting in fewer unique hashes from the same list.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="analysis-input" className="block text-sm font-medium text-gray-300 mb-2">Password List</label>
                        <textarea
                            id="analysis-input"
                            value={analysisInput}
                            onChange={e => setAnalysisInput(e.target.value)}
                            rows={10}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-white font-mono text-sm focus:ring-blue-500 focus:border-blue-500 resize-y"
                        />
                        <button onClick={analyzeHashes} disabled={isAnalyzing} className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {isAnalyzing ? 'Analyzing...' : 'Analyze & Visualize'}
                        </button>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded-lg min-h-[300px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                    <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
                                    <YAxis allowDecimals={false} stroke="#A0AEC0" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} cursor={{fill: 'rgba(128,128,128,0.1)'}}/>
                                    <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}/>
                                    <Bar dataKey="Unique Hashes" fill="#4299E1" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>Analysis results will be displayed here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HashCracker;