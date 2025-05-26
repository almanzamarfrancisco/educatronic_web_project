#include <errno.h>
#include <fcntl.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <termios.h>
#include <unistd.h>

// ——— Command definitions ———
#define CMD_DOWN 0x01
#define CMD_UP 0x02
#define CMD_PAUSE 0x03
#define CMD_OPEN 0x04
#define CMD_START 0x0C
#define CMD_END 0x0F
#define CMD_ACK 0xAA

static int uart_fd;
static pid_t child_pid;

// clean up child on SIGINT
void sigint_handler(int signo) {
    if (child_pid > 0) {
        kill(child_pid, SIGTERM);
        waitpid(child_pid, NULL, 0);
    }
    if (uart_fd >= 0) close(uart_fd);
    printf("\nExiting.\n");
    exit(0);
}

// configure the serial port to raw, 9600 bps, 8N1
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

    return fd;
}

int main(void) {
    uart_fd = setup_uart("/dev/ttyS0");
    if (uart_fd < 0) exit(EXIT_FAILURE);

    signal(SIGINT, sigint_handler);

    child_pid = fork();
    if (child_pid < 0) {
        perror("fork()");
        close(uart_fd);
        exit(EXIT_FAILURE);
    }

    if (child_pid == 0) {
        // ——— Child: wait for ACKs ———
        unsigned char buf;
        while (1) {
            ssize_t n = read(uart_fd, &buf, 1);
            if (n < 0) {
                perror("read()");
                break;
            }
            if (buf == CMD_ACK) {
                printf("[Child] ACK received\n");
                fflush(stdout);
            }
        }
        close(uart_fd);
        exit(0);
    } else {
        // ——— Parent: read user input & send commands ———
        printf("Command mappings:\n");
        printf("  d [0–15] → DOWN   (high-nibble argument)\n");
        printf("  u [0–15] → UP     (high-nibble argument)\n");
        printf("  p [0–15] → PAUSE  (high-nibble argument)\n");
        printf("  o        → OPEN\n");
        printf("  s        → START\n");
        printf("  e        → END\n");
        printf("  q        → quit\n\n");

        char line[100];
        while (fgets(line, sizeof(line), stdin)) {
            char c;
            int arg = 0;
            int count = sscanf(line, " %c %d", &c, &arg);
            unsigned char cmd_byte;
            int valid = 1;

            switch (c) {
                case 'd':
                    if (count == 2 && arg >= 0 && arg <= 15) {
                        cmd_byte = (arg << 4) | CMD_DOWN;
                    } else
                        valid = 0;
                    break;
                case 'u':
                    if (count == 2 && arg >= 0 && arg <= 15) {
                        cmd_byte = (arg << 4) | CMD_UP;
                    } else
                        valid = 0;
                    break;
                case 'p':
                    if (count == 2 && arg >= 0 && arg <= 15) {
                        cmd_byte = (arg << 4) | CMD_PAUSE;
                    } else
                        valid = 0;
                    break;
                case 'o':
                    cmd_byte = CMD_OPEN;
                    break;
                case 's':
                    cmd_byte = CMD_START;
                    break;
                case 'e':
                    cmd_byte = CMD_END;
                    break;
                case 'q':
                    // cleanup and exit
                    kill(child_pid, SIGTERM);
                    waitpid(child_pid, NULL, 0);
                    close(uart_fd);
                    printf("Parent exiting.\n");
                    exit(0);
                default:
                    valid = 0;
            }

            if (!valid) {
                printf("Invalid command format. Try again.\n");
                continue;
            }

            if (write(uart_fd, &cmd_byte, 1) != 1) {
                perror("write()");
            } else {
                printf("[Parent] Sent 0x%02X\n", cmd_byte);
            }
        }
    }

    return 0;
}
