import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { useLocation, useNavigate } from "react-router-dom";
import {
    collection,
    addDoc,
    getDoc,
    onSnapshot,
    updateDoc,
    doc,
    increment,
    query,
    orderBy,
    serverTimestamp,
    deleteDoc
} from "firebase/firestore";
import UserSession from "../utils/UserSession";
import { FaThumbsUp, FaTrash, FaReply, FaPaperPlane, FaArrowLeft } from "react-icons/fa";
import "./ModulePage.css";

const QnAPage = () => {
    const location = useLocation();
     const navigate = useNavigate();
    const moduleId = location.state?.moduleId;
    const user = UserSession.currentUser;
    const [questionText, setQuestionText] = useState("");
    const [questions, setQuestions] = useState([]);
    const [activeReplyId, setActiveReplyId] = useState(null);

    const facultyId = user.faculty;
    const degreeId = user.degreeProgram;
    const batchId = user.batchNumber;

    useEffect(() => {
        if (!moduleId) return;

        const qnaRef = collection(
            db,
            "Faculties", facultyId,
            "Degrees", degreeId,
            "Batches", batchId,
            "Modules", moduleId,
            "qna"
        );

        const q = query(qnaRef, orderBy("timestamp", "desc"));

        return onSnapshot(q, (snapshot) => {
            const validQuestions = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(q => q.text !== "[Deleted]");
            setQuestions(validQuestions);
        });
    }, [moduleId]);

    const handleAddQuestion = async () => {
        if (!moduleId || questionText.trim() === "") return;
        const qnaRef = collection(db,
            "Faculties", facultyId,
            "Degrees", degreeId,
            "Batches", batchId,
            "Modules", moduleId,
            "qna");
        await addDoc(qnaRef, {
            text: questionText,
            name: user.name,
            email: user.email,
            thumbsUp: 0,
            timestamp: new Date()
        });
        setQuestionText("");
    };

    const handleThumbsUp = async (id) => {
        if (!moduleId) return;
        const docRef = doc(
            db,
            "Faculties", facultyId,
            "Degrees", degreeId,
            "Batches", batchId,
            "Modules", moduleId,
            "qna",
            id
        );

        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        const hasLiked = data.thumbsUpBy?.includes(user.email);
        if (hasLiked) return;

        await updateDoc(docRef, {
            thumbsUp: increment(1),
            thumbsUpBy: [...(data.thumbsUpBy || []), user.email]
        });
    };

    const handleDeleteQuestion = async (questionId) => {
        const questionRef = doc(
            db,
            "Faculties", facultyId,
            "Degrees", degreeId,
            "Batches", batchId,
            "Modules", moduleId,
            "qna",
            questionId
        );
        await deleteDoc(questionRef);
    };

    if (!moduleId) return <p>Module ID is missing.</p>;

    return (
        <div className="qna-container">
            <header className="qna-header">
                 <button 
                    className="back-button"
                    onClick={() => navigate(-1)} // Go back to previous page
                >
                    <FaArrowLeft /> Back
                </button>
                <h1>{moduleId} Q&A</h1>
                <p>Ask questions and get answers from your community</p>
            </header>

            <div className="question-form">
                <div className="avatar">{user.name.charAt(0)}</div>
                <div className="form-content">
                    <textarea
                        placeholder="What's your question?"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        rows="3"
                    />
                    <button 
                        onClick={handleAddQuestion}
                        disabled={!questionText.trim()}
                    >
                        <FaPaperPlane /> Post Question
                    </button>
                </div>
            </div>

            <div className="questions-list">
                {questions.map((q) => (
                    <QuestionCard
                        key={q.id}
                        question={q}
                        user={user}
                        onThumbsUp={handleThumbsUp}
                        onDelete={handleDeleteQuestion}
                        activeReplyId={activeReplyId}
                        setActiveReplyId={setActiveReplyId}
                        moduleId={moduleId}
                    />
                ))}
            </div>
        </div>
    );
};

const QuestionCard = ({ question, user, onThumbsUp, onDelete, activeReplyId, setActiveReplyId, moduleId }) => {
    const isActive = activeReplyId === question.id;
    const facultyId = user.faculty;
    const degreeId = user.degreeProgram;
    const batchId = user.batchNumber;

    return (
        <div className={`question-card ${isActive ? 'active' : ''}`}>
            <div className="question-header">
                <div className="user-info">
                    <div className="avatar small">{question.name.charAt(0)}</div>
                    <span>{question.name}</span>
                </div>
                <div className="question-actions">
                    <button 
                        className="like-btn"
                        onClick={() => onThumbsUp(question.id)}
                    >
                        <FaThumbsUp /> {question.thumbsUp}
                    </button>
                    {question.email === user.email && (
                        <button 
                            className="delete-btn"
                            onClick={() => onDelete(question.id)}
                        >
                            <FaTrash />
                        </button>
                    )}
                </div>
            </div>
            <div className="question-content">
                {question.text}
            </div>
            <div className="question-footer">
                <button 
                    className="reply-toggle"
                    onClick={() => setActiveReplyId(isActive ? null : question.id)}
                >
                    <FaReply /> {isActive ? 'Hide Replies' : 'Show Replies'}
                </button>
            </div>
            {isActive && (
                <ReplySection 
                    moduleId={moduleId} 
                    questionId={question.id}
                    facultyId={facultyId}
                    degreeId={degreeId}
                    batchId={batchId}
                    user={user}
                />
            )}
        </div>
    );
};

const ReplySection = ({ moduleId, questionId, facultyId, degreeId, batchId, user }) => {
    const [replyText, setReplyText] = useState("");
    const [replies, setReplies] = useState([]);

    const repliesRef = collection(
        db,
        "Faculties", facultyId,
        "Degrees", degreeId,
        "Batches", batchId,
        "Modules", moduleId,
        "qna", questionId,
        "replies"
    );

    useEffect(() => {
        const unsubscribe = onSnapshot(repliesRef, (snapshot) => {
            const validReplies = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(r => r.text !== "[Deleted]");
            setReplies(validReplies);
        });
        return () => unsubscribe();
    }, [facultyId, degreeId, batchId, moduleId, questionId]);

    const handleAddReply = async () => {
        if (!replyText.trim()) return;

        const replyData = {
            text: replyText.trim(),
            userId: user.uid || user.email,
            userName: user.name,
            userEmail: user.email,
            thumbsUp: 0,
            thumbsUpBy: [],
            timestamp: serverTimestamp(),
        };

        await addDoc(repliesRef, replyData);
        setReplyText("");
    };

    const handleThumbsUpReply = async (replyId, currentData) => {
        if ((currentData.thumbsUpBy || []).includes(user.email)) return;

        const replyDocRef = doc(repliesRef, replyId);
        await updateDoc(replyDocRef, {
            thumbsUp: increment(1),
            thumbsUpBy: [...(currentData.thumbsUpBy || []), user.email],
        });
    };

    const handleDeleteReply = async (replyId) => {
        const replyDocRef = doc(repliesRef, replyId);
        await updateDoc(replyDocRef, {
            text: "[Deleted]",
            userName: "[Deleted]",
        });
    };

    return (
        <div className="replies-section">
            <div className="replies-list">
                {replies.map((r) => (
                    <div key={r.id} className="reply-item">
                        <div className="reply-header">
                            <div className="avatar xsmall">{r.userName.charAt(0)}</div>
                            <span>{r.userName}</span>
                        </div>
                        <div className="reply-content">{r.text}</div>
                        <div className="reply-actions">
                            <button 
                                className="like-btn"
                                onClick={() => handleThumbsUpReply(r.id, r)}
                            >
                                <FaThumbsUp /> {r.thumbsUp || 0}
                            </button>
                            {r.userEmail === user.email && (
                                <button 
                                    className="delete-btn"
                                    onClick={() => handleDeleteReply(r.id)}
                                >
                                    <FaTrash />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="reply-form">
                <div className="avatar small">{user.name.charAt(0)}</div>
                <div className="form-content">
                    <input
                        type="text"
                        value={replyText}
                        placeholder="Write a reply..."
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddReply();
                            }
                        }}
                    />
                    <button 
                        onClick={handleAddReply}
                        disabled={!replyText.trim()}
                    >
                        <FaPaperPlane />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QnAPage;