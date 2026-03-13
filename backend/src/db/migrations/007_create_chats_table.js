export const up = pgm => {
    pgm.createTable('chats', {
        chat_id: {
            type: 'serial',
            primaryKey: true
        },

        user1_id: {
            type: 'integer',
            notNull: true,
            references: 'users(user_id)',
            onDelete: 'cascade'
        },

        user2_id: {
            type: 'integer',
            notNull: true,
            references: 'users(user_id)',
            onDelete: 'cascade'
        },

        created_at: {
            type: 'timestamp',
            default: pgm.func('current_timestamp')
        }
    });

    pgm.createConstraint(
        'chats',
        'unique_chat_between_users',
        {
            unique: ['user1_id', 'user2_id']
        }
    );

    pgm.createIndex('chats', 'user1_id');
    pgm.createIndex('chats', 'user2_id');
};

export const down = pgm => {
    pgm.dropTable('chats');
};