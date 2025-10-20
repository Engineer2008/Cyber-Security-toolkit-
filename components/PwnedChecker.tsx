import React, { useState, useCallback } from 'react';

// Helper function to convert ArrayBuffer to hex string
const bufferToHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

interface PwnedResult {
    isPwned: boolean;
    count: number;
}

const PwnedChecker: React.FC = () => {
    const [password, setPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<PwnedResult | null>(null);
    const [error, setError] = useState<string>('');

    const checkPwnedStatus = useCallback(async () => {
        if (!password) {
            setError('Please enter a password to check.');
            return;
        }

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            // 1. Hash the password with SHA-1 (required by the HIBP API)
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
            const hashHex = bufferToHex(hashBuffer).toUpperCase();
            
            // 2. Split hash for k-anonymity
            const prefix = hashHex.substring(0, 5);
            const suffix = hashHex.substring(5);

            // 3. Query the HIBP API
            const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }
            const text = await response.text();

            // 4. Check the response for the hash suffix
            const lines = text.split('\r\n');
            let found = false;
            for (const line of lines) {
                const [hashSuffix, countStr] = line.split(':');
                if (hashSuffix === suffix) {
                    setResult({ isPwned: true, count: parseInt(countStr, 10) });
                    found = true;
                    break;
                }
            }

            if (!found) {
                setResult({ isPwned: false, count: 0 });
            }

        } catch (e: any) {
            console.error("Pwned Check failed:", e);
            setError(`An error occurred: ${e.message || 'Could not connect to the API.'}`);
        } finally {
            setIsLoading(false);
        }
    }, [password]);

    const ResultDisplay = () => {
        if (!result) return null;

        if (result.isPwned) {
            return (
                <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                    <h3 className="text-xl font-bold mb-2">Oh no — pwned!</h3>
                    <p>This password has been seen <strong className="font-bold text-white">{result.count.toLocaleString()}</strong> times in data breaches.</p>
                    <p className="mt-2">It is highly recommended that you <strong className="font-bold">do not use this password</strong> for any account.</p>
                </div>
            );
        }

        return (
            <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-200">
                <h3 className="text-xl font-bold mb-2">Good news — no pwnage found!</h3>
                <p>This password was not found in any of the Pwned Passwords data breaches.</p>
            </div>
        );
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Pwned Password Check</h2>
            <p className="text-gray-400 mb-6 text-sm">Check if a password has appeared in a data breach.</p>

            <div className="p-4 mb-6 bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200 text-sm">
                <strong>How it works:</strong> This tool uses a technique called <a href="https://haveibeenpwned.com/API/v3#PwnedPasswords" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">k-anonymity</a>, which allows your password to be checked without ever sending the full password to any server.
            </div>
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="password"
                        placeholder="Enter password to check"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-grow w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        onClick={checkPwnedStatus}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                         {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Checking...
                            </>
                        ) : 'Check Password'}
                    </button>
                </div>
                
                {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
                
                {result && <ResultDisplay />}
            </div>
        </div>
    );
};

export default PwnedChecker;