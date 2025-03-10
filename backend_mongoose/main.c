#include "database_management.h"
#include "gpio_management.h"
#include "server.h"

int main(void) {
    init_gpio();
    /* if (sqlite3_init_database() != 0) TODO: make migrations and seeds
        return 1; */

    start_server();
    return 0;
}
