// Copyright (c) 2022 Cesanta Software Limited
// All rights reserved
//
#include "mongoose.h"
#include <wiringPi.h>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>

#define CONTENT_TYPE_HEADER "Content-Type: application/json\r\n"
#define DEFAULT_CODE "START OPEN CLOSE UP 1 UP 2 OPEN CLOSE END"
#define HLS_URI "/hls/"
#define VIDEO_FILES_DIRECTORY "./web_root/hls/"
#define EVER 1
#define PROGRAM_FILE_ELEMENTS 3
// Define GPIO pin numbers
#define LED_PIN 2  // GPIO 27
#define MOTOR_PIN 0  // GPIO 17

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

// Execute video
void live_video(){
    char cmd[512]; // Adjust the size as needed
    // TODO make the log file for the video
        // char live_video_log_file[] = "./logs/live_video.log";
        // sprintf(cmd, "rpicam-vid -t 0 --inline -o - | ffmpeg -thread_queue_size 512 -i - -c:v copy -hls_flags delete_segments -hls_list_size 5 -f hls ./%s/hls/index.m3u8 > %s 2>&1 &", s_root_dir, live_video_log_file);
    // sprintf(cmd, "rpicam-vid -t 0 --inline -o - | ffmpeg -thread_queue_size 512 -i - -c:v copy -hls_flags delete_segments -hls_list_size 5 -f hls ./%s/hls/index.m3u8 &> ./web_root/logs/camera_log.txt &", s_root_dir);
    sprintf(cmd, "rpicam-vid --verbose 0 -t 0 --inline -o - | ffmpeg -thread_queue_size 512 -i - -c:v copy -hls_flags delete_segments -hls_list_size 5 -f hls ./%s/hls/index.m3u8 &> ./web_root/logs/camera_log.txt &", s_root_dir);
    // system("python web_root/server.py &");
    system("rm -rf ./web_root/hls/*");
    system(cmd);
}
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
    if(validate_json(json)){
        printf("Invalid JSON\n");
        return 1;
    }
    // free(f->code); // TODO: Free the memory
    // TODO: make this assignation dinamic
    f->fileId = strdup(mg_json_get_str(json, "$.fileId"));
    f->name = strdup(mg_json_get_str(json, "$.name"));
    f->code = strdup(mg_json_get_str(json, "$.code"));
    execute_commands(f->code);
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
            else{
                printf("[I] File updated: \n");
                printf("\t Code: %s\n", my_file.code);
                printf("\t Name: %s\n", my_file.name);
                printf("\t FileId: %s\n", my_file.fileId);
                mg_http_reply(c, 200, CONTENT_TYPE_HEADER, "{%m:%m}\n", MG_ESC("status"), MG_ESC("ok"));
            }
        } else if (mg_match(hm->uri, mg_str("/hls/*"), NULL)) {
            // Extract the file path from the URI
            char *uri = (char*)malloc((sizeof(char)) * (hm->uri.len + 1));
            strncpy(uri, hm->uri.ptr, hm->uri.len);
            char *file_name = strstr(uri, HLS_URI) + strlen(HLS_URI);
            char file_path[] = VIDEO_FILES_DIRECTORY;
            // printf("==> File name: %s\n", file_name);
            strcat(file_path, file_name);
            // printf("==> File path: %s\n", file_path);
            FILE *file = fopen(file_path, "rb");
            if (file != NULL) {
                // Determine the file size
                fseek(file, 0, SEEK_END);
                long fsize = ftell(file);
                fseek(file, 0, SEEK_SET);
                // Allocate memory for the file content
                char *string = (char *)malloc(fsize + 1);
                fread(string, 1, fsize, file);
                fclose(file);
                string[fsize] = 0;
                // Serve the file content
               // Determine the content type and caching policy based on the file extension
                const char *content_type = "application/octet-stream"; // Default content type
                char cache_control_header[128] = "Cache-Control: no-cache"; // Default cache policy

                if (strstr(file_name, ".m3u8") != NULL) {
                    content_type = "application/vnd.apple.mpegurl";
                    // Shorter cache time for playlist files, e.g., 5 seconds
                    snprintf(cache_control_header, sizeof(cache_control_header), "Cache-Control: max-age=5");
                } else if (strstr(file_name, ".ts") != NULL) {
                    content_type = "video/MP2T";
                    // Longer cache time for segment files, e.g., 3600 seconds (1 hour)
                    snprintf(cache_control_header, sizeof(cache_control_header), "Cache-Control: max-age=60");
                }

                // Construct the Content-Type header
                char content_type_header[128];
                snprintf(content_type_header, sizeof(content_type_header), "Content-Type: %s\r\n", content_type);

                // Serve the file content with the correct Content-Type and Cache-Control headers
                mg_http_reply(c, 200, content_type_header, cache_control_header, "%s", string);
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
    init_gpio();                                  // Initialize GPIO
    live_video();
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
