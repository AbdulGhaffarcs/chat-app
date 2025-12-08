// src/components/AIAssistant.jsx

import React, { useState, useEffect, useRef } from 'react';
import { RiArrowLeftLine, RiBardLine, RiSendPlaneFill } from 'react-icons/ri';
import { GoogleGenAI } from '@google/genai'; 

// Constants for LocalStorage Key
const AI_HISTORY_STORAGE_KEY = 'geminiChatHistory';

// Initialize the Gemini Client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY }); 

const AIAssistant = ({ onBack }) => {
    // 1. STATE: Start with an empty array; history will be loaded in the useEffect below.
    const [messages, setMessages] = useState([]); 
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // --- NEW: PERSISTENCE LOGIC ---
    
    // 2. EFFECT: Load history from LocalStorage on mount
    useEffect(() => {
        const storedHistory = localStorage.getItem(AI_HISTORY_STORAGE_KEY);
        
        if (storedHistory) {
            setMessages(JSON.parse(storedHistory));
        } else {
            // Default welcome message if no history found
            setMessages([
                { role: 'ai', text: "Hello! I am your AI Assistant powered by Google Gemini. How can I help you today?" }
            ]);
        }
    }, []); // Runs only once on mount

    // 3. EFFECT: Save history to LocalStorage whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(AI_HISTORY_STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);
    
    // --- END PERSISTENCE LOGIC ---

    useEffect(scrollToBottom, [messages]);
    

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        const newMessage = { role: 'user', text: userMessage };
        
        // Prepare the message history for the Gemini API call (context)
        const contents = messages.map(msg => ({
            role: msg.role === 'ai' ? 'model' : msg.role,
            parts: [{ text: msg.text }]
        }));
        
        // Add the new user message and update state immediately
        contents.push({ role: 'user', parts: [{ text: userMessage }] });
        setMessages(prev => [...prev, newMessage]); 
        setInput('');
        setIsLoading(true);

        try {
            // Call the Gemini API using the entire history
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', 
                contents: contents, 
            });

            const aiResponse = response.text;

            setMessages(prev => [
                ...prev,
                { role: 'ai', text: aiResponse }
            ]);

        } catch (error) {
            console.error("Gemini API Error:", error);
            setMessages(prev => [
                ...prev,
                { role: 'ai', text: "Sorry, I ran into an error. Please check your Gemini API key and network connection." }
            ]);
        } finally {
            setIsLoading(false);
        }
    };


    const renderMessage = (msg, index) => (
        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`p-3 rounded-lg shadow-md max-w-xs md:max-w-md ${
                msg.role === 'user' 
                ? 'bg-[#D9F2ED] text-gray-800 rounded-br-none' 
                : 'bg-white text-gray-700 rounded-bl-none'
            }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
        </div>
    );

    return (
        <section className="flex flex-col h-screen w-full bg-[#e5f6f3] overflow-hidden">
            <div className="w-full bg-white shadow-md p-4 flex items-center flex-shrink-0">
                <button onClick={onBack} className="p-2 mr-3 text-teal-700 hover:text-teal-900 transition-colors">
                    <RiArrowLeftLine size={24} />
                </button>
                <h1 className="text-xl font-bold text-teal-700 flex items-center gap-2">
                    <RiBardLine size={24} /> AI Assistant
                </h1>
            </div>

            {/* Chat History */}
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                {messages.map(renderMessage)}
                {isLoading && (
                     <div className="flex justify-start mb-4">
                        <div className="p-3 rounded-lg shadow-md bg-white text-gray-500 text-sm">
                            ...Typing
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="flex p-4 bg-white border-t border-gray-200 flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-grow p-3 border border-gray-300 rounded-l-lg outline-none focus:border-teal-500"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="flex items-center justify-center bg-[#01AA85] text-white p-3 rounded-r-lg hover:bg-[#019379] transition-colors disabled:opacity-50"
                >
                    <RiSendPlaneFill size={24} />
                </button>
            </form>
        </section>
    );
};

export default AIAssistant;