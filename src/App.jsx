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
    const [selectedUser, setSelectedUser] = useState(null);
    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUser(currentUser);
        }

        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });

        return () => unsubscribe();
    }, []);
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