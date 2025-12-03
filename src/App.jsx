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
        
        return (
            <div className="flex lg:flex-row flex-col items-start w-[100%]">
                <Navlinks setCurrentScreen={setCurrentScreen} />
                <Chatlist setSelectedUser={setSelectedUser} />
                <Chatbox selectedUser={selectedUser} />
            </div>
        );
    };

    return (
        <div>
            {user ? (
                renderAuthenticatedApp()
            ) : (
                <div>{isLogin ? <Login isLogin={isLogin} setIsLogin={setIsLogin} /> : <Register isLogin={isLogin} setIsLogin={setIsLogin} />}</div>
            )}
        </div>
    );
};

export default App;
