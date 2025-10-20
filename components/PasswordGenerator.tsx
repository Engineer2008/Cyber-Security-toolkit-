import React, { useState, useCallback } from 'react';
import { CopyIcon, CheckIcon } from './icons';

// FIX: Explicitly type PasswordHistoryItem with React.FC to resolve issue with 'key' prop type checking.
const PasswordHistoryItem: React.FC<{ password: string }> = ({ password }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
            <span className="font-mono text-sm text-gray-300 truncate pr-2">{password}</span>
            <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
            </button>
        </div>
    );
};


const PasswordGenerator: React.FC = () => {
    const [length, setLength] = useState<number>(16);
    const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
    const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
    const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
    const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
    const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [history, setHistory] = useState<string[]>([]);
    const [copied, setCopied] = useState<boolean>(false);

    const generatePassword = useCallback(() => {
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
        
        let charPool = '';
        if (includeUppercase) charPool += upper;
        if (includeLowercase) charPool += lower;
        if (includeNumbers) charPool += numbers;
        if (includeSymbols) charPool += symbols;

        if (excludeAmbiguous) {
            const ambiguousChars = 'Il1O0';
            charPool = Array.from(charPool).filter(c => !ambiguousChars.includes(c)).join('');
        }

        if (charPool.length === 0) {
            setPassword('Please select at least one character type.');
            return;
        }

        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);
        let newPassword = '';
        for (let i = 0; i < length; i++) {
            newPassword += charPool[array[i] % charPool.length];
        }
        
        setPassword(newPassword);
        setHistory(prev => [newPassword, ...prev].slice(0, 5));
        setCopied(false);

    }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous]);
    
    const handleCopy = () => {
        if(password && password.length > 0 && !password.startsWith("Please select")) {
            navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const OptionCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
        <label className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
            <input type="checkbox" checked={checked} onChange={onChange} className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800" />
            <span className="text-gray-200">{label}</span>
        </label>
    );

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Secure Password Generator</h2>
            
            <div className="space-y-6">
                <div className="relative">
                    <input
                        readOnly
                        value={password}
                        placeholder="Your secure password will appear here"
                        className="w-full bg-gray-900 text-green-400 font-mono p-4 pr-12 rounded-md border border-gray-700 focus:outline-none"
                    />
                    <button onClick={handleCopy} className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-white transition-colors">
                        {copied ? <CheckIcon className="h-6 w-6 text-green-500" /> : <CopyIcon className="h-6 w-6" />}
                    </button>
                </div>

                <div>
                    <label htmlFor="length" className="block text-sm font-medium text-gray-300 mb-2">Password Length: {length}</label>
                    <input
                        type="range"
                        id="length"
                        min="8"
                        max="64"
                        value={length}
                        onChange={(e) => setLength(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <OptionCheckbox label="Include Uppercase (A-Z)" checked={includeUppercase} onChange={() => setIncludeUppercase(!includeUppercase)} />
                    <OptionCheckbox label="Include Lowercase (a-z)" checked={includeLowercase} onChange={() => setIncludeLowercase(!includeLowercase)} />
                    <OptionCheckbox label="Include Numbers (0-9)" checked={includeNumbers} onChange={() => setIncludeNumbers(!includeNumbers)} />
                    <OptionCheckbox label="Include Symbols (!@#...)" checked={includeSymbols} onChange={() => setIncludeSymbols(!includeSymbols)} />
                    <OptionCheckbox label="Exclude Ambiguous (I, l, 1, O, 0)" checked={excludeAmbiguous} onChange={() => setExcludeAmbiguous(!excludeAmbiguous)} />
                </div>

                <button
                    onClick={generatePassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg"
                >
                    Generate Password
                </button>

                {history.length > 0 && (
                     <div className="pt-4 border-t border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-3">History</h3>
                        <div className="space-y-2">
                            {history.map((p, i) => (
                                <PasswordHistoryItem key={`${i}-${p}`} password={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PasswordGenerator;