# Prisma Database Schema Documentation

Generated: 2025-12-05T08:04:21.111Z

## Models

### RPAExecution

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| workflowId | String | status      String      @default("RUNNING") |
| trigger | Json | steps       Json |
| error | String? | startedAt   DateTime    @default(now()) |
| completedAt | DateTime? | RPAWorkflow RPAWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade) |

### RPAWorkflow

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| name | String | description  String? |
| trigger | Json | actions      Json |
| enabled | Boolean | @default(true) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | createdById  String |
| RPAExecution | RPAExecution | [] |
| users | users | @relation(fields: [createdById], references: [id]) |

### activity_logs

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String? | action    String |
| ipAddress | String | userAgent String |
| metadata | Json? | createdAt DateTime @default(now()) |

### admin_login_logs

| Field | Type | Attributes |
|-------|------|------------|
| id | Int | @id @default(autoincrement()) |
| email | String | phone     String? |
| status | String | ipAddress String? |
| userAgent | String? | createdAt DateTime @default(now()) |

### admin_portfolios

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| currency | String | @unique |
| balance | Decimal | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |

### admin_settings

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| btcAddress | String? | ethAddress           String? |
| usdtAddress | String? | ltcAddress           String? |
| otherAddresses | String? | exchangeRateBtc      Decimal? |
| exchangeRateEth | Decimal? | exchangeRateUsdt     Decimal? |
| processingFeePercent | Decimal | @default(2.5) |
| minPurchaseAmount | Decimal | @default(10) |
| debitCardPriceUSD | Decimal | @default(1000) |
| updatedAt | DateTime | createdAt            DateTime @default(now()) |

### admin_transfers

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| adminId | String? | userId    String? |
| currency | String | amount    Decimal |
| note | String? | source    String? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @@index([userId]) |

### ai_generations

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | type        String |
| model | String | prompt      String |
| output | String? | imageUrl    String? |
| metadata | String? | status      String    @default("pending") |
| error | String? | createdAt   DateTime  @default(now()) |
| lastRotated | DateTime? | users       users     @relation(fields: [userId], references: [id], onDelete: Cascade) |

### ai_models

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| name | String | version         String |
| modelType | String | accuracy        Decimal? |
| precision | Decimal? | recall          Decimal? |
| f1Score | Decimal? | trainingSamples Int       @default(0) |
| modelPath | String? | isActive        Boolean   @default(false) |
| trainedBy | String? | trainedAt       DateTime? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @@index([isActive]) |

### ai_suggestions

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| user_id | String | type         String |
| content | String | accepted     Boolean   @default(false) |
| dismissed_at | DateTime? | created_at   DateTime  @default(now()) |

### ai_training_data

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String? | ipAddress  String |
| userAgent | String | features   Json |
| label | Boolean | verifiedBy String? |
| verifiedAt | DateTime? | createdAt  DateTime  @default(now()) |

### ai_usage_metrics

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | date             DateTime @default(now()) |
| textGenerations | Int | @default(0) |
| codeGenerations | Int | @default(0) |
| imageGenerations | Int | @default(0) |
| tokensUsed | Int | @default(0) |
| costUSD | Decimal | @default(0) |
| users | users | @relation(fields: [userId], references: [id], onDelete: Cascade) |

### app_roles

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| name | String | @unique |
| token | String | @unique |
| policies | Json | expires_at DateTime |
| created_by | String | created_at DateTime @default(now()) |

### audit_logs

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String? | action         String |
| resourceType | String | resourceId     String |
| changes | Json? | previousValues Json? |
| newValues | Json? | metadata       Json? |
| ipAddress | String? | userAgent      String? |
| severity | String? | timestamp      DateTime @default(now()) |
| createdAt | DateTime | @default(now()) |

### backup_codes

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | code      String    @unique |
| isUsed | Boolean | @default(false) |
| usedAt | DateTime? | createdAt DateTime  @default(now()) |

### blockchain_verifications

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| manifest_hash | String | version       String |
| tx_hash | String? | @unique |
| record_id | Int? | status        String    @default("PENDING") |
| blockchain | String | @default("polygon") |
| confirmed_at | DateTime? | created_at    DateTime  @default(now()) |

### bot_detections

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String? | ipAddress  String |
| userAgent | String | isBot      Boolean |
| confidence | Decimal | riskScore  Decimal   @default(0) |
| signals | Json? | action     String? |
| reviewedBy | String? | reviewedAt DateTime? |
| createdAt | DateTime | @default(now()) |

### chat_messages

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| sessionId | String | senderType String |
| senderId | String? | content    String |
| metadata | Json? | createdAt  DateTime @default(now()) |

### chat_sessions

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String? | status          String   @default("open") |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | assignedAdminId String? |

### click_events

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String? | eventName  String |
| ipAddress | String | userAgent  String |
| isRobot | Boolean | @default(false) |
| confidence | Decimal? | metadata   Json? |
| createdAt | DateTime | @default(now()) |

### codebase_index

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| filePath | String | @unique |
| content | String | embedding   String? |
| lastIndexed | DateTime | @default(now()) |

### compliance_alerts

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| alert_type | String | severity         String |
| user_id | String? | transaction_id   String? |
| description | String | details          Json? |
| status | String | @default("OPEN") |
| assigned_to | String? | resolution_notes String? |
| created_at | DateTime | @default(now()) |
| resolved_at | DateTime? | @@index([created_at]) |

### compliance_logs

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| jurisdiction | String | event_type        String |
| user_id | String? | payment_id        String? |
| payload | Json | compliance_result Json |
| processor | String? | risk_score        Decimal? |
| violations | Json? | auto_corrected    Boolean  @default(false) |
| timestamp | DateTime | @default(now()) |
| created_at | DateTime | @default(now()) |

### consultation_messages

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| consultationId | String | senderType     String |
| senderId | String | content        String |
| attachmentUrl | String? | createdAt      DateTime @default(now()) |

### consultations

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| patientId | String | doctorId     String |
| status | String | @default("SCHEDULED") |
| scheduledAt | DateTime? | startedAt    DateTime? |
| completedAt | DateTime? | symptoms     String? |
| diagnosis | String? | prescription String? |
| notes | String? | videoRoomId  String? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |

### copilot_feedback

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| taskId | String | userId        String |
| rating | Int | comment       String? |
| timestamp | DateTime | @default(now()) |
| copilot_tasks | copilot_tasks | @relation(fields: [taskId], references: [id], onDelete: Cascade) |

### copilot_interactions

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | sessionId String |
| message | String | response  String |
| timestamp | DateTime | @default(now()) |

### copilot_tasks

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| type | String | description      String |
| context | Json? | status           String             @default("pending") |
| result | Json? | error            String? |
| createdAt | DateTime | @default(now()) |
| completedAt | DateTime? | copilot_feedback copilot_feedback[] |

### crisis_events

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| type | String | severity    Int |
| description | String | indicators  Json |
| actions | Json? | resolved_at DateTime? |
| created_at | DateTime | @default(now()) |

### crypto_orders

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | cryptoType        String |
| usdAmount | Decimal | cryptoAmount      Decimal |
| exchangeRate | Decimal | processingFee     Decimal |
| totalUsd | Decimal | status            String    @default("PENDING") |
| adminAddress | String | txHash            String? |
| adminNotes | String? | userWalletAddress String? |
| stripeSessionId | String? | completedAt       DateTime? |
| cancelledAt | DateTime? | createdAt         DateTime  @default(now()) |
| updatedAt | DateTime | @@index([createdAt]) |

### crypto_withdrawals

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | cryptoType        String |
| cryptoAmount | Decimal | usdEquivalent     Decimal |
| withdrawalAddress | String | status            String    @default("PENDING") |
| adminApprovedBy | String? | adminNotes        String? |
| txHash | String? | networkFee        Decimal? |
| approvedAt | DateTime? | rejectedAt        DateTime? |
| completedAt | DateTime? | cancelledAt       DateTime? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | users             users     @relation(fields: [userId], references: [id], onDelete: Cascade) |

### debit_cards

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | cardNumber     String   @unique |
| cardHolderName | String | expiryMonth    Int |
| expiryYear | Int | cvv            String |
| cardType | String | @default("virtual") |
| status | String | @default("ACTIVE") |
| balance | Decimal | @default(0) |
| dailyLimit | Decimal | @default(1000) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @@index([status]) |

### doctors

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| email | String | passwordHash   String |
| firstName | String | lastName       String |
| specialization | String | licenseNumber  String |
| phoneNumber | String? | status         String    @default("PENDING") |
| verifiedAt | DateTime? | verifiedBy     String? |
| inviteCode | String | createdAt      DateTime  @default(now()) |
| updatedAt | DateTime |  |

### eth_activity

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String? | address           String |
| addressNormalized | String | type              String |
| txHash | String? | @unique |
| amountEth | Decimal | status            String |
| confirmations | Int | @default(0) |
| blockNumber | Int? | note              String? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @@index([createdAt]) |

### fraud_scores

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | transactionId String? |
| score | Decimal | factors       Json? |
| status | String | @default("pending") |
| reviewedBy | String? | reviewedAt    DateTime? |
| createdAt | DateTime | @default(now()) |

### health_readings

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | heartRate        Int? |
| bloodPressureSys | Int? | bloodPressureDia Int? |
| steps | Int? | sleepHours       Decimal? |
| sleepQuality | String? | weight           Decimal? |
| temperature | Decimal? | oxygenLevel      Int? |
| stressLevel | String? | mood             String? |
| deviceId | String? | deviceType       String? |
| metadata | String? | notes            String? |
| recordedAt | DateTime | @default(now()) |
| createdAt | DateTime | @default(now()) |

### ip_blocks

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| ip | String | @unique |
| reason | String? | until     DateTime? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @@index([updatedAt]) |

### jurisdiction_rules

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| jurisdiction | String | @unique |
| regulators | String | requirements         Json |
| allowed_processors | String | restricted_countries String |
| compliance_level | String | enabled              Boolean  @default(true) |
| last_updated | DateTime | @default(now()) |
| created_at | DateTime | @default(now()) |

### loans

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | amount           Decimal |
| interestRate | Decimal | termMonths       Int |
| monthlyPayment | Decimal | remainingBalance Decimal |
| status | String | @default("pending") |
| purpose | String | startDate        DateTime  @default(now()) |
| dueDate | DateTime | approvedBy       String? |
| approvedAt | DateTime? | paidOffAt        DateTime? |
| defaultedAt | DateTime? | cancelledAt      DateTime? |
| adminNotes | String? | createdAt        DateTime  @default(now()) |
| updatedAt | DateTime | @@index([createdAt]) |

### market_intelligence

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| source | String | category   String |
| data | Json | sentiment  String? |
| importance | Int | @default(5) |
| created_at | DateTime | @default(now()) |

### medbeds_bookings

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | chamberType     String |
| chamberName | String | sessionDate     DateTime |
| duration | Int | cost            Decimal |
| paymentMethod | String | paymentStatus   String   @default("pending") |
| transactionId | String? | stripeSessionId String? |
| status | String | @default("scheduled") |
| effectiveness | Int? | notes           String? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | users           users    @relation(fields: [userId], references: [id], onDelete: Cascade) |

### notification_logs

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| notificationId | String | channel        String |
| status | String | errorMessage   String? |
| sentAt | DateTime | @default(now()) |
| deliveredAt | DateTime? | metadata       Json? |

### notification_preferences

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | @unique |
| emailEnabled | Boolean | @default(true) |
| smsEnabled | Boolean | @default(false) |
| inAppEnabled | Boolean | @default(true) |
| pushEnabled | Boolean | @default(true) |
| transactionAlerts | Boolean | @default(true) |
| securityAlerts | Boolean | @default(true) |
| systemAlerts | Boolean | @default(true) |
| rewardAlerts | Boolean | @default(true) |
| adminAlerts | Boolean | @default(true) |
| promotionalEmails | Boolean | @default(false) |
| enableDigest | Boolean | @default(false) |
| digestFrequency | String | @default("daily") |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |

### notifications

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | type        String |
| priority | String | @default("normal") |
| category | String | title       String |
| message | String | data        Json? |
| isRead | Boolean | @default(false) |
| readAt | DateTime? | emailSent   Boolean   @default(false) |
| emailSentAt | DateTime? | smsSent     Boolean   @default(false) |
| smsSentAt | DateTime? | pushSent    Boolean   @default(false) |
| pushSentAt | DateTime? | createdAt   DateTime  @default(now()) |
| updatedAt | DateTime | @@index([priority]) |

### oal_audit_log

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| object | String | action      String |
| location | String | subjectId   String? |
| metadata | Json? | status      String   @default("PENDING") |
| createdById | String | updatedById String? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @@index([createdAt]) |

### processor_configs

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| processor_id | String | @unique |
| processor_name | String | jurisdictions        String |
| features | String | fees                 Json |
| settlement_time_days | Int | max_amount           Decimal |
| rating | Decimal | @default(0.80) |
| enabled | Boolean | @default(true) |
| api_credentials | Json? | last_health_check    DateTime? |
| created_at | DateTime | @default(now()) |
| updated_at | DateTime | @default(now()) |

### push_subscriptions

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | endpoint   String |
| p256dh | String | auth       String |
| deviceInfo | Json? | isActive   Boolean  @default(true) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @default(now()) |

### rewards

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | type        String |
| amount | Decimal | status      String    @default("PENDING") |
| title | String | description String |
| metadata | String? | expiresAt   DateTime? |
| claimedAt | DateTime? | createdAt   DateTime  @default(now()) |

### risk_assessments

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| user_id | String | transaction_id          String? |
| risk_score | Decimal | risk_level              String |
| risk_factors | Json | assessment_reason       String? |
| adaptive_policy_applied | Boolean | @default(false) |
| assessed_at | DateTime | @default(now()) |
| expires_at | DateTime? | created_at              DateTime  @default(now()) |

### scam_addresses

| Field | Type | Attributes |
|-------|------|------------|
| address | String | @id |
| blockchain | String | category    String |
| severity | Int | source      String |
| reported_at | DateTime | created_at  DateTime @default(now()) |

### security_patches

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| type | String | vulnerability String |
| fix | String | status        String    @default("PENDING") |
| applied_by | String? | applied_at    DateTime? |
| created_at | DateTime | @default(now()) |

### sessions

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | token     String   @unique |
| expiresAt | DateTime | createdAt DateTime @default(now()) |

### support_tickets

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | subject    String |
| message | String | category   String    @default("GENERAL") |
| status | String | @default("OPEN") |
| priority | String | @default("MEDIUM") |
| response | String? | resolvedBy String? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | resolvedAt DateTime? |

### system_alerts

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| alertType | String | severity    String |
| title | String | description String |
| serviceName | String? | isResolved  Boolean   @default(false) |
| resolvedAt | DateTime? | resolvedBy  String? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @@index([createdAt]) |

### system_config

| Field | Type | Attributes |
|-------|------|------------|
| id | Int | @id @default(autoincrement()) |
| key | String | @unique |
| value | String | updatedAt DateTime |
| createdAt | DateTime | @default(now()) |

### system_status

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| serviceName | String | status        String |
| responseTime | Int? | uptime        Decimal? |
| lastChecked | DateTime | @default(now()) |
| statusMessage | String? | alertLevel    String   @default("none") |
| metadata | String? | createdAt     DateTime @default(now()) |
| updatedAt | DateTime | @@index([lastChecked]) |

### token_transactions

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| walletId | String | amount      Decimal |
| type | String | status      String   @default("COMPLETED") |
| description | String? | toAddress   String? |
| fromAddress | String? | txHash      String? |
| metadata | String? | createdAt   DateTime @default(now()) |

### token_wallets

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | @unique |
| balance | Decimal | @default(0) |
| tokenType | String | @default("ADVANCIA") |
| lockedBalance | Decimal | @default(0) |
| lifetimeEarned | Decimal | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @@index([userId]) |

### transactions

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | amount      Decimal |
| type | String | description String? |
| category | String? | status      String   @default("COMPLETED") |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @@index([type]) |

### uploaded_files

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | category    String   @default("documents") |
| filename | String | key         String   @unique |
| url | String? | size        Int |
| contentType | String | metadata    Json? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | users       users    @relation(fields: [userId], references: [id]) |

### user_preferences

| Field | Type | Attributes |
|-------|------|------------|
| user_id | String | @unique |
| dashboard_layout | Json? | features         Json? |
| suggestions | Json? | interaction_log  Json? |
| updated_at | DateTime | created_at       DateTime @default(now()) |

### user_tiers

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| userId | String | @unique |
| currentTier | String | @default("bronze") |
| points | Int | @default(0) |
| lifetimePoints | Int | @default(0) |
| lifetimeRewards | Decimal | @default(0) |
| streak | Int | @default(0) |
| longestStreak | Int | @default(0) |
| lastActiveDate | DateTime | @default(now()) |
| achievements | String? | badges          String? |
| referralCode | String? | @unique |
| referredBy | String? | totalReferrals  Int      @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @@index([referralCode]) |

### users

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| email | String | @unique |
| username | String | @unique |
| passwordHash | String | firstName          String? |
| lastName | String? | role               String               @default("USER") |
| usdBalance | Decimal | @default(0) |
| active | Boolean | @default(true) |
| emailVerified | Boolean | @default(false) |
| emailVerifiedAt | DateTime? | lastLogin          DateTime? |
| termsAccepted | Boolean | @default(false) |
| termsAcceptedAt | DateTime? | totpSecret         String? |
| totpEnabled | Boolean | @default(false) |
| totpVerified | Boolean | @default(false) |
| backupCodes | String? | ethWalletAddress   String?              @unique |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | btcBalance         Decimal              @default(0) |
| ethBalance | Decimal | @default(0) |
| usdtBalance | Decimal | @default(0) |
| googleId | String? | @unique |
| profilePicture | String? | // Block/Ban tracking |
| blockedAt | DateTime? | blockedReason      String? |
| blockedBy | String? | // Admin user ID who blocked |
| deletedAt | DateTime? | deletedBy          String? // Admin user ID who deleted |
| RPAWorkflow | RPAWorkflow | [] |
| ai_generations | ai_generations | [] |
| ai_usage_metrics | ai_usage_metrics | [] |
| crypto_withdrawals | crypto_withdrawals | [] |
| medbeds_bookings | medbeds_bookings | [] |
| uploaded_files | uploaded_files | [] |
| subscriptions | Subscription | [] |
| blogPosts | BlogPost | []           @relation("BlogAuthor") |
| blogComments | BlogComment | []        @relation("BlogCommentAuthor") |
| ownedProjects | Project | []            @relation("ProjectOwner") |
| projectMemberships | ProjectMember | []      @relation("ProjectMembership") |
| assignedTasks | Task | []               @relation("TaskAssignee") |
| reportedTasks | Task | []               @relation("TaskReporter") |
| taskComments | TaskComment | []        @relation("TaskComments") |
| taskAttachments | TaskAttachment | []     @relation("TaskAttachments") |
| timeEntries | TimeEntry | []          @relation("TimeEntries") |

### vault_audit_logs

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| user_id | String | action        String |
| secret_key | String | timestamp     DateTime @default(now()) |
| ip_address | String? | user_agent    String? |
| success | Boolean | @default(true) |
| error_message | String? | mfa_verified  Boolean  @default(false) |

### vault_secrets

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| key | String | @unique |
| encrypted_value | String | iv              String |
| version | Int | @default(1) |
| metadata | Json? | rotationPolicy  Json? |
| created_by | String | created_at      DateTime  @default(now()) |
| last_rotated | DateTime? | @@index([last_rotated]) |

### AIWorkflow

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| name | String | @unique |
| description | String | category         String // "automation", "monitoring", "code_suggestion", "data_collection", "orchestration" |
| triggerType | String | // "event", "scheduled", "manual" |
| cronSchedule | String? | // for scheduled triggers |
| enabled | Boolean | @default(true) |
| requiresApproval | Boolean | @default(true) // critical tasks need human approval |
| riskLevel | String | @default("medium") // "low", "medium", "high", "critical" |
| aiModel | String | @default("gpt-4") // "gpt-4", "gpt-3.5-turbo", "claude-3" |
| config | String | // JSON configuration |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| tasks | AITask | [] |
| executions | AIWorkflowExecution | [] |

### AITask

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| workflowId | String | workflow    AIWorkflow           @relation(fields: [workflowId], references: [id], onDelete: Cascade) |
| executionId | String? | execution   AIWorkflowExecution? @relation(fields: [executionId], references: [id], onDelete: SetNull) |
| taskType | String | // "email", "report", "code_fix", "monitoring", "data_collection" |
| priority | Int | @default(5) // 1-10, higher = more urgent |
| status | String | @default("pending") // "pending", "in_progress", "awaiting_approval", "approved", "rejected", "completed", "failed" |
| input | String | // JSON input data |
| aiSuggestion | String? | // AI's proposed action/solution |
| aiReasoning | String? | // Why AI suggests this |
| aiConfidence | Decimal? | @default(0) // 0-1 confidence score |
| output | String? | // Result after execution |
| error | String? | executionTimeMs Int? |
| reviewedBy | String? | reviewedAt        DateTime? |
| approvalStatus | String? | // "approved", "rejected", "modified" |
| humanFeedback | String? | // Learning data |
| humanModification | String? | // What human changed |
| attempts | Int | @default(0) |
| maxRetries | Int | @default(3) |
| scheduledFor | DateTime? | startedAt    DateTime? |
| completedAt | DateTime? | createdAt    DateTime  @default(now()) |
| updatedAt | DateTime | @updatedAt |

### AIWorkflowExecution

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| workflowId | String | workflow   AIWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade) |
| status | String | @default("running") // "running", "completed", "failed", "cancelled" |
| triggeredBy | String | // "system", "user:{userId |

### AILearning

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| taskId | String | @unique |
| taskType | String | aiSuggestion      String // What AI proposed |
| humanDecision | String | // What human chose (approved/rejected/modified) |
| humanModification | String? | // What human changed |
| feedback | String? | // Human's explanation |
| wasCorrect | Boolean? | // Did AI suggestion work out? |
| outcomeNotes | String? | // Post-execution notes |
| context | String | // JSON - situational context |
| patterns | String? | // JSON - identified patterns |
| createdAt | DateTime | @default(now()) |

### AIMonitoringAlert

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| alertType | String | // "error", "downtime", "performance", "security", "anomaly" |
| severity | String | // "info", "warning", "error", "critical" |
| source | String | // where the issue was detected |
| title | String | description String |
| detectedBy | String | @default("ai_monitor") // "ai_monitor", "system", "user" |
| aiAnalysis | String? | // AI's analysis of the issue |
| aiSuggestion | String? | // AI's suggested fix |
| aiConfidence | Decimal? | @default(0) |
| status | String | @default("open") // "open", "investigating", "resolved", "false_positive" |
| assignedTo | String? | resolvedBy String? |
| resolvedAt | DateTime? | resolution String? // How it was fixed |
| metadata | String? | // JSON - additional data |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### AIMonitoringRule

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| name | String | description String? |
| type | String | // "error", "performance", "security", "usage", "custom" |
| condition | String | // JSON condition |
| threshold | Float? | severity    String    @default("medium") |
| enabled | Boolean | @default(true) |
| lastCheck | DateTime? | createdAt   DateTime  @default(now()) |
| updatedAt | DateTime | @updatedAt |

### AIAlert

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| ruleId | String | message   String |
| metadata | String | // JSON metadata |
| severity | String | status    String   @default("open") |
| createdAt | DateTime | @default(now()) |

### AIReport

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| reportType | String | // "daily", "weekly", "monthly", "incident", "custom" |
| category | String | // "usage", "performance", "security", "business", "technical" |
| title | String | summary String // Executive summary |
| content | String | // Full report content (Markdown) |
| format | String | @default("markdown") // "markdown", "json", "html" |
| generatedBy | String | @default("ai_core") // "ai_core", "scheduled_job" |
| aiModel | String | @default("gpt-4") |
| dataFrom | DateTime | // Period start |
| dataTo | DateTime | // Period end |
| dataSources | String | // JSON - what data was used |
| insights | String? | // JSON array of key insights |
| recommendations | String? | // JSON array of recommendations |
| status | String | @default("generated") // "generated", "reviewed", "published", "archived" |
| reviewedBy | String? | reviewedAt  DateTime? |
| publishedAt | DateTime? | recipients String? // JSON array of who received this |
| createdAt | DateTime | @default(now()) |

### AISystemConfig

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| key | String | @unique // config key |
| value | String | // config value (JSON) |
| category | String | // "llm", "queue", "monitoring", "workflow", "learning" |
| description | String | isEncrypted Boolean @default(false) |
| updatedBy | String? | updatedAt DateTime @updatedAt |
| createdAt | DateTime | @default(now()) |

### PricingPlan

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| name | String | @unique // "Free", "Starter", "Pro", "Enterprise" |
| slug | String | @unique // "free", "starter", "pro", "enterprise" |
| description | String? | // Pricing |
| priceMonthly | Decimal | @default(0) |
| priceYearly | Decimal | @default(0) |
| currency | String | @default("USD") |
| stripePriceIdMonthly | String? | @unique |
| stripePriceIdYearly | String? | @unique |
| stripeProductId | String? | @unique |
| aiRequestsPerDay | Int | @default(50) |
| aiRequestsPerMonth | Int | @default(1500) |
| storageGb | Int | @default(1) |
| maxTeamMembers | Int | @default(1) |
| features | String | @default("{ |

### Subscription

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| userId | String | planId String |
| status | String | @default("active") // active, cancelled, past_due, paused, trialing |
| currentPeriodStart | DateTime | currentPeriodEnd   DateTime |
| trialStart | DateTime? | trialEnd   DateTime? |
| stripeSubscriptionId | String? | @unique |
| stripeCustomerId | String? | // Cancellation |
| cancelAtPeriodEnd | Boolean | @default(false) |
| cancelledAt | DateTime? | cancellationReason String? |
| metadata | String? | // JSON for custom fields |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| user | users | @relation(fields: [userId], references: [id], onDelete: Cascade) |
| plan | PricingPlan | @relation(fields: [planId], references: [id]) |
| invoices | Invoice | [] |
| usageRecords | UsageRecord | [] |

### Invoice

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| subscriptionId | String | userId         String |
| amountDue | Decimal | amountPaid Decimal @default(0) |
| currency | String | @default("USD") |
| status | String | @default("draft") // draft, open, paid, void, uncollectible |
| stripeInvoiceId | String? | @unique |
| stripePaymentIntentId | String? | hostedInvoiceUrl      String? |
| invoicePdfUrl | String? | // Dates |
| dueDate | DateTime? | paidAt  DateTime? |
| lineItems | String | @default("[]") |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| subscription | Subscription | @relation(fields: [subscriptionId], references: [id]) |

### UsageRecord

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| subscriptionId | String | userId         String |
| resourceType | String | // "ai_request", "storage", "api_call", "agent_execution" |
| quantity | Int | @default(1) |
| unitPrice | Decimal? | totalPrice Decimal? |
| periodStart | DateTime | periodEnd   DateTime |
| billed | Boolean | @default(false) |
| billedAt | DateTime? | invoiceId String? |
| stripeUsageRecordId | String? | // Metadata |
| metadata | String? | // JSON: {"model": "gpt-4", "tokens": 1500 |

### AIUsageQuota

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| userId | String | @unique |
| aiRequestsToday | Int | @default(0) |
| aiRequestsThisMonth | Int | @default(0) |
| dailyLimit | Int | @default(50) |
| monthlyLimit | Int | @default(1500) |
| lastDailyReset | DateTime | @default(now()) |
| lastMonthlyReset | DateTime | @default(now()) |
| overageAllowed | Boolean | @default(false) |
| overageRate | Decimal? | // Price per additional request |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### BlogCategory

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| name | String | @unique |
| slug | String | @unique |
| description | String? | parentId       String? |
| parent | BlogCategory? | @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: SetNull) |
| children | BlogCategory | [] @relation("CategoryHierarchy") |
| posts | BlogPost | [] |
| seoTitle | String? | seoDescription String? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### BlogPost

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| title | String | slug            String  @unique |
| excerpt | String? | contentMarkdown String // Markdown source |
| contentHtml | String | // Rendered HTML |
| authorId | String | author     users         @relation("BlogAuthor", fields: [authorId], references: [id], onDelete: Cascade) |
| categoryId | String? | category   BlogCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull) |
| tags | String? | // Comma-separated tags |
| status | String | @default("DRAFT") // DRAFT, SCHEDULED, PUBLISHED, ARCHIVED |
| publishedAt | DateTime? | scheduledFor DateTime? |
| archivedAt | DateTime? | // SEO & Analytics |
| seoTitle | String? | seoDescription  String? |
| seoKeywords | String? | // Comma-separated |
| canonicalUrl | String? | structuredData  String? // JSON-LD schema |
| readTimeMinutes | Int? | viewCount       Int     @default(0) |
| aiGenerated | Boolean | @default(false) |
| aiModel | String? | // "gpt-4", "claude-3-sonnet", etc. |
| aiPrompt | String? | aiJobId     String? |
| featured | Boolean | @default(false) |
| pinned | Boolean | @default(false) |
| media | BlogMedia | [] |
| comments | BlogComment | [] |
| socialPosts | SocialMediaPost | [] |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### BlogMedia

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| postId | String | post   BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade) |
| url | String | type     String // "image", "video", "file" |
| filename | String | mimeType String |
| size | Int | // bytes |
| width | Int? | height   Int? |
| altText | String? | caption  String? |
| s3Key | String? | cdnUrl String? |
| aiGenerated | Boolean | @default(false) |
| aiPrompt | String? | position  Int      @default(0) |
| createdAt | DateTime | @default(now()) |

### BlogComment

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| postId | String | post   BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade) |
| authorId | String? | author      users?  @relation("BlogCommentAuthor", fields: [authorId], references: [id], onDelete: SetNull) |
| authorName | String | // For guest comments |
| authorEmail | String? | // For guest comments |
| content | String | parentId String? |
| parent | BlogComment? | @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade) |
| replies | BlogComment | [] @relation("CommentReplies") |
| status | String | @default("PENDING") // PENDING, APPROVED, SPAM, DELETED |
| approved | Boolean | @default(false) |
| approvedBy | String? | approvedAt DateTime? |
| ipAddress | String? | userAgent String? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

### SEOAudit

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| postId | String? | url    String |
| overallScore | Int | // 0-100 |
| technicalScore | Int | contentScore   Int |
| mobileFriendly | Boolean | pageSpeed      Int? // 0-100 |
| missingMetaTags | String? | // JSON array |
| brokenLinks | String? | // JSON array |
| missingAltText | String? | // JSON array |
| keywordIssues | String? | // JSON array |
| suggestions | String? | // JSON array of fixes |
| status | String | @default("PENDING") // PENDING, COMPLETED, FAILED |
| errorMessage | String? | createdAt   DateTime  @default(now()) |
| completedAt | DateTime? | @@index([postId]) |

### Sitemap

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| urls | String | // JSON array of sitemap entries |
| totalUrls | Int | generated   Boolean   @default(false) |
| generatedAt | DateTime? | submitted   Boolean   @default(false) |
| submittedAt | DateTime? | createdAt DateTime @default(now()) |

### SocialMediaAccount

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| userId | String | platform    String // "twitter", "linkedin", "facebook", "instagram" |
| accountName | String | accountId   String // Platform-specific ID |
| vaultKeyAccess | String | // Reference to vault_secrets |
| vaultKeyRefresh | String? | active   Boolean @default(true) |
| verified | Boolean | @default(false) |
| profileImageUrl | String? | followerCount   Int? |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| posts | SocialMediaPost | [] |

### SocialMediaPost

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| blogPostId | String? | blogPost   BlogPost? @relation(fields: [blogPostId], references: [id], onDelete: SetNull) |
| accountId | String | account   SocialMediaAccount @relation(fields: [accountId], references: [id], onDelete: Cascade) |
| content | String | mediaUrls String? // JSON array |
| hashtags | String? | // Comma-separated |
| status | String | @default("DRAFT") // DRAFT, SCHEDULED, POSTED, FAILED |
| scheduledFor | DateTime? | postedAt     DateTime? |
| platformPostId | String? | // Twitter tweet ID, LinkedIn post URN, etc. |
| platformUrl | String? | errorMessage   String? |
| likes | Int | @default(0) |
| shares | Int | @default(0) |
| comments | Int | @default(0) |
| clicks | Int | @default(0) |
| impressions | Int | @default(0) |
| lastSyncedAt | DateTime? | // AI generated content |
| aiGenerated | Boolean | @default(false) |
| aiModel | String? | createdAt DateTime @default(now()) |
| updatedAt | DateTime | @updatedAt |

### Project

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| name | String | description String? |
| ownerId | String | status      String   @default("PLANNING") // PLANNING, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED |
| priority | String | @default("MEDIUM") // LOW, MEDIUM, HIGH, CRITICAL |
| startDate | DateTime? | endDate     DateTime? |
| budget | Float? | progress    Int      @default(0) // 0-100 |
| visibility | String | @default("PRIVATE") // PRIVATE, TEAM, PUBLIC |
| metadata | String? | // JSON |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| owner | users | @relation("ProjectOwner", fields: [ownerId], references: [id], onDelete: Cascade) |
| tasks | Task | [] |
| sprints | Sprint | [] |
| boards | KanbanBoard | [] |
| members | ProjectMember | [] |
| tags | ProjectTag | [] |

### ProjectMember

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| projectId | String | userId    String |
| role | String | @default("MEMBER") // OWNER, ADMIN, MEMBER, VIEWER |
| joinedAt | DateTime | @default(now()) |
| project | Project | @relation(fields: [projectId], references: [id], onDelete: Cascade) |
| user | users | @relation("ProjectMembership", fields: [userId], references: [id], onDelete: Cascade) |

### Task

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| projectId | String | sprintId        String? |
| boardId | String? | columnId        String? |
| title | String | description     String? |
| status | String | @default("TODO") // TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED |
| priority | String | @default("MEDIUM") // LOW, MEDIUM, HIGH, CRITICAL |
| assigneeId | String? | reporterId      String |
| estimatedHours | Float? | actualHours     Float? |
| dueDate | DateTime? | completedAt     DateTime? |
| position | Int | @default(0) |
| aiGenerated | Boolean | @default(false) |
| aiSuggestions | String? | // JSON |
| metadata | String? | // JSON |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| project | Project | @relation(fields: [projectId], references: [id], onDelete: Cascade) |
| sprint | Sprint? | @relation(fields: [sprintId], references: [id], onDelete: SetNull) |
| board | KanbanBoard? | @relation(fields: [boardId], references: [id], onDelete: SetNull) |
| assignee | users? | @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull) |
| reporter | users | @relation("TaskReporter", fields: [reporterId], references: [id], onDelete: Cascade) |
| dependencies | TaskDependency | [] @relation("DependentTask") |
| dependents | TaskDependency | [] @relation("BlockingTask") |
| comments | TaskComment | [] |
| attachments | TaskAttachment | [] |
| timeEntries | TimeEntry | [] |
| tags | TaskTag | [] |

### TaskDependency

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| taskId | String | dependsOnTaskId String |
| type | String | @default("BLOCKS") // BLOCKS, RELATED_TO |
| createdAt | DateTime | @default(now()) |
| task | Task | @relation("DependentTask", fields: [taskId], references: [id], onDelete: Cascade) |
| dependsOnTask | Task | @relation("BlockingTask", fields: [dependsOnTaskId], references: [id], onDelete: Cascade) |

### Sprint

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| projectId | String | name        String |
| goal | String? | startDate   DateTime |
| endDate | DateTime | status      String    @default("PLANNED") // PLANNED, ACTIVE, COMPLETED, CANCELLED |
| velocity | Int? | createdAt   DateTime  @default(now()) |
| updatedAt | DateTime | @updatedAt |
| project | Project | @relation(fields: [projectId], references: [id], onDelete: Cascade) |
| tasks | Task | [] |

### KanbanBoard

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| projectId | String | name        String |
| description | String? | isDefault   Boolean  @default(false) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| project | Project | @relation(fields: [projectId], references: [id], onDelete: Cascade) |
| columns | KanbanColumn | [] |
| tasks | Task | [] |

### KanbanColumn

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| boardId | String | name        String |
| position | Int | limit       Int?     // WIP limit |
| color | String? | createdAt   DateTime @default(now()) |
| updatedAt | DateTime | @updatedAt |
| board | KanbanBoard | @relation(fields: [boardId], references: [id], onDelete: Cascade) |

### TaskComment

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| taskId | String | userId    String |
| content | String | createdAt DateTime @default(now()) |
| updatedAt | DateTime | @updatedAt |
| task | Task | @relation(fields: [taskId], references: [id], onDelete: Cascade) |
| user | users | @relation("TaskComments", fields: [userId], references: [id], onDelete: Cascade) |

### TaskAttachment

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| taskId | String | userId    String |
| filename | String | fileUrl   String |
| fileSize | Int | mimeType  String |
| createdAt | DateTime | @default(now()) |
| task | Task | @relation(fields: [taskId], references: [id], onDelete: Cascade) |
| user | users | @relation("TaskAttachments", fields: [userId], references: [id], onDelete: Cascade) |

### TimeEntry

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| taskId | String | userId      String |
| hours | Float | description String? |
| date | DateTime | @default(now()) |
| createdAt | DateTime | @default(now()) |
| task | Task | @relation(fields: [taskId], references: [id], onDelete: Cascade) |
| user | users | @relation("TimeEntries", fields: [userId], references: [id], onDelete: Cascade) |

### ProjectTag

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| projectId | String | name      String |
| color | String? | createdAt DateTime @default(now()) |
| project | Project | @relation(fields: [projectId], references: [id], onDelete: Cascade) |

### TaskTag

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id @default(uuid()) |
| taskId | String | name      String |
| color | String? | createdAt DateTime @default(now()) |
| task | Task | @relation(fields: [taskId], references: [id], onDelete: Cascade) |

### JobLog

| Field | Type | Attributes |
|-------|------|------------|
| id | String | @id |
| type | String | status      String    // 'pending' | 'processing' | 'completed' | 'failed' | 'delayed' |
| data | String? | // JSON |
| result | String? | // JSON |
| error | String? | attempts    Int       @default(0) |
| maxAttempts | Int | @default(3) |
| priority | Int | @default(1) |
| delay | Int | @default(0) |
| startedAt | DateTime? | completedAt DateTime? |
| failedAt | DateTime? | createdAt   DateTime  @default(now()) |
| updatedAt | DateTime | @@index([type]) |

