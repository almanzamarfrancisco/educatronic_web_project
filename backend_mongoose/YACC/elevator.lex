%{
#include "elevator.tab.h"
%}

%%

UP      { return UP; }
DOWN    { return DOWN; }
OPEN    { return OPEN; }
CLOSE   { return CLOSE; }
START   { return START; }
END     { return END; }
FOR     { return FOR; }
IF      { return IF; }
THEN    { return THEN; }
ELSE    { return ELSE; }
"="     { return '='; }
[0-9]+  { yylval.num = atoi(yytext); return NUMBER; }
[a-zA-Z][a-zA-Z0-9]* { yylval.identifier = strdup(yytext); return IDENTIFIER; }
[ \t\n] ; // Ignore whitespace and newline

.       { yyerror("Invalid input"); }

%%

int yywrap() {
    return 1;
}
