export const up = pgm => {
    pgm.addColumn('chats', {
        requested_by_id: {
            type: 'integer',
            references: 'users(user_id)',
            onDelete: 'set null'
        },
        status: {
            type: 'text',
            notNull: true,
            default: 'approved'
        }
    });
    pgm.createIndex('chats', 'status');
};

export const down = pgm => {
    pgm.dropIndex('chats', 'status');
    pgm.dropColumn('chats', 'requested_by_id');
    pgm.dropColumn('chats', 'status');
};
