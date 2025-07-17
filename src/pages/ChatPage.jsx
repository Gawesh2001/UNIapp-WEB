import React, { useEffect, useState, useRef } from "react";
import "./ChatPage.css";
import UserSession from "../utils/UserSession";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

const ChatPage = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  // Get user details once
  useEffect(() => {
    const user = UserSession.currentUser;
    setUserDetails({
      name: user.name || "User",
      email: user.email,
      role: user.role || "Student",
      faculty: user.faculty || "Faculty of Computing",
    });
  }, []);

  // Start listening to chat messages after userDetails are loaded
  useEffect(() => {
    if (!userDetails?.faculty) return;

    const chatRef = collection(db, "Faculties", userDetails.faculty, "chat");
    const q = query(chatRef, orderBy("time", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(chats);
    });

    return () => unsubscribe();
  }, [userDetails]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage; // snapshot of current input
    setNewMessage(""); // clear input immediately

    const chatRef = collection(db, "Faculties", userDetails.faculty, "chat");

    await addDoc(chatRef, {
      msg: messageToSend,
      name: userDetails.name,
      senderId: userDetails.email,
      time: serverTimestamp(),
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">{userDetails?.faculty || "Loading..."}</div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${
              msg.senderId === userDetails?.email ? "me" : "other"
            }`}
          >
            <div className="chat-name">{msg.name}</div>
            <div className="chat-text">{msg.msg}</div>
            {msg.time && (
              <div className="chat-time">
                {msg.time.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="send-button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
