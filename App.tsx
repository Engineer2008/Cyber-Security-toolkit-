import React, { useState, useCallback } from 'react';
import { Tool } from './types';
import PasswordGenerator from './components/PasswordGenerator';
import TokenGenerator from './components/TokenGenerator';
import StrengthChecker from './components/StrengthChecker';
import PasswordHasher from './components/PasswordHasher';
import HashCracker from './components/HashCracker';
import { ShieldCheckIcon, CogIcon, KeyIcon, BeakerIcon, LockOpenIcon } from './components/icons';

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
};


const App: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool>(Tool.PasswordGenerator);

    const renderActiveTool = useCallback(() => {
        const { component: ToolComponent } = toolConfig[activeTool];
        return <ToolComponent />;
    }, [activeTool]);

    const NavButton = ({ tool, children }: { tool: Tool, children: React.ReactNode }) => (
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

                <nav className="mb-8 p-1.5 bg-gray-800 rounded-xl flex flex-col sm:flex-row gap-2 flex-wrap">
                   {Object.entries(toolConfig).map(([toolKey, config]) => (
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