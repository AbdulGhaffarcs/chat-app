// src/App.jsx

import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Navlinks from "./components/Navlinks";
import Chatbox from "./components/Chatbox";
import Chatlist from "./components/Chatlist";
import Profile from "./components/Profile";
import Notifications from "./components/Notifications"; 
import AIAssistant from "./components/AIAssistant"; // NEW IMPORT
import { auth } from "./firebase/firebase";

const App = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentScreen, setCurrentScreen] = useState('chat');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[100vh]">
                <h1 className="text-[30px] font-bold text-teal-700">Loading...</h1>
            </div>
        );
    }

    const renderAuthenticatedApp = () => {
        if (currentScreen === 'profile') {
            return <Profile onBack={() => setCurrentScreen('chat')} />;
        }
        
        if (currentScreen === 'notifications') {
            return <Notifications onBack={() => setCurrentScreen('chat')} />;
        }
        
        // AI Assistant Screen Rendering
        if (currentScreen === 'ai') {
            return <AIAssistant onBack={() => setCurrentScreen('chat')} />;
        }
        
        // Default Chat View
        return (
            <div className="flex lg:flex-row flex-col items-start w-full h-screen overflow-hidden">
                
                <div className={`lg:block w-full lg:w-[150px] lg:flex-shrink-0 ${selectedUser && currentScreen === 'chat' ? 'hidden' : 'block'}`}>
                    <Navlinks setCurrentScreen={setCurrentScreen} />
                </div>
                
                <div className={`w-full lg:w-[350px] lg:flex-shrink-0 ${selectedUser ? 'hidden lg:block' : 'block'}`}>
                    <Chatlist setSelectedUser={setSelectedUser} />
                </div>

                <div className={`w-full lg:flex-grow h-full ${selectedUser ? 'block' : 'hidden lg:block'}`}>
                    <Chatbox 
                        selectedUser={selectedUser} 
                        onChatDeleted={() => setSelectedUser(null)} 
                        onBackToChatlist={() => setSelectedUser(null)}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full"> 
            {user ? (
                renderAuthenticatedApp()
            ) : (
                <div>{isLogin ? <Login isLogin={isLogin} setIsLogin={setIsLogin} /> : <Register isLogin={isLogin} setIsLogin={setIsLogin} />}</div>
            )}
        </div>
    );
};

export default App;