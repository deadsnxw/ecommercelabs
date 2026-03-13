export const up = (pgm) => {
  // Enable pg_trgm extension for trigram similarity search
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

  // Create tags table
  pgm.createTable("tags", {
    tag_id: {
      type: "serial",
      primaryKey: true,
    },
    name: {
      type: "varchar(100)",
      notNull: true,
      unique: true,
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
      notNull: true,
    },
  });

  // Create video_tags junction table
  pgm.createTable("video_tags", {
    video_id: {
      type: "integer",
      notNull: true,
      references: "videos(video_id)",
      onDelete: "CASCADE",
    },
    tag_id: {
      type: "integer",
      notNull: true,
      references: "tags(tag_id)",
      onDelete: "CASCADE",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
      notNull: true,
    },
  });

  // Create unique constraint to prevent duplicate tag assignments
  pgm.addConstraint("video_tags", "video_tags_unique", {
    unique: ["video_id", "tag_id"],
  });

  // Create indexes
  pgm.createIndex("tags", "name");
  pgm.createIndex("video_tags", "video_id");
  pgm.createIndex("video_tags", "tag_id");

  // Create trigram indexes for fast text search
  pgm.sql(`
    CREATE INDEX videos_title_trgm_idx ON videos USING gin (title gin_trgm_ops);
  `);

  pgm.sql(`
    CREATE INDEX tags_name_trgm_idx ON tags USING gin (name gin_trgm_ops);
  `);
};

export const down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS videos_title_trgm_idx;`);
  pgm.sql(`DROP INDEX IF EXISTS tags_name_trgm_idx;`);
  pgm.dropTable("video_tags");
  pgm.dropTable("tags");
  // Note: We don't drop the extension as it might be used elsewhere
};
