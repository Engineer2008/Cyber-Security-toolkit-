import React, { useState, useMemo } from 'react';

interface StrengthCriteria {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  digit: boolean;
  symbol: boolean;
}

const StrengthChecker: React.FC = () => {
    const [password, setPassword] = useState<string>('');

    const analysis: StrengthCriteria & { score: number } = useMemo(() => {
        const length = password.length >= 12;
        const lowercase = /[a-z]/.test(password);
        const uppercase = /[A-Z]/.test(password);
        const digit = /[0-9]/.test(password);
        const symbol = /[\W_]/.test(password); // \W is non-alphanumeric

        const criteria = [length, lowercase, uppercase, digit, symbol];
        const score = criteria.filter(Boolean).length;
        
        return { length, lowercase, uppercase, digit, symbol, score };
    }, [password]);

    const getStrengthInfo = (): { label: string; color: string; } => {
        if (!password) return { label: 'Enter a password', color: 'text-gray-400' };
        switch (analysis.score) {
            case 5: return { label: 'Very Strong', color: 'text-emerald-500' };
            case 4: return { label: 'Strong', color: 'text-green-500' };
            case 3: return { label: 'Medium', color: 'text-yellow-500' };
            case 2: return { label: 'Weak', color: 'text-orange-500' };
            default: return { label: 'Very Weak', color: 'text-red-500' };
        }
    };

    const getBorderColorClass = () => {
        if (!password) return 'border-gray-600';
        switch (analysis.score) {
            case 5: return 'border-emerald-500';
            case 4: return 'border-green-500';
            case 3: return 'border-yellow-500';
            case 2: return 'border-orange-500';
            default: return 'border-red-500';
        }
    };
    
    const strengthInfo = getStrengthInfo();
    const strengthMeterColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

    const CriteriaItem = ({ valid, text }: { valid: boolean; text: string }) => (
      <li className={`flex items-center transition-colors ${valid ? 'text-green-400' : 'text-gray-400'}`}>
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d={valid ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" : "M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"} clipRule="evenodd"></path>
        </svg>
        <span>{text}</span>
      </li>
    );

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Password Strength Analyzer</h2>
            
            <div className="space-y-6">
                <div>
                    <input
                        type="password"
                        placeholder="Enter password to analyze"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full bg-gray-700 border rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500 transition-colors ${getBorderColorClass()}`}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex space-x-1.5">
                        {strengthMeterColors.map((color, index) => (
                            <div key={index} className="flex-1 h-2 rounded-full transition-colors duration-300"
                                style={{ backgroundColor: analysis.score > index ? color.replace('bg-', '#').slice(0, -4) + '500' : '#374151' /* gray-700 */ }}>
                            </div>
                        ))}
                    </div>
                    <p className={`text-right font-medium text-sm transition-colors ${strengthInfo.color}`}>
                        {strengthInfo.label}
                    </p>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <ul className="space-y-2 text-sm">
                       <CriteriaItem valid={analysis.length} text="At least 12 characters long" />
                       <CriteriaItem valid={analysis.lowercase} text="Contains lowercase letters (a-z)" />
                       <CriteriaItem valid={analysis.uppercase} text="Contains uppercase letters (A-Z)" />
                       <CriteriaItem valid={analysis.digit} text="Contains digits (0-9)" />
                       <CriteriaItem valid={analysis.symbol} text="Contains symbols (!@#...)" />
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StrengthChecker;