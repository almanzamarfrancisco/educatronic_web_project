// Copyright (c) 2022 Cesanta Software Limited
// All rights reserved
#include "mongoose.h"
#include <wiringPi.h>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <stdio.h>
#include <sqlite3.h>
#include <ctype.h>
#include <string.h>
#include <pthread.h>

#define CONTENT_TYPE_HEADER "Content-Type: application/json\r\n"
#define DEFAULT_CODE "START OPEN CLOSE UP 1 UP 2 OPEN CLOSE END"
#define CORS_HEADERS "HTTP/1.1 200 OK\r\n" \
                      "Content-Type: application/json\r\n"  \
                      "Access-Control-Allow-Origin: *\r\n"  \
                      "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"  \
                      "Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept\r\n"  \
                      "Content-Length: %d\r\n"  \
                      "\r\n"
#define HLS_URI "/hls/"
#define VIDEO_FILES_DIRECTORY "./web_root/hls/"
#define EVER 1
#define PROGRAM_FILE_ELEMENTS 3
// Define GPIO pin numbers
#define LED_PIN 2  // GPIO 27
#define MOTOR_PIN 0  // GPIO 17

// static const char *s_http_addr = "http://localhost:8000";  // Ngrok HTTP port
static const char* s_http_addr = "http://192.168.1.71:8000";  // Developing HTTP port
static const char* s_root_dir = "web_root";

typedef struct PROGRAM_FILE {
    int fileId;
    char* name;
    char* code;
    int exercise_id;
} program_file;
typedef struct EXERCISE {
    int exercise_id;
    char* name;
    char* content;
    u_int16_t program_files_count;
} exercise;
exercise* exercises = NULL;
program_file* programs = NULL;
size_t exercises_count = 0;
size_t programs_count = 0;

const char* program_file_properties[] = {
    "programId",
    "exerciseId",
    "code",
};
// Function to initialize GPIO
void init_gpio() {
    // Initialize WiringPi using WiringPi's own pin numbering
    if (wiringPiSetup() == -1) {
        perror("Failed to initialize WiringPi");
        exit(1);
    }
    pinMode(LED_PIN, OUTPUT);  // Set LED_PIN as output
    pinMode(MOTOR_PIN, OUTPUT);  // Set LED_PIN as output
}
// Function to turn LED on
void led_on() {
    printf("[I] Seting the led on ...\n");
    digitalWrite(LED_PIN, HIGH);
}
// Function to turn LED off
void led_off() {
    printf("[I] Seting the led off ...\n");
    digitalWrite(LED_PIN, LOW);
}
// Function to turn MOTOR on
void motor_on() {
    printf("[I] Seting the MOTOR on ...\n");
    digitalWrite(MOTOR_PIN, HIGH);
}
// Function to turn MOTOR off
void motor_off() {
    printf("[I] Seting the MOTOR off ...\n");
    digitalWrite(MOTOR_PIN, LOW);
}
// Execute video encoding command
int isMotionRunning() {
    // sudo libcamerify motion -c ./motion.conf
    FILE* fp;
    char path[1035];
    int running = 0;
    fp = popen("pidof motion", "r");
    if (fp == NULL) {
        printf("Failed to run command\n");
        return -1;
    }
    if (fgets(path, sizeof(path), fp) != NULL) {
        running = 1;
    }
    pclose(fp);
    return running;
}
// Saves code in the database
int saveProgram(char* code, int fileId) {
    sqlite3* db;
    char* err_msg = 0;
    int rc;
    rc = sqlite3_open("db.sqlite3", &db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return 1;
    }
    char* sql = (char*)malloc(sizeof(char) * 1024);
    memset(sql, 0, sizeof(char) * 1024);
    sprintf(sql, "UPDATE ProgramFiles SET content = '%s' WHERE programfile_id = %d;", code, fileId);
    rc = sqlite3_exec(db, sql, 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL error: %s\n", err_msg);
        sqlite3_free(err_msg);
        sqlite3_close(db);
        return 1;
    }
    return 0;
}
// Validates de JSON properties
int validate_code_json(struct mg_str json) { // TODO: Add the compiler here
    char key_to_validate[20] = "";
    int value_found;
    for (int i = 0;i < PROGRAM_FILE_ELEMENTS;i++) {
        strcat(key_to_validate, "$.");
        strcat(key_to_validate, program_file_properties[i]);
        if ((value_found = mg_json_get(json, key_to_validate, NULL)) <= 0) {
            return 1;
        }
        strcpy(key_to_validate, "");
    }
    return 0;
}
// Execute code commands
int execute_commands(char* code) {
    if (strstr(code, "LED ON") != NULL) led_on();
    else if (strstr(code, "LED OFF") != NULL) led_off();
    else if (strstr(code, "MOTOR ON") != NULL) motor_on();
    else if (strstr(code, "MOTOR OFF") != NULL) motor_off();
    return 0;
}
// Try to update a single file
int update_file(struct mg_str json, int execute) {
    int fileId = atoi(mg_json_get_str(json, "$.programId"));
    char* code = mg_json_get_str(json, "$.code");
    if (validate_code_json(json)) {
        printf("Invalid JSON\n");
        return 1;
    }
    if (saveProgram(code, fileId) != 0) {
        printf("Error saving the program\n");
        return 1;
    }
    if (execute) execute_commands(code);
    return 0;
}
static int exercises_callback(void* NotUsed, int argc, char** argv, char** azColName) {
    (void)NotUsed;(void)argc;(void)azColName;
    exercises = realloc(exercises, (exercises_count + 1) * sizeof(exercise));
    if (!exercises) {
        fprintf(stderr, "Memory allocation failed in exercises\n");
        exit(1);
    }
    for (size_t i = 0; i < exercises_count; i++) { if (exercises[i].exercise_id == atoi(argv[0])) return 0; }
    exercises[exercises_count].exercise_id = atoi(argv[0]);
    exercises[exercises_count].name = strdup(argv[1]);
    exercises[exercises_count].content = strdup(argv[2]);
    exercises[exercises_count].program_files_count = 0;
    exercises_count++;
    return 0;
}
static int programs_callback(void* NotUsed, int argc, char** argv, char** azColName) {
    (void)NotUsed;(void)argc;(void)azColName;
    programs = realloc(programs, (programs_count + 1) * sizeof(program_file));
    if (!programs) {
        fprintf(stderr, "Memory allocation failed\n");
        exit(1);
    }
    for (size_t i = 0; i < programs_count; i++) { if (programs[i].fileId == atoi(argv[0])) return 0; }
    programs[programs_count].fileId = atoi(argv[0]);
    programs[programs_count].name = strdup(argv[1]);
    programs[programs_count].code = strdup(argv[2]);
    programs[programs_count].exercise_id = atoi(argv[3]);
    programs_count++;
    return 0;
}
void load_exercises_from_db(sqlite3* db) {
    char* err_msg = 0;
    const char* exercise_table = "SELECT * FROM Exercises;";
    int rc = sqlite3_exec(db, exercise_table, exercises_callback, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Failed to load exercises: %s\n", err_msg);
        sqlite3_free(err_msg);
    }
    else {
        printf("\t => Loaded %zu exercises\n", exercises_count);
        for (size_t i = 0; i < exercises_count; i++)
            printf("\t\t=> Exercise: %d - %s\n", exercises[i].exercise_id, exercises[i].name);
        printf("----------------------------------------------------\n");
    }
}
void load_programs_from_db(sqlite3* db) {
    char* err_msg = 0;
    const char* program_file_table = "SELECT * FROM ProgramFiles;";
    int rc = sqlite3_exec(db, program_file_table, programs_callback, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Failed to load programs: %s\n", err_msg);
        sqlite3_free(err_msg);
    }
    else {
        printf("\t => Loaded %zu programs\n", programs_count);
        for (size_t i = 0; i < programs_count; i++)
            printf("\t\t=> Program: %d - %s\n", programs[i].fileId, programs[i].name);
    }
}
// TODO: Look into how treat the database in the best way
int sqlite3_init_database() {
    sqlite3* db;
    char* err_msg = 0;
    int rc;
    rc = sqlite3_open("db.sqlite3", &db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return 1;
    }
    const char* sql_init[] = {
            "DROP TABLE IF EXISTS Exercises",
            "DROP TABLE IF EXISTS ProgramFiles",
            "CREATE TABLE IF NOT EXISTS Exercises(exercise_id INTEGER PRIMARY KEY AUTOINCREMENT, exercise_name TEXT, content TEXT);",
            "CREATE TABLE IF NOT EXISTS ProgramFiles(programfile_id INTEGER PRIMARY KEY AUTOINCREMENT, program_file_name TEXT, content TEXT, exercise_id INTEGER);",
            "INSERT INTO Exercises(exercise_name, content) VALUES ('First Exercise', '1. Make the Doors open  for 1 second\n 2. Up to floor 1');",
            "INSERT INTO Exercises(exercise_name, content) VALUES ('Second Exercise', '1. Make the Doors open  for 3 seconds\n 2. Up to floor 6');",
            "INSERT INTO ProgramFiles(program_file_name, content, exercise_id) VALUES ('First try', 'O 2{new_line}U 1', 1);",
            "INSERT INTO ProgramFiles(program_file_name, content, exercise_id) VALUES ('Second try', 'O {new_line}U 6', 2);",
    };
    for (long unsigned int i = 0; i < sizeof(sql_init) / sizeof(sql_init[0]); i++) {
        rc = sqlite3_exec(db, sql_init[i], 0, 0, &err_msg);
        if (rc != SQLITE_OK) {
            fprintf(stderr, "SQL error: %s\n", err_msg);
            sqlite3_free(err_msg);
            sqlite3_close(db);
            return 1;
        }
    }
    load_programs_from_db(db);
    load_exercises_from_db(db);
    sqlite3_close(db);
    return 0;
}
void trim_non_alphanumeric(char* str) {
    int i, j;
    for (i = 0, j = 0; str[i] != '\0'; i++) {
        if (isalnum((unsigned char)str[i]) || str[i] == '_' || str[i] == '[' || str[i] == ']' ||
            str[i] == '(' || str[i] == ')' || str[i] == '"' || str[i] == '\'' ||
            str[i] == ',' || str[i] == ':' || str[i] == ' ' || str[i] == '{' ||
            str[i] == '}') {
            str[j++] = str[i];
        }
    }
    str[j] = '\0';
}
char* programs_to_json() { // TODO: Make this and exercise one function
    char* result = (char*)malloc(sizeof(char) * 2048);
    memset(result, 0, sizeof(char) * 2048);
    for (size_t i = 0; i < programs_count; i++) {
        char* program_json = (char*)malloc(sizeof(char) * 1024);
        char name[50]; char code[2048];
        memset(program_json, 0, sizeof(char) * 1024);
        sprintf(name, "\"%s\"", programs[i].name);
        sprintf(code, "\"%s\"", programs[i].code);
        program_json = mg_mprintf("{%m:%d, %m:%s, %m:%s, %m:%d}",
            MG_ESC("fileId"), programs[i].fileId,
            MG_ESC("name"), name,
            MG_ESC("code"), code,
            MG_ESC("exercise_id"), programs[i].exercise_id
        );
        strcat(result, program_json);
        if (i < programs_count - 1) {
            strcat(result, ",");
        }
        for (size_t j = 0; j < exercises_count; j++) {
            if (exercises[j].exercise_id == programs[i].exercise_id) {
                exercises[j].program_files_count++;
            }
        }
    }
    trim_non_alphanumeric(result);
    return result;
}
char* exercises_to_json() { // TODO: Make this and programs one function
    char* result = (char*)malloc(sizeof(char) * 2048);
    memset(result, 0, sizeof(char) * 2048);
    for (size_t i = 0; i < exercises_count; i++) {
        char* exercises_json = (char*)malloc(sizeof(char) * 1024);
        memset(exercises_json, 0, sizeof(char) * 1024);
        char name[50];
        char content[150];
        sprintf(name, "\"%s\"", exercises[i].name);
        sprintf(content, "\"%s\"", exercises[i].content);
        exercises_json = mg_mprintf("{%m:%d, %m:%s, %m:%s, %m:%hu}",
            MG_ESC("exercise_id"), exercises[i].exercise_id,
            MG_ESC("name"), name,
            MG_ESC("content"), content,
            MG_ESC("program_files_count"), exercises[i].program_files_count
        );
        strcat(result, exercises_json);
        if (i < exercises_count - 1) {
            strcat(result, ",");
        }
    }
    trim_non_alphanumeric(result);
    return result;
}
int update_database() {
    sqlite3* db;
    int rc = sqlite3_open("db.sqlite3", &db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return 1;
    }
    load_programs_from_db(db);
    load_exercises_from_db(db);
    sqlite3_close(db);
    return 0;
}
/* static */ void event_handler(struct mg_connection* c, int ev, void* ev_data) {
    if (ev == MG_EV_OPEN && c->is_listening) {
        printf("[I] Connection listening correctly\n");
    }
    else if (ev == MG_EV_HTTP_MSG) {
        struct mg_http_message* hm = (struct mg_http_message*)ev_data;
        char* json_response = (char*)malloc(sizeof(char) * 1024);
        if (mg_http_match_uri(hm, "/api/code/get_default")) {
            if (update_database() != 0) { printf("Database error: "); return; }
            char* programs_json = programs_to_json();
            char* exercises_json = exercises_to_json();
            json_response = mg_mprintf("{%m:[%s], %m:[%s]}", MG_ESC("exercises"), exercises_json, MG_ESC("programs"), programs_json);
            int content_length = strlen(json_response);
            mg_printf(c, CORS_HEADERS,
                content_length);
            mg_printf(c, "%s\n", json_response);
        }
        else if (mg_http_match_uri(hm, "/api/code/execute")) {
            printf("\n\n\t[I] Executing code... \n");
            struct mg_str json = hm->body;
            if (update_file(json, 1) != 0) {
                printf("Error updating the file\n");
                json_response = mg_mprintf("{%m:%m}", MG_ESC("status"), MG_ESC("Error to update the file"));
                int content_length = strlen(json_response);
                mg_printf(c, CORS_HEADERS,
                    content_length);
                mg_printf(c, "%s\n", json_response);
                mg_http_reply(c, 505, CORS_HEADERS, "%s", json_response);
                return;
            }
            // JSON Response
            json_response = mg_mprintf("{%m:%m}", MG_ESC("status"), MG_ESC("ok"));
            int content_length = strlen(json_response);
            mg_printf(c, CORS_HEADERS,
                content_length);
            mg_printf(c, "%s\n", json_response);
            mg_http_reply(c, 200, CORS_HEADERS, "%s", json_response);
        }
        else if (mg_http_match_uri(hm, "/api/code/save")) {
            printf("\n\n\t[I] Saving the code... \n");
            struct mg_str json = hm->body;
            if (update_file(json, 0) != 0) {
                printf("Error updating the file\n");
                json_response = mg_mprintf("{%m:%m}", MG_ESC("status"), MG_ESC("Error to update the file"));
                int content_length = strlen(json_response);
                mg_printf(c, CORS_HEADERS,
                    content_length);
                mg_printf(c, "%s\n", json_response);
                mg_http_reply(c, 505, CORS_HEADERS, "%s", json_response);
                return;
            }
            // JSON Response
            json_response = mg_mprintf("{%m:%m}", MG_ESC("status"), MG_ESC("ok"));
            int content_length = strlen(json_response);
            mg_printf(c, CORS_HEADERS,
                content_length);
            mg_printf(c, "%s\n", json_response);
            mg_http_reply(c, 200, CORS_HEADERS, "%s", json_response);
        }
        else if (mg_match(hm->uri, mg_str("/hls/*"), NULL)) {
            // Extract the file path from the URI
            char* uri = (char*)malloc((sizeof(char)) * (hm->uri.len + 1));
            strncpy(uri, hm->uri.ptr, hm->uri.len);
            char* file_name = strstr(uri, HLS_URI) + strlen(HLS_URI);
            char file_path[] = VIDEO_FILES_DIRECTORY;
            strcat(file_path, file_name);
            // Get the file and send 404 if it doesn't exist
            FILE* file = fopen(file_path, "rb");
            if (file != NULL) {
                fseek(file, 0, SEEK_END); // Determine the file size
                long fsize = ftell(file);
                fseek(file, 0, SEEK_SET);
                char* content = (char*)malloc(fsize + 1); // Allocate memory for the file content
                fread(content, 1, fsize, file);
                fclose(file);
                content[fsize] = 0;
                // Serve the file content
                // Determine the content type based on the file extension
                const char* content_type = "application/octet-stream"; // Default content type
                if (strstr(file_path, ".m3u8") != NULL) {
                    content_type = "application/vnd.apple.mpegurl";
                }
                else if (strstr(file_path, ".ts") != NULL) {
                    content_type = "video/MP2T";
                }
                // Construct the Content-Type header
                char content_type_header[128];
                snprintf(content_type_header, sizeof(content_type_header), "Content-Type: %s\r\n", content_type);
                if (strstr(file_path, ".ts") != NULL) { // Check if the content is binary and use the appropriate format specifier
                    char headers[256];
                    int headers_length = snprintf(headers, sizeof(headers),
                        "HTTP/1.1 200 OK\r\n"
                        "Content-Type: %s\r\n"
                        "Content-Length: %d\r\n"
                        "\r\n",
                        content_type, (int)fsize);
                    mg_send(c, headers, headers_length); // Add headers to mg_mgr_poll
                    mg_send(c, content, fsize); // Add the file content to mg_mgr_poll
                    mg_send(c, "\r\n", 2);
                }
                else {
                    mg_http_reply(c, 200, content_type_header, "%s", content);
                }
            }
            else {
                mg_http_reply(c, 404, "", "File not found :(");
            }
            free(uri);
        }
        else {
            struct mg_http_serve_opts opts = { .root_dir = s_root_dir };
            mg_http_serve_dir(c, ev_data, &opts);
        }
    }
}

int main(void) {
    struct mg_mgr mgr;                            // Event manager
    struct mg_connection* connection;
    mg_log_set(MG_LL_INFO);                       // Set to 3 to enable debug
    mg_mgr_init(&mgr);                            // Initialise event manager
    connection = mg_http_listen(&mgr, s_http_addr, event_handler, NULL);  // Create HTTP listener
    if (connection == NULL) {
        printf("Error to initialize the server\n");
        return 1;
    }
    printf("HTTP server initialized on %s\n", s_http_addr);
    init_gpio();                                  // Initialize GPIO
    if (sqlite3_init_database() != 0) {            // Initialize the database
        return 0;
    }
    if (isMotionRunning() <= 0) {
        printf("[E] Motion is not running.\n[I] Please run motion before of initializing the project\n");
        return 1;
    }
    for (;EVER;) mg_mgr_poll(&mgr, 500);           // Infinite event loop
    mg_mgr_free(&mgr);                            // Clears the connection manager
    return 0;
}
