import React, { useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { hashWord, HashAlgorithm } from '../utils/hashing';

interface CollisionResult {
    totalWords: number;
    uniqueHashes: number;
    collisions: number;
    collisionDetails: Record<string, string[]>;
}

type AnalysisReport = Record<HashAlgorithm, CollisionResult>;

const HashCollisionAnalyzer: React.FC = () => {
    const [inputList, setInputList] = useState('password\n123456\nadmin\nqwerty\n123456789\npassword123\nfootball\niloveyou\ndragon\n111111');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [error, setError] = useState('');

    const analyzeCollisions = useCallback(async () => {
        const words = inputList.split(/\r?\n/).filter(w => w.trim() !== '');
        if (words.length === 0) {
            setError('Please provide a list of words to analyze.');
            return;
        }

        setIsAnalyzing(true);
        setError('');
        setReport(null);
        await new Promise(resolve => setTimeout(resolve, 50)); // Allow UI to update

        try {
            const algorithms: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];
            const newReport: Partial<AnalysisReport> = {};

            for (const alg of algorithms) {
                const hashMap = new Map<string, string[]>();
                const hashPromises = words.map(word => hashWord(word, alg));
                const hashes = await Promise.all(hashPromises);

                words.forEach((word, index) => {
                    const hash = hashes[index];
                    if (!hashMap.has(hash)) {
                        hashMap.set(hash, []);
                    }
                    hashMap.get(hash)!.push(word);
                });

                const collisionDetails: Record<string, string[]> = {};
                let collisionCount = 0;
                hashMap.forEach((wordList, hash) => {
                    if (wordList.length > 1) {
                        collisionDetails[hash] = wordList;
                        collisionCount++;
                    }
                });

                newReport[alg] = {
                    totalWords: words.length,
                    uniqueHashes: hashMap.size,
                    collisions: collisionCount,
                    collisionDetails,
                };
            }
            setReport(newReport as AnalysisReport);
        } catch (e: any) {
            setError(`An error occurred during analysis: ${e.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    }, [inputList]);
    
    const chartData = useMemo(() => {
        if (!report) return [];
        // FIX: Use Object.keys with type assertion to iterate over the report and fix type inference issues.
        return (Object.keys(report) as HashAlgorithm[]).map((name) => ({
            name,
            'Unique Hashes': report[name].uniqueHashes,
            'Total Words': report[name].totalWords,
        }));
    }, [report]);

    const ResultCard = ({ alg, data }: { alg: string, data: CollisionResult }) => (
        <div className="bg-gray-900/50 p-4 rounded-lg flex-1">
            <h4 className="font-bold text-lg text-white">{alg}</h4>
            <p className="text-sm text-gray-400">Unique Hashes: <span className="font-mono text-gray-200">{data.uniqueHashes.toLocaleString()}</span></p>
            <p className={`text-sm ${data.collisions > 0 ? 'text-red-400' : 'text-green-400'}`}>
                Collisions Found: <span className="font-mono">{data.collisions.toLocaleString()}</span>
            </p>
        </div>
    );

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Hash Collision Analyzer</h2>
            <p className="text-gray-400 mb-6 text-sm">Visualize the collision resistance of different hashing algorithms.</p>
            
            <div className="p-4 mb-6 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200 text-sm">
                <strong>Demonstration:</strong> MD5 and SHA-1 are cryptographically broken due to their known vulnerabilities to collision attacks. This tool helps demonstrate why stronger algorithms like SHA-256 are necessary.
            </div>

            <div className="space-y-6">
                 <div>
                    <label htmlFor="collision-input" className="block text-sm font-medium text-gray-300 mb-2">Input List (one item per line)</label>
                    <textarea
                        id="collision-input"
                        placeholder="Paste a list of words or phrases here..."
                        value={inputList}
                        onChange={(e) => setInputList(e.target.value)}
                        rows={8}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                </div>

                <button
                    onClick={analyzeCollisions}
                    disabled={isAnalyzing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                >
                     {isAnalyzing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                        </>
                    ) : 'Analyze for Collisions'}
                </button>
                
                {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
                
                {report && (
                    <div className="space-y-6 pt-4 border-t border-gray-700">
                        <h3 className="text-xl font-bold text-white">Analysis Report</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* FIX: Use Object.keys with type assertion to iterate over the report and fix type inference issues. */}
                            {(Object.keys(report) as HashAlgorithm[]).map((alg) => <ResultCard key={alg} alg={alg} data={report[alg]} />)}
                        </div>
                        
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-3">Unique Hash Comparison</h4>
                             <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                        <XAxis dataKey="name" stroke="#A0AEC0" />
                                        <YAxis stroke="#A0AEC0" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                                        <Legend />
                                        <Bar dataKey="Unique Hashes" fill="#4299E1" />
                                        <Bar dataKey="Total Words" fill="#4A5568" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* FIX: Use Object.values with type assertion for a cleaner check and to fix type inference issues. */}
                        {(Object.values(report) as CollisionResult[]).some((data) => data.collisions > 0) && (
                            <div>
                                <h4 className="text-lg font-semibold text-white mb-3">Collision Details</h4>
                                <div className="space-y-4">
                                {/* FIX: Use Object.keys with type assertion to iterate over the report and fix type inference issues. */}
                                {(Object.keys(report) as HashAlgorithm[]).map((alg) => {
                                    const data = report[alg];
                                    return (
                                        data.collisions > 0 && (
                                            <div key={alg} className="bg-gray-900/50 p-4 rounded-lg">
                                                <h5 className="font-bold text-red-400 mb-2">{alg} Collisions:</h5>
                                                <div className="space-y-2">
                                                    {Object.entries(data.collisionDetails).map(([hash, words]) => (
                                                        <div key={hash} className="text-sm">
                                                            <p className="font-mono text-gray-400 truncate">Hash: {hash}</p>
                                                            <p className="font-mono text-gray-200 ml-4">Words: {JSON.stringify(words)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    );
                                })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HashCollisionAnalyzer;
