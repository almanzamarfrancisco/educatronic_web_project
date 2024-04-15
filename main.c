// Copyright (c) 2022 Cesanta Software Limited
// All rights reserved
//
// UI example
// It implements the following endpoints:
//    /api/config/get - respond with current config
//    /api/config/set - POST a config change
//    any other URI serves static files from s_root_dir
// Data and results are JSON strings

#include "mongoose.h"

static const char *s_http_addr = "http://localhost:8000";  // HTTP port
static const char *s_root_dir = "web_root";
#define DEFAULT_CODE "START OPEN CLOSE UP 1 UP 2 OPEN CLOSE END"
static struct config {
  char *code;
} s_config;

// Try to update a single configuration value
static void update_config(struct mg_str json, const char *path, char **value) {
  char *jval;
  if ((jval = mg_json_get_str(json, path)) != NULL) {
    free(*value);
    *value = strdup(jval);
    printf("Updated %s to %s\n", path, *value);
  }
}

static void fn(struct mg_connection *c, int ev, void *ev_data) {
  if (ev == MG_EV_OPEN && c->is_listening) {
    s_config.code = strdup(DEFAULT_CODE);
  } else if (ev == MG_EV_HTTP_MSG) {
    struct mg_http_message *hm = (struct mg_http_message *) ev_data;
    if (mg_http_match_uri(hm, "/api/code/get_default")) {
      mg_http_reply(c, 200, "Content-Type: application/json\r\n",
                    "{%m:%m}\n", MG_ESC("code"),
                    MG_ESC(s_config.code));
    } else if (mg_http_match_uri(hm, "/api/code/exec")) {
      struct mg_str json = hm->body;
      update_config(json, "$.code", &s_config.code);
      mg_http_reply(c, 200, "status", "ok\n");
    } else {
      struct mg_http_serve_opts opts = {.root_dir = s_root_dir};
      mg_http_serve_dir(c, ev_data, &opts);
    }
  }
}

int main(void) {
  struct mg_mgr mgr;                            // Event manager
  mg_log_set(MG_LL_INFO);                       // Set to 3 to enable debug
  mg_mgr_init(&mgr);                            // Initialise event manager
  mg_http_listen(&mgr, s_http_addr, fn, NULL);  // Create HTTP listener
  for (;;) mg_mgr_poll(&mgr, 1000);             // Infinite event loop
  mg_mgr_free(&mgr);
  return 0;
}
