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
  where,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { FaChevronCircleLeft, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";

const ChatGroup = ({ chatPath, title, userFilter }) => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);
  const [sidebarUsers, setSidebarUsers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const chatBoxRef = useRef(null);
  const lastSeenRef = useRef(null);
  const [lastSeenMessageId, setLastSeenMessageId] = useState(null);

  // --- New refs and states for mention feature ---
  const inputRef = useRef(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);

  const [mentionAlert, setMentionAlert] = useState(null);
const isAtBottomRef = useRef(true);
const [mentionMessageId, setMentionMessageId] = useState(null);

const [showMentionAlert, setShowMentionAlert] = useState(false);





  useEffect(() => {
    const user = UserSession.currentUser;
    setUserDetails({
      id: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      faculty: user.faculty,
      degree: user.degree,
      batch: user.batch,
    });
  }, []);

  useEffect(() => {
    if (!userDetails || !chatPath) return;

    const chatRef = collection(db, ...chatPath);
    const q = query(chatRef, orderBy("time", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
  const chats = [];
  snapshot.forEach((doc) => {
    chats.push({ id: doc.id, ...doc.data() });
  });
  setMessages(chats);

  // Detect mention
  const latestMention = chats.find(
    (msg) =>
      msg.msg?.includes(`@${userDetails.name}`) &&
      msg.senderId !== userDetails.email
  );
  if (latestMention && !isAtBottomRef.current) {
    setMentionAlert(latestMention.id);
  }
});


    return () => unsubscribe();
  }, [userDetails, chatPath]);

  // Fetch last seen message ID
  useEffect(() => {
    if (!userDetails || !chatPath) return;
    const userDocRef = doc(db, ...chatPath, "seen_" + userDetails.id);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        setLastSeenMessageId(docSnap.data().lastSeenId);
      }
    });

  }, [userDetails, chatPath]);

  useEffect(() => {
    if (!chatBoxRef.current || !chatEndRef.current || !messages.length || !userDetails) return;

    const chatBox = chatBoxRef.current;
    const lastMessage = messages[messages.length - 1];
    const isNearBottom =
      chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 80;

    const shouldScroll =
      lastMessage.senderId === userDetails.email || isNearBottom;

    if (shouldScroll) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, [messages, userDetails]);

  useEffect(() => {
    if (lastSeenRef.current) {
      lastSeenRef.current.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, [lastSeenMessageId]);


  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const chatRef = collection(db, ...chatPath);
    const newMsg = newMessage.trim();
    setNewMessage("");
    setReplyTo(null);

    const title = chatPath.join("_");
    const customId = `${title.trim()
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()}_${nanoid(8)}`;

    const docRef = doc(chatRef, customId);
    await setDoc(docRef, {
      msg: newMsg,
      name: userDetails.name,
      senderId: userDetails.email,
      time: serverTimestamp(),
      replyTo: replyTo ? { name: replyTo.name, msg: replyTo.msg } : null,
    });

    const seenDocRef = doc(db, ...chatPath, `seen_${userDetails.id}`);
    await setDoc(seenDocRef, { lastSeenId: customId }, { merge: true });
  };



  const deleteMessage = async (id) => {
    const messageRef = doc(db, ...chatPath, id);
    await deleteDoc(messageRef);
  };

  useEffect(() => {
    if (!userFilter || userFilter.length === 0) return;

    const filters = userFilter
      .filter((f) => f.value)
      .map((f) => where(f.field, "==", f.value));

    const q = query(collection(db, "UserDetails"), ...filters);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSidebarUsers(users);
    });

    return () => unsubscribe();
  }, [userFilter]);

  // --- New mention input change handler ---
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    const caretPos = e.target.selectionStart;
    const textUpToCaret = value.slice(0, caretPos);
    const mentionMatch = textUpToCaret.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      setMentionQuery(query);
      setShowMentionList(true);

      // Filter sidebarUsers for suggestions
      const filtered = sidebarUsers.filter((user) =>
        user.name.toLowerCase().includes(query) && user.id !== userDetails.id
      );
      setMentionSuggestions(filtered);
    } else {
      setShowMentionList(false);
      setMentionQuery("");
      setMentionSuggestions([]);
    }
  };

  // --- New mention suggestion click handler ---
  const handleMentionClick = (user) => {
    const input = inputRef.current;
    if (!input) return;

    const caretPos = input.selectionStart;
    const textBeforeCaret = newMessage.slice(0, caretPos);
    const textAfterCaret = newMessage.slice(caretPos);

    const mentionMatch = textBeforeCaret.match(/@(\w*)$/);
    if (!mentionMatch) return;

    const mentionStart = caretPos - mentionMatch[0].length;
    const mentionText = `@${user.name.split(" ").join(" ")}`; // use first name or username

    const newText =
      textBeforeCaret.slice(0, mentionStart) +
      mentionText +
      " " + // add space after mention
      textAfterCaret;

    setNewMessage(newText);
    setShowMentionList(false);
    setMentionQuery("");
    setMentionSuggestions([]);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(
        mentionStart + mentionText.length + 1,
        mentionStart + mentionText.length + 1
      );
    }, 0);
  };

  //Scroll to the Mentioned message with @ button (WIP)
 useEffect(() => {
  if (!messages.length || !userDetails || !lastSeenMessageId) return;

  let foundUnseenMention = false;
  let latestUnseenMentionId = null;

  const lastSeenIndex = messages.findIndex(msg => msg.id === lastSeenMessageId);
  if (lastSeenIndex === -1) {
    // If not found, start from beginning
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (
        msg.msg.includes(`@${userDetails.name}`) &&
        msg.senderId !== userDetails.email
      ) {
        latestUnseenMentionId = msg.id;
        foundUnseenMention = true;
        break;
      }
    }
  } else {
    // Check messages after last seen
    for (let i = lastSeenIndex + 1; i < messages.length; i++) {
      const msg = messages[i];
      if (
        msg.msg.includes(`@${userDetails.name}`) &&
        msg.senderId !== userDetails.email
      ) {
        latestUnseenMentionId = msg.id;
        foundUnseenMention = true;
        break;
      }
    }
  }

  setMentionAlert(latestUnseenMentionId);
  setShowMentionAlert(foundUnseenMention);
}, [messages, userDetails, lastSeenMessageId]);









  return (
    <div className="chat-page-wrapper">
      <div className="chat-container">
        <div className="chat-header">
          <FaChevronCircleLeft
            onClick={() => navigate(-1)}
            className="back-icon"
          />
          <span className="faculty-text">{title || "Loading..."}</span>
        </div>

        <div className="chat-messages" ref={chatBoxRef}>
          {messages.map((msg) => (
            <div
  key={msg.id}
  id={`msg-${msg.id}`} // keep the id for reference
  ref={msg.id === lastSeenMessageId ? lastSeenRef : null}

  className={`chat-bubble ${msg.senderId === userDetails?.email ? "me" : "other"}`}
  onClick={() => setReplyTo(msg)}
>


              {msg.replyTo && (
                <div className="reply-reference">
                  <strong>{msg.replyTo.name}</strong>: {msg.replyTo.msg}
                </div>
              )}
              <div className="chat-name">{msg.name}</div>
              <div
                className="chat-text"
                dangerouslySetInnerHTML={{
                   __html: msg.msg.replace(
      /@([A-Za-z]+(?:\s[A-Za-z]+)?)/g,
      '<span class="mention">@$1</span>'
                  ),
                }}
              />
              <div className="time-dlt">
                {msg.senderId === userDetails?.email && (
                  <FaTrash
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(msg.id);
                    }}
                  />
                )}
                {msg.time && (
                  <div className="chat-time">
                    {msg.time.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {replyTo && (
          <div className="reply-preview">
            Replying to <strong>{replyTo.name}</strong>: “{replyTo.msg}”
            <span
              className="cancel-reply"
              onClick={() => setReplyTo(null)}
              title="Cancel reply"
            >
              ✖
            </span>
          </div>
        )}

        {showMentionAlert && mentionMessageId && (
  <button
    className="mention-alert-btn"
    onClick={() => {
      const el = document.getElementById(`msg-${mentionMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setShowMentionAlert(false);
        setMentionMessageId(null);
      }
    }}
  >
    @
  </button>
)}



        <div className="chat-input-container" style={{ position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="send-button" onClick={sendMessage}>
            Send
          </button>

          {showMentionList && mentionSuggestions.length > 0 && (
            <ul className="mention-suggestions">
              {mentionSuggestions.map((user) => (
                <li
                  key={user.id}
                  onClick={() => handleMentionClick(user)}
                  className="mention-suggestion-item"
                >
                  <span className="initials-circle">
                    {user.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                  {user.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="chat-sidebar">
        <h3>Members of {title ? title : "Loading..."}</h3>
        <ul>
          {sidebarUsers.map((user) => (
            <li key={user.id} className="sidebar-user">
              <span className="initials-circle">
                {user.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()}
              </span>
              {user.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChatGroup;
