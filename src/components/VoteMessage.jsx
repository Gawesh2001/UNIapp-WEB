import React, { useState } from "react";
import { nanoid } from "nanoid";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { db } from "../firebase";
import "./VoteMessage.css";
import { FaPlus, FaTimes } from "react-icons/fa";

const VoteMessage = ({ onClose, userDetails, chatPath, title }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);  // <-- NEW STATE

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOption = () => setOptions([...options, ""]);

  const sendPoll = async () => {
    if (!question.trim() || options.some((opt) => !opt.trim())) return;

    const groupId = chatPath.join("_");
    const customId = `${groupId
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()}_${nanoid(8)}`;

    const pollDoc = doc(collection(db, ...chatPath), customId);
    await setDoc(pollDoc, {
      type: "vote",
      question,
      options,
      allowMultiple,  // <-- save this flag to Firestore
      votes: {}, // votes object will hold user votes as arrays for multiple options
      name: userDetails.name,
      senderId: userDetails.email,
      time: serverTimestamp(),
    });

    // Save as last seen
    const seenDocRef = doc(db, "UserDetails", userDetails.id, "chatLastSeen", title);
    await setDoc(seenDocRef, { lastSeenId: customId }, { merge: true });

    onClose();
  };

  const removeOption = (index) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  return (
    <div className="vote-modal">
      <div className="vote-modal-content">
        <h3>Create Poll</h3>
        <p>Question</p>
        <input
          type="text"
          placeholder="Type poll question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <p>Options</p>
        <div className="options-container">
          {options.map((opt, idx) => (
            <div key={idx} className="option-row">
              <input
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
              />
              <button
                type="button"
                className="remove-option-btn"
                onClick={() => removeOption(idx)}
                title="Remove option"
                disabled={options.length <= 2}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <button className="add-option-btn" onClick={addOption} title="Add option">
            <FaPlus />
          </button>
        </div>

        {/* NEW Checkbox to allow multiple votes */}
        <div className="multiple-vote-checkbox">
          <label>
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
            />
            Allow multiple options
          </label>
        </div>

        <div className="vote-actions">
          <button onClick={sendPoll}>Send Poll</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default VoteMessage;
