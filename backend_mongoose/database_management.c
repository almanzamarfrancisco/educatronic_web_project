#include "database_management.h"

#include <sqlite3.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <uuid/uuid.h>

#include "mongoose.h"

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

void generate_uuid(char *uuid_str) {
    uuid_t uuid;
    uuid_generate(uuid);
    uuid_unparse(uuid, uuid_str);
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
    const char *sql = "SELECT program_id, name, code, exercise_id FROM programs;";
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
            const char *exercise_id = (const char *)sqlite3_column_text(stmt, 3);
            char *escaped_code = escape_json_string(code);
            char temp[2048];
            snprintf(temp, sizeof(temp),
                     "{\"id\": \"%s\", \"name\": \"%s\", \"content\": \"%s\", \"exercise_id\": \"%s\"}",
                     program_id, name, escaped_code, exercise_id);
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

int update_program(sqlite3 *db, const char *id, const char *json_body) {
    if (!db || !id || !json_body) {
        fprintf(stderr, "\t❌ [E] Invalid arguments update_program\n");
        return 0;
    }
    printf("\t 🚀 [I] Updating : %s\n", json_body);
    char *name = mg_json_get_str(mg_str(json_body), "$.name");
    char *content = mg_json_get_str(mg_str(json_body), "$.content");
    if (name == NULL || content == NULL) {
        fprintf(stderr, "❌ Error: Failed to extract code and/or name.\n");
        return 0;
    }
    char *sql = sqlite3_mprintf(
        "UPDATE programs SET name = %Q, code = %Q WHERE program_id = %Q;",
        name, content, id);
    char *err_msg = NULL;
    int rc = sqlite3_exec(db, sql, 0, 0, &err_msg);
    sqlite3_free(sql);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "\t❌ Error de SQLite: %s\n", err_msg);
        sqlite3_free(err_msg);
        return 0;
    }
    printf("\t✅ Program with id %s updated succesfully.\n", id);
    return 1;
}

int delete_program(sqlite3 *db, const char *id) {
    if (!db || !id) {
        fprintf(stderr, "\t❌ [E] Invalid arguments delete_program\n");
        return 0;
    }
    printf("\t 🚀 [I] Deleting program with id: %s\n", id);
    char *sql = sqlite3_mprintf("DELETE FROM programs WHERE program_id = %Q;", id);
    char *err_msg = NULL;
    int rc = sqlite3_exec(db, sql, 0, 0, &err_msg);
    sqlite3_free(sql);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "\t❌ Error de SQLite: %s\n", err_msg);
        sqlite3_free(err_msg);
        return 0;
    }
    printf("\t✅ Program with id %s deleted succesfully.\n", id);
    return 1;
}

int new_program(sqlite3 *db, char *id, const char *json_body) {
    if (!db || !id || !json_body) {
        fprintf(stderr, "\t❌ [E] Invalid arguments new_program\n");
        return 0;
    }
    generate_uuid(id);
    printf("\t[I] 🚀 Creating new program with id: %s\n", id);
    char *name = mg_json_get_str(mg_str(json_body), "$.name");
    char *content = mg_json_get_str(mg_str(json_body), "$.content");
    char *exercise_id = mg_json_get_str(mg_str(json_body), "$.exercise_id");
    if (name == NULL || !strlen(name) || content == NULL) {
        fprintf(stderr, "\t❌ Error: Failed to extract code and/or name.\n");
        return 0;
    }
    char *sql = sqlite3_mprintf(
        "INSERT INTO programs (program_id, name, code, exercise_id) VALUES (%Q, %Q, %Q, %Q);",
        id, name, content, exercise_id);
    char *err_msg = NULL;
    int rc = sqlite3_exec(db, sql, 0, 0, &err_msg);
    sqlite3_free(sql);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "\t❌ Error de SQLite: %s\n", err_msg);
        sqlite3_free(err_msg);
        return 0;
    }
    printf("\t✅ Program with id %s created succesfully.\n", id);
    return 1;
}