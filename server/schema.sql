CREATE TABLE IF NOT EXISTS user (
  name_id VARCHAR(32) NOT NULL,
  password_hash CHAR(60) NOT NULL,
  PRIMARY KEY (name_id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS device (
  name_id VARCHAR(32) NOT NULL, 
  passkey_hash CHAR(60) DEFAULT NULL,
  last_online TIMESTAMP(3) DEFAULT NULL,
  PRIMARY KEY (name_id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tab_event (
  device_name_id VARCHAR(32) NOT NULL,
  tab_id INT NOT NULL,
  event_type ENUM('created', 'activated', 'updated', 'removed') NOT NULL,
  event_timestamp TIMESTAMP(3) NOT NULL,
  tab_url VARCHAR(2083),
  tab_title VARCHAR(1024),
  PRIMARY KEY (device_name_id, tab_id, event_type, event_timestamp)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS connection_code (
  code CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (code)
) ENGINE = InnoDB;