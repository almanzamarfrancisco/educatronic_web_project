#include "program_logic.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "gpio_management.h"

const char *commands[] = {"SUBIR", "BAJAR", "PAUSA", "ABRIR", "INICIO", "FIN"};
const int commandsCount = sizeof(commands) / sizeof(commands[0]);

/* typedef enum { Q0,
               Q1,
               Q2,
               Q3,
               QFINAL } State; */

int execute_commands(int floor, char *code, char *error_line) {
    char *lines[MAX_LINES];
    int lineCount = 0;
    char scriptCopy[strlen(code) + 1];
    strcpy(scriptCopy, code);
    char *line = strtok(scriptCopy, "\n");
    while (line && lineCount < MAX_LINES) {
        while (*line == ' ') line++;
        lines[lineCount++] = strdup(line);
        line = strtok(NULL, "\n");
    }
    for (int i = 1; i < lineCount - 1; i++) {
        char lineCopy[MAX_LENGTH];
        strcpy(lineCopy, lines[i]);
        char *command = strtok(lineCopy, " ");
        char *arg = strtok(NULL, " ");
        if (strcmp(command, "ABRIR") == 0 && !arg) {
            /* openDoor(); */
            continue;
        }
        printf("\t\t[I] current floor: %d -> command: %s %s\n", floor, command, arg);
        if (strcmp(command, "SUBIR") == 0) {
            floor += atoi(arg);
            if (floor > 7) {
                snprintf(error_line, 12, "%d", i + 1);
                return floor;
            }
            // elevatorGoUp();
            continue;
        }
        if (strcmp(command, "BAJAR") == 0) {
            floor -= atoi(arg);
            if (floor < 0) {
                snprintf(error_line, 12, "%d", i + 1);
                return floor;
            }
            // elevatorGoDown();
            continue;
        }
        if (strcmp(command, "PAUSA") == 0) sleep(atoi(arg));
    }
    return floor;
}
int isValidCommand(const char *command) {
    for (int i = 0; i < commandsCount; i++) {
        if (strcmp(command, commands[i]) == 0) return 1;
    }
    return 0;
}
int isValidNumber(const char *str) {
    if (strlen(str) == 1 && str[0] >= '1' && str[0] <= '7') return 1;
    return 0;
}
char *analyzeScript(const char *script) {
    char *lines[MAX_LINES];
    int lineCount = 0;
    char scriptCopy[strlen(script) + 1];
    strcpy(scriptCopy, script);
    char *line = strtok(scriptCopy, "\n");
    while (line && lineCount < MAX_LINES) {
        while (*line == ' ') line++;
        lines[lineCount++] = strdup(line);
        line = strtok(NULL, "\n");
    }
    if (lineCount < 2) {
        return strdup("Error: El programa debe iniciar con 'INICIO' y terminar con 'FIN'.");
    }
    if (strcmp(lines[0], "INICIO") != 0) {
        return strdup("Error: El programa debe iniciar con 'INICIO'.");
    }
    if (strcmp(lines[lineCount - 1], "FIN") != 0) {
        return strdup("Error: El programa debe finalizar con 'FIN'.");
    }
    // State state = Q1;
    for (int i = 1; i < lineCount - 1; i++) {
        char lineCopy[MAX_LENGTH];
        strcpy(lineCopy, lines[i]);
        char *command = strtok(lineCopy, " ");
        char *arg = strtok(NULL, " ");
        if (!isValidCommand(command)) {
            char errorMsg[100];
            snprintf(errorMsg, sizeof(errorMsg), "Error: Comando desconocido '%s' en la línea %d.", command, i + 1);
            return strdup(errorMsg);
        }
        if (strcmp(command, "INICIO") == 0) {
            char errorMsg[100];
            snprintf(errorMsg, sizeof(errorMsg), "Error: El comando 'INICIO' solo debe ir al inicio del programa (línea %d).", i + 1);
            return strdup(errorMsg);
        }
        if (strcmp(command, "FIN") == 0) {
            char errorMsg[100];
            snprintf(errorMsg, sizeof(errorMsg), "Error: El comando 'FIN' solo debe ir al final del programa (línea %d).", i + 1);
            return strdup(errorMsg);
        }
        if (strcmp(command, "ABRIR") == 0 && !arg) {
            // state = Q2;
            continue;
        }
        if (!arg || !isValidNumber(arg)) {
            char errorMsg[100];
            snprintf(errorMsg, sizeof(errorMsg), "Error: Número inválido '%s' en la línea %d. El comando '%s' espera un número entre 1 y 7.", arg ? arg : "N/A", i + 1, command);
            return strdup(errorMsg);
        }
        // state = Q3;
    }
    // state = QFINAL;
    return strdup("Sintaxis válida.");
}