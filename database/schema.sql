-- TransactionFlow Database Schema

-- ─── Metrics by Currency ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_metrics_by_currency (
    id                BIGSERIAL PRIMARY KEY,
    window_start      TIMESTAMPTZ NOT NULL,
    window_end        TIMESTAMPTZ NOT NULL,
    currency          VARCHAR(3)  NOT NULL,
    transaction_count BIGINT      NOT NULL,
    total_amount      NUMERIC(19, 4) NOT NULL,
    average_amount    NUMERIC(19, 4) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_currency_window ON transaction_metrics_by_currency (window_start, currency);
CREATE INDEX IF NOT EXISTS idx_metrics_currency_currency ON transaction_metrics_by_currency (currency);
CREATE INDEX IF NOT EXISTS idx_metrics_currency_created ON transaction_metrics_by_currency (created_at);

-- ─── Metrics by Transaction Type ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_metrics_by_type (
    id                BIGSERIAL PRIMARY KEY,
    window_start      TIMESTAMPTZ NOT NULL,
    window_end        TIMESTAMPTZ NOT NULL,
    transaction_type  VARCHAR(50) NOT NULL,
    transaction_count BIGINT      NOT NULL,
    total_amount      NUMERIC(19, 4) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_type_window ON transaction_metrics_by_type (window_start, transaction_type);
CREATE INDEX IF NOT EXISTS idx_metrics_type_type ON transaction_metrics_by_type (transaction_type);
CREATE INDEX IF NOT EXISTS idx_metrics_type_created ON transaction_metrics_by_type (created_at);

-- ─── Metrics by Country ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_metrics_by_country (
    id                   BIGSERIAL PRIMARY KEY,
    window_start         TIMESTAMPTZ  NOT NULL,
    window_end           TIMESTAMPTZ  NOT NULL,
    country_code         VARCHAR(2)   NOT NULL,
    country_name         VARCHAR(100) NOT NULL,
    transaction_count    BIGINT       NOT NULL,
    total_amount         NUMERIC(19, 4) NOT NULL,
    average_amount       NUMERIC(19, 4) NOT NULL,
    high_value_count     BIGINT       NOT NULL DEFAULT 0,
    rejected_count       BIGINT       NOT NULL DEFAULT 0,
    last_transaction_at  TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_country_window ON transaction_metrics_by_country (window_start, country_code);
CREATE INDEX IF NOT EXISTS idx_metrics_country_code ON transaction_metrics_by_country (country_code);
CREATE INDEX IF NOT EXISTS idx_metrics_country_created ON transaction_metrics_by_country (created_at);

-- ─── High-Value Transactions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS high_value_transactions (
    transaction_id   UUID         PRIMARY KEY,
    account_id       VARCHAR(50)  NOT NULL,
    customer_id      VARCHAR(50)  NOT NULL,
    amount           NUMERIC(19, 4) NOT NULL,
    currency         VARCHAR(3)   NOT NULL,
    transaction_type VARCHAR(50)  NOT NULL,
    merchant         VARCHAR(255),
    country_code     VARCHAR(2),
    country_name     VARCHAR(100),
    created_at       TIMESTAMPTZ  NOT NULL,
    detected_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_high_value_created ON high_value_transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_high_value_currency ON high_value_transactions (currency);
CREATE INDEX IF NOT EXISTS idx_high_value_country ON high_value_transactions (country_code);

-- ─── Pipeline Status ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_status (
    id               BIGSERIAL    PRIMARY KEY,
    component_name   VARCHAR(100) NOT NULL,
    status           VARCHAR(50)  NOT NULL,
    metric_name      VARCHAR(100) NOT NULL,
    metric_value     NUMERIC(19, 4) NOT NULL,
    last_updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_status_component ON pipeline_status (component_name);
CREATE INDEX IF NOT EXISTS idx_pipeline_status_updated ON pipeline_status (last_updated_at);

-- ─── Recent Transactions (rolling buffer for UI display) ─────────────────────
CREATE TABLE IF NOT EXISTS recent_transactions (
    id               BIGSERIAL    PRIMARY KEY,
    transaction_id   UUID         NOT NULL UNIQUE,
    account_id       VARCHAR(50)  NOT NULL,
    customer_id      VARCHAR(50)  NOT NULL,
    transaction_type VARCHAR(50)  NOT NULL,
    amount           NUMERIC(19, 4) NOT NULL,
    currency         VARCHAR(3)   NOT NULL,
    merchant         VARCHAR(255),
    country_code     VARCHAR(2),
    country_name     VARCHAR(100),
    status           VARCHAR(20)  NOT NULL,
    rejection_reason TEXT,
    created_at       TIMESTAMPTZ  NOT NULL,
    processed_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recent_tx_created ON recent_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_tx_status ON recent_transactions (status);
CREATE INDEX IF NOT EXISTS idx_recent_tx_country ON recent_transactions (country_code);

-- ─── Spark Job Metrics (written by Spark job for pipeline status) ─────────────
CREATE TABLE IF NOT EXISTS spark_job_metrics (
    id                   BIGSERIAL PRIMARY KEY,
    batch_id             BIGINT    NOT NULL,
    processed_messages   BIGINT    NOT NULL DEFAULT 0,
    rejected_messages    BIGINT    NOT NULL DEFAULT 0,
    rows_per_second      NUMERIC(10, 2) NOT NULL DEFAULT 0,
    batch_duration_ms    BIGINT    NOT NULL DEFAULT 0,
    raw_files_written    BIGINT    NOT NULL DEFAULT 0,
    rejected_files_written BIGINT  NOT NULL DEFAULT 0,
    recorded_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spark_metrics_recorded ON spark_job_metrics (recorded_at DESC);
