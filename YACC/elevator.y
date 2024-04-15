%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int current_floor = 1; // Initialize current floor to 1
%}

%union {
    int num; // For NUMBER token
    char* identifier; // For IDENTIFIER token
    // Add other types as needed
}

%token <num> NUMBER
%token <identifier> IDENTIFIER
%type <num> expression
%token UP DOWN OPEN CLOSE START END FOR IF THEN ELSE NEWLINE // Define tokens

%left '+' '-'
%left '*' '/'

%%

command_list: /* empty */
            | command_list command NEWLINE
            ;

command: UP NUMBER { printf("Moving UP to floor %d\n", $2); current_floor = $2; }
        | DOWN NUMBER { printf("Moving DOWN to floor %d\n", $2); current_floor = $2; }
        | OPEN { printf("Opening doors at floor %d\n", current_floor); }
        | CLOSE { printf("Closing doors at floor %d\n", current_floor); }
        | START { printf("Starting at floor %d\n", current_floor); }
        | END { printf("Ending program\n"); exit(0); }
        // | for_loop
        // | if_statement
        | declaration
        ;

declaration: IDENTIFIER '=' expression { printf("Variable %s declared with value %d\n", $1, $3); }

expression: NUMBER
          | IDENTIFIER
          | expression '+' expression { $$ = $1 + $3; }
          | expression '-' expression { $$ = $1 - $3; }
          | expression '*' expression { $$ = $1 * $3; }
          | expression '/' expression { $$ = $1 / $3; }
        //   | expression '~' expression { $$ = $1 == $3; }
          ;

/* for_loop: FOR '(' declaration ';' expression ';' assignment ')' command_list END { 
            int i;
            int times = $5;
            for (i = 0; i < times; i++) {
                printf("Executing loop iteration %d\n", i+1);
                // Execute the command_list inside the loop
            }
        }
        ;
*/
/* if_statement: IF '(' expression ')' THEN command_list ELSE command_list END { 
                if ($3) {
                    printf("Condition true: Executing IF block\n");
                    // Execute the command_list inside the IF block
                } else {
                    printf("Condition false: Executing ELSE block\n");
                    // Execute the command_list inside the ELSE block
                }
            }
            ;
*/

assignment: IDENTIFIER '=' expression
          ;

%%

int yyerror(const char *msg) {
    fprintf(stderr, "Error: %s\n", msg);
    return 1;
}

int main() {
    printf("Enter commands:\n");
    yyparse();
    return 0;
}
