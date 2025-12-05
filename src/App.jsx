import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Navlinks from "./components/Navlinks";
import Chatbox from "./components/Chatbox";
import Chatlist from "./components/Chatlist";
import Profile from "./components/Profile";
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
        
        // Responsive Layout Logic
        return (
            // Main container: full height/width, row layout on desktop (lg:flex-row)
            <div className="flex lg:flex-row flex-col items-start w-full h-screen overflow-hidden">
                
                {/* Navlinks (Sidebar/Mobile Header) 
                    - Hidden on mobile only if the Chatbox is open (selectedUser is true).
                */}
                <div className={`lg:block w-full lg:w-[150px] lg:flex-shrink-0 ${selectedUser && currentScreen === 'chat' ? 'hidden' : 'block'}`}>
                    <Navlinks setCurrentScreen={setCurrentScreen} />
                </div>
                
                {/* Chatlist (Chat Selector Pane) 
                    - Hidden on mobile if a chat is selected.
                    - Occupies a fixed width on large screens.
                */}
                <div className={`w-full lg:w-[350px] lg:flex-shrink-0 ${selectedUser ? 'hidden lg:block' : 'block'}`}>
                    <Chatlist setSelectedUser={setSelectedUser} />
                </div>

                {/* Chatbox (Chat Window Pane) 
                    - Takes over the entire screen on mobile when a chat is selected.
                    - Hidden on mobile if no chat is selected.
                */}
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