#ifndef PROGRAM_LOGIC_H
#define PROGRAM_LOGIC_H

int execute_commands(int floor, char *code, char *error_line, int *file_descriptor_serie);
int execute_block(char **lines, int start, int end, int *floor, char *error_line, int *file_descriptor_serie);
#define MAX_LINES 100
#define MAX_LENGTH 50
#define MAX_PARAMS 3
#define LAST_FLOOR 7
#define FIRST_FLOOR 0
#define TIME_LIMIT 9
#define LOOP_LIMIT 9

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
CommandDef *getCommandByCommandName(const char *command);
CommandDef *getProgramInitializerCommand();
CommandDef *getProgramFinalizerCommand();
int validateLine(const CommandDef *cmd, char *arg, int lineNumber, char *msg);
void init_patterns();
void delay_ms(unsigned int ms);
#endif  // PROGRAM_LOGIC_H
