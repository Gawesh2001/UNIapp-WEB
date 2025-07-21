import React from "react";
import { useLocation } from "react-router-dom";
import ChatGroup from "../pages/ChatPage";

const ChatPageWrapper = () => {
  const location = useLocation();
  const { chatPath, title, userFilter } = location.state || {};

  return (
    <ChatGroup chatPath={chatPath} title={title} userFilter={userFilter} />
  );
};

export default ChatPageWrapper;
