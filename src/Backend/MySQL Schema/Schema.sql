-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: cpsc4910-f25.cobd8enwsupz.us-east-1.rds.amazonaws.com    Database: Team03_DB
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `about_info`
--

DROP TABLE IF EXISTS `about_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `about_info` (
  `index` int NOT NULL AUTO_INCREMENT,
  `team_number` varchar(10) NOT NULL,
  `version_number` varchar(20) NOT NULL,
  `release_date` date NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `product_description` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`index`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `about_info`
--

LOCK TABLES `about_info` WRITE;
/*!40000 ALTER TABLE `about_info` DISABLE KEYS */;
INSERT INTO `about_info` VALUES (1,'03','Sprint 1','2025-09-16','Driver Incentive program','This is a web application that allows drivers to track their driving habits and earn rewards for safe driving.','2025-09-16 13:27:33','2025-09-16 13:27:33'),(2,'Team03','Sprint 2','2025-09-23','Driver Incentive program','This is a web application that allows drivers to track their driving habits and earn rewards for safe driving.','2025-09-23 18:36:07','2025-09-23 18:36:07'),(3,'03','Sprint 3','2025-09-30','Driver Incentive program','This is a web application that allows drivers to track their driving habits and earn rewards for safe driving.','2025-09-29 20:34:49','2025-09-29 20:34:49'),(4,'03','Sprint 4','2025-10-07','Driver Incentive program','This is a web application that allows drivers to track their driving habits and earn rewards for safe driving.','2025-10-20 22:43:51','2025-10-20 22:43:51'),(5,'03','Sprint 5','2025-10-14','Driver Incentive program','This is a web application that allows drivers to track their driving habits and earn rewards for safe driving.','2025-10-20 22:44:08','2025-10-20 22:44:08'),(6,'03','Sprint 6','2025-10-21','Driver Incentive program','This is a web application that allows drivers to track their driving habits and earn rewards for safe driving.','2025-10-20 22:44:28','2025-10-20 22:44:28'),(7,'03','Sprint 7','2025-10-28','Driver Incentive Program','This is a web application that allows drivers to track their driving habits and earn rewards for safe driving.','2025-10-28 18:26:31','2025-10-28 18:26:31'),(8,'03','Sprint 8','2025-11-03','Driver Incentive Program','This is a web application that allows drivers to track their driving habits and earn rewards for safe driving.','2025-11-10 13:36:36','2025-11-10 13:36:36'),(9,'03','Sprint 9','2025-11-11','Driver Incentive Program','This is a web application that allows drivers to track their driving habits and earn rewards for safe driving.','2025-11-11 00:00:00','2025-11-11 00:00:00'),(10,'03','Sprint 10','2025-11-15','Driver Incentive Program','A web application that allows sponsors to manage driver incentive programs with point-based rewards.','2025-11-15 21:12:58','2025-11-15 21:12:58'),(16,'03','Sprint 11','2025-12-01','Driver Incentive Program','A web application that allows sponsors to manage driver incentive programs with point-based rewards.','2025-12-01 01:02:40','2025-12-01 01:02:40');
/*!40000 ALTER TABLE `about_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_changes`
--

DROP TABLE IF EXISTS `account_changes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_changes` (
  `change_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `change_type` enum('PASSWORD','ACCOUNT_DETAILS') NOT NULL,
  `changed_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`change_id`),
  KEY `idx_ac_user_time` (`user_id`,`changed_at`),
  CONSTRAINT `fk_account_changes_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_changes`
--

LOCK TABLES `account_changes` WRITE;
/*!40000 ALTER TABLE `account_changes` DISABLE KEYS */;
INSERT INTO `account_changes` VALUES (1,4,'PASSWORD','2025-11-11 16:21:02.645698');
/*!40000 ALTER TABLE `account_changes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `admin_permissions` int DEFAULT NULL,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `uq_admin_user` (`user_id`),
  CONSTRAINT `fk_admin_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,1,1023);
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alert_type_definitions`
--

DROP TABLE IF EXISTS `alert_type_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alert_type_definitions` (
  `alert_type_id` tinyint NOT NULL AUTO_INCREMENT,
  `alert_type` enum('BALANCE_CHANGE','ACCOUNT_CHANGE','SPONSORSHIP_CHANGE') NOT NULL,
  `message_template` varchar(255) NOT NULL,
  PRIMARY KEY (`alert_type_id`),
  UNIQUE KEY `alert_type` (`alert_type`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alert_type_definitions`
--

LOCK TABLES `alert_type_definitions` WRITE;
/*!40000 ALTER TABLE `alert_type_definitions` DISABLE KEYS */;
INSERT INTO `alert_type_definitions` VALUES (1,'BALANCE_CHANGE','Your balance was updated.'),(2,'ACCOUNT_CHANGE','Your account settings were updated.'),(3,'SPONSORSHIP_CHANGE','Your sponsorship status was updated.');
/*!40000 ALTER TABLE `alert_type_definitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alerts`
--

DROP TABLE IF EXISTS `alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alerts` (
  `alert_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `alert_type_id` tinyint NOT NULL,
  `date_created` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `seen` tinyint(1) NOT NULL DEFAULT '0',
  `related_id` bigint DEFAULT NULL,
  `details` text,
  PRIMARY KEY (`alert_id`),
  KEY `idx_alerts_user_seen` (`user_id`,`seen`),
  KEY `idx_alerts_created` (`date_created`),
  KEY `fk_alerts_type` (`alert_type_id`),
  CONSTRAINT `fk_alerts_type` FOREIGN KEY (`alert_type_id`) REFERENCES `alert_type_definitions` (`alert_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_alerts_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alerts`
--

LOCK TABLES `alerts` WRITE;
/*!40000 ALTER TABLE `alerts` DISABLE KEYS */;
INSERT INTO `alerts` VALUES (1,4,1,'2025-11-11 16:21:02.618226',0,1,'Manual adjustment +$10 rebate'),(2,4,2,'2025-11-11 16:21:02.645698',0,1,'Account change: PASSWORD'),(3,4,3,'2025-11-11 16:21:02.670695',0,1,'Sponsorship update: status ACTIVE → PENDING (reason: Awaiting verification)'),(4,4,3,'2025-11-12 17:52:59.055427',0,1,'Sponsorship update: status PENDING → ACTIVE'),(5,7,3,'2025-11-12 17:53:08.812701',0,4,'Sponsorship update: status PENDING → ACTIVE'),(6,9,3,'2025-11-13 00:40:09.624356',0,5,'Sponsorship update: status PENDING → ACTIVE'),(8,9,3,'2025-11-14 19:36:30.845110',0,5,'Sponsorship update: status ACTIVE → INACTIVE'),(10,4,3,'2025-11-18 19:44:13.343451',0,1,'Sponsorship update: status ACTIVE → INACTIVE'),(12,4,3,'2025-11-18 19:46:20.042188',0,2,'Sponsorship update: status ACTIVE → INACTIVE'),(14,5,3,'2025-11-18 19:55:00.901581',0,12,'Sponsorship update: status PENDING → ACTIVE'),(15,4,3,'2025-11-20 14:35:01.080075',0,2,'Sponsorship update: status INACTIVE → PENDING'),(16,4,3,'2025-11-20 14:35:29.855165',0,2,'Sponsorship update: status PENDING → ACTIVE'),(17,5,1,'2025-11-30 22:50:22.676988',0,2,'Testing2'),(18,4,3,'2025-12-01 00:21:55.296097',0,1,'Sponsorship update: status INACTIVE → PENDING'),(19,4,3,'2025-12-01 00:22:14.992962',0,1,'Sponsorship update: status PENDING → ACTIVE'),(22,4,1,'2025-12-01 00:29:37.873085',0,5,'Purchase - Order #3'),(23,4,2,'2025-12-01 00:29:37.000000',0,3,'Order #3 has been placed successfully! Total: 69500 points. Status: PENDING'),(25,4,1,'2025-12-01 00:44:15.675985',0,7,'Order #3 cancelled: Cancelled by user'),(26,4,2,'2025-12-01 00:44:15.000000',0,3,'Order #3 has been cancelled. 69500 points have been refunded to your account.'),(27,4,1,'2025-12-01 00:45:49.227071',0,8,'Purchase - Order #4'),(28,4,2,'2025-12-01 00:45:49.000000',0,4,'Order #4 has been placed successfully! Total: 69500 points. Status: PENDING'),(29,4,2,'2025-12-01 00:53:56.000000',0,4,'Your order #4 is now being processed.'),(30,4,2,'2025-12-01 00:54:07.000000',0,4,'Your order #4 has been shipped!'),(31,4,2,'2025-12-01 00:54:17.000000',0,4,'Your order #4 has been delivered!'),(32,4,1,'2025-12-01 00:56:24.049775',0,9,'Purchase - Order #5'),(33,4,2,'2025-12-01 00:56:24.000000',0,5,'Order #5 has been placed successfully! Total: 86300 points. Status: PENDING'),(34,4,1,'2025-12-01 00:58:56.330046',0,10,'Order #5 cancelled: Cancelled by user'),(35,4,2,'2025-12-01 00:58:56.000000',0,5,'Order #5 has been cancelled. 86300 points have been refunded to your account.');
/*!40000 ALTER TABLE `alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `change_log`
--

DROP TABLE IF EXISTS `change_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `change_log` (
  `change_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `change_type` varchar(100) NOT NULL,
  `occurred_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`change_id`),
  KEY `idx_changelog_user_time` (`user_id`,`occurred_at`),
  CONSTRAINT `fk_changelog_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `change_log`
--

LOCK TABLES `change_log` WRITE;
/*!40000 ALTER TABLE `change_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `change_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `current_sessions`
--

DROP TABLE IF EXISTS `current_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `current_sessions` (
  `session_id` char(36) NOT NULL,
  `user_id` int NOT NULL,
  `source` enum('WEB','MOBILE','API','ADMIN') NOT NULL DEFAULT 'WEB',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `last_seen_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `expires_at` datetime(6) NOT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_exp` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `current_sessions`
--

LOCK TABLES `current_sessions` WRITE;
/*!40000 ALTER TABLE `current_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `current_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver`
--

DROP TABLE IF EXISTS `driver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver` (
  `driver_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  PRIMARY KEY (`driver_id`),
  UNIQUE KEY `uq_driver_user` (`user_id`),
  CONSTRAINT `fk_driver_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver`
--

LOCK TABLES `driver` WRITE;
/*!40000 ALTER TABLE `driver` DISABLE KEYS */;
INSERT INTO `driver` VALUES (1,4),(2,5),(3,6),(4,7),(6,9),(12,21),(13,23),(14,24),(15,25);
/*!40000 ALTER TABLE `driver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_balance_changes`
--

DROP TABLE IF EXISTS `driver_balance_changes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_balance_changes` (
  `balance_change_id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` int NOT NULL,
  `sponsor_id` int NOT NULL,
  `reason` text,
  `points_change` decimal(10,2) NOT NULL DEFAULT '0.00',
  `balance_after` decimal(10,2) NOT NULL DEFAULT '0.00',
  `changed_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`balance_change_id`),
  KEY `idx_dbc_driver_time` (`driver_id`,`changed_at`),
  KEY `idx_dbc_sponsor` (`sponsor_id`),
  CONSTRAINT `fk_dbc_driver` FOREIGN KEY (`driver_id`) REFERENCES `driver` (`driver_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dbc_sponsor` FOREIGN KEY (`sponsor_id`) REFERENCES `sponsor` (`sponsor_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_balance_changes`
--

LOCK TABLES `driver_balance_changes` WRITE;
/*!40000 ALTER TABLE `driver_balance_changes` DISABLE KEYS */;
INSERT INTO `driver_balance_changes` VALUES (1,1,1,'Manual adjustment +$10 rebate',0.00,0.00,'2025-11-11 16:21:02.618226'),(2,2,1,'Testing2',-200.00,300.00,'2025-11-30 22:50:22.676988'),(5,1,1,'Purchase - Order #3',-695.00,98766.05,'2025-12-01 00:29:37.873085'),(7,1,1,'Order #3 cancelled: Cancelled by user',695.00,99461.05,'2025-12-01 00:44:15.675985'),(8,1,1,'Purchase - Order #4',-695.00,98766.05,'2025-12-01 00:45:49.227071'),(9,1,1,'Purchase - Order #5',-863.00,97903.05,'2025-12-01 00:56:24.049775'),(10,1,1,'Order #5 cancelled: Cancelled by user',863.00,98766.05,'2025-12-01 00:58:56.330046');
/*!40000 ALTER TABLE `driver_balance_changes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_sponsor`
--

DROP TABLE IF EXISTS `driver_sponsor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_sponsor` (
  `driver_sponsor_id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` int NOT NULL,
  `sponsor_id` int NOT NULL,
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('ACTIVE','INACTIVE','PENDING') NOT NULL DEFAULT 'ACTIVE',
  `last_change_reason` text,
  `since_at` datetime DEFAULT NULL,
  `until_at` datetime DEFAULT NULL,
  PRIMARY KEY (`driver_sponsor_id`),
  UNIQUE KEY `uq_driver_sponsor_pair` (`driver_id`,`sponsor_id`),
  KEY `idx_driver` (`driver_id`),
  KEY `idx_sponsor` (`sponsor_id`),
  CONSTRAINT `fk_ds_driver` FOREIGN KEY (`driver_id`) REFERENCES `driver` (`driver_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ds_sponsor` FOREIGN KEY (`sponsor_id`) REFERENCES `sponsor` (`sponsor_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_sponsor`
--

LOCK TABLES `driver_sponsor` WRITE;
/*!40000 ALTER TABLE `driver_sponsor` DISABLE KEYS */;
INSERT INTO `driver_sponsor` VALUES (1,1,1,98071.05,'ACTIVE','Awaiting verification','2025-12-01 00:22:14',NULL),(2,1,2,25.00,'ACTIVE','Initial linkage','2025-11-20 14:35:29',NULL),(3,2,2,200.00,'ACTIVE','Initial linkage','2025-11-11 16:21:02',NULL),(4,4,1,5000.00,'ACTIVE',NULL,'2025-11-12 17:53:08',NULL),(5,6,2,0.00,'INACTIVE',NULL,'2025-11-13 00:40:09',NULL),(12,2,1,300.00,'ACTIVE',NULL,'2025-11-18 19:55:00',NULL),(19,12,1,0.00,'ACTIVE',NULL,'2025-11-30 22:11:50',NULL),(22,15,1,0.00,'ACTIVE',NULL,'2025-11-30 22:18:45',NULL);
/*!40000 ALTER TABLE `driver_sponsor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_info`
--

DROP TABLE IF EXISTS `login_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_info` (
  `user_id` int NOT NULL,
  `failed_attempts` int NOT NULL DEFAULT '0',
  `is_locked` tinyint(1) NOT NULL DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  `security_question` varchar(255) NOT NULL,
  `security_answer` varchar(255) NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_login_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_info`
--

LOCK TABLES `login_info` WRITE;
/*!40000 ALTER TABLE `login_info` DISABLE KEYS */;
INSERT INTO `login_info` VALUES (1,0,0,NULL,'What is your favorite color?','Orange'),(2,0,0,NULL,'What city were you born in?','Columbia'),(3,0,0,NULL,'What is your favorite color?','Blue'),(4,0,0,NULL,'What was your first car?','Civic'),(5,0,0,NULL,'What is your pets name?','Rex'),(6,1,0,NULL,'Default question','Default answer'),(7,0,0,NULL,'Default question','Default answer'),(9,0,0,NULL,'What is your favorite color?','blue'),(21,0,0,NULL,'Default question','Default answer'),(22,0,0,NULL,'Default question','Default answer'),(23,0,0,NULL,'Default question','Default answer'),(24,0,0,NULL,'Default question','Default answer'),(25,0,0,NULL,'Default question','Default answer');
/*!40000 ALTER TABLE `login_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_log`
--

DROP TABLE IF EXISTS `login_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_log` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `occurred_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `user_id` int DEFAULT NULL,
  `email_attempted` varchar(320) DEFAULT NULL,
  `success` tinyint(1) NOT NULL,
  `failure_reason` enum('NO_SUCH_USER','BAD_PASSWORD','LOCKED_OUT','MFA_FAILED','EXPIRED_PASSWORD','OTHER') DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `source` enum('WEB','MOBILE','API','ADMIN') NOT NULL DEFAULT 'WEB',
  `mfa_used` tinyint(1) NOT NULL DEFAULT '0',
  `request_id` char(36) DEFAULT NULL,
  `session_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `idx_loginlog_user_time` (`user_id`,`occurred_at`),
  CONSTRAINT `fk_loginlog_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=253 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_log`
--

LOCK TABLES `login_log` WRITE;
/*!40000 ALTER TABLE `login_log` DISABLE KEYS */;
INSERT INTO `login_log` VALUES (1,'2025-11-11 16:23:39.554693',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(2,'2025-11-11 16:24:16.593044',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(3,'2025-11-11 16:41:23.552053',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(4,'2025-11-11 17:03:08.627678',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(5,'2025-11-11 17:13:47.194824',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(6,'2025-11-11 17:16:45.623690',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(7,'2025-11-11 17:19:42.600363',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(8,'2025-11-11 17:23:45.565454',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(9,'2025-11-11 17:27:21.256796',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(10,'2025-11-11 17:27:26.317954',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(11,'2025-11-11 17:29:00.439989',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(12,'2025-11-11 17:30:54.365311',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(13,'2025-11-11 17:31:48.312915',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(14,'2025-11-11 17:35:31.679042',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(15,'2025-11-11 17:37:11.277125',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(16,'2025-11-11 17:40:31.083115',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(17,'2025-11-11 18:02:29.790148',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(18,'2025-11-11 18:03:48.567633',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(19,'2025-11-11 18:15:18.530287',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(20,'2025-11-11 18:16:11.958845',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(21,'2025-11-11 18:26:30.892213',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(22,'2025-11-11 18:26:46.714068',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(23,'2025-11-11 18:31:46.806313',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(24,'2025-11-11 18:31:47.052578',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(25,'2025-11-11 18:34:13.148115',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(26,'2025-11-11 18:35:53.973856',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(27,'2025-11-11 19:02:22.935697',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(28,'2025-11-11 19:02:35.562134',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(29,'2025-11-11 19:05:14.087988',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(30,'2025-11-11 19:05:20.826444',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(31,'2025-11-11 19:05:32.947503',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(32,'2025-11-11 19:08:18.279407',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(33,'2025-11-11 19:10:49.896285',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(34,'2025-11-11 19:10:58.876617',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(35,'2025-11-11 19:11:23.675701',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(36,'2025-11-11 19:11:53.437791',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(37,'2025-11-11 19:26:55.214373',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(38,'2025-11-11 19:27:46.731158',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(39,'2025-11-11 19:28:05.716280',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(40,'2025-11-11 19:31:03.789353',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(41,'2025-11-11 19:32:51.694108',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(42,'2025-11-11 19:38:14.364656',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(43,'2025-11-11 19:40:11.045630',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(44,'2025-11-11 19:45:06.230519',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(45,'2025-11-11 19:46:10.195186',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(46,'2025-11-11 19:47:14.934057',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(47,'2025-11-11 19:47:40.886027',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(48,'2025-11-11 19:47:52.091843',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(49,'2025-11-11 19:49:10.645439',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(50,'2025-11-11 20:16:24.138141',5,'dina.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(51,'2025-11-12 14:21:03.442422',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(52,'2025-11-12 14:52:00.904747',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(53,'2025-11-12 14:53:49.622885',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(54,'2025-11-12 15:02:04.316288',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(55,'2025-11-12 15:29:45.603172',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(56,'2025-11-12 15:30:01.614519',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(57,'2025-11-12 15:30:42.211913',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(58,'2025-11-12 15:31:16.809224',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(59,'2025-11-12 16:17:12.903402',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(60,'2025-11-12 16:18:46.322515',NULL,'danny.driver@example.com',0,'OTHER','172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(61,'2025-11-12 16:40:19.639937',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(62,'2025-11-12 16:43:20.745224',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(63,'2025-11-12 16:44:09.544924',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(64,'2025-11-12 16:46:03.126110',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(65,'2025-11-12 16:50:17.736725',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(66,'2025-11-12 16:50:31.446564',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(67,'2025-11-12 16:50:40.666757',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(68,'2025-11-12 17:32:40.110484',6,'test',0,'BAD_PASSWORD','172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(69,'2025-11-12 17:38:06.966391',7,'test1@test.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(70,'2025-11-12 17:39:43.343016',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(71,'2025-11-12 17:40:00.157695',7,'test1@test.com',0,'BAD_PASSWORD','172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(72,'2025-11-12 17:40:03.649504',7,'test1@test.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(73,'2025-11-12 17:40:17.447816',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(74,'2025-11-12 17:40:24.619803',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(75,'2025-11-12 17:40:31.771381',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(76,'2025-11-12 18:02:18.297931',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(77,'2025-11-12 18:02:31.320667',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(78,'2025-11-12 18:02:35.533973',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(79,'2025-11-12 18:28:26.885877',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(80,'2025-11-12 18:28:53.324537',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(81,'2025-11-12 18:29:01.386325',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(82,'2025-11-12 18:29:37.950626',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(83,'2025-11-12 18:30:29.077438',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(84,'2025-11-12 18:30:36.976482',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(85,'2025-11-12 18:30:51.906266',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(86,'2025-11-12 18:51:18.571398',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(87,'2025-11-12 18:59:35.179133',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(88,'2025-11-12 19:00:10.439166',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(89,'2025-11-12 19:00:26.434862',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(90,'2025-11-12 19:00:57.199602',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(91,'2025-11-12 19:03:28.533243',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(92,'2025-11-12 19:09:50.676529',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(93,'2025-11-12 19:10:20.667364',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(94,'2025-11-12 19:10:33.241830',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(95,'2025-11-12 19:29:42.949725',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(96,'2025-11-12 19:31:59.599241',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(97,'2025-11-12 19:48:35.534022',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(98,'2025-11-12 19:49:00.303796',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(99,'2025-11-12 19:49:05.310947',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(100,'2025-11-12 19:49:28.855840',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(101,'2025-11-12 19:49:32.100980',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(102,'2025-11-12 19:57:05.047535',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(103,'2025-11-12 19:57:21.883197',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(104,'2025-11-12 19:57:43.656634',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(105,'2025-11-12 20:07:12.381436',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(106,'2025-11-12 20:29:25.687465',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(107,'2025-11-12 20:35:16.494574',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(108,'2025-11-12 20:41:12.463406',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(109,'2025-11-12 20:54:22.703852',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(110,'2025-11-12 20:58:41.588620',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(111,'2025-11-12 21:07:05.359944',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(112,'2025-11-12 21:08:55.803329',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(113,'2025-11-12 21:09:09.200316',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(114,'2025-11-12 21:23:05.296339',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(115,'2025-11-12 21:26:32.638849',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(116,'2025-11-12 21:40:02.901834',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(117,'2025-11-12 21:40:26.127741',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(118,'2025-11-12 21:40:55.865986',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(119,'2025-11-13 00:08:58.412360',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(120,'2025-11-13 00:36:22.065236',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36','WEB',0,'',''),(121,'2025-11-13 14:49:37.934344',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(122,'2025-11-13 15:00:57.229090',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(123,'2025-11-13 15:01:09.130221',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(124,'2025-11-13 19:02:24.116997',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(125,'2025-11-13 19:04:54.863700',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(126,'2025-11-13 19:06:56.132510',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(127,'2025-11-13 19:07:17.461416',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(128,'2025-11-13 19:27:46.445600',NULL,'jill@mail.com',0,'BAD_PASSWORD','172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(129,'2025-11-13 19:27:59.069826',NULL,'jill@mail.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(130,'2025-11-13 19:28:15.165690',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(131,'2025-11-13 19:28:22.143187',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(132,'2025-11-13 19:29:43.406477',NULL,'tom887@gmail.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(133,'2025-11-13 19:29:54.442450',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(134,'2025-11-13 19:30:33.003640',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(135,'2025-11-13 19:31:21.501314',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(136,'2025-11-14 19:20:04.046871',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(137,'2025-11-14 19:20:47.183015',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(138,'2025-11-14 19:21:06.581993',NULL,'tom887@gmail.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(139,'2025-11-14 19:21:13.993501',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(140,'2025-11-14 20:06:30.746989',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(141,'2025-11-14 20:24:53.808234',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(142,'2025-11-14 20:25:22.271240',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(143,'2025-11-14 20:38:52.960150',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(144,'2025-11-14 20:57:42.366525',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(145,'2025-11-14 21:09:27.331115',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(146,'2025-11-14 21:12:28.542371',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(147,'2025-11-14 21:12:36.404950',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(148,'2025-11-15 20:13:19.057157',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(149,'2025-11-15 20:17:21.115880',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(150,'2025-11-15 20:34:20.674355',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(151,'2025-11-15 20:35:51.776770',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(152,'2025-11-15 21:14:08.908954',4,'danny.driver@example.com',1,NULL,'153.33.26.126','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(153,'2025-11-15 21:15:14.879228',1,'alice.adminson@example.com',1,NULL,'153.33.26.126','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(154,'2025-11-18 18:18:45.535586',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(155,'2025-11-18 19:08:14.960473',1,'alice.adminson@example.com',1,NULL,'130.127.255.210','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(156,'2025-11-18 19:20:20.012751',4,'danny.driver@example.com',1,NULL,'130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(157,'2025-11-18 19:21:10.039613',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(158,'2025-11-18 19:21:17.415127',4,'danny.driver@example.com',1,NULL,'130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(159,'2025-11-18 19:22:12.491095',1,'alice.adminson@example.com',1,NULL,'130.127.255.210','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(160,'2025-11-18 19:22:14.010730',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(161,'2025-11-18 19:22:21.495335',4,'danny.driver@example.com',1,NULL,'130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(162,'2025-11-18 19:23:17.017101',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(163,'2025-11-18 19:23:50.480518',4,'danny.driver@example.com',1,NULL,'130.127.255.210','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(164,'2025-11-18 19:27:15.026608',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(165,'2025-11-18 19:31:28.810646',2,'sam.sponsor@example.com',1,NULL,'130.127.255.210','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(166,'2025-11-18 19:33:52.721295',1,'alice.adminson@example.com',1,NULL,'130.127.255.210','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(167,'2025-11-18 19:37:06.133077',2,'sam.sponsor@example.com',1,NULL,'130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(168,'2025-11-18 19:40:41.154148',1,'alice.adminson@example.com',1,NULL,'130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(169,'2025-11-18 19:42:17.852137',NULL,'tom887@example.com',0,'NO_SUCH_USER','130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(170,'2025-11-18 19:42:24.592622',NULL,'tom887@gmail.com',0,'BAD_PASSWORD','130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(171,'2025-11-18 19:42:57.698802',NULL,'tom887@gmail.com',0,'BAD_PASSWORD','130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(172,'2025-11-18 19:44:08.888594',4,'danny.driver@example.com',1,NULL,'130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(173,'2025-11-18 19:44:34.418419',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(174,'2025-11-18 19:44:54.245410',2,'sam.sponsor@example.com',1,NULL,'130.127.255.210','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(175,'2025-11-18 19:46:16.509537',3,'sara.sponsor@example.com',1,NULL,'130.127.255.210','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(176,'2025-11-18 19:46:16.776198',NULL,'joe@example.com',0,'BAD_PASSWORD','130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(177,'2025-11-18 19:46:25.667137',NULL,'joe@example.com',1,NULL,'130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(178,'2025-11-18 19:51:22.065371',3,'sara.sponsor@example.com',1,NULL,'130.127.255.210','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(179,'2025-11-18 19:51:58.949133',1,'alice.adminson@example.com',1,NULL,'130.127.255.212','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0','WEB',0,'',''),(180,'2025-11-18 19:52:35.044537',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(181,'2025-11-18 19:53:11.437515',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(182,'2025-11-18 19:53:29.499740',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(183,'2025-11-18 19:53:48.740880',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(184,'2025-11-18 19:54:43.917273',5,'dina.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(185,'2025-11-18 19:54:56.920451',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(186,'2025-11-18 19:55:08.554393',5,'dina.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(187,'2025-11-18 19:55:39.262714',NULL,'jill@mail.com',0,'NO_SUCH_USER','172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(188,'2025-11-18 19:56:47.935120',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(189,'2025-11-18 19:57:48.486751',5,'dina.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(190,'2025-11-18 19:58:12.204050',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(191,'2025-11-18 19:58:32.166473',NULL,'tom887@gmail.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(192,'2025-11-18 19:59:47.081974',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(193,'2025-11-18 20:01:08.941317',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(194,'2025-11-18 20:02:34.437284',5,'dina.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(195,'2025-11-18 20:03:51.099938',5,'dina.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(196,'2025-11-20 14:18:47.671182',1,'alice.adminson@example.com',1,NULL,'130.127.255.210','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(197,'2025-11-20 14:27:08.436947',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(198,'2025-11-20 14:29:38.384347',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(199,'2025-11-20 14:35:17.454320',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(200,'2025-11-20 14:35:57.633563',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(201,'2025-11-20 14:53:51.807582',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(202,'2025-11-20 19:07:27.251676',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(203,'2025-11-20 19:28:58.169112',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(204,'2025-11-20 19:33:39.237613',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(205,'2025-11-20 23:55:06.198243',1,'alice.adminson@example.com',1,NULL,'50.36.46.59','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(206,'2025-11-20 23:55:43.506581',1,'alice.adminson@example.com',1,NULL,'50.36.46.59','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(207,'2025-11-20 23:56:14.299988',2,'sam.sponsor@example.com',1,NULL,'50.36.46.59','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(208,'2025-11-20 23:56:37.962224',4,'danny.driver@example.com',1,NULL,'50.36.46.59','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(209,'2025-11-20 23:59:33.507225',4,'danny.driver@example.com',1,NULL,'50.36.46.59','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(210,'2025-11-30 15:01:54.940871',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(211,'2025-11-30 21:07:01.636632',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0','WEB',0,'',''),(212,'2025-11-30 21:10:34.994388',NULL,'alice.admin@example.com',0,'NO_SUCH_USER','172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0','WEB',0,'',''),(213,'2025-11-30 21:10:42.710163',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0','WEB',0,'',''),(214,'2025-11-30 22:17:05.048051',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0','WEB',0,'',''),(215,'2025-11-30 22:21:14.513260',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0','WEB',0,'',''),(216,'2025-11-30 22:24:10.942532',4,'danny.driver@example.com',0,'BAD_PASSWORD','172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(217,'2025-11-30 22:24:40.886476',4,'danny.driver@example.com',0,'BAD_PASSWORD','172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(218,'2025-11-30 22:24:49.742425',NULL,'user',0,'NO_SUCH_USER','172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(219,'2025-11-30 22:24:48.850505',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0','WEB',0,'',''),(220,'2025-11-30 22:25:05.788628',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(221,'2025-11-30 22:25:33.685347',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(222,'2025-11-30 22:49:54.191722',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0','WEB',0,'',''),(223,'2025-11-30 22:53:00.613975',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(224,'2025-11-30 23:42:13.286819',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(225,'2025-11-30 23:42:22.708898',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(226,'2025-11-30 23:42:43.729938',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(227,'2025-12-01 00:18:50.870538',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(228,'2025-12-01 00:21:01.193710',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(229,'2025-12-01 00:21:54.246276',2,'sam.sponsor@example.com',1,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(230,'2025-12-01 00:22:05.173502',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(231,'2025-12-01 00:22:09.422985',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(232,'2025-12-01 00:22:23.032348',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(233,'2025-12-01 00:29:04.912846',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(234,'2025-12-01 00:30:40.435879',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(235,'2025-12-01 00:32:38.740101',2,'sam.sponsor@example.com',0,'BAD_PASSWORD','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(236,'2025-12-01 00:32:40.628864',2,'sam.sponsor@example.com',1,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(237,'2025-12-01 00:32:59.646078',2,'sam.sponsor@example.com',1,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(238,'2025-12-01 00:37:00.757791',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(239,'2025-12-01 00:37:06.857136',2,'sam.sponsor@example.com',1,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(240,'2025-12-01 00:39:28.530022',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(241,'2025-12-01 00:39:52.645468',1,'alice.adminson@example.com',0,'BAD_PASSWORD','172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(242,'2025-12-01 00:39:56.633160',1,'alice.adminson@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(243,'2025-12-01 00:44:08.137444',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(244,'2025-12-01 00:45:20.084165',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(245,'2025-12-01 00:45:37.205244',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(246,'2025-12-01 00:46:06.166990',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(247,'2025-12-01 00:53:56.289448',2,'sam.sponsor@example.com',1,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(248,'2025-12-01 00:55:56.811909',4,'danny.driver@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(249,'2025-12-01 00:56:43.240622',3,'sara.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(250,'2025-12-01 00:56:47.686961',2,'sam.sponsor@example.com',1,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(251,'2025-12-01 00:56:48.685246',2,'sam.sponsor@example.com',1,NULL,'172.17.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'',''),(252,'2025-12-01 01:05:13.685058',4,'danny.driver@example.com',1,NULL,'172.59.219.119','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','WEB',0,'','');
/*!40000 ALTER TABLE `login_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `points_per_item` int NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (3,3,5,1,69500),(4,4,5,1,69500),(5,5,5,1,69500),(6,5,6,1,16800);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `driver_id` int NOT NULL,
  `sponsor_id` int NOT NULL,
  `total_points` int NOT NULL,
  `status` enum('PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED') DEFAULT 'PENDING',
  `tracking_number` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  KEY `driver_id` (`driver_id`),
  KEY `sponsor_id` (`sponsor_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `driver` (`driver_id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`sponsor_id`) REFERENCES `sponsor` (`sponsor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (3,1,1,69500,'CANCELLED',NULL,'Cancelled: Cancelled by user','2025-12-01 00:29:37','2025-12-01 00:44:15'),(4,1,1,69500,'DELIVERED',NULL,NULL,'2025-12-01 00:45:49','2025-12-01 00:54:17'),(5,1,1,86300,'CANCELLED',NULL,'Cancelled: Cancelled by user','2025-12-01 00:56:23','2025-12-01 00:58:56');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization`
--

DROP TABLE IF EXISTS `organization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization` (
  `organization_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`organization_id`),
  UNIQUE KEY `uq_organization_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization`
--

LOCK TABLES `organization` WRITE;
/*!40000 ALTER TABLE `organization` DISABLE KEYS */;
INSERT INTO `organization` VALUES (3,'Existing Organization'),(6,'New Organization'),(7,'NewOrganization2');
/*!40000 ALTER TABLE `organization` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sponsor`
--

DROP TABLE IF EXISTS `sponsor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sponsor` (
  `sponsor_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `allowed_categories` text,
  PRIMARY KEY (`sponsor_id`),
  UNIQUE KEY `uq_sponsor_user` (`user_id`),
  CONSTRAINT `fk_sponsor_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sponsor`
--

LOCK TABLES `sponsor` WRITE;
/*!40000 ALTER TABLE `sponsor` DISABLE KEYS */;
INSERT INTO `sponsor` VALUES (1,2,'Speedy Tires','Provides tire sponsorships and discounts.','[\"electronics\", \"jewelery\"]'),(2,3,'FuelMax','Fuel cards and discounts for drivers.','[\"electronics\", \"jewelery\", \"men\'s clothing\"]'),(10,22,'New Organization','Sponsor user for org \'New Organization\' (admin import)',NULL);
/*!40000 ALTER TABLE `sponsor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `user_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `item_id` int DEFAULT NULL,
  `driver_sponsor_id` bigint DEFAULT NULL,
  PRIMARY KEY (`transaction_id`),
  KEY `idx_tx_user_id` (`user_id`),
  KEY `idx_tx_ds` (`driver_sponsor_id`),
  CONSTRAINT `fk_transactions_driver_sponsor` FOREIGN KEY (`driver_sponsor_id`) REFERENCES `driver_sponsor` (`driver_sponsor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,'2025-06-01 10:30:00',4,-25.00,101,NULL),(2,'2025-06-02 11:15:00',5,-30.00,102,NULL),(3,'2025-06-03 09:00:00',4,100.00,201,1),(4,'2025-06-04 14:20:00',5,50.00,202,3),(5,'2025-06-05 16:45:00',4,-10.00,103,NULL),(6,'2025-11-12 21:48:10',4,-109.95,1,1),(7,'2025-11-12 21:48:32',4,-109.00,10,1),(8,'2025-11-12 21:55:28',4,-64.00,9,1),(9,'2025-11-12 21:55:46',4,-64.00,9,1),(10,'2025-11-12 21:58:22',4,-109.00,10,1),(11,'2025-11-12 22:01:05',4,-109.00,10,1),(12,'2025-11-12 22:05:24',4,-109.00,10,1),(13,'2025-11-13 19:04:18',4,-64.00,9,1),(16,'2025-12-01 00:29:37',4,-695.00,5,1),(17,'2025-12-01 00:45:49',4,-695.00,5,1),(18,'2025-12-01 00:56:24',4,-695.00,5,1),(19,'2025-12-01 00:56:24',4,-168.00,6,1),(20,'2025-12-01 01:05:32',4,-695.00,5,1);
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(320) NOT NULL,
  `email_lc` varchar(320) GENERATED ALWAYS AS (lower(`email`)) STORED,
  `ssn` char(9) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `organization_id` int DEFAULT NULL,
  `type_id` tinyint NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email_lc` (`email_lc`),
  KEY `fk_user_type` (`type_id`),
  KEY `fk_user_organization` (`organization_id`),
  CONSTRAINT `fk_user_organization` FOREIGN KEY (`organization_id`) REFERENCES `organization` (`organization_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_user_type` FOREIGN KEY (`type_id`) REFERENCES `user_type` (`type_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` (`user_id`, `first_name`, `last_name`, `email`, `ssn`, `city`, `state`, `country`, `organization_id`, `type_id`) VALUES (1,'Alice','Admin','alice.adminson@example.com','111223333','Clemson','NC','USA',NULL,1),(2,'Sam','Sponsor','sam.sponsor@example.com','222334444','Greenville','SC','USA',NULL,2),(3,'Sara','Sponsor','sara.sponsor@example.com','333445555','Atlanta','GA','USA',NULL,2),(4,'Danny','Driver','danny.driver@example.com','444556666','Charlotte','SC','USA',NULL,3),(5,'Dina','Driver','dina.driver@example.com','555667777','Charleston','SC','USA',NULL,3),(6,'test','test','test@test.com','12345','test','test','test',NULL,3),(7,'test1','test1','test1@test.com','1234','test','test','test',NULL,3),(9,'Bennett','Test','bennetttest@example.com','12345678','Clemson','SC','USA',NULL,3),(21,'Joe','Driver','me@email.com',NULL,NULL,NULL,NULL,6,3),(22,'Jill','Sponsor','jill@mail.com',NULL,NULL,NULL,NULL,6,2),(23,'Tom','Smith','tom887@gmail.com',NULL,NULL,NULL,NULL,3,3),(24,'New','Driver','some@email.com',NULL,NULL,NULL,NULL,NULL,3),(25,'Dick','gryeson','dg@email.com',NULL,NULL,NULL,NULL,NULL,3);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_credentials`
--

DROP TABLE IF EXISTS `user_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_credentials` (
  `user_id` int NOT NULL,
  `username` varchar(320) NOT NULL,
  `username_lc` varchar(320) GENERATED ALWAYS AS (lower(`username`)) STORED,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_usercred_username_lc` (`username_lc`),
  CONSTRAINT `fk_user_credentials_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_credentials`
--

LOCK TABLES `user_credentials` WRITE;
/*!40000 ALTER TABLE `user_credentials` DISABLE KEYS */;
INSERT INTO `user_credentials` (`user_id`, `username`, `password`) VALUES (1,'alice.adminson@example.com','password123'),(2,'sam.sponsor@example.com','password123'),(3,'sara.sponsor@example.com','password123'),(4,'danny.driver@example.com','password123'),(5,'dina.driver@example.com','password123'),(6,'test','scrypt:32768:8:1$3Xfq9RYAdnJijgSx$c2ee27fa7dfc755244c99c77117da10d6694f03839810735c77e0fe9ba4968808f38077aac4b1e208d63427f447f9d7d40d275cba3d5028d081ae36f3b8b6a6d'),(7,'test1@test.com','scrypt:32768:8:1$x802SWznPGppVbsF$5c40a660b86b47583746e6f71556bed7c908d1bf14f19f951315d72ed1c6ff46cf9355174305fb0792db6ae6491b7db059b69c5a8bd0fde4b175e763d9fe157a'),(9,'bennetttest@example.com','scrypt:32768:8:1$VCeZ0D4LLyWekr4o$b5684029eb01ae2a108e26b1f7db1729136e55f71c8aa4f4261560af2bc17cd71ab64b7d6ab4fd4e186b7c4997bb9d7afaab2cf52ee94c3e8adb4d3badea4b37'),(21,'me@email.com','Da9c-x0z643PUA6-'),(22,'jill@mail.com','rDT8vvwvq3gwWmaq'),(23,'tom887@gmail.com','YEJVjHCN3-RAmd92'),(24,'some@email.com','GINADNzCMT1ttHGr'),(25,'dg@email.com','pTfenvaWtIMrtbJM');
/*!40000 ALTER TABLE `user_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_type`
--

DROP TABLE IF EXISTS `user_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_type` (
  `type_id` tinyint NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  PRIMARY KEY (`type_id`),
  UNIQUE KEY `type_name` (`type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_type`
--

LOCK TABLES `user_type` WRITE;
/*!40000 ALTER TABLE `user_type` DISABLE KEYS */;
INSERT INTO `user_type` VALUES (1,'Admin'),(3,'Driver'),(2,'Sponsor');
/*!40000 ALTER TABLE `user_type` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-30 20:06:28
