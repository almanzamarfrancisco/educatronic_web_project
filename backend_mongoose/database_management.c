#include "database_management.h"

exercise *exercises = NULL;
program_file *programs = NULL;
size_t exercises_count = 0;
size_t programs_count = 0;

int sqlite3_init_database() {
    sqlite3 *db;
    int rc = sqlite3_open("db.sqlite3", &db);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return 1;
    }
    printf("[I] Database initialized.\n");
    load_exercises_from_db(db);
    load_programs_from_db(db);
    sqlite3_close(db);
    return 0;
}
void load_exercises_from_db(sqlite3 *db) {
    char *err_msg = 0;
    exercises_count = 0;
    const char *exercise_table = "SELECT * FROM Exercises;";
    int rc = sqlite3_exec(db, exercise_table, exercises_callback, 0, &err_msg);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "Failed to load exercises: %s\n", err_msg);
        sqlite3_free(err_msg);
    }
    else
    {
        printf("\t => Loaded %zu exercises\n", exercises_count);
        for (size_t i = 0; i < exercises_count; i++)
            printf("\t\t=> Exercise: %d - %s\n", exercises[i].exercise_id, exercises[i].name);
        printf("----------------------------------------------------\n");
    }
}
void load_programs_from_db(sqlite3 *db) {
    char *err_msg = 0;
    programs_count = 0;
    printf("Loading programs...\n");
    const char *program_file_table = "SELECT * FROM ProgramFiles;";
    int rc = sqlite3_exec(db, program_file_table, programs_callback, 0, &err_msg);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "Failed to load programs: %s\n", err_msg);
        sqlite3_free(err_msg);
    }
    else
    {
        printf("\t => Loaded %zu programs\n", programs_count);
        for (size_t i = 0; i < programs_count; i++)
            printf("\t\t=> Program: %d - %s\n", programs[i].fileId, programs[i].name);
    }
}
static int exercises_callback(void *NotUsed, int argc, char **argv, char **azColName) {
    (void)NotUsed;
    (void)argc;
    (void)azColName;
    exercises = realloc(exercises, (exercises_count + 1) * sizeof(exercise));
    if (!exercises)
    {
        fprintf(stderr, "Memory allocation failed in exercises\n");
        exit(1);
    }
    for (size_t i = 0; i < exercises_count; i++)
    {
        if (exercises[i].exercise_id == atoi(argv[0]))
            return 0;
    }
    exercises[exercises_count].exercise_id = atoi(argv[0]);
    exercises[exercises_count].name = strdup(argv[1]);
    exercises[exercises_count].content = strdup(argv[2]);
    exercises[exercises_count].program_files_count = 0;
    exercises_count++;
    return 0;
}
static int programs_callback(void *NotUsed, int argc, char **argv, char **azColName) {
    (void)NotUsed;
    (void)argc;
    (void)azColName;
    programs = realloc(programs, (programs_count + 1) * sizeof(program_file));
    if (!programs)
    {
        fprintf(stderr, "Memory allocation failed\n");
        exit(1);
    }
    for (size_t i = 0; i < programs_count; i++)
    {
        if (programs[i].fileId == atoi(argv[0]))
            return 0;
    }
    programs[programs_count].fileId = atoi(argv[0]);
    programs[programs_count].name = strdup(argv[1]);
    programs[programs_count].code = strdup(argv[2]);
    programs[programs_count].exercise_id = atoi(argv[3]);
    programs_count++;
    return 0;
}