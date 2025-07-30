import { useParams, useNavigate, NavLink } from "react-router-dom";
import { FaArrowLeft, FaComments, FaQuestionCircle, FaBullhorn } from "react-icons/fa";

const ModulePage = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();

    const chatOptions = [
        {
            id: "discussion",
            title: "Discussion",
            icon: <FaComments size={24} />,
            description: "Engage with peers in open discussions about this module",
            path: "/chatPage",
            state: {
                chatPath: ["Modules", moduleId, "discussion"],
                title: `${moduleId} - Discussion`,
                userFilter: [{ field: "moduleId", value: moduleId }],
                isStaffOnly: false,
            }
        },
        {
            id: "qna",
            title: "Q&A",
            icon: <FaQuestionCircle size={24} />,
            description: "Ask questions and get answers from instructors and classmates",
            path: "/qna",
            state: {
                moduleId: moduleId,
            }
        },
        {
            id: "announcements",
            title: "Announcements",
            icon: <FaBullhorn size={24} />,
            description: "View important updates from your instructors",
            path: "/chatPage",
            state: {
                chatPath: ["Modules", moduleId, "announcements"],
                title: `${moduleId} - Announcements`,
                userFilter: [{ field: "moduleId", value: moduleId }],
                isStaffOnly: true,
            }
        }
    ];

    return (
        <div className="module-container">
            <button className="module-back-btn" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Back to Modules
            </button>

            <div className="module-page">
                <div className="module-header">
                    <h1>{moduleId}</h1>
                </div>

                <div className="options-grid">
                    {chatOptions.map((option) => (
                        <NavLink
                            key={option.id}
                            to={option.path}
                            state={option.state}
                            className="option-card"
                        >
                            <div className="card-icon">{option.icon}</div>
                            <h3>{option.title}</h3>
                            <p>{option.description}</p>
                            
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModulePage;