#ifndef UART_CONTROL_H
#define UART_CONTROL_H

#include <termios.h>

int config_serial(char *dispositivo_serial, speed_t baudios);
int execute_command(char *command, int fd_serie);
#define UART_PORT "/dev/ttyS0"

#endif