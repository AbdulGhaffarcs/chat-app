// src/components/AIAssistant.jsx

import React, { useState, useEffect, useRef } from 'react';
import { RiArrowLeftLine, RiBardLine, RiSendPlaneFill } from 'react-icons/ri';
import { GoogleGenAI } from '@google/genai'; // CHANGED: Import the Gemini SDK

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY }); 

const AIAssistant = ({ onBack }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    // Initial welcome message
    useEffect(() => {
        setMessages([
            { role: 'ai', text: "Hello! I am your AI Assistant powered by Google Gemini. How can I help you today?" }
        ]);
    }, []);


    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        const newMessage = { role: 'user', text: userMessage };
        
        // Gemini API uses 'user' and 'model' roles in the contents array.
        // We need to map our custom roles correctly.
        const contents = messages.map(msg => ({
            role: msg.role === 'ai' ? 'model' : msg.role,
            parts: [{ text: msg.text }]
        }));
        
        // Add the new user message
        contents.push({ role: 'user', parts: [{ text: userMessage }] });

        setMessages(prev => [...prev, newMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Call the Gemini API using generateContent
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // A capable model for chat, usually within the free tier
                contents: contents, // Pass the full message history
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