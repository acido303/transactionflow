# TransactionFlow Data Pipeline - Mini Project Specification

## 1. Project Overview

**TransactionFlow Data Pipeline** is a portfolio/demo project designed to demonstrate practical experience with a classic data engineering stack:

- Java / Spring Boot
- Apache Kafka
- Apache Spark Structured Streaming
- Hadoop / HDFS
- PostgreSQL
- Next.js dashboard
- Docker Compose

The project simulates a financial transaction pipeline where random transaction events are generated, published to Kafka, processed by Spark, stored in HDFS, aggregated into PostgreSQL, and visualised in a live dashboard.

The goal is to create an interview-friendly mini project that can be started locally with Docker and used to explain how data flows through Kafka, Spark, Hadoop/HDFS and a curated serving database.

---

## 2. Main Objective

Build a local, Docker-based data pipeline that demonstrates:

- Kafka event ingestion.
- Spark Structured Streaming processing.
- Hadoop/HDFS raw and rejected data storage.
- PostgreSQL curated metrics.
- Java/Spring Boot event generation and reporting APIs.
- Next.js dashboard with live architecture/data-flow visualisation.
- Random data generation for demos.
- A simple world map chart showing transaction activity by country.

The project must be simple enough to run locally but realistic enough to discuss in a Senior Java/Data Engineering interview.

---

## 3. Business Scenario

The system simulates a financial transaction processing platform.

A Spring Boot producer service generates random transaction events and publishes them to Kafka. A Spark Structured Streaming job consumes the Kafka stream, validates records, normalises unknown transaction types, writes raw and rejected data to HDFS, calculates aggregations, and writes curated metrics to PostgreSQL.

A Spring Boot reporting API exposes processed metrics to a Next.js frontend.

The frontend shows:

- Live pipeline status.
- Live architecture and data-flow diagram.
- Animated arrows when data moves between components.
- Random data generator controls.
- Transaction metrics.
- High-value transactions.
- Rejected transactions.
- HDFS storage status.
- A simple world map chart with all countries and transaction activity by country.

---

## 4. High-Level Architecture

```text
+--------------------------+
| Next.js Frontend         |
| Dashboard / Flow / Map   |
+------------+-------------+
             |
             v
+--------------------------+
| Spring Boot Reporting API|
| Metrics / Status / UI API|
+------------+-------------+
             |
             v
+--------------------------+
| PostgreSQL               |
| Curated metrics          |
+--------------------------+

+--------------------------+
| Spring Boot Producer     |
| Random transaction data  |
+------------+-------------+
             |
             v
+--------------------------+
| Apache Kafka             |
| Topic: transactions.raw  |
+------------+-------------+
             |
             v
+--------------------------+
| Apache Spark Streaming   |
| Validate / transform     |
| Aggregate / enrich       |
+------------+-------------+
      |              |
      v              v
+-------------+   +----------------+
| HDFS        |   | PostgreSQL     |
| Raw data    |   | Metrics        |
| Rejections  |   | High value TX  |
| Checkpoints |   | Country stats  |
+-------------+   +----------------+
```

---

## 5. Technology Stack

### Backend

- Java 21 or Java 17
- Spring Boot
- Spring Web
- Spring Kafka
- Spring Data JPA
- PostgreSQL JDBC driver
- Maven
- JUnit

### Data Engineering

- Apache Kafka
- Apache Spark Structured Streaming
- Hadoop / HDFS
- Parquet
- Spark SQL

### Database

- PostgreSQL

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Flow for live architecture diagram
- React Simple Maps or equivalent SVG world map chart library

### Infrastructure

- Docker Compose
- Kafka UI
- Adminer or pgAdmin
- HDFS NameNode UI
- Spark Master UI

---

## 6. Docker-First Requirement

The entire project must run using Docker Compose.

The user must be able to start the full stack with:

```bash
docker compose up --build
```

No local installation of Kafka, Spark, Hadoop, PostgreSQL, Java, Maven or Node.js should be required, except Docker Desktop.

---

## 7. Docker Compose Services

The `docker-compose.yml` file must define the following services:

| Service | Purpose |
|---|---|
| `frontend` | Next.js dashboard |
| `producer-service` | Spring Boot service that generates transactions and publishes them to Kafka |
| `reporting-service` | Spring Boot REST API exposing metrics and pipeline status |
| `kafka` | Kafka broker |
| `kafka-ui` | UI to inspect Kafka topics and messages |
| `kafka-init` | Topic creation container |
| `spark-master` | Spark cluster master |
| `spark-worker` | Spark worker |
| `spark-streaming-job` | Spark Structured Streaming job |
| `hdfs-namenode` | Hadoop HDFS NameNode |
| `hdfs-datanode` | Hadoop HDFS DataNode |
| `hdfs-init` | HDFS directory creation container |
| `postgres` | PostgreSQL curated metrics database |
| `adminer` | PostgreSQL web UI |

---

## 8. Required Ports

| Service | Port |
|---|---|
| Frontend | `3000` |
| Producer API | `8081` |
| Reporting API | `8082` |
| Kafka | `9092` |
| Kafka UI | `8085` |
| Spark Master UI | `8080` |
| HDFS NameNode UI | `9870` |
| PostgreSQL | `5432` |
| Adminer | `8086` |

---

## 9. Kafka Topics

The system must create the following Kafka topics:

```text
transactions.raw
transactions.validated
transactions.rejected
```

### Topic Responsibilities

| Topic | Purpose |
|---|---|
| `transactions.raw` | Raw events generated by the producer |
| `transactions.validated` | Optional topic for valid normalised records |
| `transactions.rejected` | Optional topic for invalid records or dead-letter flow |

The first version may process only from `transactions.raw`, but the additional topics should exist to make the architecture extensible.

---

## 10. Transaction Event Model

### UUID Requirement

All generated identifiers that use UUIDs must use **UUID version 7**.

This applies at minimum to:

- `transactionId`
- Any future event IDs
- Any future correlation IDs stored as UUIDs
- Any future technical IDs generated by the application where UUIDs are used

Reason:

UUIDv7 is time-ordered, which makes it more suitable than random UUIDv4 for database indexing, event ordering, log correlation and data pipeline inspection.

Java implementation guidance:

- Use a UUIDv7-compatible library if the selected Java version does not provide native UUIDv7 generation.
- Do not use `UUID.randomUUID()` for transaction IDs, because that generates UUIDv4.
- Keep UUID generation centralised in a dedicated component, for example `UuidGenerator` or `TransactionIdGenerator`.

Example:

```json
{
  "transactionId": "018f2f5c-7b6a-7cc2-9c35-7a9f8e5b6c21"
}
```

### Example Transaction Event

```json
{
  "transactionId": "018f2f5c-7b6a-7cc2-9c35-7a9f8e5b6c21",
  "accountId": "ACC-10001",
  "customerId": "CUS-50001",
  "transactionType": "CARD_PAYMENT",
  "originalTransactionType": null,
  "amount": 149.99,
  "currency": "EUR",
  "merchant": "Amazon",
  "countryCode": "IE",
  "countryName": "Ireland",
  "createdAt": "2026-06-04T12:30:00Z"
}
```

### Supported Transaction Types

```text
CARD_PAYMENT
CASH_WITHDRAWAL
BANK_TRANSFER
DIRECT_DEBIT
REFUND
UNKNOWN
```

### Unknown Transaction Type Handling

The system must support an `UNKNOWN` transaction type.

If an unsupported transaction type is received, the pipeline must:

- Set `transactionType` to `UNKNOWN`.
- Preserve the original value in `originalTransactionType`.
- Continue processing the record if all critical fields are otherwise valid.

Example input:

```json
{
  "transactionType": "APPLE_PAY"
}
```

Example normalised output:

```json
{
  "transactionType": "UNKNOWN",
  "originalTransactionType": "APPLE_PAY"
}
```

`UNKNOWN` must not be used to hide critical data quality failures.

Records with missing or invalid critical fields must be rejected.

---

## 11. Validation Rules

The Spark job must validate incoming records.

### Required Fields

- `transactionId`
- `accountId`
- `customerId`
- `amount`
- `currency`
- `countryCode`
- `createdAt`

### Validation Rules

| Field | Rule |
|---|---|
| `transactionId` | Required and must be a UUIDv7 |
| `accountId` | Required |
| `customerId` | Required |
| `amount` | Must be greater than 0 |
| `currency` | Must be `EUR`, `GBP` or `USD` |
| `countryCode` | Required ISO-style country code |
| `createdAt` | Required and parseable timestamp |
| `transactionType` | Must be supported or normalised to `UNKNOWN` |

### Rejected Records

Rejected records must include:

```json
{
  "originalPayload": "...",
  "rejectionReason": "amount must be greater than zero",
  "ingestedAt": "2026-06-04T12:31:00Z"
}
```

---

## 12. Hadoop / HDFS Requirement

This project must use **Level 2 architecture** with Hadoop/HDFS.

HDFS must not be replaced by MinIO or local filesystem storage in version 1.

The HDFS implementation only needs:

- HDFS NameNode.
- HDFS DataNode.
- HDFS CLI access.
- HDFS NameNode web UI.
- Spark writing raw/rejected/checkpoint files to HDFS.

### Required HDFS Paths

```text
/data/transactionflow/raw/transactions
/data/transactionflow/rejected/transactions
/data/transactionflow/processed/transactions
/data/transactionflow/checkpoints
```

### HDFS URLs Used by Spark

```text
hdfs://hdfs-namenode:9000/data/transactionflow/raw/transactions
hdfs://hdfs-namenode:9000/data/transactionflow/rejected/transactions
hdfs://hdfs-namenode:9000/data/transactionflow/checkpoints
```

### Raw Valid Data

Valid parsed transactions must be written to HDFS as Parquet files.

Partitioning:

```text
year=YYYY/month=MM/day=DD
```

Example:

```text
/data/transactionflow/raw/transactions/year=2026/month=06/day=04/
```

### Rejected Data

Rejected records must be written to HDFS, including rejection reason.

Rejected records may be stored as JSON or Parquet.

### Checkpointing

Spark Structured Streaming checkpoints must be stored in HDFS:

```text
/data/transactionflow/checkpoints
```

Spark must not use local container storage for checkpoints.

---

## 13. Spark Structured Streaming Job

The Spark job must:

1. Connect to Kafka.
2. Read from topic `transactions.raw`.
3. Parse JSON messages.
4. Apply a strict schema.
5. Validate records.
6. Normalise unsupported transaction types to `UNKNOWN`.
7. Split valid and rejected records.
8. Write valid raw records to HDFS as Parquet.
9. Write rejected records to HDFS.
10. Detect high-value transactions.
11. Calculate aggregations.
12. Write curated metrics to PostgreSQL.
13. Store checkpoints in HDFS.

### Spark Aggregations

The job must calculate:

- Total transaction count by currency.
- Total amount by currency.
- Average amount by currency.
- Transaction count by transaction type.
- Total amount by transaction type.
- Transaction count by country.
- Total amount by country.
- High-value transactions.
- Rejected records count.
- Windowed metrics by processing time.

### High-Value Rule

Default high-value threshold:

```text
10000
```

Transactions above this threshold must be stored in PostgreSQL.

---

## 14. PostgreSQL Schema

### `transaction_metrics_by_currency`

```sql
CREATE TABLE transaction_metrics_by_currency (
    id BIGSERIAL PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    currency VARCHAR(3) NOT NULL,
    transaction_count BIGINT NOT NULL,
    total_amount NUMERIC(19, 4) NOT NULL,
    average_amount NUMERIC(19, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `transaction_metrics_by_type`

```sql
CREATE TABLE transaction_metrics_by_type (
    id BIGSERIAL PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_count BIGINT NOT NULL,
    total_amount NUMERIC(19, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `transaction_metrics_by_country`

```sql
CREATE TABLE transaction_metrics_by_country (
    id BIGSERIAL PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    transaction_count BIGINT NOT NULL,
    total_amount NUMERIC(19, 4) NOT NULL,
    average_amount NUMERIC(19, 4) NOT NULL,
    high_value_count BIGINT NOT NULL,
    rejected_count BIGINT NOT NULL,
    last_transaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `high_value_transactions`

```sql
CREATE TABLE high_value_transactions (
    transaction_id UUID PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    merchant VARCHAR(255),
    country_code VARCHAR(2),
    country_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `pipeline_status`

```sql
CREATE TABLE pipeline_status (
    id BIGSERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(19, 4) NOT NULL,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Indexes

Create indexes on:

- `window_start`
- `currency`
- `transaction_type`
- `country_code`
- `created_at`
- `transaction_id`

---

## 15. Producer Service

The producer service is a Spring Boot application responsible for generating transaction events and publishing them to Kafka.

Package suggestion:

```text
com.acido303.transactionflow.producer
```

### Responsibilities

- Generate random financial transaction events.
- Publish events to Kafka topic `transactions.raw`.
- Provide endpoints to control the random generator.
- Generate valid records.
- Generate invalid records.
- Generate high-value records.
- Generate unknown transaction type records.
- Generate bursts of random data for demos.

### Producer Endpoints

```http
POST /api/generator/start
POST /api/generator/stop
GET  /api/generator/status
POST /api/generator/transaction/random
POST /api/generator/transaction/invalid
POST /api/generator/transaction/high-value
POST /api/generator/transaction/unknown-type
POST /api/generator/burst
```

---

## 16. Random Data Generator

The random generator must be configurable from both REST API and the frontend.

### Start Generator

```http
POST /api/generator/start
```

Payload:

```json
{
  "eventsPerSecond": 5,
  "invalidPercentage": 2,
  "highValuePercentage": 1,
  "unknownTypePercentage": 3
}
```

### Generate Burst

```http
POST /api/generator/burst
```

Payload:

```json
{
  "numberOfEvents": 1000,
  "invalidPercentage": 5,
  "highValuePercentage": 2,
  "unknownTypePercentage": 5
}
```

### Random Merchants

```text
Amazon
Tesco
Lidl
Aldi
Dunnes Stores
Ryanair
Aer Lingus
Netflix
Spotify
Uber
Bolt
Apple
Google
Microsoft
Booking.com
```

### Countries

The generator must support a broad list of countries so the world map can show global activity.

At minimum:

```text
IE - Ireland
ES - Spain
GB - United Kingdom
FR - France
DE - Germany
NL - Netherlands
US - United States
PT - Portugal
IT - Italy
PL - Poland
BR - Brazil
AR - Argentina
MX - Mexico
CA - Canada
AU - Australia
JP - Japan
CN - China
IN - India
ZA - South Africa
SE - Sweden
NO - Norway
FI - Finland
DK - Denmark
BE - Belgium
CH - Switzerland
AT - Austria
```

### Amount Rules

Normal transactions:

```text
1.00 - 500.00
```

Medium transactions:

```text
500.01 - 2500.00
```

High-value transactions:

```text
10000.00 - 50000.00
```

Invalid amount examples:

```text
0
-10.00
-999.99
```

### Unknown Transaction Type Examples

```text
APPLE_PAY
GOOGLE_PAY
CRYPTO_TRANSFER
REVOLUT_TRANSFER
PAYPAL_PAYMENT
ATM_REVERSAL
INTERNAL_ADJUSTMENT
```

---

## 17. Reporting Service

The reporting service is a Spring Boot REST API that exposes processed metrics and pipeline status to the frontend.

Package suggestion:

```text
com.acido303.transactionflow.reporting
```

### Responsibilities

- Query PostgreSQL curated metrics.
- Expose metrics to the frontend.
- Expose pipeline health/status.
- Expose data for the live architecture diagram.
- Expose data for the world map chart.
- Optionally proxy generator actions to the producer service.

### Reporting Endpoints

```http
GET  /api/pipeline/status
GET  /api/pipeline/flow
GET  /api/pipeline/journey/latest
GET  /api/pipeline/journey/rejected/latest

GET  /api/metrics/summary
GET  /api/metrics/currency
GET  /api/metrics/type
GET  /api/metrics/countries
GET  /api/metrics/map/countries

GET  /api/transactions/recent
GET  /api/transactions/high-value
GET  /api/storage/hdfs/status
```

Optional proxy endpoints:

```http
POST /api/generator/start
POST /api/generator/stop
POST /api/generator/transaction/random
POST /api/generator/transaction/invalid
POST /api/generator/transaction/high-value
POST /api/generator/transaction/unknown-type
POST /api/generator/burst
```

---

## 18. Frontend UI

The frontend must be a Next.js dashboard.

The frontend must be designed for demo and interview purposes.

It should be simple, visual and focused on explaining how the data pipeline works.

### Recommended Navigation

```text
Dashboard
Architecture & Live Data Flow
Data Generator
Transaction Map
Metrics
Recent Transactions
High Value Transactions
HDFS Storage
```

---

## 19. Architecture & Live Data Flow View

The UI must include a live architecture diagram showing all major components and the flow of data between them.

Recommended library:

```text
React Flow
```

### Components/Nodos

The diagram must show:

- Producer Service
- Kafka topic `transactions.raw`
- Spark Structured Streaming Job
- HDFS Storage
- PostgreSQL
- Reporting API
- Frontend UI

### Visual Layout

```text
[Producer Service]
      |
      | messages/sec
      v
[Kafka: transactions.raw]
      |
      | consumed / lag
      v
[Spark Streaming Job]
   |                 |
   | raw/rejected    | metrics/high-value
   v                 v
[HDFS]           [PostgreSQL]
                      |
                      | REST / JSON
                      v
              [Reporting API]
                      |
                      v
                [Frontend UI]
```

### Live Node Counters

Each node must show live counters.

#### Producer Node

```text
Status
Messages sent
Rate per second
Last event timestamp
```

#### Kafka Node

```text
Topic name
Messages in topic
Partitions
Consumer lag
```

#### Spark Node

```text
Status
Processed messages
Rejected messages
Last batch ID
Rows per second
Last batch duration
```

#### HDFS Node

```text
Status
Raw files
Rejected files
Checkpoint status
Last write timestamp
```

#### PostgreSQL Node

```text
Status
Metric rows
High-value rows
Last update timestamp
```

#### Reporting API Node

```text
Status
Requests served
Average response time
Last request timestamp
```

#### Frontend Node

```text
Status
Last refresh timestamp
```

### Animated Edges

Each edge must visually react when new data moves through that part of the pipeline.

| Edge | Animation Trigger |
|---|---|
| Producer → Kafka | `producer.messagesSent` increases |
| Kafka → Spark | `spark.processedMessages` increases |
| Spark → HDFS | `hdfs.rawFiles` or `hdfs.rejectedFiles` increases |
| Spark → PostgreSQL | `postgres.metricRows` or `postgres.highValueRows` increases |
| PostgreSQL → Reporting API | `reportingApi.requestsServed` increases |
| Reporting API → Frontend | Each frontend refresh |

### Edge States

| State | Meaning |
|---|---|
| Grey | No recent activity |
| Green | Healthy data flow |
| Amber | Warning, lag or rejected count increasing |
| Red | Error/down |
| Flashing/animated | New data just moved through this connection |

The first implementation may simply flash the relevant edge for 500ms to 1 second when the frontend detects that the related counter increased.

### Polling Strategy

The first version should use polling.

The frontend calls:

```http
GET /api/pipeline/flow
```

every 1 second.

The frontend compares the new response with the previous response and animates the relevant edges when counters increase.

### Example `/api/pipeline/flow` Response

```json
{
  "timestamp": "2026-06-04T12:44:22Z",
  "components": {
    "producer": {
      "status": "RUNNING",
      "messagesSent": 12850,
      "ratePerSecond": 5.4
    },
    "kafka": {
      "status": "OK",
      "topic": "transactions.raw",
      "messagesInTopic": 12850,
      "consumerLag": 40
    },
    "spark": {
      "status": "RUNNING",
      "processedMessages": 12810,
      "rejectedMessages": 73,
      "lastBatchId": 48,
      "rowsPerSecond": 920
    },
    "hdfs": {
      "status": "OK",
      "rawFiles": 245,
      "rejectedFiles": 12,
      "checkpointStatus": "ACTIVE"
    },
    "postgres": {
      "status": "OK",
      "metricRows": 530,
      "highValueRows": 21
    },
    "reportingApi": {
      "status": "OK",
      "requestsServed": 320
    },
    "frontend": {
      "status": "ACTIVE",
      "lastRefreshAt": "2026-06-04T12:44:22Z"
    }
  },
  "connections": {
    "producerToKafka": {
      "status": "ACTIVE",
      "messagesSent": 12850,
      "deltaSinceLastCheck": 12
    },
    "kafkaToSpark": {
      "status": "ACTIVE",
      "messagesConsumed": 12810,
      "deltaSinceLastCheck": 10
    },
    "sparkToHdfs": {
      "status": "ACTIVE",
      "rawFilesWritten": 245,
      "rejectedFilesWritten": 12,
      "deltaSinceLastCheck": 2
    },
    "sparkToPostgres": {
      "status": "ACTIVE",
      "metricRowsWritten": 530,
      "deltaSinceLastCheck": 4
    },
    "postgresToApi": {
      "status": "OK"
    },
    "apiToFrontend": {
      "status": "ACTIVE"
    }
  }
}
```

---

## 20. Data Generator UI

The frontend must include a Data Generator panel.

### Controls

```text
Events/sec
Invalid %
High-value %
Unknown type %

Start Generator
Stop Generator

Generate Valid Transaction
Generate Invalid Transaction
Generate High-Value Transaction
Generate Unknown Type Transaction

Burst size
Generate Burst
```

### Demo Behaviour

During a demo, the user should be able to:

1. Start the generator.
2. See the Producer → Kafka arrow flash.
3. See Kafka counters increase.
4. See the Kafka → Spark arrow flash.
5. See Spark processed counters increase.
6. See the Spark → HDFS arrow flash when files are written.
7. See the Spark → PostgreSQL arrow flash when metrics are stored.
8. Generate invalid data and see rejected counters increase.
9. Generate high-value transactions and see them appear in the High Value Transactions table.
10. Generate a burst and see the whole pipeline react.

---

## 21. Transaction Map / World Map Chart

The UI must include a simple world map chart showing all countries.

This should be a data visualisation map, not a street-level interactive map.

Recommended approach:

```text
React Simple Maps + world TopoJSON/GeoJSON
```

Alternative:

```text
Apache ECharts map chart with registered world GeoJSON
```

### Purpose

The map must show transaction activity by country.

Each country should be visible. Countries with no transaction activity should use a neutral/empty style.

Countries with transaction activity should be shaded or highlighted according to one selected metric.

### Supported Map Metrics

The map should allow switching between:

- Transaction count.
- Total amount.
- Average amount.
- High-value transaction count.
- Rejected transaction count.

### Map Behaviour

The map should:

- Render all countries.
- Highlight countries with activity.
- Show tooltip on hover.
- Update when new data arrives.
- Briefly pulse/highlight a country when its transaction count increases.
- Allow selecting a country to see a detail panel.

### Country Tooltip

Tooltip fields:

```text
Country name
Country code
Transaction count
Total amount
Average amount
High-value count
Rejected count
Last transaction timestamp
```

### Country Detail Panel

When the user clicks a country, show:

```text
Country
Transactions
Total amount
Average amount
High-value transactions
Rejected transactions
Last transaction
Top transaction type
```

### Map Endpoint

```http
GET /api/metrics/map/countries
```

Example response:

```json
{
  "countries": [
    {
      "countryCode": "IE",
      "countryName": "Ireland",
      "transactionCount": 1250,
      "totalAmount": 320400.75,
      "averageAmount": 256.32,
      "currency": "EUR",
      "highValueCount": 12,
      "rejectedCount": 4,
      "lastTransactionAt": "2026-06-04T12:55:00Z"
    },
    {
      "countryCode": "ES",
      "countryName": "Spain",
      "transactionCount": 830,
      "totalAmount": 210120.50,
      "averageAmount": 253.15,
      "currency": "EUR",
      "highValueCount": 8,
      "rejectedCount": 2,
      "lastTransactionAt": "2026-06-04T12:54:45Z"
    }
  ]
}
```

### Map Data Note

The world map geometry should be stored locally in the frontend project when possible.

Do not make the dashboard depend on an external map service for basic rendering.

This avoids failures during demos and keeps the project self-contained.

---

## 22. Dashboard Summary Page

The main dashboard page must show:

- Pipeline status cards.
- Generator status.
- Total transactions.
- Rejected transactions.
- High-value transactions.
- Total amount.
- Latest transactions.
- Link to Architecture & Live Data Flow.
- Link to Transaction Map.

Example:

```text
TransactionFlow Dashboard

Producer: RUNNING       Kafka: OK
Spark Job: RUNNING      HDFS: OK
PostgreSQL: OK          Reporting API: OK

Total transactions today: 15,420
Rejected records: 37
High-value transactions: 12
Total EUR amount: 2,450,320.45
```

---

## 23. Recent Transactions View

The UI must show recent transactions.

Columns:

| Time | Transaction ID | Account | Type | Amount | Currency | Country | Status |
|---|---|---|---:|---|---|---|

Statuses:

```text
VALID
REJECTED
HIGH_VALUE
NORMALISED
UNKNOWN_TYPE
```

---

## 24. HDFS Storage View

The UI must show HDFS storage status.

Fields:

```text
Raw transactions path
Rejected transactions path
Checkpoint path
Raw files count
Rejected files count
Last write timestamp
Checkpoint status
```

Example:

```text
Raw transactions:
hdfs://hdfs-namenode:9000/data/transactionflow/raw/transactions

Rejected transactions:
hdfs://hdfs-namenode:9000/data/transactionflow/rejected/transactions

Checkpoints:
hdfs://hdfs-namenode:9000/data/transactionflow/checkpoints
```

---

## 25. Repository Structure

```text
transactionflow-data-pipeline/
├── docker-compose.yml
├── README.md
├── docs/
│   ├── architecture.md
│   ├── data-flow.md
│   ├── docker.md
│   ├── frontend.md
│   ├── interview-notes.md
│   └── troubleshooting.md
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── producer-service/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
├── reporting-service/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
├── spark-jobs/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
├── database/
│   ├── init.sql
│   └── schema.sql
├── kafka/
│   └── create-topics.sh
├── hdfs/
│   └── init-hdfs.sh
└── sample-data/
    ├── valid-transaction.json
    ├── invalid-transaction.json
    ├── high-value-transaction.json
    └── unknown-type-transaction.json
```

---

## 26. Example Docker Compose Skeleton

```yaml
version: "3.9"

services:
  kafka:
    image: bitnami/kafka:latest
    container_name: transactionflow-kafka
    ports:
      - "9092:9092"
    environment:
      - KAFKA_CFG_NODE_ID=1
      - KAFKA_CFG_PROCESS_ROLES=broker,controller
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka:9093
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=false
      - ALLOW_PLAINTEXT_LISTENER=yes
    networks:
      - transactionflow-net

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: transactionflow-kafka-ui
    ports:
      - "8085:8080"
    environment:
      - KAFKA_CLUSTERS_0_NAME=transactionflow-local
      - KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=kafka:9092
    depends_on:
      - kafka
    networks:
      - transactionflow-net

  postgres:
    image: postgres:17
    container_name: transactionflow-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=transactionflow
      - POSTGRES_USER=transactionflow
      - POSTGRES_PASSWORD=transactionflow
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/001-schema.sql
    networks:
      - transactionflow-net

  adminer:
    image: adminer:latest
    container_name: transactionflow-adminer
    ports:
      - "8086:8080"
    depends_on:
      - postgres
    networks:
      - transactionflow-net

  hdfs-namenode:
    image: apache/hadoop:3.4.1
    container_name: transactionflow-hdfs-namenode
    hostname: hdfs-namenode
    ports:
      - "9870:9870"
      - "9000:9000"
    command: ["hdfs", "namenode"]
    networks:
      - transactionflow-net

  hdfs-datanode:
    image: apache/hadoop:3.4.1
    container_name: transactionflow-hdfs-datanode
    hostname: hdfs-datanode
    depends_on:
      - hdfs-namenode
    command: ["hdfs", "datanode"]
    networks:
      - transactionflow-net

  spark-master:
    image: bitnami/spark:latest
    container_name: transactionflow-spark-master
    ports:
      - "8080:8080"
      - "7077:7077"
    environment:
      - SPARK_MODE=master
    networks:
      - transactionflow-net

  spark-worker:
    image: bitnami/spark:latest
    container_name: transactionflow-spark-worker
    depends_on:
      - spark-master
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_URL=spark://spark-master:7077
    networks:
      - transactionflow-net

  producer-service:
    build:
      context: ./producer-service
      dockerfile: Dockerfile
    container_name: transactionflow-producer-service
    ports:
      - "8081:8081"
    environment:
      - SERVER_PORT=8081
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
      - TRANSACTIONFLOW_TOPIC_RAW=transactions.raw
    depends_on:
      - kafka
    networks:
      - transactionflow-net

  reporting-service:
    build:
      context: ./reporting-service
      dockerfile: Dockerfile
    container_name: transactionflow-reporting-service
    ports:
      - "8082:8082"
    environment:
      - SERVER_PORT=8082
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/transactionflow
      - SPRING_DATASOURCE_USERNAME=transactionflow
      - SPRING_DATASOURCE_PASSWORD=transactionflow
    depends_on:
      - postgres
    networks:
      - transactionflow-net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: transactionflow-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_REPORTING_API_URL=http://localhost:8082
    depends_on:
      - reporting-service
    networks:
      - transactionflow-net

  spark-streaming-job:
    build:
      context: ./spark-jobs
      dockerfile: Dockerfile
    container_name: transactionflow-spark-streaming-job
    depends_on:
      - kafka
      - spark-master
      - spark-worker
      - hdfs-namenode
      - hdfs-datanode
      - postgres
    environment:
      - SPARK_MASTER_URL=spark://spark-master:7077
      - KAFKA_BOOTSTRAP_SERVERS=kafka:9092
      - KAFKA_TOPIC_RAW=transactions.raw
      - HDFS_RAW_PATH=hdfs://hdfs-namenode:9000/data/transactionflow/raw/transactions
      - HDFS_REJECTED_PATH=hdfs://hdfs-namenode:9000/data/transactionflow/rejected/transactions
      - HDFS_CHECKPOINT_PATH=hdfs://hdfs-namenode:9000/data/transactionflow/checkpoints
      - POSTGRES_URL=jdbc:postgresql://postgres:5432/transactionflow
      - POSTGRES_USER=transactionflow
      - POSTGRES_PASSWORD=transactionflow
    networks:
      - transactionflow-net

volumes:
  postgres-data:

networks:
  transactionflow-net:
    driver: bridge
```

This is a starting skeleton. It may require image-specific Hadoop configuration to make HDFS work correctly in Docker.

---

## 27. Local Development Commands

Start everything:

```bash
docker compose up --build
```

Start in detached mode:

```bash
docker compose up --build -d
```

Stop everything:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

View logs:

```bash
docker compose logs -f producer-service
docker compose logs -f spark-streaming-job
docker compose logs -f reporting-service
docker compose logs -f frontend
```

Start transaction generation:

```bash
curl -X POST http://localhost:8081/api/generator/start \
  -H "Content-Type: application/json" \
  -d '{"eventsPerSecond":5,"invalidPercentage":2,"highValuePercentage":1,"unknownTypePercentage":3}'
```

Generate a burst:

```bash
curl -X POST http://localhost:8081/api/generator/burst \
  -H "Content-Type: application/json" \
  -d '{"numberOfEvents":1000,"invalidPercentage":5,"highValuePercentage":2,"unknownTypePercentage":5}'
```

Check reporting API:

```bash
curl http://localhost:8082/api/metrics/summary
curl http://localhost:8082/api/pipeline/flow
curl http://localhost:8082/api/metrics/map/countries
```

Inspect HDFS:

```bash
docker exec -it transactionflow-hdfs-namenode bash
hdfs dfs -ls /data/transactionflow
hdfs dfs -ls /data/transactionflow/raw/transactions
hdfs dfs -ls /data/transactionflow/rejected/transactions
```

---

## 28. Web UIs

| UI | URL |
|---|---|
| Frontend Dashboard | `http://localhost:3000` |
| Kafka UI | `http://localhost:8085` |
| Spark Master UI | `http://localhost:8080` |
| HDFS NameNode UI | `http://localhost:9870` |
| Adminer | `http://localhost:8086` |

Adminer connection:

```text
System: PostgreSQL
Server: postgres
Username: transactionflow
Password: transactionflow
Database: transactionflow
```

---

## 29. Non-Functional Requirements

### Observability

- Use structured logs where practical.
- Log Kafka publishing activity.
- Log Spark batch processing status.
- Log rejected record count.
- Log PostgreSQL write failures.
- Expose pipeline status through the reporting API.

### Reliability

- Spark checkpointing must be enabled.
- Kafka producer should retry transient failures.
- PostgreSQL writes should avoid duplicate high-value transaction records.
- Invalid records must not stop the streaming job.

### Security

- No secrets committed to Git.
- Use environment variables for credentials.
- Docker Compose may use local development credentials only.
- README must clearly state that local credentials are not production credentials.

### Performance

- Spark should process data in micro-batches.
- PostgreSQL tables should be indexed.
- Frontend polling interval should default to 1 second.
- The random generator must allow limiting event rate.

### Testability

- Unit tests for transaction generation.
- Unit tests for validation rules.
- Unit tests for unknown transaction type normalisation.
- Integration test for Kafka producer.
- Integration test for reporting API repositories.
- Optional Testcontainers tests for Kafka and PostgreSQL.

---

## 30. Implementation Phases

### Phase 1: Core Docker Infrastructure

- Kafka
- Kafka UI
- PostgreSQL
- Adminer
- Basic Docker network

### Phase 2: Producer Service

- Spring Boot producer
- Random transaction generator
- Kafka publishing
- REST controls

### Phase 3: Spark Reads Kafka

- Spark Structured Streaming job
- Read Kafka messages
- Parse JSON
- Log processed records

### Phase 4: Hadoop/HDFS

- Add NameNode and DataNode
- Create HDFS directories
- Spark writes valid/rejected files to HDFS
- Spark stores checkpoints in HDFS

### Phase 5: PostgreSQL Metrics

- Spark writes curated metrics to PostgreSQL
- Add high-value transactions table
- Add country metrics table

### Phase 6: Reporting API

- Metrics endpoints
- Pipeline status endpoints
- Map endpoint
- HDFS status endpoint

### Phase 7: Frontend Dashboard

- Summary dashboard
- Data generator controls
- Recent transactions
- High-value table

### Phase 8: Live Architecture & Data Flow

- React Flow diagram
- Live counters
- Animated edges
- Polling from `/api/pipeline/flow`

### Phase 9: World Map Chart

- World map with all countries
- Country activity metrics
- Tooltip and detail panel
- Pulse countries when data changes

---

## 31. Interview Talking Points

This project should allow the developer to explain:

- Why Kafka is used for ingestion.
- How Kafka decouples producers and consumers.
- How Spark Structured Streaming processes Kafka data.
- How data validation and rejection works.
- Why unknown transaction types are normalised rather than always rejected.
- Why raw and rejected data are stored in HDFS.
- Why Parquet is useful for analytics workloads.
- Why Spark checkpoints are stored in HDFS.
- Why PostgreSQL is used as a curated serving layer.
- How a reporting API exposes processed data to the UI.
- How a live architecture diagram helps explain operational data flow.
- How country-level aggregations feed a world map chart.
- How random data generation supports demos and testing.

---

## 32. Out of Scope for Version 1

Do not implement the following in the first version:

- Kubernetes.
- Kerberos.
- YARN.
- Hive.
- HBase.
- Ranger.
- Knox.
- TLS between Hadoop services.
- Cloud deployment.
- Schema Registry.
- Avro.
- CDC.
- Airflow.
- Flink.
- Real financial market feeds.
- Full fraud detection ML model.
- Authentication/login.
- Production-grade monitoring.

---

## 33. Optional Extensions

### Extension 1: Schema Registry and Avro

Replace plain JSON messages with Avro and Schema Registry.

### Extension 2: Kafka Dead Letter Topic

Publish invalid messages to `transactions.rejected` before or after HDFS rejection storage.

### Extension 3: Batch Reprocessing Job

Create a Spark batch job that reads historical Parquet files from HDFS and recalculates metrics.

### Extension 4: Simple Fraud Rules

Add rule-based fraud checks:

- Multiple transactions from different countries in a short time window.
- More than 5 transactions in 1 minute for the same account.
- Sudden amount above customer average.

### Extension 5: Server-Sent Events

Replace polling with Server-Sent Events for live UI updates.

### Extension 6: Next.js Map Animation Enhancements

Add animated pulses on countries when transaction volume increases.

---

## 34. Definition of Done

The project is complete when:

- `docker compose up --build` starts the full stack.
- Kafka topics are created automatically.
- HDFS directories are created automatically.
- Producer service publishes random transaction events to Kafka.
- Generated transaction IDs use UUID version 7.
- Spark consumes Kafka messages.
- Spark validates transactions.
- Spark normalises unknown transaction types to `UNKNOWN`.
- Spark writes valid records to HDFS as Parquet.
- Spark writes rejected records to HDFS with rejection reasons.
- Spark stores checkpoints in HDFS.
- Spark writes currency/type/country metrics to PostgreSQL.
- Spark writes high-value transactions to PostgreSQL.
- Reporting API exposes metrics, pipeline status and map data.
- Frontend dashboard displays pipeline status.
- Frontend has random data generator controls.
- Frontend has a live architecture/data-flow view.
- Frontend animates arrows when data moves through the pipeline.
- Frontend has a world map chart showing all countries.
- Countries update/pulse when transaction activity changes.
- README explains how to run and demo the project.
- The project can be discussed as a practical Java/Data Engineering portfolio project.

---

## 35. Suggested CV Description

After implementing the project, it can be described in the CV as:

> Built a Docker-based Kafka/Spark/Hadoop data pipeline using Java/Spring Boot, Spark Structured Streaming, HDFS, PostgreSQL and Next.js. The system generates random financial transaction events, streams them through Kafka, validates and processes them with Spark, stores raw/rejected data in HDFS, writes curated metrics to PostgreSQL, and displays live pipeline activity through an interactive dashboard with animated data-flow visualisation and a world map chart.

---

## 36. Important Implementation Warning

Hadoop in Docker can be fragile.

The first milestone is not production realism or performance. The first milestone is end-to-end data flow:

```text
Spring Boot Producer
    -> Kafka
    -> Spark Structured Streaming
    -> HDFS raw/rejected files
    -> PostgreSQL metrics
    -> Spring Boot Reporting API
    -> Next.js Dashboard
```

Keep the Hadoop implementation minimal and focused on HDFS.

Do not add YARN, Kerberos, Hive, HBase or extra Hadoop ecosystem components until the core pipeline is working.

---

## 37. As-Built Implementation Notes

The system was implemented end-to-end and runs with `docker compose up --build`. This section records where the delivered system **differs from** or **extends** the original specification above. Where this section and earlier sections disagree, **this section reflects what was actually built**.

### 37.1 Docker Image Choices

The image choices in §26 were a starting skeleton. The working stack uses:

| Service | Spec skeleton | As built | Reason |
|---|---|---|---|
| `kafka` / `kafka-init` | `bitnami/kafka:latest` | `apache/kafka:3.7.1` | The `bitnami/kafka:3.7` tag is not published; switched to the official Apache image (KRaft, env vars without the `KAFKA_CFG_` prefix, `CLUSTER_ID`, data dir `/var/lib/kafka/data`). |
| `spark-*` | `bitnami/spark:latest` | `apache/spark:3.5.1` | Official image; master/worker started via explicit `spark-class` commands, `SPARK_HOME=/opt/spark`. |
| `hdfs-namenode` / `hdfs-datanode` | `apache/hadoop:3.4.1` | `bde2020/hadoop-namenode` / `-datanode:2.0.0-hadoop3.2.1-java8` | The bde2020 images provide turnkey single-node HDFS with `CORE_CONF_*` / `HDFS_CONF_*` env configuration. |
| `hdfs-init` | (CLI in hadoop image) | `curlimages/curl:latest` | Directory creation uses the **WebHDFS REST API** (`PUT …?op=MKDIRS`) instead of the Hadoop CLI, which avoided entrypoint conflicts. |

The namenode also sets `extra_hosts: ["hdfs-namenode:127.0.0.1"]` and `hadoop.security.authentication=simple` so `InetAddress.getLocalHost()` resolves before the JVM starts, and the datanode depends on the namenode with `condition: service_started` (not `service_healthy`) to avoid a startup deadlock. The namenode health check verifies HDFS safe mode is **OFF** so `hdfs-init` only runs once writes are allowed.

### 37.2 Single `.env` Configuration

All ports, credentials, topic names, HDFS paths, Spark resources, and the high-value threshold live in a **single root `.env` file**. `docker-compose.yml` references them with `${VAR}` interpolation, so there is one place to change any configuration. (The spec implied per-service env blocks; the as-built design centralises them.)

### 37.3 PostgreSQL Schema — Additional Tables

In addition to the five tables in §14 (`transaction_metrics_by_currency`, `transaction_metrics_by_type`, `transaction_metrics_by_country`, `high_value_transactions`, `pipeline_status`), two tables were added to support the dashboard:

- **`recent_transactions`** — rolling buffer of recently processed transactions (valid + rejected) with a `status` column (`VALID`, `HIGH_VALUE`, `REJECTED`), used by the Recent Transactions view and the metrics summary.
- **`spark_job_metrics`** — one row per Spark micro-batch (processed/rejected counts, rows/sec, batch duration, files written), used to drive the live pipeline-flow and HDFS status endpoints.

### 37.4 Spark → PostgreSQL JDBC

The PostgreSQL JDBC connection sets **`stringtype=unspecified`** so string values (e.g. the `transactionId`) are cast by PostgreSQL into `UUID` columns. Without it, inserts into `high_value_transactions` / `recent_transactions` fail with a type mismatch. The job uses the `foreachBatch` pattern (required for arbitrary JDBC writes from Structured Streaming) and wraps every sink write in its own try/catch so a single failing sink never stops the stream.

### 37.5 Generator Reference-Data Configuration (extension)

Beyond the generator endpoints in §15, the producer exposes endpoints to **inspect and edit the reference-data lists at runtime**, also proxied through the reporting service and surfaced in the Data Generator UI:

```http
GET    /api/generator/config
POST   /api/generator/config/merchants        # body: { "value": "IKEA" }
DELETE /api/generator/config/merchants        # body: { "value": "IKEA" }
POST   /api/generator/config/countries        # body: { "code": "NZ" }  (ISO name derived)
DELETE /api/generator/config/countries        # body: { "code": "NZ" }
POST   /api/generator/config/unknown-types    # body: { "value": "WISE_TRANSFER" }
DELETE /api/generator/config/unknown-types    # body: { "value": "WISE_TRANSFER" }
```

Countries are validated against the official **ISO 3166-1 alpha-2** list (the iban.com country-codes set); only valid codes can be added and the canonical ISO name is always stored. Currencies (`EUR/GBP/USD`) and the supported transaction types remain fixed because the Spark validation logic depends on them. The lists are held in memory (thread-safe) and reset on producer restart.

### 37.6 Frontend Enhancements (extension)

- **Architecture view:** nodes are **draggable**, the custom layout is **persisted to `localStorage`** and restored on reload, with a **Reset layout** button. The 1 s poll updates only live counters/edges, never positions.
- **Data Generator view:** adds chip-style editors for the reference-data lists above (merchants, countries via an ISO dropdown, unknown types) plus a read-only display of the fixed currencies and valid types.
- **React Flow controls** restyled to match the dark theme.

### 37.7 Next.js Version

The frontend uses **Next.js 15** (the spec said Next.js generally). It was upgraded from the initially-scaffolded 14.2.x to pick up security patches. The Docker build uses `output: "standalone"`, `npm install` (no committed lockfile), a `.dockerignore` excluding `node_modules`/`.next`, and `typescript.ignoreBuildErrors` so the production image builds without a separate type-check pass.

### 37.8 Documentation & Screenshots

A `README.md` (run/stop instructions, full endpoint reference, data-location notes) and a `docs/screenshots/` gallery covering all eight dashboard pages were added.
