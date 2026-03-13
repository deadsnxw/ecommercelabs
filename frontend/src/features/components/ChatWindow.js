import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../../context/chatContext";
import { authService } from "../../services/authService";

const ChatWindow = () => {
    const { currentChatId, messages, sendMessage, closeChat } = useChat();
    const [text, setText] = useState("");
    const messagesEndRef = useRef(null);
    const currentUser = authService.getCurrentUser();

    // Автоскрол до останнього повідомлення
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!currentChatId) return null;

    const handleSend = () => {
        if (!text.trim()) return;
        sendMessage(currentChatId, text);
        setText("");
    };

    const handleClose = () => {
        closeChat();
    };

    return (
        <div
            style={{
                position: "fixed",
                bottom: 20,
                right: 100,
                width: 350,
                height: 500,
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                zIndex: 1000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
        >
            {/* Заголовок з кнопкою закриття */}
            <div
                style={{
                    padding: "10px 15px",
                    borderBottom: "1px solid #eee",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#6441A5",
                    color: "#fff",
                    borderRadius: "10px 10px 0 0",
                }}
            >
                <h3 style={{ margin: 0, fontSize: 16 }}>Чат</h3>
                <button
                    onClick={handleClose}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "#fff",
                        fontSize: 20,
                        cursor: "pointer",
                        padding: 5,
                        lineHeight: 1,
                    }}
                    title="Закрити"
                >
                    ✕
                </button>
            </div>

            {/* Повідомлення */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 15,
                    backgroundColor: "#f9f9f9",
                }}
            >
                {messages.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#999", marginTop: 50 }}>
                        Поки що немає повідомлень
                    </p>
                ) : (
                    messages.map((m) => {
                        const isOwn = m.sender_id === currentUser?.user_id;
                        return (
                            <div
                                key={m.message_id}
                                style={{
                                    display: "flex",
                                    justifyContent: isOwn ? "flex-end" : "flex-start",
                                    marginBottom: 10,
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: "70%",
                                        background: isOwn ? "#6441A5" : "#e1e1e1",
                                        color: isOwn ? "#fff" : "#000",
                                        padding: "8px 12px",
                                        borderRadius: isOwn
                                            ? "15px 15px 0 15px"
                                            : "15px 15px 15px 0",
                                        wordWrap: "break-word",
                                    }}
                                >
                                    <div>{m.text}</div>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            opacity: 0.7,
                                            marginTop: 4,
                                            textAlign: "right",
                                        }}
                                    >
                                        {new Date(m.created_at).toLocaleTimeString("uk-UA", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Поле вводу */}
            <div
                style={{
                    display: "flex",
                    padding: 10,
                    borderTop: "1px solid #eee",
                    backgroundColor: "#fff",
                    borderRadius: "0 0 10px 10px",
                }}
            >
                <input
                    style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 20,
                        border: "1px solid #ccc",
                        outline: "none",
                        fontSize: 14,
                    }}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Введіть повідомлення..."
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim()}
                    style={{
                        marginLeft: 10,
                        padding: "8px 16px",
                        borderRadius: 20,
                        border: "none",
                        backgroundColor: text.trim() ? "#6441A5" : "#ccc",
                        color: "#fff",
                        cursor: text.trim() ? "pointer" : "not-allowed",
                        fontSize: 16,
                    }}
                    title="Надіслати"
                >
                    📨
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;