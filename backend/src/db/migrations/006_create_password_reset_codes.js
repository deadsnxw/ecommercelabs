export const up = (pgm) => {
  pgm.createTable("password_reset_codes", {
    id: { type: "serial", primaryKey: true },

    user_id: {
      type: "integer",
      notNull: true,
      references: "users(user_id)",
      onDelete: "cascade",
    },

    code_hash: {
      type: "varchar(64)",
      notNull: true,
    },

    expires_at: {
      type: "timestamp",
      notNull: true,
    },

    used: {
      type: "boolean",
      default: false,
    },

    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("password_reset_codes", "user_id");
  pgm.createIndex("password_reset_codes", "expires_at");
};

export const down = (pgm) => {
  pgm.dropTable("password_reset_codes");
};