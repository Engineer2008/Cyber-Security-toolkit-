import React, { useState, useCallback } from 'react';
import { Tool } from './types';
import PasswordGenerator from './components/PasswordGenerator';
import TokenGenerator from './components/TokenGenerator';
import StrengthChecker from './components/StrengthChecker';
import PasswordHasher from './components/PasswordHasher';
import HashCracker from './components/HashCracker';
import SSLChecker from './components/SSLChecker';
import EntropyAnalyzer from './components/EntropyAnalyzer';
import PwnedChecker from './components/PwnedChecker';
import { ShieldCheckIcon, CogIcon, KeyIcon, BeakerIcon, LockOpenIcon, CertificateIcon, CalculatorIcon, ExclamationTriangleIcon, SearchIcon } from './components/icons';

const toolConfig = {
    [Tool.PasswordGenerator]: {
        name: 'Password Generator',
        component: PasswordGenerator,
        icon: KeyIcon,
    },
    [Tool.TokenGenerator]: {
        name: 'Token Generator',
        component: TokenGenerator,
        icon: CogIcon,
    },
    [Tool.StrengthChecker]: {
        name: 'Strength Checker',
        component: StrengthChecker,
        icon: ShieldCheckIcon,
    },
    [Tool.EntropyAnalyzer]: {
        name: 'Entropy Analyzer',
        component: EntropyAnalyzer,
        icon: CalculatorIcon,
    },
    [Tool.PwnedChecker]: {
        name: 'Pwned Check',
        component: PwnedChecker,
        icon: ExclamationTriangleIcon,
    },
    [Tool.PasswordHasher]: {
        name: 'Password Hasher',
        component: PasswordHasher,
        icon: BeakerIcon,
    },
    [Tool.HashCracker]: {
        name: 'Hash Cracker',
        component: HashCracker,
        icon: LockOpenIcon,
    },
    [Tool.SSLChecker]: {
        name: 'SSL/TLS Checker',
        component: SSLChecker,
        icon: CertificateIcon,
    },
};


const App: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool>(Tool.PasswordGenerator);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const renderActiveTool = useCallback(() => {
        const { component: ToolComponent } = toolConfig[activeTool];
        return <ToolComponent />;
    }, [activeTool]);

    // FIX: Explicitly type NavButton with React.FC to resolve issue with 'key' prop type checking.
    const NavButton: React.FC<{ tool: Tool; children: React.ReactNode }> = ({ tool, children }) => (
        <button
            onClick={() => setActiveTool(tool)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTool === tool
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
            {children}
        </button>
    );

    const filteredTools = Object.entries(toolConfig).filter(([_, config]) =>
        config.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-3xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                        Cyber Security Toolkit
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">
                        Your all-in-one suite for cryptographic utilities.
                    </p>
                </header>

                <div className="mb-6 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-500" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search for a tool..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <nav className="mb-8 p-1.5 bg-gray-800 rounded-xl flex flex-col sm:flex-row gap-2 flex-wrap">
                   {filteredTools.map(([toolKey, config]) => (
                        <NavButton key={toolKey} tool={toolKey as Tool}>
                            <config.icon className="h-5 w-5" />
                            <span>{config.name}</span>
                        </NavButton>
                    ))}
                </nav>

                <main>
                    {renderActiveTool()}
                </main>
                
                <footer className="text-center mt-12 text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Cyber Security Toolkit. All Rights Reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;