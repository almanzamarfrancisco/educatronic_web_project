%{
#include <stdio.h>
#include <stdlib.h>
int current_floor = 1; // Initialize current floor to 1

int yyerror(const char *msg);

%}

%union {
    int num; // For NUMBER token
    // Add other types as needed
}

%token UP DOWN STOP OPEN CLOSE START FOR IF END
%token <num> NUMBER
%token TIMES EQUALS THEN ELSE
%token NEWLINE

%%

command_list: /* empty */
            | command_list command NEWLINE
            ;

command: UP NUMBER { printf("Moving UP to floor %d\n", $2); current_floor = $2; }
        | DOWN NUMBER { printf("Moving DOWN to floor %d\n", $2); current_floor = $2; }
        | STOP { printf("Stopping at current floor %d\n", current_floor); }
        | OPEN { printf("Opening doors at floor %d\n", current_floor); }
        | CLOSE { printf("Closing doors at floor %d\n", current_floor); }
        | START { printf("Starting at floor %d\n", current_floor); }
        | for_loop
        | if_statement
        ;

for_loop: FOR NUMBER TIMES command_list END { 
            int i;
            int times = $2;
            for (i = 0; i < times; i++) {
                printf("Executing loop iteration %d\n", i+1);
                // Execute the command_list inside the loop
            }
        }
        ;

if_statement: IF NUMBER EQUALS NUMBER THEN command_list ELSE command_list END { 
                if ($2 == $4) {
                    printf("Condition true: Executing IF block\n");
                    // Execute the command_list inside the IF block
                } else {
                    printf("Condition false: Executing ELSE block\n");
                    // Execute the command_list inside the ELSE block
                }
            }
            ;

%%

int yyerror(const char *msg) {
    fprintf(stderr, "Error: %s\n", msg);
    return 0; // Return 0 to indicate parsing failure
}


int main() {
    yyparse();
    return 0;
}
