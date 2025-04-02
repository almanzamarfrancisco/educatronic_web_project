#ifndef UART_CONTROL_H
#define UART_CONTROL_H

#include <termios.h>

int setup_uart();
int execute_command(unsigned char *command, int *fd_serie);
int receive_ack(int *fd_serie);
#define UART_PORT "/dev/ttyS0"
#define BAUDRATE B9600
#define ACK 0xAA

#endif