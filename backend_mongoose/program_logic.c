#include "program_logic.h"

#include <cjson/cJSON.h>
#include <regex.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "UART_control.h"

char floor_boundaries[20];
char time_limit[20];
char loop_limit[20];

static CommandRole parse_role(const char *role) {
    if (strcmp(role, "CMD_REGULAR") == 0)
        return CMD_REGULAR;
    else if (strcmp(role, "CMD_BLOCK_START") == 0)
        return CMD_BLOCK_START;
    else if (strcmp(role, "CMD_BLOCK_END") == 0)
        return CMD_BLOCK_END;
    else if (strcmp(role, "CMD_PROGRAM_START") == 0)
        return CMD_PROGRAM_START;
    else if (strcmp(role, "CMD_PROGRAM_END") == 0)
        return CMD_PROGRAM_END;
    fprintf(stderr, "Unknown role '%s', defaulting to CMD_REGULAR\n", role);
    return CMD_REGULAR;
}

CommandDef *commandTable = NULL;
int commandsCount = 0;
CommandDef *load_command_table(const char *json_path, int *out_count) {
    FILE *f = fopen(json_path, "rb");
    if (!f) {
        perror("fopen");
        return NULL;
    }
    fseek(f, 0, SEEK_END);
    long len = ftell(f);
    fseek(f, 0, SEEK_SET);
    char *data = malloc(len + 1);
    fread(data, 1, len, f);
    data[len] = '\0';
    fclose(f);

    cJSON *root = cJSON_Parse(data);
    free(data);
    if (!root) {
        fprintf(stderr, "JSON parse error\n");
        return NULL;
    }

    cJSON *arr;
    if (cJSON_IsArray(root)) {
        arr = root;
    } else {
        arr = cJSON_GetObjectItem(root, "commands");
    }
    int n = cJSON_GetArraySize(arr);
    CommandDef *table = calloc(n, sizeof(CommandDef));

    init_patterns();

    for (int i = 0; i < n; i++) {
        cJSON *obj = cJSON_GetArrayItem(arr, i);

        const char *cmd = cJSON_GetObjectItem(obj, "command")->valuestring;
        const char *token = cJSON_GetObjectItem(obj, "token")->valuestring;
        const char *role_s = cJSON_GetObjectItem(obj, "role")->valuestring;

        table[i].command = strdup(cmd);
        table[i].token = strdup(token);
        table[i].role = parse_role(role_s);

        cJSON *params = cJSON_GetObjectItem(obj, "parameters");
        int pcount = cJSON_GetArraySize(params);
        table[i].param_count = pcount;

        for (int j = 0; j < pcount && j < MAX_PARAMS; j++) {
            const char *pname = cJSON_GetArrayItem(params, j)->valuestring;
            if (strcmp(pname, "floor_boundaries") == 0)
                table[i].parameters[j] = floor_boundaries;
            else if (strcmp(pname, "time_limit") == 0)
                table[i].parameters[j] = time_limit;
            else if (strcmp(pname, "loop_limit") == 0)
                table[i].parameters[j] = loop_limit;
            else
                table[i].parameters[j] = strdup(pname);
        }
        printf("\t\t[I] Command loaded: %s (%s) with role %d ✅\n", cmd, token, table[i].role);
    }

    *out_count = n;
    cJSON_Delete(root);
    return table;
}

CommandDef *getCommandByToken(const char *token) {
    for (int i = 0; i < commandsCount; i++) {
        if (strcmp(commandTable[i].token, token) == 0) {
            return &commandTable[i];
        }
    }
    return NULL;
}
CommandDef *getCommandByCommandName(const char *command) {
    for (int i = 0; i < commandsCount; i++) {
        if (strcmp(commandTable[i].command, command) == 0) {
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
    return execute_block(lines, 0, lineCount, &floor, error_line, file_descriptor_serie);
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
                send_start(file_descriptor_serie);
                break;
            case CMD_PROGRAM_END:
                send_finish(file_descriptor_serie);
                break;
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
                if (strcmp(cmd->token, (getCommandByCommandName("SUBIR"))->token) == 0) {
                    int value = atoi(arg);
                    (*floor) += value;
                    if (*floor > LAST_FLOOR) {
                        sprintf(error_line, "%d", i + 1);
                        send_finish(file_descriptor_serie);
                        return -1;
                    }
                    elevatorGoUp(value, file_descriptor_serie);
                } else if (strcmp(cmd->token, (getCommandByCommandName("BAJAR"))->token) == 0) {
                    int value = atoi(arg);
                    (*floor) -= value;
                    if (*floor < FIRST_FLOOR) {
                        sprintf(error_line, "%d", i + 1);
                        send_finish(file_descriptor_serie);
                        return -1;
                    }
                    elevatorGoDown(value, file_descriptor_serie);
                } else if (strcmp(cmd->token, (getCommandByCommandName("PAUSA"))->token) == 0) {
                    pause_execution(atoi(arg), file_descriptor_serie);
                } else if (strcmp(cmd->token, (getCommandByCommandName("ABRIR"))->token) == 0) {
                    openDoor(file_descriptor_serie);
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
    if (initCmd == NULL && strcmp(lines[0], initCmd->command) != 0) {
        char msg[100];
        snprintf(msg, sizeof(msg), "Error: El programa debe iniciar con '%s'.", initCmd->command);
        return strdup(msg);
    }
    if (endCmd == NULL && strcmp(lines[lineCount - 1], endCmd->command) != 0) {
        char msg[100];
        snprintf(msg, sizeof(msg), "Error: El programa debe terminar con '%s'.", endCmd->command);
        return strdup(msg);
    }
    for (int i = 1; i < lineCount - 1; i++) {
        char lineCopy[MAX_LENGTH];
        strcpy(lineCopy, lines[i]);
        char *command = strtok(lineCopy, " ");
        char *arg = strtok(NULL, " ");
        printf("\t\t[t] Analyzing line %d: %s\n", i + 1, lines[i]);
        CommandDef *cmd = getCommandByToken(command);
        char msg[100];
        if (!cmd) {
            snprintf(msg, 100, "Error: Comando '%s' no reconocido en línea %d.", command, i + 1);
            return strdup(msg);
        }
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
    printf("\t\t[t] Línea %d válida: %s %s ✅\n", lineNumber, cmd->command, arg ? arg : "");
    return 1;
}
void init_patterns() {
    printf("\t[I] Initializing patterns... 🧩\n");
    snprintf(floor_boundaries, sizeof(floor_boundaries), "^[%d-%d]$", FIRST_FLOOR, LAST_FLOOR);
    snprintf(time_limit, sizeof(time_limit), "^[%d-%d]$", 0, TIME_LIMIT);
    snprintf(loop_limit, sizeof(loop_limit), "^[%d-%d]$", 0, LOOP_LIMIT);
    printf("⠾[I] Patterns initialized: floor_boundaries: %s, time_limit: %s, loop_limit: %s\n", floor_boundaries, time_limit, loop_limit);
}
int init_commands() {
    commandTable = load_command_table("./web_root/assets/commandTable.json", &commandsCount);
    if (!commandTable) return 1;
    printf("[I] Command table loaded with %d commands 🎖️\n", commandsCount);
    return 0;
}
