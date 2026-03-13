export const up = (pgm) => {
  pgm.createTable("subscriptions", {
    subscription_id: {
      type: "serial",
      primaryKey: true,
    },

    subscriber_id: {
      type: "integer",
      notNull: true,
      references: "users(user_id)",
      onDelete: "CASCADE",
    },

    channel_id: {
      type: "integer",
      notNull: true,
      references: "users(user_id)",
      onDelete: "CASCADE",
    },

    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
      notNull: true,
    },
  });

  // Ensure a user can't subscribe to the same channel more than once
  pgm.addConstraint("subscriptions", "unique_subscription", {
    unique: ["subscriber_id", "channel_id"],
  });

  pgm.createIndex("subscriptions", "subscriber_id");
  pgm.createIndex("subscriptions", "channel_id");
};

export const down = (pgm) => {
  pgm.dropTable("subscriptions");
};

