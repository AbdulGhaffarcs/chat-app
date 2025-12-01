import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAH5XJJ1Dlyb84MONrLiU5OvCWQ29I8NtM",
  authDomain: "chat-app-19d50.firebaseapp.com",
  projectId: "chat-app-19d50",
  storageBucket: "chat-app-19d50.firebasestorage.app",
  messagingSenderId: "758864400678",
  appId: "1:758864400678:web:d130da8b2d49b431fe31e7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export const  listenForChats = (setChats) => {
    // FIX: Corrected misspelled 'collecion' to 'collection' and proper onSnapshot usage
    const chatsRef = collection(db , "chats"); 
    const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
        const chatList = snapshot.docs.map((doc ) => ({
            id : doc.id, 
            ...doc.data()  
        }));
    
    const currentUserEmail = auth.currentUser?.email;

    // FIX: Added null check for auth.currentUser to prevent runtime error on sign out
    const filteredChats = currentUserEmail
        ? chatList.filter((chat) => chat.users.some((user) => user.email === currentUserEmail))
        : [];

    setChats(filteredChats); 
    });
    return unsubscribe;

} 

export const sendMessage = async (messageText, chatId, user1, user2) => {
    const chatRef = doc(db, "chats", chatId);

    const user1Doc = await getDoc(doc(db, "users", user1));
    const user2Doc = await getDoc(doc(db, "users", user2));

    console.log(user1Doc);
    console.log(user2Doc);

    const user1Data = user1Doc.data();
    const user2Data = user2Doc.data();

    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) {
        await setDoc(chatRef, {
            users: [user1Data, user2Data],
            lastMessage: messageText,
            lastMessageTimestamp: serverTimestamp(),
        });
    } else {
        await updateDoc(chatRef, {
            lastMessage: messageText,
            lastMessageTimestamp: serverTimestamp(),
        });
    }

    const messageRef = collection(db, "chats", chatId, "messages");

    await addDoc(messageRef, {
        text: messageText,
        sender: auth.currentUser.email,
        timestamp: serverTimestamp(),
    });
};
export const listenForMessages = (chatId, setMessages) => {
    const chatRef = collection(db, "chats", chatId, "messages");
    onSnapshot(chatRef, (snapshot) => {
        const messages = snapshot.docs.map((doc) => doc.data());
        setMessages(messages);
    });
};



export { auth, db, storage, ref, uploadBytes, getDownloadURL };