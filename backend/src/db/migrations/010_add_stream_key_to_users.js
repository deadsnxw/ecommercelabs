export const up = (pgm) => {
    pgm.addColumn('users', {
        stream_key: {
            type: 'varchar(64)',
            unique: true
        }
    });

    // Populate existing users with a default stream_key
    pgm.sql(`UPDATE users SET stream_key = 'stream_' || user_id WHERE stream_key IS NULL`);
};

export const down = (pgm) => {
    pgm.dropColumn('users', 'stream_key');
};
