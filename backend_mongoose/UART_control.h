#ifndef UART_CONTROL_H
#define UART_CONTROL_H

#include <termios.h>

int setup_uart();
int execute_command(unsigned char *command, int *fd_serie);
int receive_ack(int *fd_serie);
#define UART_PORT "/dev/ttyS0"
#define BAUDRATE B9600
#define ACK 0xAA
#define BAJAR 0x01
#define SUBIR 0x02
#define PAUSAR 0x03
#define ABRIR 0x04
#define INICIO 0x0C
#define FIN 0xFF

/*
Acción	Decimal	Parámetro   Forma(HEX)
BAJAR	1	    Piso    	0xN1
SUBIR	2	    Piso    	0xN2
PAUSAR	3	    Segundos    0xN3
ABRIR	4	    -   	    0x04
INICIO  12      -           0x0C
FIN     255     -           0xFF
ACK     170     -           0xAA
 */
void elevatorGoUp(unsigned int floors, int *fd_serie);
void elevatorGoDown(unsigned int floors, int *fd_serie);
void pause_execution(unsigned int seconds, int *fd_serie);
void openDoor(int *fd_serie);
void send_start(int *fd_serie);
void send_finish(int *fd_serie);

#endif