import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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

export const listenForChats = (setChats) => {
    // Fixed typo: collecion -> collection
    const chatsRef = collection(db, "chats"); 
    const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
        const chatList = snapshot.docs.map((doc) => ({
            id: doc.id, 
            ...doc.data()  
        }));
        
        const filteredChats = chatList.filter((chat) => 
            chat.users && chat.users.some((user) => user.email === auth.currentUser?.email)
        );

        setChats(filteredChats); 
    });
    
    return unsubscribe;
} 

export const sendMessage = async (messageText, chatId, user1, user2) => {
    if (!messageText.trim()) return; // Don't send empty messages
    
    const chatRef = doc(db, "chats", chatId);

    const user1Doc = await getDoc(doc(db, "users", user1));
    const user2Doc = await getDoc(doc(db, "users", user2));

    if (!user1Doc.exists() || !user2Doc.exists()) {
        console.error("User document not found");
        return;
    }

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
    if (!chatId) return () => {}; // Return empty function if no chatId
    
    const chatRef = collection(db, "chats", chatId, "messages");
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
        const messages = snapshot.docs.map((doc) => doc.data());
        setMessages(messages);
    });
    
    return unsubscribe;
};

export { auth, db };