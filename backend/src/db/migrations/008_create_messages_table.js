export const up = pgm => {
    pgm.createTable('messages', {
        message_id: {
            type: 'serial',
            primaryKey: true
        },

        chat_id: {
            type: 'integer',
            notNull: true,
            references: 'chats(chat_id)',
            onDelete: 'cascade'
        },

        sender_id: {
            type: 'integer',
            notNull: true,
            references: 'users(user_id)',
            onDelete: 'cascade'
        },

        text: {
            type: 'text',
            notNull: true
        },

        created_at: {
            type: 'timestamp',
            default: pgm.func('current_timestamp')
        }
    });

    pgm.createIndex('messages', 'chat_id');
    pgm.createIndex('messages', 'sender_id');
};

export const down = pgm => {
    pgm.dropTable('messages');
};