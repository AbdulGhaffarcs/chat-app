import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Navlinks from "./components/Navlinks";
import Chatbox from "./components/Chatbox";
import Chatlist from "./components/Chatlist";
import { auth } from "./firebase/firebase";

const App = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // NEW: State to track Firebase initialization
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        // onAuthStateChanged is called immediately with the current session state.
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setIsLoading(false); // Stop loading once the session status is known
        });

        return () => unsubscribe();
    }, []);

    // FIX: Show a loading screen while Firebase checks for a session
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[100vh]">
                <h1 className="text-[30px] font-bold text-teal-700">Loading...</h1>
            </div>
        );
    }

    return (
        <div>
            {user ? (
                <div className="flex lg:flex-row flex-col items-start w-[100%]">
                    <Navlinks />
                    <Chatlist setSelectedUser={setSelectedUser} />
                    <Chatbox selectedUser={selectedUser} />
                </div>
            ) : (
                <div>{isLogin ? <Login isLogin={isLogin} setIsLogin={setIsLogin} /> : <Register isLogin={isLogin} setIsLogin={setIsLogin} />}</div>
            )}
        </div>
    );
};

export default App;