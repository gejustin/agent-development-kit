CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  shipped_at TIMESTAMP,
  status TEXT NOT NULL
);
