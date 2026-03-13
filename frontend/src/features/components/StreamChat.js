import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { authService } from "../../services/authService";
import "../../styles/StreamChat.css";

const SOCKET_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:5000";

export default function StreamChat({ streamUserId }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        const s = io(SOCKET_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });
        socketRef.current = s;

        s.emit("join_stream_chat", streamUserId);

        s.on("stream_chat_message", (msg) => {
            setMessages((prev) => [...prev.slice(-200), msg]); // keep last 200
        });

        return () => {
            s.emit("leave_stream_chat", streamUserId);
            s.disconnect();
        };
    }, [streamUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed || !socketRef.current) return;

        socketRef.current.emit("stream_chat_message", {
            streamUserId,
            nickname: currentUser?.nickname || "Анонім",
            text: trimmed,
        });
        setText("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="stream-chat">
            <div className="stream-chat__header">
                <span className="stream-chat__header-title">Чат стріму</span>
            </div>

            <div className="stream-chat__messages">
                {messages.length === 0 && (
                    <p className="stream-chat__empty">Поки що немає повідомлень. Напишіть перше!</p>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className="stream-chat__msg">
                        <span className="stream-chat__msg-nick">{msg.nickname}</span>
                        <span className="stream-chat__msg-text">{msg.text}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="stream-chat__input-wrap">
                {currentUser ? (
                    <>
                        <input
                            className="stream-chat__input"
                            type="text"
                            placeholder="Написати в чат…"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            maxLength={500}
                        />
                        <button
                            className="stream-chat__send-btn"
                            onClick={handleSend}
                            disabled={!text.trim()}
                        >
                            ➤
                        </button>
                    </>
                ) : (
                    <p className="stream-chat__login-hint">Увійдіть, щоб писати в чат</p>
                )}
            </div>
        </div>
    );
}
