-- Broken CorpFlow starter schema: no tenant isolation or role boundaries.
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  salary DECIMAL(10,2),
  role VARCHAR(20)
);
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200),
  owner_id INTEGER REFERENCES users(id)
);
CREATE TABLE billing_details (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100),
  card_last4 VARCHAR(4),
  amount DECIMAL(10,2)
);
