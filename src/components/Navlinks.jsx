// src/components/Navlinks.jsx

import React from "react";
import logo from "/assets/logo.png";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { RiArrowDownSFill, RiBardLine, RiChatAiLine, RiFile4Line, RiFolderUserLine, RiLogoutCircleRLine, RiNotificationLine, RiShutDownLine } from "react-icons/ri"; 

const Navlinks = ({ setCurrentScreen }) => { 
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.log(error);
        }
    };
    
    const handleProfileClick = () => {
        if (setCurrentScreen) {
            setCurrentScreen('profile');
        } else {
             alert("Profile Management feature is not fully implemented. (Console check)");
        }
    };

    const handleNotificationsClick = () => {
        if (setCurrentScreen) {
            setCurrentScreen('notifications');
        } else {
            console.log("Notifications action triggered, but setCurrentScreen is missing.");
        }
    };

    const handleAIClick = () => {
        // UPDATED: Now sets the main app screen state to 'ai'
        if (setCurrentScreen) {
            setCurrentScreen('ai');
        } else {
            console.log("AI Assistant action triggered, but setCurrentScreen is missing.");
        }
    };

    return (
        <section className="sticky lg:static top-0 flex items-center lg:items-start lg:justify-start h-[7vh] lg:h-[100vh] w-[100%] lg:w-[150px] py-8 lg:py-0 bg-[#01AA85]">
            <main className="flex lg:flex-col items-center lg:gap-10 justify-between lg:px-0 w-[100%]">
                <div className="lex items-start justify-center lg:border-b border-b-1 border-[#ffffffb9] lg:w-[100%] p-2">
                    <span className="flex items-center justify-center ">
                        <img src={logo} className="w-[80px] h-[auto] object-contain  p-1" alt="" /> 
                    </span>
                </div>

                <ul className="flex lg:flex-col flex-row items-center gap-7 md:gap-10 px-2 md:px-0">
                    
                    <li className="">
                        {/* MODIFIED: Circular, modern button style */}
                        <button onClick={handleProfileClick} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors">
                            <RiFolderUserLine color="#fff" className="w-[20px] h-[20px] lg:w-[24px] lg:h-[24px]" />
                        </button>
                    </li>
                    <li className="">
                        {/* MODIFIED: Circular, modern button style - Now navigates to Notifications screen */}
                        <button onClick={handleNotificationsClick} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors">
                            <RiNotificationLine color="#fff" className="w-[20px] h-[20px] lg:w-[24px] lg:h-[24px]" />
                        </button>
                    </li>
                    
                    <li className="">
                        {/* MODIFIED: Circular, modern button style - Now calls handleAIClick */}
                        <button onClick={handleAIClick} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors">
                            <RiBardLine color="#fff" className="w-[20px] h-[20px] lg:w-[24px] lg:h-[24px]" />
                        </button>
                    </li>
                    <li className="">
                        {/* MODIFIED: Circular, modern button style (Logout icon changed to RiLogoutCircleRLine) */}
                        <button onClick={handleLogout} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors">
                            <RiLogoutCircleRLine color="#fff" className="w-[20px] h-[20px] lg:w-[24px] lg:h-[24px]" />
                        </button>
                    </li>
                </ul>
                <button className="block lg:hidden lg:text-[28px] text-[22px]">
                    <RiArrowDownSFill color="#fff" />
                </button>
            </main>
        </section>
    );
};

export default Navlinks;