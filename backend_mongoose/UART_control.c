#include "UART_control.h"

#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <termios.h>
#include <unistd.h>

/** @brief: This function configures the serial interface
 *  @return: fd, Serial descriptor
 *******************************************************************************************
 */
int setup_uart() {
    int fd = open(UART_PORT, (O_RDWR | O_NOCTTY | O_NDELAY));
    if (fd == -1) {
        perror("❌ Failed to open UART");
        return -1;
    }

    struct termios options;
    tcgetattr(fd, &options);
    options.c_cflag = BAUDRATE | CS8 | CLOCAL | CREAD;
    options.c_iflag = IGNPAR;
    options.c_oflag = 0;
    options.c_lflag = 0;
    cfsetispeed(&options, BAUDRATE);
    cfsetospeed(&options, BAUDRATE);
    tcflush(fd, TCIOFLUSH);
    tcsetattr(fd, TCSANOW, &options);

    printf("🔌 UART ready on %s (9600 baud)\n", UART_PORT);
    return fd;
}
int receive_ack(int *fd_serie) {
    unsigned char response[1];
    int bytesRead = read((int)*fd_serie, response, 1);
    if (bytesRead == ACK) {
        printf("\t\t ✅ Response received: 0x%0X\n", response[0]);
    } else {
        printf("\t\t ❌ No response received\n");
    }
    return 1;
}

int execute_command(unsigned char *command, int *fd_serie) {
    write((int)*fd_serie, command, 1);
    printf("\t\t Command sent: 0x%0X\n", *command);
    receive_ack(fd_serie);
    return 0;
}