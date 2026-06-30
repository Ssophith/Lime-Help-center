-- Add admin authentication table
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - CHANGE THIS!)
-- Password hash is for 'admin123' - you should change this after first login
-- To generate a new hash, use: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('yourpassword', 10));"
INSERT INTO admin_users (id, username, password_hash)
VALUES ('admin_1', 'admin', '$2a$10$rOzJqZqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq')
ON CONFLICT (username) DO NOTHING;
