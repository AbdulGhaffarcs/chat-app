import React, { useState } from "react";
import { FaSignInAlt, FaGoogle } from "react-icons/fa";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore"; 
import { db } from "../firebase/firebase";

const Login = ({ isLogin, setIsLogin }) => {
    const [userData, setUserData] = useState({ email: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState(""); 

    const handleGoogleAuth = async () => {
        setLoginError(""); 
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;
            
            const userDocRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userDocRef);

            if (!docSnap.exists()) {
                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    username: user.email?.split("@")[0],
                    fullName: user.displayName || user.email?.split("@")[0],
                    image: user.photoURL || "",
                });
            }
        } catch (error) {
            console.log(error);
            setLoginError("Google sign-in failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleChangeUserData = (e) => {
        setLoginError("");
        const { name, value } = e.target;

        setUserData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleAuth = async () => {
        setLoginError(""); 
        
        if (!userData.email || !userData.password) {
            setLoginError("Email and password are required.");
            return;
        }

        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, userData?.email, userData?.password);
        } catch (error) {
            console.log(error);
            
            let errorMessage = "An unknown error occurred during login.";
            
            if (
                error.code === 'auth/invalid-email' || 
                error.code === 'auth/user-not-found' ||
                error.code === 'auth/wrong-password'
            ) {
                 errorMessage = "Account not found or password incorrect.";
            } else if (error.code === 'auth/too-many-requests') {
                 errorMessage = "Access temporarily blocked. Try again later.";
            } else {
                 if (error.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
                     errorMessage = error.code.replace('auth/', '').replace(/-/g, ' ');
                 } else {
                     errorMessage = error.message;
                 }
            }
            setLoginError(errorMessage);
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
                <div className="w-full flex flex-col gap-3">
                    <input type="email" name="email" onChange={handleChangeUserData} className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] font-medium outline-none placeholder:text-[#00493958]" placeholder="Email" />
                    <input type="password" name="password" onChange={handleChangeUserData} className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] font-medium outline-none placeholder:text-[#00493958]" placeholder="Password" />
                </div>
                <div className="w-full mt-3">
                    {/* MODIFIED: Button now only shows the Google icon */}
                    <button onClick={handleGoogleAuth} disabled={isLoading} className="bg-red-600 text-white font-bold h-[45px] w-full mb-3 rounded-md flex items-center justify-center hover:bg-red-700">
                        <FaGoogle size={20} />
                    </button>
                    
                    <button disabled={isLoading} onClick={handleAuth} className="bg-[#01aa85] text-white font-bold w-full p-2 rounded-md flex items-center gap-2 justify-center">
                        {isLoading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                Login <FaSignInAlt />
                            </>
                        )}
                    </button>
                    {loginError && (
                        <p className="text-red-600 text-sm mt-2 text-center font-medium">
                            {loginError}
                        </p>
                    )}
                </div>
                <div className="mt-5 text-center text-gray-400 text-sm">
                    <button onClick={() => setIsLogin(!isLogin)}>Don't have an account yet? Sign Up</button>
                </div>
            </div>
        </section>
    );
};

export default Login;