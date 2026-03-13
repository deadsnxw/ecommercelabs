export const up = (pgm) => {
    pgm.addColumn('users', {
        stream_title: { type: 'varchar(200)' },
        stream_description: { type: 'text' },
    });
};

export const down = (pgm) => {
    pgm.dropColumn('users', 'stream_title');
    pgm.dropColumn('users', 'stream_description');
};
