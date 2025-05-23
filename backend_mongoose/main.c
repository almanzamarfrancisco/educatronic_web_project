#include "UART_control.h"
#include "database_management.h"
#include "server.h"

int main(void) {
    if (init_database() != 0)
        return 1;
    start_server();
    return 0;
}
