export const up = (pgm) => {
  pgm.createTable("videos", {
    video_id: {
      type: "serial",
      primaryKey: true,
    },

    user_id: {
      type: "integer",
      notNull: true,
      references: "users(user_id)",
      onDelete: "CASCADE",
    },

    title: {
      type: "varchar(255)",
      notNull: true,
    },

    description: {
      type: "text",
    },

    video_url: {
      type: "varchar(500)",
      notNull: true,
    },

    thumbnail_url: {
      type: "varchar(500)",
    },

    duration: {
      type: "integer",
    },

    file_size: {
      type: "bigint",
    },

    mime_type: {
      type: "varchar(100)",
    },

    status: {
      type: "varchar(50)",
      default: "processing",
      notNull: true,
    },

    views_count: {
      type: "integer",
      default: 0,
      notNull: true,
    },

    is_public: {
      type: "boolean",
      default: true,
      notNull: true,
    },

    is_active: {
      type: "boolean",
      default: true,
      notNull: true,
    },

    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
      notNull: true,
    },

    updated_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
      notNull: true,
    },
  });

  pgm.createIndex("videos", "user_id");
  pgm.createIndex("videos", "status");
  pgm.createIndex("videos", "is_public");
  pgm.createIndex("videos", "created_at");
  pgm.createIndex("videos", ["user_id", "is_active"]);

  pgm.sql(
    `
    CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    `
  );
};

export const down = (pgm) => {
  pgm.dropTable("videos");
};