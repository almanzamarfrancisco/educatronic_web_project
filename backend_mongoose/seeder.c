#include <cjson/cJSON.h>
#include <sqlite3.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <uuid/uuid.h>

// Function to check if a file exists
int file_exists(const char *filename) {
    FILE *file = fopen(filename, "r");
    if (!file) {
        fprintf(stderr, "Error: File not found - %s\n", filename);
        return 0;
    }
    fclose(file);
    return 1;
}

// Function to generate UUIDs
void generate_uuid(char *uuid_str) {
    uuid_t uuid;
    uuid_generate(uuid);
    uuid_unparse(uuid, uuid_str);
}

// Function to execute SQL queries
int execute_sql(sqlite3 *db, const char *sql) {
    char *err_msg = NULL;
    int rc = sqlite3_exec(db, sql, 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL Error: %s\n", err_msg);
        sqlite3_free(err_msg);
        return rc;
    }
    return SQLITE_OK;
}

// Function to load and parse JSON file
cJSON *load_json(const char *filename) {
    if (!file_exists(filename)) {
        exit(EXIT_FAILURE);
    }

    FILE *file = fopen(filename, "r");
    if (!file) {
        fprintf(stderr, "Error opening file: %s\n", filename);
        return NULL;
    }

    fseek(file, 0, SEEK_END);
    long length = ftell(file);
    fseek(file, 0, SEEK_SET);

    char *data = (char *)malloc(length + 1);
    fread(data, 1, length, file);
    data[length] = '\0';
    fclose(file);

    cJSON *json = cJSON_Parse(data);
    free(data);

    if (!json) {
        fprintf(stderr, "Error parsing JSON: %s\n", cJSON_GetErrorPtr());
        return NULL;
    }

    return json;
}

// Function to seed exercises table
void seed_exercises(sqlite3 *db) {
    cJSON *json = load_json("./seeds/exercises.json");
    if (!json) return;

    printf("Seeding Exercises...\n");
    cJSON *exercise;
    cJSON_ArrayForEach(exercise, json) {
        char *exercise_id = cJSON_GetObjectItem(exercise, "exercise_id")->valuestring;
        char *name = cJSON_GetObjectItem(exercise, "name")->valuestring;
        char *content = cJSON_GetObjectItem(exercise, "content")->valuestring;
        char *difficulty = cJSON_GetObjectItem(exercise, "difficulty")->valuestring;

        char sql[512];
        snprintf(sql, sizeof(sql),
                 "INSERT INTO exercises (exercise_id, name, content, difficulty) VALUES ('%s', '%s', '%s', '%s');",
                 exercise_id, name, content, difficulty);
        execute_sql(db, sql);
    }
    cJSON_Delete(json);
}

// Function to seed programs table
void seed_programs(sqlite3 *db) {
    cJSON *json = load_json("./seeds/programs.json");
    if (!json) return;

    printf("Seeding Programs...\n");
    cJSON *program;
    cJSON_ArrayForEach(program, json) {
        char *program_id = cJSON_GetObjectItem(program, "program_id")->valuestring;
        char *name = cJSON_GetObjectItem(program, "name")->valuestring;
        char *code = cJSON_GetObjectItem(program, "code")->valuestring;
        char *exercise_id = cJSON_GetObjectItem(program, "exercise_id")->valuestring;

        char sql[1024];
        snprintf(sql, sizeof(sql),
                 "INSERT INTO programs (program_id, name, code, exercise_id) VALUES ('%s', '%s', '%s', '%s');",
                 program_id, name, code, exercise_id);
        execute_sql(db, sql);
    }
    cJSON_Delete(json);
}

// Function to seed answers table
void seed_answers(sqlite3 *db) {
    cJSON *json = load_json("./seeds/answers.json");
    if (!json) return;

    printf("Seeding Answers...\n");
    cJSON *answer;
    cJSON_ArrayForEach(answer, json) {
        char *id = cJSON_GetObjectItem(answer, "id")->valuestring;
        char *exercise_id = cJSON_GetObjectItem(answer, "exercise_id")->valuestring;
        char *expected_output = cJSON_GetObjectItem(answer, "expected_output")->valuestring;

        char sql[512];
        snprintf(sql, sizeof(sql),
                 "INSERT INTO answers (id, exercise_id, expected_output) VALUES ('%s', '%s', '%s');",
                 id, exercise_id, expected_output);
        execute_sql(db, sql);
    }
    cJSON_Delete(json);
}

void clear_database(sqlite3 *db) {
    printf("Clearing Database...\n");
    execute_sql(db, "DELETE FROM exercises;");
    execute_sql(db, "DELETE FROM programs;");
    execute_sql(db, "DELETE FROM answers;");
}

int main() {
    if (!file_exists("./seeds/exercises.json") || !file_exists("./seeds/programs.json") || !file_exists("./seeds/answers.json")) {
        fprintf(stderr, "Error: One or more required JSON files are missing. Seeding aborted.\n");
        return EXIT_FAILURE;
    }

    sqlite3 *db;
    int rc = sqlite3_open("educatronic.db", &db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        return EXIT_FAILURE;
    }

    clear_database(db);

    seed_exercises(db);
    seed_programs(db);
    seed_answers(db);

    sqlite3_close(db);
    printf("Database seeding complete! 🚀\n");

    return EXIT_SUCCESS;
}
