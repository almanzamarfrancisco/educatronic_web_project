#include <sqlite3.h>
#include <stdio.h>
#include <stdlib.h>

// Function to read and execute SQL from a file
void execute_sql_file(sqlite3 *db, const char *filename) {
    FILE *file = fopen(filename, "r");
    if (!file) {
        fprintf(stderr, "Error opening file: %s\n", filename);
        exit(EXIT_FAILURE);
    }

    // Read file content
    fseek(file, 0, SEEK_END);
    long length = ftell(file);
    fseek(file, 0, SEEK_SET);
    char *sql = (char *)malloc(length + 1);
    fread(sql, 1, length, file);
    sql[length] = '\0';
    fclose(file);

    // Execute SQL
    char *err_msg = NULL;
    int rc = sqlite3_exec(db, sql, 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL Error: %s\n", err_msg);
        sqlite3_free(err_msg);
        free(sql);
        exit(EXIT_FAILURE);
    }

    free(sql);
    printf("Database migration successful! 🚀\n");
}

int main() {
    sqlite3 *db;
    int rc = sqlite3_open("educatronic.db", &db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        return EXIT_FAILURE;
    }

    execute_sql_file(db, "migration.sql");

    sqlite3_close(db);
    return EXIT_SUCCESS;
}
