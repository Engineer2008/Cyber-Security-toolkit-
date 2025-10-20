import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';

interface SSLResult {
    analysis: string;
    sources: any[];
}

interface BreachInfo {
    isPwned: boolean | null; // null for indeterminate status
    details: string;
}

const SSLChecker: React.FC = () => {
    const [domain, setDomain] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<SSLResult | null>(null);
    const [breachInfo, setBreachInfo] = useState<BreachInfo | null>(null);
    const [error, setError] = useState<string>('');

    const checkSSL = useCallback(async () => {
        if (!domain) {
            setError('Please enter a domain name.');
            return;
        }
        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
        if (!domainRegex.test(domain)) {
            setError('Please enter a valid domain name (e.g., example.com).');
            return;
        }

        setIsLoading(true);
        setError('');
        setResult(null);
        setBreachInfo(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Perform two tasks for the domain "${domain}".

TASK 1: SSL/TLS ANALYSIS
Analyze the SSL/TLS configuration. Use your search capabilities to fetch current best practices. Provide a detailed analysis including a score, summary, and recommendations.

TASK 2: DATA BREACH CHECK
Use Google Search to check if the domain "${domain}" has been involved in any publicly known data breaches. Specifically reference data from "Have I Been Pwned" as the primary source if available.

FORMAT YOUR RESPONSE STRICTLY AS FOLLOWS, using "---" as a separator:
**Overall Score:** [score out of 100]
**Summary:**
[A brief, one-paragraph summary of the configuration's security posture.]
**Recommendations:**
- [Detailed recommendation 1]
- [Detailed recommendation 2]
---
**Breach Status:** [e.g., "Clear: No breaches found for this domain via Have I Been Pwned.", or "Pwned! This domain was part of the following breaches: ..."]`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });
            
            const fullText = response.text;
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            
            if (!fullText) {
                throw new Error("Received an empty response from the AI. The domain might be inaccessible or the service is down.");
            }

            const parts = fullText.split('---');
            const analysisPart = parts[0]?.trim() || '';
            const breachPart = parts[1]?.trim() || '';

            const breachStatusLine = breachPart.split('\n').find(line => line.startsWith('**Breach Status:**'));
            if (breachStatusLine) {
                const details = breachStatusLine.replace('**Breach Status:**', '').trim();
                const isPwned = details.toLowerCase().startsWith('pwned');
                setBreachInfo({ isPwned, details });
            } else {
                setBreachInfo({ isPwned: null, details: "Could not determine breach status from the AI response." });
            }

            setResult({ analysis: analysisPart, sources });

        } catch (e: any) {
            console.error("SSL Check failed:", e);
            if (e.message?.includes('API key')) {
                setError('SSL check failed. Please ensure your API key is correctly configured and valid.');
            } else {
                setError(`An error occurred: ${e.message || 'Please check the console for details.'}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [domain]);
    
    const renderAnalysis = (analysisText: string) => {
        const lines = analysisText.split('\n').filter(line => line.trim() !== '');
        return lines.map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
                const content = line.replace(/\*\*/g, '');
                const colonIndex = content.indexOf(':');
                
                if (colonIndex !== -1) {
                    const title = content.substring(0, colonIndex).trim();
                    let value = content.substring(colonIndex + 1).trim();

                    if (title === "Overall Score") {
                        const score = parseInt(value, 10);
                        let color = 'text-gray-300';
                        if (score >= 90) color = 'text-green-400';
                        else if (score >= 70) color = 'text-yellow-400';
                        else color = 'text-red-400';
                        return <h4 key={i} className="text-lg font-bold text-white mt-4 mb-2">{title}: <span className={color}>{value}</span></h4>
                    }
                }
                
                return <h4 key={i} className="text-lg font-bold text-white mt-4 mb-2">{content}</h4>;
            }
            if (line.startsWith('- ')) {
                return <li key={i} className="ml-5 list-disc text-gray-300">{line.substring(2)}</li>;
            }
            return <p key={i} className="text-gray-300 my-2">{line}</p>;
        });
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">SSL/TLS & Domain Breach Checker</h2>
            <p className="text-gray-400 mb-6 text-sm">Analyze a domain's security certificate and check for public data breaches.</p>
            
             <div className="p-4 mb-6 bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200 text-sm">
                <strong>Powered by Gemini & Google Search:</strong> This tool uses AI with real-time web search to provide recommendations based on the latest security best practices and breach data.
            </div>
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="e.g., example.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="flex-grow w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        onClick={checkSSL}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                         {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : 'Analyze Domain'}
                    </button>
                </div>
                
                 {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}

                {(result || breachInfo) && (
                     <div className="space-y-6 pt-4 border-t border-gray-700">
                        {breachInfo && (
                             <div>
                                <h3 className="text-lg font-bold text-white mb-2">Data Breach Check</h3>
                                <div className={`p-4 rounded-lg ${
                                    breachInfo.isPwned === true ? 'bg-red-900/50 border border-red-700 text-red-200' :
                                    breachInfo.isPwned === false ? 'bg-green-900/50 border border-green-700 text-green-200' :
                                    'bg-gray-700 border border-gray-600 text-gray-300'
                                }`}>
                                    <p>{breachInfo.details}</p>
                                </div>
                            </div>
                        )}
                        {result && result.analysis && (
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">SSL/TLS Analysis</h3>
                                <div className="bg-gray-900/50 p-4 rounded-lg">
                                    {renderAnalysis(result.analysis)}
                                </div>
                            </div>
                        )}
                        {result && result.sources.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Sources from Google Search:</h4>
                                <ul className="space-y-1 text-xs">
                                    {result.sources.map((source, index) => (
                                         <li key={index} className="text-blue-400 hover:underline">
                                             <a href={source.web.uri} target="_blank" rel="noopener noreferrer" title={source.web.title}>
                                                 {source.web.title || source.web.uri}
                                             </a>
                                         </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                     </div>
                )}

            </div>
        </div>
    );
};

export default SSLChecker;