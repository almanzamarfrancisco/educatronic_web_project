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
        printf("\t\t\t✅ Response received: 0x%0X\n", response[0]);
        exit(0);
    } else {
        printf("\t\t\t❌ No response received\n");
        exit(1);
    }
}

int execute_command(unsigned char *command, int *fd_serie) {
    write((int)*fd_serie, command, 1);
    printf("\t\t📫 Command sent: 0x%0X\n", *command);
    sleep(5);
    pid_t pid = fork();
    if (pid == 0) {
        printf("\t\t\t[I] Child process %d created to track ACK.\n", pid);
        receive_ack(fd_serie);
    } else if (pid < 0) {
        perror("❌ Fork failed");
    }
    return 0;
}
void elevatorGoUp(unsigned int floors, int *fd_serie) {
    int actualFloor = floors - 1;
    unsigned char cmd = (actualFloor << 4) | SUBIR;
    printf("\t\t⬆️  Going up %u floors...\n", floors);
    execute_command(&cmd, fd_serie);
}

void elevatorGoDown(unsigned int floors, int *fd_serie) {
    int actualFloor = floors - 1;
    unsigned char cmd = (actualFloor << 4) | BAJAR;
    printf("\t\t⬇️  Going down %u floors...\n", floors);
    execute_command(&cmd, fd_serie);
}

void pause_execution(unsigned int seconds, int *fd_serie) {
    unsigned char cmd = (seconds << 4) | PAUSAR;
    printf("\t\t⏸ Pausing execution for %u seconds...\n", seconds);
    execute_command(&cmd, fd_serie);
}

void openDoor(int *fd_serie) {
    unsigned char cmd = ABRIR;
    printf("\t\t🚪 Opening door...\n");
    execute_command(&cmd, fd_serie);
}

void send_start(int *fd_serie) {
    unsigned char cmd = INICIO;
    printf("\t\t🟢 Sending START command...\n");
    execute_command(&cmd, fd_serie);
}

void send_finish(int *fd_serie) {
    unsigned char cmd = FIN;
    printf("\t\t🔴 Sending FINISH command...\n");
    execute_command(&cmd, fd_serie);
}