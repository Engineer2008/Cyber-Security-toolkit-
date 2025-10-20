import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { hashWord, HashAlgorithm, bufferToHex } from '../utils/hashing';

type AttackMode = 'dictionary' | 'bruteforce' | 'ai_agent' | 'rulebased' | 'mask' | 'hybrid' | 'verification';
const STORAGE_KEY = 'cyber-security-toolkit-cracker-state';

const formatSeconds = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};


// GENERATORS
function* combinationGenerator(charset: string, maxLength: number) {
    const base = charset.length;
    for (let len = 1; len <= maxLength; len++) {
        const totalForLen = Math.pow(base, len);
        for (let i = 0; i < totalForLen; i++) {
            let temp = i;
            let word = '';
            for (let j = 0; j < len; j++) {
                word = charset[temp % base] + word;
                temp = Math.floor(temp / base);
            }
            yield { word };
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

function* maskGenerator(mask: string) {
    const mapping = {
        '?l': 'abcdefghijklmnopqrstuvwxyz',
        '?u': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        '?d': '0123456789',
        '?s': '!@#$%^&*()_+~`|}{[]:;?><,./-=',
        '?a': 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-='
    };
    const parts = mask.match(/\?l|\?u|\?d|\?s|\?a/g);
    if (!parts) {
        if (mask) yield { word: mask };
        return;
    }
    const charsets = parts.map(p => mapping[p as keyof typeof mapping]);
    const total = charsets.reduce((acc, cs) => acc * cs.length, 1);
    if (total === 0) return;

    for (let i = 0; i < total; i++) {
        let temp = i;
        let word = '';
        for (let j = 0; j < charsets.length; j++) {
            word += charsets[j][temp % charsets[j].length];
            temp = Math.floor(temp / charsets[j].length);
        }
        yield { word };
    }
}

function* hybridGenerator(words: string[], mask: string) {
    for (const word of words) {
        for (const maskItem of maskGenerator(mask)) {
            yield { word: word + maskItem.word };
        }
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

    const [savedStateExists, setSavedStateExists] = useState(false);
    const [dynamicTotal, setDynamicTotal] = useState<number>(0);

    const crackingRef = useRef(false);
    const crackingStartTime = useRef<number>(0);
    
    const processedWordlist = useMemo(() => {
        const lines = wordlist.split(/\r?\n/);
        // Normalize by trimming and lowercasing, then create a unique set.
        const uniqueNormalizedWords = [...new Set(lines.map(w => w.trim().toLowerCase()).filter(Boolean))];
        return uniqueNormalizedWords;
    }, [wordlist]);

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
        // Saving state is complex with generators. For now, we will not resume complex attacks.
        // This can be implemented later by saving the generator's internal state (e.g., current index).
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
        setStatusMessage('Cracking stopped by user.');
        // saveState(); // Disabled for now
    };
    
    const runAiAgentAttack = async (): Promise<string[]> => {
        if (!aiHints) {
            throw new Error('Please provide some hints for the AI agent to formulate a plan.');
        }
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let combinedWordlist: string[] = [];
        // 1 initial attempt + up to 3 retries
        const maxRetries = 4;

        const callGeminiWithRetry = async (prompt: string, stepName: string): Promise<string[]> => {
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: prompt,
                    });
                    const text = response.text;
                    if (!text) throw new Error('AI returned an empty response.');
                    return text.split(/\r?\n/).filter(w => w.trim() !== '');
                } catch (e: any) {
                    console.error(`AI Agent step '${stepName}' failed (attempt ${attempt + 1}/${maxRetries}):`, e);
                    if (attempt === maxRetries - 1) {
                        if (e.message?.includes('API key')) {
                           throw new Error('AI Agent failed. Please ensure your API key is correctly configured and valid.');
                        }
                        throw new Error(`AI Agent step '${stepName}' failed after ${maxRetries} attempts. The service might be unavailable or the request was blocked.`);
                    }
                    // Exponential backoff with jitter
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
                    setStatusMessage(`AI Agent: Step '${stepName}' failed. Retrying in ${Math.round(delay/1000)}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            return []; // Should be unreachable
        };

        // Step 1: Core Wordlist Generation
        setStatusMessage('AI Agent: [1/3] Generating core password ideas...');
        setProgress(10);
        const corePrompt = `Based on these hints: "${aiHints}", generate a targeted list of ${Math.floor(aiWordlistSize * 0.4)} potential passwords. Focus on direct combinations, important names, dates, and pets. Output only the password list, one per line.`;
        const coreWords = await callGeminiWithRetry(corePrompt, "Core Ideas");
        combinedWordlist.push(...coreWords);

        if (!crackingRef.current) return [];

        // Step 2: Creative & Thematic Variations
        setStatusMessage('AI Agent: [2/3] Generating creative & leetspeak variations...');
        setProgress(40);
        const creativePrompt = `Based on these hints: "${aiHints}", generate a creative list of ${Math.floor(aiWordlistSize * 0.6)} potential passwords. Use heavy 'leetspeak' (e.g., e->3, a->@), incorporate thematic words from hobbies/interests mentioned (like movie characters or game terms), and common misspellings. Output only the password list, one per line.`;
        const creativeWords = await callGeminiWithRetry(creativePrompt, "Creative Variations");
        combinedWordlist.push(...creativeWords);
        
        if (!crackingRef.current) return [];

        // Step 3: Client-Side Rule Application
        setStatusMessage('AI Agent: [3/3] Applying common password mutation rules...');
        setProgress(75);
        const finalWordlistWithRules: string[] = [];
        const uniqueWords = new Set<string>(combinedWordlist);
        
        for (const word of uniqueWords) {
            for (const ruleWord of ruleBasedGenerator(word)) {
                finalWordlistWithRules.push(ruleWord);
            }
            if (finalWordlistWithRules.length % 1000 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        if (!crackingRef.current) return [];

        const finalUniqueWords = [...new Set(finalWordlistWithRules.map(w => w.trim().toLowerCase()).filter(Boolean))];
        setStatusMessage(`AI Agent: Plan complete. Starting attack with ${finalUniqueWords.length.toLocaleString()} unique candidates...`);
        setProgress(100);
        
        return finalUniqueWords;
    };


    const startCracking = async (resumeState: any = null) => {
        if (!targetHash) {
            setError('Target hash cannot be empty.');
            return;
        }

        setError('');
        setFoundPassword('');
        setIsCracking(true);
        setStatusMessage('Starting...');
        setProgress(0);
        setEta('');
        setHashesPerSecond(0);
        setDynamicTotal(0);
        crackingRef.current = true;
        crackingStartTime.current = performance.now();
        
        try {
            if (attackMode === 'dictionary') {
                await startDictionaryAttack(processedWordlist);
            } else if (attackMode === 'ai_agent') {
                 const words = await runAiAgentAttack();
                 setDynamicTotal(words.length);
                 if (crackingRef.current) await startDictionaryAttack(words);
            } else if (attackMode === 'bruteforce') {
                await startBruteForceAttack();
            } else if (attackMode === 'rulebased') {
                await startRuleBasedAttack(processedWordlist);
            } else if (attackMode === 'mask') {
                await startMaskAttack();
            } else if (attackMode === 'hybrid') {
                await startHybridAttack(processedWordlist);
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred during cracking.');
            setIsCracking(false);
            crackingRef.current = false;
        }
    };

    const handleResume = () => {
       setError("Resuming attacks is not yet implemented for this version.");
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

    const runAttackLoop = async (generator: Generator<{ word: string; [key: string]: any; }>, total: number) => {
        const normalizedTargetHash = targetHash.toLowerCase().trim();
        const CHUNK_SIZE = 5000;
        let checkedCount = 0;
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
                        setProgress(100); setIsCracking(false); crackingRef.current = false; return;
                    }
                }
                checkedCount += chunk.length;
                chunk = [];
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
        }
        setIsCracking(false);
        crackingRef.current = false;
    };


    const startDictionaryAttack = (words: string[]) => {
        if (!words || words.length === 0) throw new Error('Wordlist is empty.');
        const generator = (function*() {
            for (const word of words) {
                yield { word };
            }
        })();
        return runAttackLoop(generator, words.length);
    };

    const startBruteForceAttack = () => {
        let charset = '';
        if (bruteForceOpts.useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (bruteForceOpts.useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (bruteForceOpts.useDigits) charset += '0123456789';
        if (bruteForceOpts.useSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
        if (!charset) throw new Error('Please select at least one character set.');
        
        const total = calculateTotalCombinations(charset, bruteForceOpts.maxLength);
        return runAttackLoop(combinationGenerator(charset, bruteForceOpts.maxLength), total);
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
    
    const startMaskAttack = () => {
        if (!mask) throw new Error('Mask cannot be empty.');
        const total = calculateMaskCombinations(mask);
        return runAttackLoop(maskGenerator(mask), total);
    };
    
    const startHybridAttack = (words: string[]) => {
        if (words.length === 0) throw new Error('Wordlist is empty for hybrid attack.');
        if (!mask) throw new Error('Mask cannot be empty for hybrid attack.');
    
        const maskTotal = calculateMaskCombinations(mask);
        if (maskTotal === 0) throw new Error('Mask results in zero combinations.');
        
        const total = words.length * maskTotal;
        return runAttackLoop(hybridGenerator(words, mask), total);
    };

    const handleVerify = async () => {
        if (!passwordToVerify || !targetHash) {
            setVerificationResult('error');
            setError("Password and target hash fields cannot be empty for verification.");
            return;
        }
        setError('');
        let generatedHash = '';

        if (verificationSalt.trim() && ['SHA-256', 'SHA-512'].includes(algorithm)) {
            try {
                const saltBytes = new Uint8Array(verificationSalt.trim().match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
                const encoder = new TextEncoder();
                const passwordBuffer = encoder.encode(passwordToVerify);
                const keyMaterial = await window.crypto.subtle.importKey(
                    'raw',
                    passwordBuffer,
                    { name: 'PBKDF2' },
                    false,
                    ['deriveBits']
                );
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
            generatedHash = await hashWord(passwordToVerify, algorithm);
        }

        if (generatedHash.toLowerCase() === targetHash.toLowerCase().trim()) {
            setVerificationResult('match');
        } else {
            setVerificationResult('no_match');
        }
    };

    const AttackModeButton = ({ label, value }: { label: string, value: AttackMode }) => (
        <button
            onClick={() => { setAttackMode(value); setError(''); setFoundPassword(''); setVerificationResult(null); }}
            className={`flex-grow sm:flex-1 text-center p-3 rounded-lg transition-colors text-xs sm:text-sm ${attackMode === value ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
            {label}
        </button>
    );
    
    // --- UI PANELS ---
    const VerificationPanel = () => (
        <div className="space-y-4">
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
        </div>
    );
    
    const WordlistPanel = ({ wordCount }: { wordCount: number }) => (
        <div className="space-y-2">
            <label htmlFor="wordlist" className="block text-sm font-medium text-gray-300">Wordlist (one word per line)</label>
            <textarea id="wordlist" placeholder={"Paste a list of passwords here, or upload a file.\n\npassword\n123456\n..."} value={wordlist} onChange={(e) => setWordlist(e.target.value)} rows={8} className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-white font-mono text-sm focus:ring-blue-500 focus:border-blue-500 resize-y"/>
            <div className="flex justify-between items-center">
                 <label htmlFor="file-upload" className="text-sm text-blue-400 hover:underline cursor-pointer pt-1 inline-block">
                    Or upload a wordlist file
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.dic" />
                </label>
                 {wordCount > 0 && (
                    <p className="text-sm text-gray-400">
                        Using {wordCount.toLocaleString()} unique, normalized words.
                    </p>
                )}
            </div>
        </div>
    );
    
    const AIPanel = () => (
        <div className="space-y-4">
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
                    Target AI Wordlist Size: {aiWordlistSize}
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
    );

    const BruteForcePanel = () => {
        const BruteForceOptionCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
            <label className="flex items-center space-x-2 p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors text-sm">
                <input type="checkbox" checked={checked} onChange={onChange} className="form-checkbox h-4 w-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500" />
                <span>{label}</span>
            </label>
        );
        return (
            <div className="space-y-4">
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
        );
    };

    const MaskPanel = ({ isHybrid = false }: { isHybrid?: boolean }) => {
        const placeholders = [
            { char: '?l', name: 'Lowercase (a-z)' },
            { char: '?u', name: 'Uppercase (A-Z)' },
            { char: '?d', name: 'Digit (0-9)' },
            { char: '?s', name: 'Symbol (!@#...)' },
            { char: '?a', name: 'All Characters' },
        ];

        const handlePlaceholderClick = (placeholder: string) => {
            setMask(prevMask => prevMask + placeholder);
        };

        return (
             <div className="space-y-4">
                <div>
                    <label htmlFor="mask-input" className="block text-sm font-medium text-gray-300 mb-2">
                        {isHybrid ? 'Mask Pattern (appended to each word)' : 'Mask Pattern'}
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            id="mask-input" 
                            value={mask} 
                            onChange={e => setMask(e.target.value)} 
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 pr-8 font-mono" 
                            placeholder="e.g., ?u?l?l?l?d?d"
                        />
                        {mask && (
                            <button onClick={() => setMask('')} aria-label="Clear mask" className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-xs text-gray-400">Click to add placeholders:</p>
                    <div className="flex flex-wrap gap-2">
                        {placeholders.map(p => (
                            <button key={p.char} onClick={() => handlePlaceholderClick(p.char)} title={p.name} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md font-mono text-sm transition-colors">
                                {p.char}
                            </button>
                        ))}
                    </div>
                </div>
                 <div className="text-xs text-gray-400 p-2 bg-gray-900/50 rounded-md">
                    <p>Example: <span className="font-mono">{isHybrid ? '1?d?d?d' : '?u?l?l?l?d?d?s'}</span> would generate {isHybrid ? "'word1999'" : "'Pass12!'"}-style candidates.</p>
                </div>
            </div>
        );
    };
    
    const renderAttackSettings = () => {
        switch (attackMode) {
            case 'dictionary': return <WordlistPanel wordCount={processedWordlist.length} />;
            case 'ai_agent': return <AIPanel />;
            case 'bruteforce': return <BruteForcePanel />;
            case 'rulebased': return <WordlistPanel wordCount={processedWordlist.length} />;
            case 'mask': return <MaskPanel />;
            case 'hybrid': return (
                <div className="space-y-4">
                    <WordlistPanel wordCount={processedWordlist.length} />
                    <MaskPanel isHybrid={true} />
                </div>
            );
            case 'verification': return <VerificationPanel />;
            default: return null;
        }
    };
    
    const totalCombinations = useMemo(() => {
        if (attackMode === 'verification' || isCracking) return 0;
        try {
            switch (attackMode) {
                case 'dictionary':
                    return processedWordlist.length;
                case 'ai_agent':
                    return aiWordlistSize; // This is a target, the real number is dynamic
                case 'bruteforce':
                    let charset = '';
                    if (bruteForceOpts.useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
                    if (bruteForceOpts.useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    if (bruteForceOpts.useDigits) charset += '0123456789';
                    if (bruteForceOpts.useSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
                    return calculateTotalCombinations(charset, bruteForceOpts.maxLength);
                case 'mask':
                    return calculateMaskCombinations(mask);
                case 'hybrid':
                     return processedWordlist.length * calculateMaskCombinations(mask);
                case 'rulebased':
                    return 0; // Dynamic, so we don't show a total
                default:
                    return 0;
            }
        } catch (e) {
            return Infinity;
        }
    }, [attackMode, processedWordlist, bruteForceOpts, mask, aiWordlistSize, isCracking]);
    
    const displayTotal = attackMode === 'ai_agent' ? dynamicTotal : totalCombinations;


    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Hash Cracker & Verifier</h2>
            <p className="text-gray-400 mb-6 text-sm">Demonstrates attacks against common hash algorithms and verifies hashes.</p>
            
            <div className="p-4 mb-6 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                <strong>For Educational Use Only:</strong> This tool is for learning purposes to understand password vulnerability. Do not use it for malicious activities.
            </div>

            {savedStateExists && !isCracking && (
                <div className="p-3 mb-6 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200 text-sm flex justify-between items-center">
                    <span>An incomplete attack session was found.</span>
                    <div>
                        <button onClick={handleResume} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded-md text-sm">Resume</button>
                        <button onClick={clearSavedState} className="bg-red-700 hover:bg-red-800 text-white font-bold py-1 px-3 rounded-md text-sm ml-2">Clear</button>
                    </div>
                </div>
             )}

            <div className="p-1.5 mb-6 bg-gray-900/50 rounded-xl flex flex-wrap gap-1">
                <AttackModeButton label="Dictionary" value="dictionary" />
                <AttackModeButton label="Brute-Force" value="bruteforce" />
                <AttackModeButton label="Mask" value="mask" />
                <AttackModeButton label="Hybrid" value="hybrid" />
                <AttackModeButton label="Rule-Based" value="rulebased" />
                <AttackModeButton label="AI Agent Attack" value="ai_agent" />
                <AttackModeButton label="Verify" value="verification" />
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="target-hash" className="block text-sm font-medium text-gray-300 mb-2">Target Hash</label>
                        <input type="text" id="target-hash" placeholder="e.g., 5f4dcc3b5aa765d61d8327deb882cf99" value={targetHash} onChange={(e) => setTargetHash(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 font-mono text-sm" />
                    </div>
                    <div>
                        <label htmlFor="hash-algorithm" className="block text-sm font-medium text-gray-300 mb-2">Algorithm</label>
                        <select id="hash-algorithm" value={algorithm} onChange={(e) => setAlgorithm(e.target.value as HashAlgorithm)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2">
                            <option value="MD5">MD5 (Weak)</option>
                            <option value="SHA-1">SHA-1 (Weak)</option>
                            <option value="SHA-256">SHA-256 (OK)</option>
                            <option value="SHA-512">SHA-512 (Good)</option>
                        </select>
                    </div>
                </div>

                {renderAttackSettings()}
                
                {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
                
                {displayTotal > 0 && !isCracking && (
                    <div className="p-3 bg-gray-900/50 rounded-lg text-center text-sm">
                        <span className="text-gray-400">
                            {attackMode === 'ai_agent' ? 'Final Attack Size: ' : 'Total Combinations to Check: '}
                        </span>
                        <span className="font-bold text-white">{isFinite(displayTotal) ? displayTotal.toLocaleString() : 'Effectively Infinite'}</span>
                    </div>
                )}
                
                <div className="pt-4 border-t border-gray-700">
                    {attackMode === 'verification' ? (
                        <button onClick={handleVerify} disabled={isCracking} className="w-full font-bold py-3 px-4 rounded-lg transition-colors text-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-600">
                            Verify Password
                        </button>
                    ) : (
                        isCracking ? (
                            <button onClick={stopCracking} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg">
                                Stop Attack
                            </button>
                        ) : (
                            <button onClick={() => startCracking()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg">
                                {attackMode === 'ai_agent' ? 'Start AI Agent Attack' : 'Start Attack'}
                            </button>
                        )
                    )}

                    {verificationResult && (
                        <div className={`mt-4 p-4 rounded-lg text-center font-bold ${
                            verificationResult === 'match' ? 'bg-green-900/50 text-green-300' :
                            verificationResult === 'no_match' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300'
                        }`}>
                            {verificationResult === 'match' && '✅ HASH MATCH'}
                            {verificationResult === 'no_match' && '❌ HASH DOES NOT MATCH'}
                        </div>
                    )}
                </div>

                {(isCracking || statusMessage) && (
                     <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Attack Status</h3>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">{statusMessage}</span></div>
                                <div className="text-right"><span className="text-xs font-semibold inline-block text-blue-300">{progress.toFixed(2)}%</span></div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                                <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                             <div className="bg-gray-900/50 p-3 rounded-lg"><span className="text-gray-400 text-sm">Hashes/sec: </span><span className="font-bold text-white">{Math.round(hashesPerSecond).toLocaleString()}</span></div>
                             <div className="bg-gray-900/50 p-3 rounded-lg"><span className="text-gray-400 text-sm">ETA: </span><span className="font-bold text-white">{eta}</span></div>
                        </div>
                    </div>
                )}
                 {foundPassword && (
                    <div className="p-6 bg-green-900/50 border border-green-700 rounded-lg text-center">
                        <h3 className="text-xl font-bold text-green-300 mb-2">Password Found!</h3>
                        <p className="text-2xl font-mono bg-gray-900 p-3 rounded-md text-white inline-block">{foundPassword}</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default HashCracker;