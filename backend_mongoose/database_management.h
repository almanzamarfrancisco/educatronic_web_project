#ifndef DATABASE_H
#define DATABASE_H

#include <sqlite3.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Function declarations
int sqlite3_init_database();
void load_exercises_from_db(sqlite3 *db);
void load_programs_from_db(sqlite3 *db);
static int exercises_callback(void *NotUsed, int argc, char **argv, char **azColName);
static int programs_callback(void *NotUsed, int argc, char **argv, char **azColName);

// Struct definitions
typedef struct PROGRAM_FILE {
    int fileId;
    char *name;
    char *code;
    int exercise_id;
} program_file;

typedef struct EXERCISE {
    int exercise_id;
    char *name;
    char *content;
    uint16_t program_files_count;
} exercise;

// Global variable declarations (use extern)
extern exercise *exercises;
extern program_file *programs;
extern size_t exercises_count;
extern size_t programs_count;

#endif // DATABASE_H
