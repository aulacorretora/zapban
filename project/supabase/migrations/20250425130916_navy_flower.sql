/*
  # Rename full_name column to nome

  1. Changes
    - Rename full_name column to nome in users table
*/

-- Rename full_name column to nome
ALTER TABLE users RENAME COLUMN full_name TO nome;