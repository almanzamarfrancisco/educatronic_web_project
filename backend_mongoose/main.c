#include "database_management.h"
#include "gpio_management.h"
#include "server.h"

int main(void) {
    init_gpio();
    if (init_database() != 0)
        return 1;
    start_server();
    return 0;
}
