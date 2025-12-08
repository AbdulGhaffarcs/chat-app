// src/components/Notifications.jsx

import React from 'react';
import { RiArrowLeftLine } from 'react-icons/ri';

const Notifications = ({ onBack }) => {
    return (
        <section className="flex flex-col items-center p-8 h-screen w-full bg-[#e5f6f3] overflow-y-auto">
            <div className="w-full max-w-lg bg-white shadow-xl rounded-xl p-6">
                <header className="flex justify-start items-center mb-6 border-b pb-4">
                    <button onClick={onBack} className="p-2 mr-3 text-teal-700 hover:text-teal-900 transition-colors">
                        <RiArrowLeftLine size={24} />
                    </button>
                    <h1 className="text-3xl font-bold text-teal-700">Notifications</h1>
                </header>
                
                <div className="space-y-4">
                    <p className="text-gray-500 text-center py-10">
                        🔔 This is your Notifications Screen. <br/> 
                        Notifications will appear here when the feature is fully implemented.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Notifications;