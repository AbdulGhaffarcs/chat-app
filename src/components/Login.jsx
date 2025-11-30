import React, { useState } from "react";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
const Login = ({ isLogin, setIsLogin }) => {
    const [userData, setUserData] = useState({ email: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);

    const handleChangeUserData = (e) => {
        const { name, value } = e.target;

        setUserData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleAuth = async () => {
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, userData?.email, userData?.password);
        } catch (error) {
            console.log(error);
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <section className="flex flex-col justify-center items-center h-[100vh] background-image">
            <div className="bg-white shadow-lg p-5 rounded-xl h-[27rem] w-[20rem] flex flex-col justify-center items-center">
                <div className="mb-10">
                    <h1 className="text-center text-[28px] font-bold">Sign In</h1>
                    <p className="text-center text-sm text-gray-400">Welcome back, login to continue</p>
                </div>
                <div className="w-full">
                    <input type="email" name="email" onChange={handleChangeUserData} className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none placeholder:text-[#00493958]" placeholder="Email" />
                    <input type="password" name="password" onChange={handleChangeUserData} className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none placeholder:text-[#00493958]" placeholder="Password" />
                </div>
                <div className="w-full">
                    <button disabled={isLoading} onClick={handleAuth} className="bg-[#01aa85] text-white font-bold w-full p-2 rounded-md flex items-center gap-2 justify-center">
                        {isLoading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                Login <FaSignInAlt />
                            </>
                        )}
                    </button>
                </div>
                <div className="mt-5 text-center text-gray-400 text-sm">
                    <button onClick={() => setIsLogin(!isLogin)}>Don't have an account yet? Sign Up</button>
                </div>
            </div>
        </section>
    );
};

export default Login;