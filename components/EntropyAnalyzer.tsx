import React, { useState, useMemo } from 'react';

const formatTime = (seconds: number): { value: string; color: string } => {
    if (!isFinite(seconds) || seconds > 1e30) return { value: 'Effectively infinite', color: 'text-emerald-400' };

    const MINUTE = 60;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    const YEAR = DAY * 365.25;
    const CENTURY = YEAR * 100;
    const MILLENNIUM = CENTURY * 10;

    if (seconds < 1) return { value: `${(seconds * 1000).toFixed(0)} milliseconds`, color: 'text-red-400' };
    if (seconds < MINUTE) return { value: `${seconds.toFixed(2)} seconds`, color: 'text-red-400' };
    if (seconds < HOUR) return { value: `${(seconds / MINUTE).toFixed(2)} minutes`, color: 'text-orange-400' };
    if (seconds < DAY) return { value: `${(seconds / HOUR).toFixed(2)} hours`, color: 'text-yellow-400' };
    if (seconds < YEAR) return { value: `${(seconds / DAY).toFixed(2)} days`, color: 'text-lime-400' };
    if (seconds < CENTURY) return { value: `${(seconds / YEAR).toFixed(2)} years`, color: 'text-green-400' };
    if (seconds < MILLENNIUM) return { value: `${(seconds / CENTURY).toFixed(2)} centuries`, color: 'text-emerald-400' };
    return { value: `${(seconds / MILLENNIUM).toFixed(2)} millennia`, color: 'text-emerald-400' };
};

const EntropyAnalyzer: React.FC = () => {
    const [password, setPassword] = useState<string>('');
    const [hashRate, setHashRate] = useState<number>(5e9); // 5 billion hashes/sec

    const analysis = useMemo(() => {
        if (!password) {
            return { poolSize: 0, entropy: 0, combinations: '0', timeToCrack: { value: 'N/A', color: 'text-gray-400' } };
        }

        let poolSize = 0;
        if (/[a-z]/.test(password)) poolSize += 26;
        if (/[A-Z]/.test(password)) poolSize += 26;
        if (/[0-9]/.test(password)) poolSize += 10;
        if (/[\W_]/.test(password)) poolSize += 32; // Common symbol count

        const entropy = password.length * Math.log2(poolSize || 1);
        
        // Use BigInt for combinations to avoid overflow with large entropy values
        const combinations = BigInt(2) ** BigInt(Math.floor(entropy));
        
        const timeInSeconds = Number(combinations) / hashRate;
        const timeToCrack = formatTime(timeInSeconds);
        
        return { poolSize, entropy, combinations: combinations.toLocaleString(), timeToCrack };
    }, [password, hashRate]);

    const ResultRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
        <div className="flex justify-between items-center py-3 px-4 bg-gray-900/50 rounded-lg">
            <span className="text-gray-300">{label}</span>
            <span className={`font-mono font-bold text-right ${valueColor || 'text-cyan-400'}`}>{value}</span>
        </div>
    );

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Password Entropy & Time-to-Crack</h2>
            <p className="text-gray-400 mb-6 text-sm">Estimate the time required for a brute-force attack.</p>

            <div className="space-y-6">
                <div>
                    <label htmlFor="password-to-analyze" className="block text-sm font-medium text-gray-300 mb-2">Password to Analyze</label>
                    <input
                        id="password-to-analyze"
                        type="password"
                        placeholder="Enter a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="hash-rate" className="block text-sm font-medium text-gray-300 mb-2">Attacker's Hash Rate (Hashes/sec)</label>
                    <input
                        id="hash-rate"
                        type="text"
                        value={hashRate.toExponential(2)}
                        onChange={(e) => setHashRate(Number(e.target.value) || 1)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white font-mono focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Example: 5e9 = 5 billion. High-end GPU clusters can exceed 1e12 (1 trillion).</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-700">
                    <ResultRow label="Password Length" value={password.length.toString()} />
                    <ResultRow label="Character Pool Size" value={analysis.poolSize.toString()} />
                    <ResultRow label="Entropy (bits)" value={analysis.entropy.toFixed(2)} />
                    <ResultRow label="Possible Combinations" value={analysis.combinations} />
                    <ResultRow label="Estimated Time to Crack" value={analysis.timeToCrack.value} valueColor={analysis.timeToCrack.color} />
                </div>
            </div>
        </div>
    );
};

export default EntropyAnalyzer;
