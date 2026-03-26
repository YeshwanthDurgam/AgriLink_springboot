-- Migration for adding fraud case management
-- V10__add_fraud_case_table.sql

CREATE TABLE IF NOT EXISTS fraud_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(50) NOT NULL UNIQUE,
    reporter_id UUID NOT NULL,
    accused_id UUID NOT NULL,
    order_id UUID,
    fraud_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    description TEXT,
    evidence_details TEXT,
    investigation_notes TEXT,
    resolved_reason TEXT,
    resolved_by_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_fraud_status ON fraud_cases(status);
CREATE INDEX IF NOT EXISTS idx_fraud_reporter_id ON fraud_cases(reporter_id);
CREATE INDEX IF NOT EXISTS idx_fraud_accused_id ON fraud_cases(accused_id);
CREATE INDEX IF NOT EXISTS idx_fraud_created_at ON fraud_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_order_id ON fraud_cases(order_id);

-- Add comment to table
COMMENT ON TABLE fraud_cases IS 'Stores fraud reports and investigation cases';
COMMENT ON COLUMN fraud_cases.case_number IS 'Unique case identifier for tracking';
COMMENT ON COLUMN fraud_cases.fraud_type IS 'Type of fraud: PAYMENT_FRAUD, IDENTITY_FRAUD, PRODUCT_FRAUD, NON_DELIVERY, NON_PAYMENT, ACCOUNT_COMPROMISE, SUSPICIOUS_ACTIVITY, OTHER';
COMMENT ON COLUMN fraud_cases.priority IS 'Case priority: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN fraud_cases.status IS 'Investigation status: OPEN, INVESTIGATING, RESOLVED, CLOSED, ESCALATED';
