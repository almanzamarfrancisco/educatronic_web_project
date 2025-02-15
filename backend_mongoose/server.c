#include "server.h"
#include "database_management.h"
#include "program_logic.h"
#include "utils.h"
#include <stdio.h>
#include <stdlib.h>

static const char *s_http_addr = "http://192.168.1.71:8000"; // Developing HTTP port
static const char *s_root_dir = "web_root";

void event_handler(struct mg_connection *c, int ev, void *ev_data) {
    if (ev == MG_EV_HTTP_MSG) {
        struct mg_http_message *hm = (struct mg_http_message *)ev_data;
        if (mg_http_match_uri(hm, "/api/state")) {
            printf("[I] Sending the state for this user...\n");

            // JSON response for /api/state
            const char *json_response =
                "{"
                "  \"programs\": ["
                "    {\"id\": \"One\", \"name\": \"Primer archivo\", \"content\": \"I\\nS 6\\nP 2\\nB 3\\nF\"},"
                "    {\"id\": \"Two\", \"name\": \"Segundo archivo\", \"content\": \"This is the content of the second file\"},"
                "    {\"id\": \"Three\", \"name\": \"Versión definitiva\", \"content\": \"3rd file content\"}"
                "  ]"
                "}";

            mg_http_reply(c, 200, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", json_response);
        }
        else {
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
    if (connection == NULL)
    {
        printf("Error initializing the server\n");
        return;
    }
    printf("HTTP server initialized on %s\n", s_http_addr);
    for (;;)
        mg_mgr_poll(&mgr, 500);
    
    mg_mgr_free(&mgr);
}
