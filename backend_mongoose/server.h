#ifndef SERVER_H
#define SERVER_H

#include "mongoose.h"

// HTTP Server Functions
void event_handler(struct mg_connection *c, int ev, void *ev_data);
void start_server();

#endif // SERVER_H
