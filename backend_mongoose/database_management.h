#ifndef DATABASE_MANAGEMENT_H
#define DATABASE_MANAGEMENT_H

#include <sqlite3.h>

sqlite3 *connect_database();

int execute_sql(sqlite3 *db, const char *sql);

void clear_database(sqlite3 *db);

void migrate_database();

void seed_database();

int init_database();

void close_database(sqlite3 *db);

void generate_uuid(char *uuid_str);

char *get_exercises_json(sqlite3 *db);
char *get_programs_json(sqlite3 *db);
int update_program(sqlite3 *db, const char *id, const char *json_body);
int delete_program(sqlite3 *db, const char *id);
int new_program(sqlite3 *db, char *id, const char *json_body);

char *escape_json_string(const char *input);

#endif