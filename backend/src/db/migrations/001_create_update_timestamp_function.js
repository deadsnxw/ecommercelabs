export const up = pgm => {
    pgm.sql(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);
};

export const down = pgm => {
    pgm.sql(`
        DROP FUNCTION IF EXISTS update_updated_at_column();
    `);
};