#ifndef PROGRAM_LOGIC_H
#define PROGRAM_LOGIC_H

int execute_commands(int floor, char *code, char *error_line);
int execute_block(char **lines, int start, int end, int *floor, char *error_line);
#define MAX_LINES 100
#define MAX_LENGTH 50
#define MAX_PARAMS 3

extern const int commandsCount;

int matchRegex(const char *pattern, const char *input);
char *analyzeScript(const char *script);
typedef enum {
    CMD_REGULAR,
    CMD_BLOCK_START,
    CMD_BLOCK_END,
    CMD_PROGRAM_START,
    CMD_PROGRAM_END
} CommandRole;
typedef struct {
    char *command;
    char *token;
    char *parameters[MAX_PARAMS];  // regex rules for parameters
    int param_count;
    CommandRole role;
} CommandDef;
CommandDef *getCommandByToken(const char *token);
CommandDef *getProgramInitializerComand();
CommandDef *getProgramFinalizerComand();
int validateLine(const CommandDef *cmd, char *arg, int lineNumber, char *msg);

#endif  // PROGRAM_LOGIC_H
