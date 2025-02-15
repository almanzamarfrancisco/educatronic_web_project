#include "program_logic.h"
#include "gpio_management.h"
#include <string.h>
#include <stdio.h>

void execute_commands(char *code) {
    if (strstr(code, "LED ON") != NULL)
        led_on();
    else if (strstr(code, "LED OFF") != NULL)
        led_off();
    else if (strstr(code, "MOTOR ON") != NULL)
        motor_on();
    else if (strstr(code, "MOTOR OFF") != NULL)
        motor_off();
}
