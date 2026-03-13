export const up = (pgm) => {
  pgm.createTable("video_views", {
    view_id: {
      type: "serial",
      primaryKey: true,
    },

    video_id: {
      type: "integer",
      notNull: true,
      references: "videos(video_id)",
      onDelete: "CASCADE",
    },

    user_id: {
      type: "integer",
      references: "users(user_id)",
      onDelete: "SET NULL",
    },

    ip_address: {
      type: "varchar(45)",
    },

    watch_duration: {
      type: "integer",
      default: 0,
    },

    viewed_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
      notNull: true,
    },
  });

  pgm.createIndex("video_views", "video_id");
  pgm.createIndex("video_views", "user_id");
  pgm.createIndex("video_views", "viewed_at");
};

export const down = (pgm) => {
  pgm.dropTable("video_views");
};