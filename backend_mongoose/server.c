#include "server.h"

#include <stdio.h>
#include <stdlib.h>
// #include <time.h>
#include "UART_control.h"
#include "database_management.h"
#include "program_logic.h"
#include "utils.h"

#define CORS_HEADERS                                                                   \
    "HTTP/1.1 200 OK\r\n"                                                              \
    "Content-Type: application/json\r\n"                                               \
    "Access-Control-Allow-Origin: *\r\n"                                               \
    "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"                             \
    "Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept\r\n" \
    "Content-Length: %d\r\n"                                                           \
    "\r\n"

// static const char *s_http_addr = "http://192.168.1.71:8000";  // Developing HTTP port
static const char *s_http_addr = "http://localhost:8000";  // Ngrok HTTP port
static const char *s_root_dir = "web_root";
int current_floor = 0;
int fd_serie = -1;

// Event handler for HTTP requests
void event_handler(struct mg_connection *c, int ev, void *ev_data) {
    if (ev == MG_EV_HTTP_MSG) {
        struct mg_http_message *hm = (struct mg_http_message *)ev_data;
        if (mg_http_match_uri(hm, "/api/state") && mg_vcmp(&hm->method, "GET") == 0) {
            printf("\t [I] Fetching exercises and programs from database... (/api/state)\n");
            sqlite3 *db = connect_database();
            if (!db) {
                fprintf(stderr, "Error connecting to database.\n");
                mg_http_reply(c, 500, "Content-Type: application/json\r\n", "{\"error\":\"Database connection failed\"}");
                return;
            }
            char *exercises_json = get_exercises_json(db);
            char *programs_json = get_programs_json(db);
            char *json_response = mg_mprintf("{%m:%s, %m:%s, %m:%d}",
                                             MG_ESC("programs"), programs_json,
                                             MG_ESC("exercises"), exercises_json,
                                             MG_ESC("currentFloor"), current_floor);
            int content_length = strlen(json_response);
            mg_printf(c, CORS_HEADERS, content_length);
            mg_printf(c, "%s\n", json_response);
            printf("\t [I] State sent successfully (/api/state)\n");
            free(exercises_json);
            free(programs_json);
            sqlite3_close(db);
        } else if (mg_http_match_uri(hm, "/api/programs/update/*") && mg_vcmp(&hm->method, "PUT") == 0) {
            printf("\t[I] Yes! This is a received PUT request to UPDATE programs\n");
            char id[37] = {0};
            const char *uri_start = hm->uri.ptr + strlen("/api/programs/update/");
            size_t uri_len = hm->uri.len - strlen("/api/programs/update/");
            snprintf(id, sizeof(id), "%.*s", (int)uri_len, uri_start);
            printf("\t [I] 🔹 Program ID: %s\n", id);
            printf("\t [I] Updating program with ID %s... (/api/programs/update/*)\n", id);
            if (strlen(id) != 36) {
                mg_http_reply(c, 400, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "{\"error\":\"Invalid program ID\"}");
                printf("\t [E] Invalid program ID\n");
                return;
            }
            sqlite3 *db = connect_database();
            if (!db) {
                fprintf(stderr, "Error connecting to database.\n");
                mg_http_reply(c, 500, "Content-Type: application/json\r\n", "{\"error\":\"Database connection failed\"}");
                return;
            }
            if (!update_program(db, id, hm->body.ptr)) mg_http_reply(c, 400, "Content-Type: application/json\r\n", "{\"error\": \"Failed to update program\"}");
            mg_http_reply(c, 200, "Content-Type: application/json\r\n", "{\"status\":\"ok\"}");
            sqlite3_close(db);
        } else if (mg_http_match_uri(hm, "/api/programs/delete/*") && mg_vcmp(&hm->method, "DELETE") == 0) {
            printf("\t[I] Yes! This is a received DELETE request to DELETE programs\n");
            char id[37] = {0};
            const char *uri_start = hm->uri.ptr + strlen("/api/programs/delete/");
            size_t uri_len = hm->uri.len - strlen("/api/programs/delete/");
            snprintf(id, sizeof(id), "%.*s", (int)uri_len, uri_start);
            printf("\t[I] 🔹 Program ID: %s\n", id);
            printf("\t [I] Deleting program with ID %s... (/api/programs/delete/*)\n", id);
            if (strlen(id) != 36) {
                mg_http_reply(c, 400, "Content-Type: application/json\r\n", "{\"error\":\"Invalid program ID\"}");
                printf("\t [E] Invalid program ID\n");
                return;
            }
            sqlite3 *db = connect_database();
            if (!db) {
                fprintf(stderr, "Error connecting to database.\n");
                mg_http_reply(c, 500, "Content-Type: application/json\r\n", "{\"error\":\"Database connection failed\"}");
                return;
            }
            if (!delete_program(db, id)) mg_http_reply(c, 400, "Content-Type: application/json\r\n", "{\"error\": \"Failed to delete program\"}");
            mg_http_reply(c, 200, "Content-Type: application/json\r\n", "{\"status\":\"ok\"}");
            sqlite3_close(db);
        } else if (mg_http_match_uri(hm, "/api/programs/create") && mg_vcmp(&hm->method, "POST") == 0) {
            printf("\t[I] Yes! This is a received POST request to ADD NEW programs\n");
            sqlite3 *db = connect_database();
            if (!db) {
                fprintf(stderr, "Error connecting to database.\n");
                mg_http_reply(c, 500, "Content-Type: application/json\r\n", "{\"error\":\"Database connection failed\"}");
                return;
            }
            char id[37] = {0};
            if (!new_program(db, id, hm->body.ptr)) mg_http_reply(c, 400, "Content-Type: application/json\r\n", "{\"error\": \"Failed to add program\"}");
            printf("\t[I] 🔹 Program ID: %s\n", id);
            char *json_response = mg_mprintf("{%m: 'ok', %m:%s}", MG_ESC("status"), MG_ESC("newProgramId"), id);
            int content_length = strlen(json_response);
            mg_printf(c, CORS_HEADERS, content_length);
            mg_printf(c, "%s\n", json_response);
            sqlite3_close(db);
        } else if (mg_http_match_uri(hm, "/api/programs/execute") && mg_vcmp(&hm->method, "POST") == 0) {
            printf("\t[I] Yes! This is a received POST request to EXECUTE programs\n");
            char *code = mg_json_get_str(mg_str(hm->body.ptr), "$.code");
            char *program_id = mg_json_get_str(mg_str(hm->body.ptr), "$.programId");
            if (!program_id) {
                mg_http_reply(c, 400, "Content-Type: application/json\r\n", "{\"error\":\"Invalid program ID\"}");
                return;
            }
            if (!code) {
                mg_http_reply(c, 400, "Content-Type: application/json\r\n", "{\"error\":\"Invalid code\"}");
                return;
            }
            char *error = analyzeScript(code);
            if (strcmp(error, "Sintaxis válida.") != 0) {
                mg_http_reply(c, 400, "Content-Type: application/json\r\n", mg_mprintf("{\"error\":\"%s\"}", error));
                free(error);
                return;
            }
            free(error);
            // Execute the program
            char error_line[12] = {0};
            current_floor = execute_commands(current_floor, code, error_line, &fd_serie);
            char current_floor_str[12];
            sprintf(current_floor_str, "%d", current_floor);
            if (current_floor < 0 || current_floor > 7)
                printf("\t[I] Elevator out of bounds at line %s.\n", error_line);
            else
                printf("\t[I] Elevator reached current_floor %d.\n", current_floor);
            char *json_response = mg_mprintf("{%m:%m, %m:%s}",
                                             MG_ESC("status"), MG_ESC(current_floor >= 0 ? "ok" : "error"),
                                             MG_ESC(current_floor >= 0 ? "current_floor" : "line"), current_floor >= 0 ? current_floor_str : error_line);
            int content_length = strlen(json_response);
            mg_printf(c, CORS_HEADERS, content_length);
            mg_printf(c, "%s\n", json_response);
            if (current_floor < 0) current_floor = 0;
            if (current_floor > 7) current_floor = 7;
            printf("\t[I] Current current_floor: %d\n", current_floor);
        } else {
            struct mg_http_serve_opts opts = {.root_dir = s_root_dir};
            mg_http_serve_dir(c, ev_data, &opts);
        }
        // time_t now = time(NULL);
        // struct tm *t = localtime(&now);
        // char time_str[100];
        // strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", t);
        // printf("\n-------- %s --------\n", time_str);
        puts("---------------------------------------\n");
    }
}

// Function to start the HTTP server
void start_server() {
    struct mg_mgr mgr;
    struct mg_connection *connection;
    mg_mgr_init(&mgr);
    connection = mg_http_listen(&mgr, s_http_addr, event_handler, NULL);
    if (connection == NULL) {
        printf("Error initializing the server\n");
        return;
    }
    printf("HTTP server initialized on %s\n", s_http_addr);
    fd_serie = config_serial("/dev/ttyS0", B9600);
    if (fd_serie == -1) {
        printf("\t[E] Error opening serial port\n");
        perror("\t[E] Error al abrir el dispositivo serial\n");
        return;
    }
    printf("\t[I] Serial opened with descriptor: %d\n", fd_serie);
    for (;;)
        mg_mgr_poll(&mgr, 500);
    mg_mgr_free(&mgr);
}
