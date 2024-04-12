%{
#include "elevator.tab.h"
%}

%%


up      { return UP; }
down    { return DOWN; }
stop    { return STOP; }
open    { return OPEN; }
close   { return CLOSE; }
start   { return START; }
for     { return FOR; }
if      { return IF; }
end     { return END; }
times   { return TIMES; }
equals  { return EQUALS; }
then    { return THEN; }
else    { return ELSE; }
[1-7]   { yylval.num = atoi(yytext); return NUMBER; }
\n      { return NEWLINE; }
[ \t]   ; // Ignore whitespace

%%

int yywrap() {
    return 1;
}
