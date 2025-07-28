import React, { useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ChatInput = ({
  newMessage,
  setNewMessage,
  sendMessage,
  isUploading,
  setImageToUpload,
  imageToUpload,
  setReplyTo,
  replyTo,
  sidebarUsers,
  userDetails,
  setShowVoteForm,
  handleVote,
}) => {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mentionQuery, setMentionQuery] = useState('');
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
      setMentionQuery('');
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
    const mentionText = `@${user.name.split(' ').join(' ')}`;

    const newText =
      textBeforeCaret.slice(0, mentionStart) +
      mentionText +
      ' ' +
      textAfterCaret;

    setNewMessage(newText);
    setShowMentionList(false);
    setMentionQuery('');
    setMentionSuggestions([]);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(
        mentionStart + mentionText.length + 1,
        mentionStart + mentionText.length + 1
      );
    }, 0);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setImageToUpload(file);
  };

  const handleSend = () => {
    sendMessage();
    // Clear mention suggestions after sending
    setShowMentionList(false);
    setMentionSuggestions([]);
  };

  return (
    <>
      {replyTo && (
        <div className="reply-preview">
          Replying to <strong>{replyTo.name}</strong>: "{replyTo.msg}"
          <FaTimes
            className="cancel-reply"
            onClick={() => setReplyTo(null)}
            title="Cancel reply"
          />
        </div>
      )}

      <div className="chat-input-container">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          style={{ display: 'none' }}
          disabled={isUploading}
        />
        <button
          className="image-upload-btn"
          onClick={() => fileInputRef.current.click()}
          disabled={isUploading}
        >
          📤
        </button>

        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isUploading}
        />

        <button
          className="vote-button"
          onClick={() => setShowVoteForm(true)}
          disabled={isUploading}
        >
          📊
        </button>

        <button
          className="send-button"
          onClick={handleSend}
          disabled={isUploading || (!newMessage.trim() && !imageToUpload)}
        >
          {isUploading ? 'Sending...' : 'Send'}
        </button>

        {showMentionList && mentionSuggestions.length > 0 && (
          <ul className="mention-suggestions">
            {mentionSuggestions.map((user) => (
              <li
                key={user.id}
                onClick={() => handleMentionClick(user)}
                className="mention-suggestion-item"
              >
                <span className={`initials-circle${user.role === 'staff' ? ' staff' : ''}`}>
                  {user.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase()}
                </span>
                {user.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default ChatInput;