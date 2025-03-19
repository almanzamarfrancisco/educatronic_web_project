#ifndef PROGRAM_LOGIC_H
#define PROGRAM_LOGIC_H

int execute_commands(int floor, char *code, char *error_line);
#define MAX_LINES 100
#define MAX_LENGTH 50

extern const char *commands[];
extern const int commandsCount;

int isValidCommand(const char *command);
int isValidNumber(const char *str);
char *analyzeScript(const char *script);
#endif  // PROGRAM_LOGIC_H
