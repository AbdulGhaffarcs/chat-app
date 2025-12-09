import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Navlinks from "./components/Navlinks";
import Chatbox from "./components/Chatbox";
import Chatlist from "./components/Chatlist";
import Profile from "./components/Profile";
import Notifications from "./components/Notifications"; 
import AIAssistant from "./components/AIAssistant"; 
import { auth } from "./firebase/firebase";

const App = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentScreen, setCurrentScreen] = useState('chat'); // Default screen is 'chat'

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
        // 1. PROFILE Screen
        if (currentScreen === 'profile') {
            return <Profile onBack={() => setCurrentScreen('chat')} />;
        }
        
        // 2. NOTIFICATIONS Screen
        if (currentScreen === 'notifications') {
            return <Notifications onBack={() => setCurrentScreen('chat')} />;
        }
        
        // 3. AI ASSISTANT Screen
        if (currentScreen === 'ai') {
            return <AIAssistant onBack={() => setCurrentScreen('chat')} />;
        }
        
        // 4. DEFAULT CHAT View (Responsive Layout)
        return (
            // Main container: full height/width, row layout on desktop (lg:flex-row)
            <div className="flex lg:flex-row flex-col items-start w-full h-screen overflow-hidden">
                
                {/* Navlinks: Renders the vertical sidebar on desktop, or horizontal header on mobile/chatlist view. */}
                <div className={`lg:block w-full lg:w-[150px] lg:flex-shrink-0 ${selectedUser && currentScreen === 'chat' ? 'hidden' : 'block'}`}>
                    <Navlinks setCurrentScreen={setCurrentScreen} />
                </div>
                
                {/* Chatlist: Hidden on small screens if a specific chat is selected */}
                <div className={`w-full lg:w-[350px] lg:flex-shrink-0 ${selectedUser ? 'hidden lg:block' : 'block'}`}>
                    <Chatlist setSelectedUser={setSelectedUser} />
                </div>

                {/* Chatbox: Takes over the entire screen on mobile when a chat is selected */}
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