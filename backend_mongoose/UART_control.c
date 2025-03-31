#include "UART_control.h"

#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <termios.h>
#include <unistd.h>

#define N 4096
#define EVER 1

/** @brief: This function configures the serial interface
 *  @param: dispositivo_serial, Name of the serial device to use: ttyUSB0, ttyUSB1, etc.
 *  @param: baudios, Communication speed. The constant Bxxxx is used, where xxxx is the
 *          speed. These are defined in termios.h. Example: B9600, B19200, B115200 ...
 *  @return: fd, Serial descriptor
 *******************************************************************************************
 */
int config_serial(char *dispositivo_serial, speed_t baudios) {
    struct termios newtermios;
    int fd;
    /*
     * A file descriptor is opened to handle the serial interface
     * O_RDWR - The descriptor is opened for reading and writing
     * O_NOCTTY - The terminal device will not become the process's terminal
     * ~O_NONBLOCK - Makes data reading blocking
     */
    fd = open(dispositivo_serial, (O_RDWR | O_NOCTTY) & ~O_NONBLOCK);
    if (fd == -1) {
        perror("Error opening tty device \n");
        exit(EXIT_FAILURE);
    }
    /*
     * cflag - Provides control mode flags
     *	CBAUD	- Transmission speed in baud rate.
     * 	CS8	- Specifies the bits per data, in this case 8
     * 	CLOCAL 	- Ignores modem control lines: CTS and RTS
     * 	CREAD  	- Enables the UART receiver
     * iflag - Provides input mode flags
     * 	IGNPAR 	- Ignores parity errors, i.e., communication without parity
     * oflag - Provides output mode flags
     * lflag - Provides local mode flags
     * 	TCIOFLUSH - Clears received but unread data, as well as written but not transmitted data
     * 	~ICANON - Sets non-canonical mode, in this mode input is available immediately
     * cc[]	 - Array that defines special control characters
     *	VMIN > 0, VTIME = 0 - Blocks reading until the number of bytes (1) is available
     */
    newtermios.c_cflag = CBAUD | CS8 | CLOCAL | CREAD;
    newtermios.c_iflag = IGNPAR;
    newtermios.c_oflag = 0;
    newtermios.c_lflag = TCIOFLUSH | ~ICANON;
    newtermios.c_cc[VMIN] = 1;
    newtermios.c_cc[VTIME] = 0;

    // Configures the UART output speed
    if (cfsetospeed(&newtermios, baudios) == -1) {
        printf("\t[E] Error setting output speed \n");
        exit(EXIT_FAILURE);
    }
    // Configures the UART input speed
    if (cfsetispeed(&newtermios, baudios) == -1) {
        printf("\t[E] Error setting input speed \n");
        exit(EXIT_FAILURE);
    }
    // Clears the input buffer
    if (tcflush(fd, TCIFLUSH) == -1) {
        printf("\t[E] Error clearing the input buffer \n");
        exit(EXIT_FAILURE);
    }
    // Clears the output buffer
    if (tcflush(fd, TCOFLUSH) == -1) {
        printf("\t[E] Error clearing the output buffer \n");
        exit(EXIT_FAILURE);
    }
    /*
     * Sets the terminal parameters associated with the
     * file descriptor fd using the termios structure
     * TCSANOW - Changes the values immediately
     */
    if (tcsetattr(fd, TCSANOW, &newtermios) == -1) {
        printf("\t[E] Error setting terminal parameters \n");
        exit(EXIT_FAILURE);
    }
    // Returns the file descriptor
    return fd;
}
int execute_command(char *command, int fd_serie) {
    write(fd_serie, command, 1);
    return 0;
}