// Copyright (c) 2022 Cesanta Software Limited
// All rights reserved
//
#include "mongoose.h"

#define CONTENT_TYPE_HEADER "Content-Type: application/json\r\n"
#define DEFAULT_CODE "START OPEN CLOSE UP 1 UP 2 OPEN CLOSE END"
#define EVER 1
#define PROGRAM_FILE_ELEMENTS 3

static const char *s_http_addr = "http://192.168.1.74:8000";  // HTTP port
static const char *s_root_dir = "web_root";

typedef struct PROGRAM_FILE{
    char *fileId;
    char *name;
    char *code;
} program_file;
const char * program_file_properties[] = {
    "fileId",
    "name",
    "code",
};

// Validates de JSON properties
int validate_json(struct mg_str json) {
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

// Try to update a single file
int update_files(struct mg_str json, program_file *f) {
    if(validate_json(json)){
        printf("Invalid JSON\n");
        return 1;
    }
    // free(f->code); // TODO: Free the memory
    // TODO: make this assignation dinamic
    f->fileId = strdup(mg_json_get_str(json, "$.fileId"));
    f->name = strdup(mg_json_get_str(json, "$.name"));
    f->code = strdup(mg_json_get_str(json, "$.code"));
    return 0;
}

/* static */ void event_handler(struct mg_connection *c, int ev, void *ev_data) {
        program_file my_file;
        my_file.code = DEFAULT_CODE;
        my_file.name = "Unnamed";
        my_file.fileId = "None";
    if (ev == MG_EV_OPEN && c->is_listening) {
        printf("[I] Connection listening correctly\n");
    } else if (ev == MG_EV_HTTP_MSG) {
        struct mg_http_message *hm = (struct mg_http_message *) ev_data;
        if (mg_http_match_uri(hm, "/api/code/get_default")) {
            mg_http_reply(c, 200, CONTENT_TYPE_HEADER, "{%m:%m}\n", MG_ESC("code"), MG_ESC(my_file.code));
        } else if (mg_http_match_uri(hm, "/api/code/exec")) {
            struct mg_str json = hm->body;
            if(update_files(json, &my_file))
                mg_http_reply(c, 400, CONTENT_TYPE_HEADER, "{%m:%m}\n", MG_ESC("status"), MG_ESC("Error, Ivalid JSON"));
            else
                mg_http_reply(c, 200, CONTENT_TYPE_HEADER, "{%m:%m}\n", MG_ESC("status"), MG_ESC("ok"));
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
    for (;EVER;) mg_mgr_poll(&mgr, 1000);         // Infinite event loop
    mg_mgr_free(&mgr);                            // Clears the connection manager
    return 0;
}
