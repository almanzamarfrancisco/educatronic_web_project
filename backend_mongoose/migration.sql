-- Drop existing tables if they exist
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS answers;

-- Create exercises table
CREATE TABLE exercises (
    exercise_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    difficulty TEXT NOT NULL
);

-- Create programs table
CREATE TABLE programs (
    program_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
);

-- Create answers table
CREATE TABLE answers (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
);
