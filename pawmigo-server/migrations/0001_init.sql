CREATE TABLE IF NOT EXISTS users (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  open_id      VARCHAR(64)  NOT NULL UNIQUE,
  phone        VARCHAR(20)  DEFAULT '',
  nickname     VARCHAR(64)  DEFAULT '',
  avatar       VARCHAR(255) DEFAULT '',
  bone_balance BIGINT       NOT NULL DEFAULT 0,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pets (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id    BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(64)  NOT NULL,
  breed       VARCHAR(64)  DEFAULT '',
  gender      VARCHAR(8)   DEFAULT '',
  age         INT          DEFAULT 0,
  personality JSON,
  bio         VARCHAR(255) DEFAULT '',
  bone_count  BIGINT       NOT NULL DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
