import React, { useState, useMemo } from 'react';

interface AnalysisResult {
    password: string;
    length: number;
    poolSize: number;
    entropy: number;
    timeToCrack: { value: string; color: string; seconds: number };
}

const formatTime = (seconds: number): { value: string; color: string; seconds: number } => {
    if (!isFinite(seconds) || seconds > 1e30) return { value: 'Effectively infinite', color: 'text-emerald-400', seconds: Infinity };

    const MINUTE = 60;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    const YEAR = DAY * 365.25;
    const CENTURY = YEAR * 100;
    const MILLENNIUM = CENTURY * 10;

    if (seconds < 1) return { value: `${(seconds * 1000).toFixed(0)} ms`, color: 'text-red-400', seconds };
    if (seconds < MINUTE) return { value: `${seconds.toFixed(2)} sec`, color: 'text-red-400', seconds };
    if (seconds < HOUR) return { value: `${(seconds / MINUTE).toFixed(2)} min`, color: 'text-orange-400', seconds };
    if (seconds < DAY) return { value: `${(seconds / HOUR).toFixed(2)} hours`, color: 'text-yellow-400', seconds };
    if (seconds < YEAR) return { value: `${(seconds / DAY).toFixed(2)} days`, color: 'text-lime-400', seconds };
    if (seconds < CENTURY) return { value: `${(seconds / YEAR).toFixed(2)} years`, color: 'text-green-400', seconds };
    if (seconds < MILLENNIUM) return { value: `${(seconds / CENTURY).toFixed(2)} centuries`, color: 'text-emerald-400', seconds };
    return { value: `${(seconds / MILLENNIUM).toFixed(2)} millennia`, color: 'text-emerald-400', seconds };
};

const formatHashRate = (rate: number): string => {
    if (rate >= 1e12) return `${(rate / 1e12).toFixed(1)} Trillion H/s`;
    if (rate >= 1e9) return `${(rate / 1e9).toFixed(1)} Billion H/s`;
    if (rate >= 1e6) return `${(rate / 1e6).toFixed(1)} Million H/s`;
    return `${rate.toLocaleString()} H/s`;
};

const hashRatePresets = [
    { name: 'Mid-range GPU', rate: 5e9 },
    { name: 'High-end GPU', rate: 70e9 },
    { name: 'Cloud Cluster', rate: 1e12 },
];

const EntropyAnalyzer: React.FC = () => {
    const [passwords, setPasswords] = useState<string>('password\n123456\nCorrectHorseBatteryStaple\nP@ssw0rd123!\nThisIsA-Very-Secure-Password-I-Think-1998');
    const [hashRate, setHashRate] = useState<number>(hashRatePresets[0].rate); 
    const [sortConfig, setSortConfig] = useState<{ key: keyof AnalysisResult; direction: 'asc' | 'desc' } | null>({ key: 'entropy', direction: 'asc' });

    const analysisResults: AnalysisResult[] = useMemo(() => {
        const passwordList = passwords.split(/\r?\n/).filter(p => p.trim() !== '');
        
        return passwordList.map(password => {
            let poolSize = 0;
            if (/[a-z]/.test(password)) poolSize += 26;
            if (/[A-Z]/.test(password)) poolSize += 26;
            if (/[0-9]/.test(password)) poolSize += 10;
            if (/[\W_]/.test(password)) poolSize += 32;

            const entropy = password.length * Math.log2(poolSize || 1);
            const combinations = 2 ** entropy;
            const timeInSeconds = combinations / hashRate;
            const timeToCrack = formatTime(timeInSeconds);

            return { password, length: password.length, poolSize, entropy, timeToCrack };
        });
    }, [passwords, hashRate]);

    const sortedResults = useMemo(() => {
        let sortableItems = [...analysisResults];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: number | string, bValue: number | string;
                if (sortConfig.key === 'timeToCrack') {
                    aValue = a.timeToCrack.seconds;
                    bValue = b.timeToCrack.seconds;
                } else if (sortConfig.key === 'password') {
                     aValue = a.password;
                     bValue = b.password;
                } else {
                    aValue = a[sortConfig.key] as number;
                    bValue = b[sortConfig.key] as number;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [analysisResults, sortConfig]);

    const summary = useMemo(() => {
        if (analysisResults.length === 0) return null;

        const totalEntropy = analysisResults.reduce((sum, r) => sum + r.entropy, 0);
        const weakest = analysisResults.reduce((min, r) => r.entropy < min.entropy ? r : min, analysisResults[0]);
        const strongest = analysisResults.reduce((max, r) => r.entropy > max.entropy ? r : max, analysisResults[0]);

        return {
            count: analysisResults.length,
            averageEntropy: (totalEntropy / analysisResults.length).toFixed(2),
            weakest,
            strongest,
        };
    }, [analysisResults]);

    const requestSort = (key: keyof AnalysisResult) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey }: { label: string; sortKey: keyof AnalysisResult }) => (
        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                <span>{label}</span>
                {sortConfig?.key === sortKey && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                )}
            </div>
        </th>
    );
    
     const SummaryCard = ({ label, value, subValue, valueColor }: { label: string; value: string; subValue?: string; valueColor?: string }) => (
        <div className="bg-gray-900/50 p-4 rounded-lg flex-1">
            <h4 className="text-sm text-gray-400">{label}</h4>
            <p className={`text-xl font-bold ${valueColor || 'text-white'}`}>{value}</p>
            {subValue && <p className="text-xs text-gray-500 truncate">{subValue}</p>}
        </div>
    );

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Password Entropy & Time-to-Crack</h2>
            <p className="text-gray-400 mb-6 text-sm">Estimate the time required for a brute-force attack on a list of passwords.</p>

            <div className="space-y-6">
                <div>
                    <label htmlFor="passwords-to-analyze" className="block text-sm font-medium text-gray-300 mb-2">Passwords to Analyze (one per line)</label>
                    <textarea
                        id="passwords-to-analyze"
                        placeholder="Enter passwords, each on a new line"
                        value={passwords}
                        onChange={(e) => setPasswords(e.target.value)}
                        rows={6}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="hash-rate" className="block text-sm font-medium text-gray-300 mb-2">Attacker's Hash Rate (Hashes/sec)</label>
                    <input
                        id="hash-rate"
                        type="number"
                        step="1e9"
                        min="1"
                        value={hashRate}
                        onChange={(e) => setHashRate(Number(e.target.value) || 1)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white font-mono focus:ring-blue-500 focus:border-blue-500"
                    />
                     <div className="flex flex-wrap gap-2 mt-2">
                        {hashRatePresets.map(preset => (
                            <button key={preset.name} onClick={() => setHashRate(preset.rate)} className={`px-3 py-1 text-xs rounded-full transition-colors ${hashRate === preset.rate ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
                                {preset.name}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Currently: <span className="font-semibold">{formatHashRate(hashRate)}</span></p>
                </div>

                {summary && (
                    <div className="pt-4 border-t border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-3">Analysis Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <SummaryCard label="Passwords Analyzed" value={summary.count.toLocaleString()} />
                            <SummaryCard label="Average Entropy" value={`${summary.averageEntropy} bits`} />
                            <SummaryCard label="Weakest Password" value={`${summary.weakest.entropy.toFixed(2)} bits`} subValue={summary.weakest.password} valueColor={summary.weakest.timeToCrack.color} />
                            <SummaryCard label="Strongest Password" value={`${summary.strongest.entropy.toFixed(2)} bits`} subValue={summary.strongest.password} valueColor={summary.strongest.timeToCrack.color} />
                        </div>
                    </div>
                )}
                
                {sortedResults.length > 0 && (
                     <div className="pt-4 border-t border-gray-700">
                         <h3 className="text-lg font-semibold text-white mb-3">Detailed Results</h3>
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-900/50">
                                    <tr>
                                        <SortableHeader label="Password" sortKey="password" />
                                        <SortableHeader label="Length" sortKey="length" />
                                        <SortableHeader label="Entropy (bits)" sortKey="entropy" />
                                        <SortableHeader label="Time to Crack" sortKey="timeToCrack" />
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {sortedResults.map((result, index) => (
                                        <tr key={`${result.password}-${index}`} className="hover:bg-gray-700/50">
                                            <td className="px-4 py-3 whitespace-nowrap"><span className="font-mono text-sm text-gray-300">{result.password}</span></td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center">{result.length}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center">{result.entropy.toFixed(2)}</td>
                                            <td className={`px-4 py-3 whitespace-nowrap text-sm ${result.timeToCrack.color}`}>{result.timeToCrack.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EntropyAnalyzer;