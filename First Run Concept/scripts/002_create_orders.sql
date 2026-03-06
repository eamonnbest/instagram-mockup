-- Create orders table for tracking customer orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL')),
  customer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'refunded', 'shipped')),
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders are not publicly readable - only by admin or the customer
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Index for product lookups
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
