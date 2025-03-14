#include <sqlite3.h>
#include <stdio.h>
#include <stdlib.h>

sqlite3 *connect_database() {
    sqlite3 *db;
    int rc = sqlite3_open("educatronic.db", &db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Error opening database: %s\n", sqlite3_errmsg(db));
        return NULL;
    }
    return db;
}

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

void clear_database(sqlite3 *db) {
    printf("Clearing database...\n");
    execute_sql(db, "DELETE FROM exercises;");
    execute_sql(db, "DELETE FROM programs;");
    execute_sql(db, "DELETE FROM answers;");
}

void migrate_database() {
    printf("Running database migration...\n");
    system("./migrate");
}

void seed_database() {
    printf("Seeding database with initial data...\n");
    system("./seeder");
}

int init_database() {
    printf("Initializing database...\n");

    if (system("./migrate") != 0) {
        fprintf(stderr, "Error: Database migration failed!\n");
        return 1;
    }

    if (system("./seeder") != 0) {
        fprintf(stderr, "Error: Database seeding failed!\n");
        return 1;
    }

    printf("Database initialization complete! ✅\n");
    return 0;  // Success
}

void close_database(sqlite3 *db) {
    if (db) {
        sqlite3_close(db);
    }
}

char *escape_json_string(const char *input) {
    if (!input) return strdup("");
    size_t len = strlen(input);
    char *escaped = (char *)malloc(len * 2 + 1);
    char *dst = escaped;

    while (*input) {
        switch (*input) {
            case '\n':
                *dst++ = '\\';
                *dst++ = 'n';
                break;  // Escape newlines
            case '\r':
                *dst++ = '\\';
                *dst++ = 'r';
                break;
            case '"':
                *dst++ = '\\';
                *dst++ = '"';
                break;  // Escape double quotes
            case '\\':
                *dst++ = '\\';
                *dst++ = '\\';
                break;  // Escape backslashes
            default:
                *dst++ = *input;
                break;
        }
        input++;
    }
    *dst = '\0';
    return escaped;
}

char *get_exercises_json(sqlite3 *db) {
    sqlite3_stmt *stmt;
    const char *sql = "SELECT exercise_id, name, content FROM exercises;";
    char *json_result = (char *)malloc(8192);
    json_result[0] = '\0';
    strcat(json_result, "[");

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        int first = 1;
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            if (!first) strcat(json_result, ",");
            first = 0;

            const char *exercise_id = (const char *)sqlite3_column_text(stmt, 0);
            const char *name = (const char *)sqlite3_column_text(stmt, 1);
            const char *content = (const char *)sqlite3_column_text(stmt, 2);
            char *escaped_content = escape_json_string(content);

            char temp[2048];
            snprintf(temp, sizeof(temp),
                     "{\"id\": \"%s\", \"name\": \"%s\", \"content\": \"%s\"}",
                     exercise_id, name, escaped_content);
            strcat(json_result, temp);
            free(escaped_content);
        }
        strcat(json_result, "]");
        sqlite3_finalize(stmt);
    } else {
        fprintf(stderr, "Error fetching exercises: %s\n", sqlite3_errmsg(db));
    }

    return json_result;
}
char *get_programs_json(sqlite3 *db) {
    sqlite3_stmt *stmt;
    const char *sql = "SELECT program_id, name, code FROM programs;";
    char *json_result = (char *)malloc(8192);
    json_result[0] = '\0';
    strcat(json_result, "[");

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        int first = 1;
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            if (!first) strcat(json_result, ",");
            first = 0;

            const char *program_id = (const char *)sqlite3_column_text(stmt, 0);
            const char *name = (const char *)sqlite3_column_text(stmt, 1);
            const char *code = (const char *)sqlite3_column_text(stmt, 2);
            char *escaped_code = escape_json_string(code);

            char temp[2048];
            snprintf(temp, sizeof(temp),
                     "{\"id\": \"%s\", \"name\": \"%s\", \"content\": \"%s\"}",
                     program_id, name, escaped_code);
            strcat(json_result, temp);
            free(escaped_code);
        }
        strcat(json_result, "]");
        sqlite3_finalize(stmt);
    } else {
        fprintf(stderr, "Error fetching programs: %s\n", sqlite3_errmsg(db));
    }

    return json_result;
}