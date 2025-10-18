import React, { useState, useCallback } from 'react';
import { CopyIcon, CheckIcon } from './icons';

// Helper function to convert ArrayBuffer to hex string
const bufferToHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

type HashAlgorithm = 'SHA-256' | 'SHA-512';

const PasswordHasher: React.FC = () => {
    const [password, setPassword] = useState<string>('');
    const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
    const [salt, setSalt] = useState<string>('');
    const [hashedKey, setHashedKey] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [saltCopied, setSaltCopied] = useState<boolean>(false);
    const [hashCopied, setHashCopied] = useState<boolean>(false);

    const handleCopy = (text: string, type: 'salt' | 'hash') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        if (type === 'salt') {
            setSaltCopied(true);
            setTimeout(() => setSaltCopied(false), 2000);
        } else {
            setHashCopied(true);
            setTimeout(() => setHashCopied(false), 2000);
        }
    };

    const hashPassword = useCallback(async () => {
        if (!password) {
            setError('Password cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSalt('');
        setHashedKey('');
        
        try {
            // 1. Generate a salt
            const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
            setSalt(bufferToHex(saltBytes));

            // 2. Encode the password
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);

            // 3. Import key for PBKDF2
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );
            
            // 4. Derive key using PBKDF2
            const iterations = 260000;
            const keyLength = algorithm === 'SHA-256' ? 256 : 512;
            const derivedBits = await window.crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: saltBytes,
                    iterations: iterations,
                    hash: algorithm
                },
                keyMaterial,
                keyLength // key length in bits
            );

            setHashedKey(bufferToHex(derivedBits));

        } catch (e) {
            console.error("Hashing failed:", e);
            setError('An error occurred during hashing. Check the console for details.');
        } finally {
            setIsLoading(false);
        }

    }, [password, algorithm]);

    const ResultDisplay = ({ label, value, isCopied, onCopy }: { label: string; value: string; isCopied: boolean; onCopy: () => void; }) => (
        <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-1">{label}</h4>
            <div className="relative">
                <p className="w-full bg-gray-900 p-3 pr-12 rounded-md font-mono text-sm text-green-400 break-all">{value || '...'}</p>
                {value && (
                    <button onClick={onCopy} className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-white transition-colors">
                        {isCopied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Secure Password Hasher</h2>
            <p className="text-gray-400 mb-6 text-sm">Demonstrating PBKDF2 for secure password storage.</p>
            
            <div className="p-4 mb-6 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200 text-sm">
                <strong>Important:</strong> This is a client-side demonstration only. In a real application, password hashing and verification **must** be performed on a secure backend server. Never trust the client with this process.
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="password-to-hash" className="block text-sm font-medium text-gray-300 mb-2">Password to Hash</label>
                        <input type="password" id="password-to-hash" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                     <div>
                        <label htmlFor="hash-algorithm" className="block text-sm font-medium text-gray-300 mb-2">Algorithm (PBKDF2)</label>
                        <select id="hash-algorithm" value={algorithm} onChange={(e) => setAlgorithm(e.target.value as HashAlgorithm)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500">
                            <option value="SHA-256">SHA-256</option>
                            <option value="SHA-512">SHA-512</option>
                        </select>
                    </div>
                </div>
                 <div className="p-3 bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200 text-xs">
                    <strong>Note:</strong> For modern applications, password hashing algorithms like <strong>Argon2</strong> or <strong>bcrypt</strong> are recommended over PBKDF2. They are not included here as they are not supported by the standard browser Web Crypto API.
                </div>
                
                <button
                    onClick={hashPassword}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Hashing...
                        </>
                    ) : 'Hash Password'}
                </button>

                {error && <p className="text-red-400 text-center">{error}</p>}

                {(salt || hashedKey) && (
                    <div className="space-y-4 pt-4 border-t border-gray-700">
                        <ResultDisplay label="Generated Salt (16 bytes)" value={salt} isCopied={saltCopied} onCopy={() => handleCopy(salt, 'salt')} />
                        <ResultDisplay label={`Hashed Key (PBKDF2-${algorithm})`} value={hashedKey} isCopied={hashCopied} onCopy={() => handleCopy(hashedKey, 'hash')} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PasswordHasher;