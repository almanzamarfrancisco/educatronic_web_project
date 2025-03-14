#include "server.h"

#include <stdio.h>
#include <stdlib.h>

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

static const char *s_http_addr = "http://192.168.1.71:8000";  // Developing HTTP port
// static const char *s_http_addr = "http://localhost:8000";  // Ngrok HTTP port
static const char *s_root_dir = "web_root";

// Event handler for HTTP requests
void event_handler(struct mg_connection *c, int ev, void *ev_data) {
    if (ev == MG_EV_HTTP_MSG) {
        struct mg_http_message *hm = (struct mg_http_message *)ev_data;
        if (mg_http_match_uri(hm, "/api/state")) {
            printf("\t [I] Fetching exercises and programs from database... (/api/state)\n");

            sqlite3 *db = connect_database();
            if (!db) {
                fprintf(stderr, "Error connecting to database.\n");
                mg_http_reply(c, 500, "Content-Type: application/json\r\n", "{\"error\":\"Database connection failed\"}");
                return;
            }

            char *exercises_json = get_exercises_json(db);
            char *programs_json = get_programs_json(db);

            char *json_response = mg_mprintf("{%m:%s, %m:%s}", MG_ESC("programs"), programs_json, MG_ESC("exercises"), exercises_json);
            int content_length = strlen(json_response);

            mg_printf(c, CORS_HEADERS, content_length);
            mg_printf(c, "%s\n", json_response);
            printf("\t [I] State sent successfully (/api/state)\n");

            free(exercises_json);
            free(programs_json);
            sqlite3_close(db);
        } else {
            struct mg_http_serve_opts opts = {.root_dir = s_root_dir};
            mg_http_serve_dir(c, ev_data, &opts);
        }
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
    for (;;)
        mg_mgr_poll(&mgr, 500);

    mg_mgr_free(&mgr);
}
