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

void event_handler(struct mg_connection *c, int ev, void *ev_data) {
    if (ev == MG_EV_HTTP_MSG) {
        struct mg_http_message *hm = (struct mg_http_message *)ev_data;
        if (mg_http_match_uri(hm, "/api/state")) {
            printf("\t [I] Sending the current state for this user... (/api/state)\n");
            char *json_response = (char *)malloc(sizeof(char) * 1024);
            const char *response =
                "["
                "    {\"id\": \"One\", \"name\": \"Primer archivo\", \"content\": \"I\\nS 6\\nP 2\\nB 3\\nF\"},"
                "    {\"id\": \"Two\", \"name\": \"Segundo archivo\", \"content\": \"This is the content of the second file\"},"
                "    {\"id\": \"Three\", \"name\": \"Versión definitiva\", \"content\": \"3rd file content\"}"
                "]";
            const char *exercises =
                "["
                "    {\"id\": \"One\", \"name\": \"Primer ejercicio\", \"content\": \"Contenido del primer ejercicio\"},"
                "    {\"id\": \"Two\", \"name\": \"Segundo ejercicio\", \"content\": \"Este es el segundo ejercicio y su contenido\"},"
                "    {\"id\": \"Three\", \"name\": \"Tercer ejercicio\", \"content\": \"Contenido del tercer ejercicio \\n lorem ipsum \"}"
                "]";
            json_response = mg_mprintf("{%m:%s, %m:%s}", MG_ESC("programs"), response, MG_ESC("exercises"), exercises);
            int content_length = strlen(json_response);
            mg_printf(c, CORS_HEADERS, content_length);
            mg_printf(c, "%s\n", json_response);
            printf("\t [I] State sent (/api/state)\n");
        } else {
            struct mg_http_serve_opts opts = {.root_dir = s_root_dir};
            mg_http_serve_dir(c, ev_data, &opts);
        }
    }
}

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
