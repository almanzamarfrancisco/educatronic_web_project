#include "program_logic.h"

#include <regex.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "UART_control.h"

u_char command_to_execute;

void openDoor() {
    command_to_execute = 4;
    printf("\t\t\t🚪 Opening door\n");
    // write(fd_serie, &command_to_execute, 1);
}
void elevatorGoUp(int *fd_serie) {
    command_to_execute = 0x022;
    printf("\t\t\t⬆️ Going one floor up\n");
    execute_command(command_to_execute, fd_serie);
}
void elevatorGoDown(int *fd_serie) {
    command_to_execute = 0x11;
    printf("\t\t\t⬇️ Going one floor down\n");
    execute_command(command_to_execute, fd_serie);
}

CommandDef commandTable[] = {
    {"INICIO", "INICIO", {}, 0, CMD_PROGRAM_START},
    {"SUBIR", "SUBIR", {"^[1-7]$"}, 1, CMD_REGULAR},
    {"BAJAR", "BAJAR", {"^[1-7]$"}, 1, CMD_REGULAR},
    {"PAUSA", "PAUSA", {"^[0-9]+$"}, 1, CMD_REGULAR},
    {"ABRIR", "ABRIR", {}, 0, CMD_REGULAR},
    {"REPETIR", "REPETIR", {"^[0-9]+$"}, 1, CMD_BLOCK_START},
    {"FIN_REPETIR", "FIN_REPETIR", {}, 0, CMD_BLOCK_END},
    {"FIN", "FIN", {}, 0, CMD_PROGRAM_END}};
const int commandsCount = sizeof(commandTable) / sizeof(commandTable[0]);

CommandDef *getCommandByToken(const char *token) {
    for (int i = 0; i < commandsCount; i++) {
        if (strcmp(commandTable[i].token, token) == 0) {
            return &commandTable[i];
        }
    }
    return NULL;
}
CommandDef *getProgramInitializerCommand() {
    for (int i = 0; i < commandsCount; i++) {
        if (commandTable[i].role == CMD_PROGRAM_START) {
            return &commandTable[i];
        }
    }
    return NULL;
}
CommandDef *getProgramFinalizerCommand() {
    for (int i = 0; i < commandsCount; i++) {
        if (commandTable[i].role == CMD_PROGRAM_END) {
            return &commandTable[i];
        }
    }
    return NULL;
}
int matchRegex(const char *pattern, const char *input) {
    regex_t regex;
    if (regcomp(&regex, pattern, REG_EXTENDED)) return 0;
    int result = regexec(&regex, input, 0, NULL, 0);
    regfree(&regex);
    return result == 0;
}
int execute_commands(int floor, char *code, char *error_line, int *file_descriptor_serie) {
    printf("\t[I] Starting program execution... 🚀\n");
    char *lines[MAX_LINES];
    int lineCount = 0;
    char codeCopy[strlen(code) + 1];
    strcpy(codeCopy, code);
    char *line = strtok(codeCopy, "\n");
    while (line && lineCount < MAX_LINES) {
        while (*line == ' ') line++;
        lines[lineCount++] = strdup(line);
        line = strtok(NULL, "\n");
    }
    return execute_block(lines, 1, lineCount - 1, &floor, error_line, file_descriptor_serie);
}
int execute_block(char **lines, int start, int end, int *floor, char *error_line, int *file_descriptor_serie) {
    for (int i = start; i < end; i++) {
        char lineCopy[MAX_LENGTH];
        strcpy(lineCopy, lines[i]);
        char *command = strtok(lineCopy, " ");
        char *arg = strtok(NULL, " ");
        CommandDef *cmd = getCommandByToken(command);
        switch (cmd->role) {
            case CMD_PROGRAM_START:
            case CMD_PROGRAM_END:
            case CMD_BLOCK_END:
                break;
            case CMD_BLOCK_START: {
                printf("\t\t🔁 Repitiendo %s veces\n", arg);
                int repeatCount = atoi(arg);
                int loopStart = i + 1;
                int loopEnd = -1;
                for (int j = loopStart; j < end; j++) {
                    char tempLine[MAX_LENGTH];
                    strcpy(tempLine, lines[j]);
                    char *maybeEnd = strtok(tempLine, " ");
                    CommandDef *maybeCmd = getCommandByToken(maybeEnd);
                    if (maybeCmd && maybeCmd->role == CMD_BLOCK_END && strcmp(maybeCmd->token, "FIN_REPETIR") == 0) {
                        loopEnd = j;
                        break;
                    }
                }
                for (int r = 0; r < repeatCount; r++) {
                    execute_block(lines, loopStart, loopEnd, floor, error_line, file_descriptor_serie);
                }
                i = loopEnd;
                printf("\t\t🔚 Fin del bloque de repetición\n");
                break;
            }
            case CMD_REGULAR: {
                if (strcmp(cmd->token, "SUBIR") == 0) {
                    int value = atoi(arg);
                    for (int s = 0; s < value; s++) {
                        elevatorGoUp(file_descriptor_serie);
                        (*floor)++;
                        if (*floor > 7) {
                            sprintf(error_line, "%d.", i + 1);
                            return -1;
                        }
                    }
                } else if (strcmp(cmd->token, "BAJAR") == 0) {
                    int value = atoi(arg);
                    for (int s = 0; s < value; s++) {
                        elevatorGoDown(file_descriptor_serie);
                        (*floor)--;
                        if (*floor < 1) {
                            sprintf(error_line, "%d.", i + 1);
                            return -1;
                        }
                    }
                } else if (strcmp(cmd->token, "PAUSA") == 0) {
                    printf("\t\t\t⏸ Pausa de %s segundos\n", arg);
                } else if (strcmp(cmd->token, "ABRIR") == 0) {
                    openDoor();
                }
                break;
            }
        }
    }
    return *floor;
}

char *analyzeScript(const char *script) {
    printf("\t[I] Starting syntax analysis... 📝\n");
    char *lines[MAX_LINES];
    int lineCount = 0, repeatBlockOpen = 0, programOpened = 0;
    char scriptCopy[strlen(script) + 1];
    strcpy(scriptCopy, script);
    char *line = strtok(scriptCopy, "\n");
    while (line && lineCount < MAX_LINES) {
        while (*line == ' ') line++;
        lines[lineCount++] = strdup(line);
        line = strtok(NULL, "\n");
    }
    if (lineCount < 2) return strdup("Error: El programa debe iniciar con 'INICIO' y terminar con 'FIN'.");
    CommandDef *initCmd = getProgramInitializerCommand();
    CommandDef *endCmd = getProgramFinalizerCommand();
    if (strcmp(lines[0], initCmd->command) != 0) {
        char msg[100];
        snprintf(msg, sizeof(msg), "Error: El programa debe iniciar con '%s'.", initCmd->command);
        return strdup(msg);
    }
    if (strcmp(lines[lineCount - 1], endCmd->command) != 0) {
        char msg[100];
        snprintf(msg, sizeof(msg), "Error: El programa debe terminar con '%s'.", endCmd->command);
        return strdup(msg);
    }
    for (int i = 1; i < lineCount - 1; i++) {
        char lineCopy[MAX_LENGTH];
        strcpy(lineCopy, lines[i]);
        char *command = strtok(lineCopy, " ");
        char *arg = strtok(NULL, " ");
        CommandDef *cmd = getCommandByToken(command);
        char msg[100];
        if (cmd->role == CMD_PROGRAM_END) {
            if (programOpened)
                programOpened = 0;
            else {
                snprintf(msg, 100, "Error: En la línea %d, elomando '%s' no se puede usar 2 o más veces seguidas ", i + 1, command);
                return strdup(msg);
            }
            continue;
        }
        if (cmd->role == CMD_PROGRAM_START) {
            if (!programOpened)
                programOpened = 1;
            else {
                snprintf(msg, 100, "Error: En la línea %d, el comando '%s' no se puede usar 2 o más veces seguidas ", i + 1, command);
                return strdup(msg);
            }
            continue;
        }
        if (cmd->role == CMD_BLOCK_START) {
            if (repeatBlockOpen) {
                snprintf(msg, 100, "Error: En la línea %d, el comando '%s' no se puede usar 2 o más veces seguidas ", i + 1, command);
                return strdup(msg);
            }
            repeatBlockOpen = 1;
        }
        if (cmd->role == CMD_BLOCK_END) {
            if (!repeatBlockOpen) {
                snprintf(msg, 100, "Error: En la línea %d, el comando '%s' no se puede usar 2 o más veces seguidas ", i + 1, command);
                return strdup(msg);
            }
            repeatBlockOpen = 0;
        }
        if (!validateLine(cmd, arg, i + 1, msg)) return strdup(msg);
    }
    if (repeatBlockOpen)
        return strdup("Error: Bloque 'REPETIR' sin cerrar.");
    if (programOpened)
        return strdup("Error: Programa sin cerrar.");
    printf("\t[I] Syntax analysis completed. Valid syntax ✅\n");
    return strdup("Sintaxis válida.");
}
int validateLine(const CommandDef *cmd, char *arg, int lineNumber, char *msg) {
    if (!cmd) {
        snprintf(msg, 100, "Error: Comando '%s' no reconocido en línea %d.", cmd->command, lineNumber);
        return 0;
    }
    if (cmd->param_count == 0 && arg != NULL) {
        snprintf(msg, 100, "Error: El comando '%s' no debe tener argumentos. Línea %d.", cmd->command, lineNumber);
        return 0;
    }
    if (cmd->param_count == 1) {
        if (!arg) {
            snprintf(msg, 100, "Error: El comando '%s' requiere un parámetro. Línea %d.", cmd->command, lineNumber);
            return 0;
        }
        if (!matchRegex(cmd->parameters[0], arg)) {
            snprintf(msg, 100, "Error: El parámetro '%s' no es válido para '%s'. Línea %d.", arg, cmd->command, lineNumber);
            return 0;
        }
    }
    printf("\t\t[t]Línea %d válida: %s %s ✅\n", lineNumber, cmd->command, arg ? arg : "");
    return 1;
}
