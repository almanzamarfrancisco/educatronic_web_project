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
int setup_uart(const char *device) {
    struct termios tty;
    int fd = open(device, O_RDWR | O_NOCTTY);
    if (fd < 0) {
        perror("open()");
        return -1;
    }

    if (tcgetattr(fd, &tty) < 0) {
        perror("tcgetattr()");
        close(fd);
        return -1;
    }

    cfsetospeed(&tty, B9600);
    cfsetispeed(&tty, B9600);

    tty.c_cflag |= (CLOCAL | CREAD);  // ignore modem controls, enable reading
    tty.c_cflag &= ~CSIZE;
    tty.c_cflag |= CS8;       // 8 bits per byte
    tty.c_cflag &= ~PARENB;   // no parity
    tty.c_cflag &= ~CSTOPB;   // one stop bit
    tty.c_cflag &= ~CRTSCTS;  // no hardware flow control

    tty.c_lflag &= ~(ICANON | ECHO | ECHOE | ISIG);  // raw input
    tty.c_iflag &= ~(IXON | IXOFF | IXANY);          // no software flow control
    tty.c_iflag &= ~(INLCR | ICRNL | IGNCR);
    tty.c_oflag &= ~OPOST;  // raw output

    tty.c_cc[VMIN] = 1;   // read() blocks until ≥1 byte arrives
    tty.c_cc[VTIME] = 0;  // no timeout

    if (tcsetattr(fd, TCSANOW, &tty) != 0) {
        perror("tcsetattr()");
        close(fd);
        return -1;
    }
    printf("🔌 UART ready on %s (9600 baud)\n", UART_PORT);
    return fd;
}
int receive_ack(int *fd_serie) {
    unsigned char buf;
    while (1) {
        ssize_t n = read((int)*fd_serie, &buf, 1);
        if (n < 0) {
            perror("read()");
            break;
        }
        if (buf == ACK) {
            printf("\t\t\t✅ Response received: 0x%0X\n", ACK);
            fflush(stdout);
            exit(0);
        } else {
            printf("\t\t\t❌ No response received\n");
            exit(1);
        }
    }
    close((int)*fd_serie);
    exit(0);
}

int execute_command(unsigned char *command, int *fd_serie) {
    write((int)*fd_serie, command, 1);
    printf("\t\t📫 Command sent: 0x%2X\n", *command);
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
    int actualFloor = floors;
    unsigned char cmd = (actualFloor << 4) | SUBIR;
    printf("\t\t⬆️  Going up %u floors...\n", floors);
    execute_command(&cmd, fd_serie);
}

void elevatorGoDown(unsigned int floors, int *fd_serie) {
    int actualFloor = floors;
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