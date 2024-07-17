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

static const char *s_http_addr = "http://192.168.1.71:8000";  // HTTP port
static const char *s_root_dir = "web_root";

typedef struct PROGRAM_FILE {
    int fileId;
    char *name;
    char *code;
    int robot_id;
} program_file;
typedef struct ROBOT {
    int robot_id;
    char *name;
    u_int16_t angle;
    u_int16_t program_files_count;
} robot;
robot *robots = NULL;
program_file *programs = NULL;
size_t robots_count = 0;
size_t programs_count = 0;

const char * program_file_properties[] = {
    "fileId",
    "name",
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
// Move camera to view robot
void turn_camera_to(char *robot_name){ // TODO: turn the servo motor to the angle of the robot
    __u_char *cmd[512];
    printf("\t=> Turning camera to robot: %s\n", robot_name);
    for(size_t i = 0; i < robots_count; i++){
        if(strcmp(robots[i].name, robot_name) == 0){
            sprintf(cmd, "python servo.py %d", robots[i].angle);
            break;
        }
    }
    system(cmd);
}
// Execute video
void live_video(){
    char cmd[512]; // Adjust the size as needed
    // TODO make the log file for the video
        // char live_video_log_file[] = "./logs/live_video.log";
        // sprintf(cmd, "rpicam-vid -t 0 --inline -o - | ffmpeg -thread_queue_size 512 -i - -c:v copy -hls_flags delete_segments -hls_list_size 5 -f hls ./%s/hls/index.m3u8 > %s 2>&1 &", s_root_dir, live_video_log_file);
    // sprintf(cmd, "rpicam-vid -t 0 --inline -o - | ffmpeg -thread_queue_size 512 -i - -c:v copy -hls_flags delete_segments -hls_list_size 5 -f hls ./%s/hls/index.m3u8 &> ./web_root/logs/camera_log.txt &", s_root_dir);
    sprintf(cmd, "rpicam-vid --vflip --verbose 0 --level 4.2 --width 640 -t 0 --inline -o - | ffmpeg -thread_queue_size 512 -i - -c:v copy -hls_flags delete_segments -hls_list_size 5 -f hls ./%s/hls/index.m3u8 &> ./web_root/logs/camera_log.txt &", s_root_dir);
    // system("python web_root/server.py &");
    system("rm -rf ./web_root/hls/*");
    system(cmd);
}
// Validates de JSON properties
int validate_code_json(struct mg_str json) {
    char key_to_validate[20] = "";
    int value_found;
    for(int i = 0;i<PROGRAM_FILE_ELEMENTS;i++){
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
int execute_commands(char *code){
    printf("[I] Executing...");
    if (strstr(code, "LED ON") != NULL) led_on();
    else if (strstr(code, "LED OFF") != NULL) led_off();
    else if (strstr(code, "MOTOR ON") != NULL) motor_on();
    else if (strstr(code, "MOTOR OFF") != NULL) motor_off();
    return 0;
}
// Try to update a single file
int update_files(struct mg_str json, program_file *f) {
    if(validate_code_json(json)){
        printf("Invalid JSON\n");
        return 1;
    }
    // free(f->code); // TODO: Free the memory
    // TODO: make this assignation dinamic
    f->fileId = atoi(mg_json_get_str(json, "$.fileId"));
    f->name = strdup(mg_json_get_str(json, "$.name"));
    f->code = strdup(mg_json_get_str(json, "$.code"));
    execute_commands(f->code);
    return 0;
}
static int robots_callback(void *NotUsed, int argc, char **argv, char **azColName){
    (void)NotUsed;(void)argc;(void)azColName;
    robots = realloc(robots, (robots_count + 1) * sizeof(robot));
    if (!robots) {
        fprintf(stderr, "Memory allocation failed\n");
        exit(1);
    }
    for(size_t i = 0; i < robots_count; i++){ if(robots[i].robot_id == atoi(argv[0])) return 0;}
    robots[robots_count].robot_id = atoi(argv[0]);
    robots[robots_count].name = strdup(argv[1]);
    robots[robots_count].angle = atoi(argv[2]);
    robots[robots_count].program_files_count = 0;
    robots_count++;
    return 0;
}
static int programs_callback(void *NotUsed, int argc, char **argv, char **azColName){
    (void)NotUsed;(void)argc;(void)azColName;
    programs = realloc(programs, (programs_count + 1) * sizeof(program_file));
    if (!programs) {
        fprintf(stderr, "Memory allocation failed\n");
        exit(1);
    }
    for(size_t i = 0; i < programs_count; i++){ if(programs[i].fileId == atoi(argv[0])) return 0;}
    programs[programs_count].fileId = atoi(argv[0]);
    programs[programs_count].name = strdup(argv[1]);
    programs[programs_count].code = strdup(argv[2]);
    programs[programs_count].robot_id = atoi(argv[3]);
    programs_count++;
    return 0;
}
void load_robots_from_db(sqlite3 *db) {
    char *err_msg = 0;
    const char *robots_table = "SELECT * FROM Robots;";
    int rc = sqlite3_exec(db, robots_table, robots_callback, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Failed to load robots: %s\n", err_msg);
        sqlite3_free(err_msg);
    } else {
        printf("\t => Loaded %zu robots\n", robots_count);
        for(size_t i = 0; i < robots_count; i++)
            printf("\t\t=> Robot: %d - %s\n", robots[i].robot_id, robots[i].name);
    }
}
void load_programs_from_db(sqlite3 *db) {
    char *err_msg = 0;
    const char *program_file_table = "SELECT * FROM ProgramFiles;";
    int rc = sqlite3_exec(db, program_file_table, programs_callback, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Failed to load programs: %s\n", err_msg);
        sqlite3_free(err_msg);
    } else {
        printf("\t => Loaded %zu programs\n", programs_count);
        for(size_t i = 0; i < programs_count; i++)
            printf("\t\t=> Program: %d - %s\n", programs[i].fileId, programs[i].name);
    }
}
int sqlite3_init_database(){
    sqlite3 *db;
    char *err_msg = 0;
    int rc;
    rc = sqlite3_open("db.sqlite3", &db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return 1;
    }
    const char *sql_init[] = {
            "CREATE TABLE IF NOT EXISTS Robots(robot_id INTEGER PRIMARY KEY AUTOINCREMENT, robot_name TEXT, angle INTEGER);",
            "CREATE TABLE IF NOT EXISTS ProgramFiles(programfile_id INTEGER PRIMARY KEY AUTOINCREMENT, program_file_name TEXT, content TEXT, robot_id INTEGER);",
            // "INSERT INTO Robots(robot_name, angle) VALUES ('BASIC', 45);",
            // "INSERT INTO Robots(robot_name, angle) VALUES ('ELEVATOR', 135);",
            // "INSERT INTO ProgramFiles(program_file_name, content, robot_id) VALUES ('basic_first_file', '', 1);",
            // "INSERT INTO ProgramFiles(program_file_name, content, robot_id) VALUES ('basic_second', '', 1);",
            // "INSERT INTO ProgramFiles(program_file_name, content, robot_id) VALUES ('elevator_first_file', '', 2);",
            // "INSERT INTO ProgramFiles(program_file_name, content, robot_id) VALUES ('elevator_second_file', '', 2);",
        };
    for(long unsigned int i = 0; i < sizeof(sql_init)/sizeof(sql_init[0]); i++){
        rc = sqlite3_exec(db, sql_init[i], 0, 0, &err_msg);
        if (rc != SQLITE_OK ) {
            fprintf(stderr, "SQL error: %s\n", err_msg);
            sqlite3_free(err_msg);
            sqlite3_close(db);
            return 1;
        }
    }
    load_programs_from_db(db);
    load_robots_from_db(db);
    sqlite3_close(db);
    return 0;
}
void trim_non_alphanumeric(char *str) {
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
char * programs_to_json(){
    char * result = (char*)malloc(sizeof(char)*2048);
    for(size_t i = 0; i < programs_count; i++){
        char *program_json = (char*)malloc(sizeof(char)*1024);
        char name[50]; char code[2048];
        memset(program_json, 0, sizeof(char)*1024);
        sprintf(name, "\"%s\"", programs[i].name);
        sprintf(code, "\"%s\"", programs[i].code);
        program_json = mg_mprintf("{%m:%d, %m:%s, %m:%s, %m:%d}",
            MG_ESC("fileId"), programs[i].fileId,
            MG_ESC("name"), name,
            MG_ESC("code"), code,
            MG_ESC("robot_id"), programs[i].robot_id
            );
        strcat(result, program_json);
        if(i < programs_count - 1){
            strcat(result, ",");
        }
        for(size_t j = 0; j < robots_count; j++){
            if(robots[j].robot_id == programs[i].robot_id){
                robots[j].program_files_count++;
            }
        }
    }
    trim_non_alphanumeric(result);
    return result;
}
char * robots_to_json(){
    char * result = (char*)malloc(sizeof(char)*2048);
    for(size_t i = 0; i < robots_count; i++){
        char *robot_json = (char*)malloc(sizeof(char)*1024);
        memset(robot_json, 0, sizeof(char)*1024);
        char name[50];
        sprintf(name, "\"%s\"", robots[i].name);
        robot_json = mg_mprintf("{%m:%d, %m:%s, %m:%hu, %m:%hu}",
            MG_ESC("robot_id"), robots[i].robot_id,
            MG_ESC("name"), name,
            MG_ESC("angle"), robots[i].angle,
            MG_ESC("program_files_count"), robots[i].program_files_count
            );
        strcat(result, robot_json);
        if(i < robots_count - 1){
            strcat(result, ",");
        }
    }
    trim_non_alphanumeric(result);
    return result;
}
int update_database(){
    sqlite3 *db;
    int rc = sqlite3_open("db.sqlite3", &db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        sqlite3_close(db);
        return 1;
    }
    load_programs_from_db(db);
    load_robots_from_db(db);
    sqlite3_close(db);
    return 0;
}
/* static */ void event_handler(struct mg_connection *c, int ev, void *ev_data) {
    if (ev == MG_EV_OPEN && c->is_listening) {
        printf("[I] Connection listening correctly\n");
    } else if (ev == MG_EV_HTTP_MSG) {
        struct mg_http_message *hm = (struct mg_http_message *) ev_data;
        if (mg_http_match_uri(hm, "/api/code/get_default")) {
            if (update_database() != 0){ printf("Database error: "); return; }
            char *json_response = (char*)malloc(sizeof(char)*1024);
            char *programs_json = programs_to_json();
            char *robots_json = robots_to_json();
            json_response = mg_mprintf("{%m:[%s], %m:[%s]}", MG_ESC("robots"), robots_json, MG_ESC("programs"), programs_json);
            int content_length = strlen(json_response);
            mg_printf(c, CORS_HEADERS,
                      content_length);
            mg_printf(c, "%s\n", json_response);
        } else if (mg_http_match_uri(hm, "/api/code/exec")) {
            printf("\t\n\n[I] Executing code\n");
            // struct mg_str json = hm->body;
            // if(update_files(json, &my_file))
            //     mg_http_reply(c, 400, CONTENT_TYPE_HEADER, "{%m:%m}\n", MG_ESC("status"), MG_ESC("Error, Ivalid JSON"));
            // else{
                // printf("[I] File updated: \n");
                // printf("\t Code: %s\n", programs[0].code);
                // printf("\t Name: %s\n", programs[0].name);
                // printf("\t FileId: %s\n", programs[0].fileId);
                mg_http_reply(c, 200, CONTENT_TYPE_HEADER, "{%m:%m}\r\n", MG_ESC("status"), MG_ESC("ok"));
            // }
        } else if(mg_http_match_uri(hm, "/api/camera/turn/")){
            struct mg_str json = hm->body;
            // printf("\t Turning camera to robot %s\n", mg_json_get_str(json, "$.robot_name"));
            turn_camera_to(mg_json_get_str(json, "$.robot_name"));
        } else if (mg_match(hm->uri, mg_str("/hls/*"), NULL)) {
            // Extract the file path from the URI
            char *uri = (char*)malloc((sizeof(char)) * (hm->uri.len + 1));
            strncpy(uri, hm->uri.ptr, hm->uri.len);
            char *file_name = strstr(uri, HLS_URI) + strlen(HLS_URI);
            char file_path[] = VIDEO_FILES_DIRECTORY;
            strcat(file_path, file_name);
            // Get the file and send 404 if it doesn't exist
            FILE *file = fopen(file_path, "rb");
            if (file != NULL) {
                fseek(file, 0, SEEK_END); // Determine the file size
                long fsize = ftell(file);
                fseek(file, 0, SEEK_SET);
                char *content = (char *)malloc(fsize + 1); // Allocate memory for the file content
                fread(content, 1, fsize, file);
                fclose(file);
                content[fsize] = 0;
                // Serve the file content
                // Determine the content type based on the file extension
                const char *content_type = "application/octet-stream"; // Default content type
                if (strstr(file_path, ".m3u8") != NULL) {
                    content_type = "application/vnd.apple.mpegurl";
                } else if (strstr(file_path, ".ts") != NULL) {
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
                } else {
                    mg_http_reply(c, 200, content_type_header, "%s", content);
                }
            } else {
                mg_http_reply(c, 404, "", "File not found :(");
            }
            free(uri);
        } else {
            struct mg_http_serve_opts opts = {.root_dir = s_root_dir};
            mg_http_serve_dir(c, ev_data, &opts);
        }
    }
}

int main(void) {
    struct mg_mgr mgr;                            // Event manager
    struct mg_connection *connection;
    mg_log_set(MG_LL_INFO);                       // Set to 3 to enable debug
    mg_mgr_init(&mgr);                            // Initialise event manager
    connection = mg_http_listen(&mgr, s_http_addr, event_handler, NULL);  // Create HTTP listener
    if (connection == NULL) {
        printf("Error to initialize the server\n");
        return 1;
    }
    printf("HTTP server initialized on %s\n", s_http_addr);
    init_gpio();                                  // Initialize GPIO
    if (sqlite3_init_database() != 0){            // Initialize the database
        return 0;
    }
    live_video();                                 // Starts live video
    for (;EVER;) mg_mgr_poll(&mgr, 500);           // Infinite event loop
    mg_mgr_free(&mgr);                            // Clears the connection manager
    return 0;
}
