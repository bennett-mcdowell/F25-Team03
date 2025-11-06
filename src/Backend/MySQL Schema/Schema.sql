-- =====================================================================
-- FULL RESET (drivers can have multiple sponsors; balance per pair)
-- =====================================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TRIGGER IF EXISTS trg_admin_before_insert;
DROP TRIGGER IF EXISTS trg_sponsor_before_insert;
DROP TRIGGER IF EXISTS trg_driver_before_insert;
DROP TRIGGER IF EXISTS trg_loginlog_after_insert;

DROP EVENT IF EXISTS ev_purge_expired_sessions;

DROP TABLE IF EXISTS driver_catalog_curation;

DROP TABLE IF EXISTS current_sessions;
DROP TABLE IF EXISTS login_log;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS driver_sponsor;
DROP TABLE IF EXISTS driver;
DROP TABLE IF EXISTS sponsor;
DROP TABLE IF EXISTS admin;
DROP TABLE IF EXISTS login_info;
DROP TABLE IF EXISTS user_credentials;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS user_type;
DROP TABLE IF EXISTS change_log;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- LOOKUP: user_type
-- =====================================================================
CREATE TABLE user_type (
  type_id TINYINT NOT NULL AUTO_INCREMENT,
  type_name VARCHAR(50) NOT NULL UNIQUE,
  PRIMARY KEY (type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- CORE: user
-- =====================================================================
CREATE TABLE `user` (
  user_id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name  VARCHAR(100) NOT NULL,
  email VARCHAR(320) NOT NULL,
  email_lc VARCHAR(320) AS (LOWER(email)) STORED,
  ssn CHAR(9),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  type_id TINYINT NOT NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_user_email_lc (email_lc),
  CONSTRAINT fk_user_type
    FOREIGN KEY (type_id) REFERENCES user_type(type_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- AUTH: user_credentials
-- =====================================================================
CREATE TABLE user_credentials (
  user_id INT NOT NULL,
  username VARCHAR(320) NOT NULL,
  username_lc VARCHAR(320) AS (LOWER(username)) STORED,
  password VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_usercred_username_lc (username_lc),
  CONSTRAINT fk_user_credentials_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- AUTH: login_info
-- =====================================================================
CREATE TABLE login_info (
  user_id INT NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  security_question VARCHAR(255) NOT NULL,
  security_answer VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_login_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- ROLES
-- =====================================================================
CREATE TABLE admin (
  admin_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  admin_permissions INT,
  PRIMARY KEY (admin_id),
  UNIQUE KEY uq_admin_user (user_id),
  CONSTRAINT fk_admin_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sponsor (
  sponsor_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (sponsor_id),
  UNIQUE KEY uq_sponsor_user (user_id),
  CONSTRAINT fk_sponsor_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE driver (
  driver_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  PRIMARY KEY (driver_id),
  UNIQUE KEY uq_driver_user (user_id),
  CONSTRAINT fk_driver_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- DRIVER–SPONSOR M:N with per-pair BALANCE
-- =====================================================================
CREATE TABLE driver_sponsor (
  driver_sponsor_id BIGINT NOT NULL AUTO_INCREMENT,
  driver_id INT NOT NULL,
  sponsor_id INT NOT NULL,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,     -- balance per (driver,sponsor)
  status ENUM('ACTIVE','INACTIVE','PENDING') NOT NULL DEFAULT 'ACTIVE',
  since_at DATETIME NULL,
  until_at DATETIME NULL,
  PRIMARY KEY (driver_sponsor_id),
  UNIQUE KEY uq_driver_sponsor_pair (driver_id, sponsor_id),
  KEY idx_driver (driver_id),
  KEY idx_sponsor (sponsor_id),
  CONSTRAINT fk_ds_driver
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ds_sponsor
    FOREIGN KEY (sponsor_id) REFERENCES sponsor(sponsor_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- DRIVER CATALOG CURATION: hide/show products from API (per sponsor)
-- UPDATED: Now includes sponsor_id for per-sponsor curation
-- =====================================================================
CREATE TABLE driver_catalog_curation (
  curation_id INT NOT NULL AUTO_INCREMENT,
  driver_id INT NOT NULL,
  sponsor_id INT NOT NULL,                      -- ADDED: sponsor context
  product_id INT NOT NULL,                      -- ID from Fake Store API
  is_hidden TINYINT(1) NOT NULL DEFAULT 1,      -- 1 = hidden, 0 = visible
  hidden_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (curation_id),
  UNIQUE KEY uq_driver_sponsor_product (driver_id, sponsor_id, product_id),  -- UPDATED
  KEY idx_curation_driver (driver_id),
  KEY idx_curation_sponsor (sponsor_id),        -- ADDED
  CONSTRAINT fk_curation_driver
    FOREIGN KEY (driver_id) REFERENCES driver(driver_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_curation_sponsor                -- ADDED
    FOREIGN KEY (sponsor_id) REFERENCES sponsor(sponsor_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- TRANSACTIONS (optionally tie to a specific driver_sponsor pair)
-- =====================================================================
CREATE TABLE transactions (
  transaction_id INT NOT NULL AUTO_INCREMENT,
  `date` DATETIME NOT NULL,
  user_id INT NOT NULL,                                -- driver's user_id
  amount DECIMAL(10,2) NOT NULL,
  item_id INT,
  driver_sponsor_id BIGINT NULL,                        -- specific pair attribution
  PRIMARY KEY (transaction_id),
  KEY idx_tx_user_id (user_id),
  KEY idx_tx_ds (driver_sponsor_id),
  CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_transactions_driver_sponsor
    FOREIGN KEY (driver_sponsor_id) REFERENCES driver_sponsor(driver_sponsor_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- AUDIT: login_log
-- =====================================================================
CREATE TABLE login_log (
  log_id BIGINT NOT NULL AUTO_INCREMENT,
  occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  user_id INT NULL,
  email_attempted VARCHAR(320) NULL,
  success TINYINT(1) NOT NULL,
  failure_reason ENUM('NO_SUCH_USER','BAD_PASSWORD','LOCKED_OUT','MFA_FAILED','EXPIRED_PASSWORD','OTHER') NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  source ENUM('WEB','MOBILE','API','ADMIN') NOT NULL DEFAULT 'WEB',
  mfa_used TINYINT(1) NOT NULL DEFAULT 0,
  request_id CHAR(36) NULL,
  session_id CHAR(36) NULL,
  PRIMARY KEY (log_id),
  KEY idx_loginlog_user_time (user_id, occurred_at),
  CONSTRAINT fk_loginlog_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- SESSIONS
-- =====================================================================
CREATE TABLE current_sessions (
  session_id CHAR(36) NOT NULL,
  user_id INT NOT NULL,
  source ENUM('WEB','MOBILE','API','ADMIN') NOT NULL DEFAULT 'WEB',
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  expires_at DATETIME(6) NOT NULL,
  PRIMARY KEY (session_id),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_exp (expires_at),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- AUDIT: change_log
-- =====================================================================
CREATE TABLE change_log (
  change_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NULL,
  change_type VARCHAR(100) NOT NULL,
  occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (change_id),
  KEY idx_changelog_user_time (user_id, occurred_at),
  CONSTRAINT fk_changelog_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- TRIGGERS: role exclusivity + lockout enforcement
-- =====================================================================
DELIMITER $$

CREATE TRIGGER trg_admin_before_insert
BEFORE INSERT ON admin
FOR EACH ROW
BEGIN
  DECLARE v_type TINYINT;
  DECLARE v_cnt INT;
  SELECT type_id INTO v_type FROM `user` WHERE user_id = NEW.user_id;
  IF v_type <> 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User type must be Admin (1).';
  END IF;
  SELECT (SELECT COUNT(*) FROM sponsor WHERE user_id = NEW.user_id)
       + (SELECT COUNT(*) FROM driver  WHERE user_id = NEW.user_id)
    INTO v_cnt;
  IF v_cnt > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already has another role.';
  END IF;
END$$

CREATE TRIGGER trg_sponsor_before_insert
BEFORE INSERT ON sponsor
FOR EACH ROW
BEGIN
  DECLARE v_type TINYINT;
  DECLARE v_cnt INT;
  SELECT type_id INTO v_type FROM `user` WHERE user_id = NEW.user_id;
  IF v_type <> 2 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User type must be Sponsor (2).';
  END IF;
  SELECT (SELECT COUNT(*) FROM admin WHERE user_id = NEW.user_id)
       + (SELECT COUNT(*) FROM driver WHERE user_id = NEW.user_id)
    INTO v_cnt;
  IF v_cnt > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already has another role.';
  END IF;
END$$

CREATE TRIGGER trg_driver_before_insert
BEFORE INSERT ON driver
FOR EACH ROW
BEGIN
  DECLARE v_type TINYINT;
  DECLARE v_cnt INT;
  SELECT type_id INTO v_type FROM `user` WHERE user_id = NEW.user_id;
  IF v_type <> 3 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User type must be Driver (3).';
  END IF;
  SELECT (SELECT COUNT(*) FROM admin WHERE user_id = NEW.user_id)
       + (SELECT COUNT(*) FROM sponsor WHERE user_id = NEW.user_id)
    INTO v_cnt;
  IF v_cnt > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already has another role.';
  END IF;
END$$

-- Lockout enforcement
CREATE TRIGGER trg_loginlog_after_insert
AFTER INSERT ON login_log
FOR EACH ROW
BEGIN
  DECLARE v_uid INT;

  SET v_uid = NEW.user_id;
  IF v_uid IS NULL AND NEW.email_attempted IS NOT NULL THEN
    SELECT u.user_id INTO v_uid
    FROM `user` u
    WHERE LOWER(u.email) = LOWER(NEW.email_attempted)
    LIMIT 1;
  END IF;

  IF v_uid IS NOT NULL THEN
    IF NEW.success = 1 THEN
      UPDATE login_info
         SET failed_attempts = 0,
             is_locked = 0,
             locked_until = NULL
       WHERE user_id = v_uid;
    ELSE
      UPDATE login_info
         SET failed_attempts = failed_attempts + 1
       WHERE user_id = v_uid;

      UPDATE login_info
         SET is_locked = 1,
             locked_until = NOW() + INTERVAL 15 MINUTE
       WHERE user_id = v_uid
         AND failed_attempts >= 5
         AND (is_locked = 0 OR locked_until IS NULL OR locked_until < NOW());
    END IF;
  END IF;
END$$

DELIMITER ;

-- =====================================================================
-- SESSION AUTO-CLEANUP EVENT
-- =====================================================================
-- Turn on once (requires privileges): SET GLOBAL event_scheduler = ON;
CREATE EVENT ev_purge_expired_sessions
ON SCHEDULE EVERY 5 MINUTE
DO
  DELETE FROM current_sessions WHERE expires_at <= NOW();

-- =====================================================================
-- SEED DATA
-- =====================================================================

-- user_type
INSERT INTO user_type (type_name) VALUES
('Admin'), ('Sponsor'), ('Driver');

-- users
INSERT INTO `user` (first_name, last_name, email, ssn, city, state, country, type_id) VALUES
('Alice','Adminson','alice.adminson@example.com','111223333','Clemson','SC','USA',1),   -- 1
('Sam','Sponsor','sam.sponsor@example.com','222334444','Greenville','SC','USA',2),      -- 2
('Sara','Sponsor','sara.sponsor@example.com','333445555','Atlanta','GA','USA',2),       -- 3
('Danny','Driver','danny.driver@example.com','444556666','Charlotte','NC','USA',3),     -- 4
('Dina','Driver','dina.driver@example.com','555667777','Charleston','SC','USA',3);      -- 5

-- user_credentials
INSERT INTO user_credentials (user_id, username, password) VALUES
(1, 'alice.adminson@example.com', 'password123'),
(2, 'sam.sponsor@example.com', 'password123'),
(3, 'sara.sponsor@example.com', 'password123'),
(4, 'danny.driver@example.com', 'password123'),
(5, 'dina.driver@example.com', 'password123');

-- login_info
INSERT INTO login_info (user_id, failed_attempts, is_locked, locked_until, security_question, security_answer) VALUES
(1, 0, 0, NULL, 'What is your favorite color?', 'Orange'),
(2, 0, 0, NULL, 'What city were you born in?', 'Columbia'),
(3, 0, 0, NULL, 'What is your favorite color?', 'Blue'),
(4, 0, 0, NULL, 'What was your first car?', 'Civic'),
(5, 0, 0, NULL, 'What is your pets name?', 'Rex');

-- roles
INSERT INTO admin (user_id, admin_permissions) VALUES (1, 1023);

INSERT INTO sponsor (user_id, name, description) VALUES
(2, 'Speedy Tires', 'Provides tire sponsorships and discounts.'),   -- sponsor_id 1
(3, 'FuelMax', 'Fuel cards and discounts for drivers.');             -- sponsor_id 2

INSERT INTO driver (user_id) VALUES
(4),  -- Danny
(5);  -- Dina

-- driver_sponsor relations with per-pair balances
-- Danny: Speedy Tires ($150), FuelMax ($25)
INSERT INTO driver_sponsor (driver_id, sponsor_id, balance, status, since_at)
VALUES
((SELECT driver_id FROM driver WHERE user_id=4), 1, 150.00, 'ACTIVE', NOW()),
((SELECT driver_id FROM driver WHERE user_id=4), 2,  25.00, 'ACTIVE', NOW());

-- Dina: FuelMax ($200)
INSERT INTO driver_sponsor (driver_id, sponsor_id, balance, status, since_at)
VALUES
((SELECT driver_id FROM driver WHERE user_id=5), 2, 200.00, 'ACTIVE', NOW());

-- transactions with optional attribution to specific driver_sponsor rows
INSERT INTO transactions (`date`, user_id, amount, item_id, driver_sponsor_id) VALUES
('2025-06-01 10:30:00', 4, -25.00, 101, NULL),  -- out-of-pocket or unassigned
('2025-06-02 11:15:00', 5, -30.00, 102, NULL),
('2025-06-03 09:00:00', 4, 100.00, 201,
  (SELECT ds.driver_sponsor_id FROM driver_sponsor ds
     JOIN driver d ON d.driver_id = ds.driver_id
   WHERE d.user_id = 4 AND ds.sponsor_id = 1)), -- Speedy Tires -> Danny
('2025-06-04 14:20:00', 5,  50.00, 202,
  (SELECT ds.driver_sponsor_id FROM driver_sponsor ds
     JOIN driver d ON d.driver_id = ds.driver_id
   WHERE d.user_id = 5 AND ds.sponsor_id = 2)), -- FuelMax -> Dina
('2025-06-05 16:45:00', 4, -10.00, 103, NULL);