// hooks/useMentions.js
import { useState } from "react";

const useMentions = ({ newMessage, setNewMessage, sidebarUsers, userDetails, inputRef }) => {
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);

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

      const filtered = sidebarUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(query) && user.id !== userDetails.id
      );
      setMentionSuggestions(filtered);
    } else {
      setShowMentionList(false);
      setMentionQuery("");
      setMentionSuggestions([]);
    }
  };

  const handleMentionClick = (user) => {
    const input = inputRef.current;
    if (!input) return;

    const caretPos = input.selectionStart;
    const textBeforeCaret = newMessage.slice(0, caretPos);
    const textAfterCaret = newMessage.slice(caretPos);

    const mentionMatch = textBeforeCaret.match(/@(\w*)$/);
    if (!mentionMatch) return;

    const mentionStart = caretPos - mentionMatch[0].length;
    const mentionText = `@${user.name.split(" ").join(" ")}`;

    const newText =
      textBeforeCaret.slice(0, mentionStart) +
      mentionText +
      " " +
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

  return {
    mentionQuery,
    showMentionList,
    mentionSuggestions,
    handleInputChange,
    handleMentionClick
  };
};

export default useMentions;