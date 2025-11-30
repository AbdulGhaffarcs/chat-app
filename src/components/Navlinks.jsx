import React from "react";
// FIX: Changed relative path to absolute public path for consistency in Vite
import logo from "/assets/logo.png";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { RiArrowDownSFill, RiBardLine, RiChatAiLine, RiFile4Line, RiFolderUserLine, RiNotificationLine, RiShutDownLine } from "react-icons/ri";

const Navlinks = () => {
    const handleLogout = async () => {
        try {
            // This button *should* sign out the user
            await signOut(auth);
        } catch (error) {
            console.log(error);
        }
    };
    return (
        <section className="sticky lg:static top-0 flex items-center lg:items-start lg:justify-start h-[7vh] lg:h-[100vh] w-[100%] lg:w-[150px] py-8 lg:py-0 bg-[#01AA85]">
            <main className="flex lg:flex-col items-center lg:gap-10 justify-between lg:px-0 w-[100%]">
                <div className="lex items-start justify-center lg:border-b border-b-1 border-[#ffffffb9] lg:w-[100%] p-4">
                    <span className="flex items-center justify-center ">
                        <img src={logo} className="w-[56px] h-[52px] object-contain bg-white rounded-lg p-2" alt="" />
                    </span>
                </div>

                <ul className="flex lg:flex-col flex-row items-center gap-7 md:gap-10 px-2 md:px-0">
                    <li className="">
                        {/* Placeholder button (no onClick handler) */}
                        <button className="lg:text-[28px] text-[22px] cursor-pointer">
                            <RiChatAiLine color="#fff" />
                        </button>
                    </li>
                    <li className="">
                        {/* Placeholder button (no onClick handler) */}
                        <button className="lg:text-[28px] text-[22px] cursor-pointer">
                            <RiFolderUserLine color="#fff" />
                        </button>
                    </li>
                    <li className="">
                        {/* Placeholder button (no onClick handler) */}
                        <button className="lg:text-[28px] text-[22px] cursor-pointer">
                            <RiNotificationLine color="#fff" />
                        </button>
                    </li>
                    <li className="">
                        {/* Placeholder button (no onClick handler) */}
                        <button className="lg:text-[28px] text-[22px] cursor-pointer">
                            <RiFile4Line color="#fff" />
                        </button>
                    </li>
                    <li className="">
                        {/* Placeholder button (no onClick handler) */}
                        <button className="lg:text-[28px] text-[22px] cursor-pointer">
                            <RiBardLine color="#fff" />
                        </button>
                    </li>
                    <li className="">
                        {/* Functional Sign Out button */}
                        <button onClick={handleLogout} className="lg:text-[28px] text-[22px] cursor-pointer">
                            <RiShutDownLine color="#fff" />
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