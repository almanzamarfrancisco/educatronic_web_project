flex elevator.lex
bison -d elevator.y
gcc lex.yy.c elevator.tab.c -o elevator_parser -lfl
