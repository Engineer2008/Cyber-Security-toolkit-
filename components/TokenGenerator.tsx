import React, { useState, useCallback } from 'react';
import { CopyIcon, CheckIcon } from './icons';

type TokenType = 'hex' | 'urlsafe';

const tokenExplanations: Record<TokenType, string> = {
    hex: "Ideal for API keys, machine-to-machine authentication, and anywhere you need a simple string of hexadecimal characters.",
    urlsafe: "Perfect for use in URLs, such as password reset links or session identifiers. It uses a Base64 character set that won't conflict with URL syntax."
};

const TokenGenerator: React.FC = () => {
    const [byteLength, setByteLength] = useState<number>(32);
    const [tokenType, setTokenType] = useState<TokenType>('hex');
    const [token, setToken] = useState<string>('');
    const [copied, setCopied] = useState<boolean>(false);

    const generateToken = useCallback(() => {
        if (byteLength <= 0 || isNaN(byteLength)) {
            setToken('Please enter a valid positive number for byte length.');
            return;
        }

        const array = new Uint8Array(byteLength);
        window.crypto.getRandomValues(array);

        let newToken = '';
        if (tokenType === 'hex') {
            newToken = Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
        } else {
            const str = String.fromCharCode.apply(null, Array.from(array));
            newToken = btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }

        setToken(newToken);
        setCopied(false);

    }, [byteLength, tokenType]);

    const handleCopy = () => {
        if (token && token.length > 0 && !token.startsWith("Please enter")) {
            navigator.clipboard.writeText(token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const TokenOptionRadio = ({ label, value, checked, onChange }: { label: string; value: TokenType; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => (
        <label className={`flex-1 text-center p-3 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <input type="radio" name="tokenType" value={value} checked={checked} onChange={onChange} className="sr-only" />
            <span>{label}</span>
        </label>
    );


    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Secure Token Generator</h2>
            
            <div className="space-y-6">
                 <div className="relative">
                    <textarea
                        readOnly
                        value={token}
                        placeholder="Your secure token will appear here"
                        className="w-full h-24 bg-gray-900 text-green-400 font-mono p-4 pr-12 rounded-md border border-gray-700 focus:outline-none resize-none"
                    />
                    <button onClick={handleCopy} className="absolute top-3 right-0 flex items-center px-4 text-gray-400 hover:text-white transition-colors">
                        {copied ? <CheckIcon className="h-6 w-6 text-green-500" /> : <CopyIcon className="h-6 w-6" />}
                    </button>
                </div>

                <div className="flex bg-gray-900/50 rounded-lg p-1 space-x-1">
                     <TokenOptionRadio label="Hex Token" value="hex" checked={tokenType === 'hex'} onChange={(e) => setTokenType(e.target.value as TokenType)} />
                     <TokenOptionRadio label="URL-Safe Token" value="urlsafe" checked={tokenType === 'urlsafe'} onChange={(e) => setTokenType(e.target.value as TokenType)} />
                </div>

                <div className="p-3 bg-gray-900/50 rounded-md text-center text-sm text-gray-300">
                    <p>{tokenExplanations[tokenType]}</p>
                </div>
                
                <div>
                    <label htmlFor="byteLength" className="block text-sm font-medium text-gray-300 mb-2">Byte Length (e.g., 32)</label>
                    <input
                        type="number"
                        id="byteLength"
                        min="1"
                        max="128"
                        value={byteLength}
                        onChange={(e) => setByteLength(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                
                <button
                    onClick={generateToken}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg"
                >
                    Generate Token
                </button>
            </div>
        </div>
    );
};

export default TokenGenerator;