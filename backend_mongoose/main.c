#include "server.h"
#include "gpio_management.h"
#include "database_management.h"

int main(void) {
    init_gpio();
    if (sqlite3_init_database() != 0)
        return 1;

    start_server();
    return 0;
}
