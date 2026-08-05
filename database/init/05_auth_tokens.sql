-- Tokenuri de autentificare pentru sesiuni separate în fiecare tab

CREATE TABLE IF NOT EXISTS auth_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    token_hash CHAR(64) NOT NULL UNIQUE,

    expires_at DATETIME NOT NULL,

    revoked_at DATETIME NULL DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auth_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    KEY idx_auth_tokens_user (
        user_id
    ),

    KEY idx_auth_tokens_expires (
        expires_at
    ),

    KEY idx_auth_tokens_revoked (
        revoked_at
    )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_uca1400_ai_ci;