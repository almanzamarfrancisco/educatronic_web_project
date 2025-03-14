# Program name
PROG ?= server

# Commands
DELETE = rm -rf                  # Command to remove files
OUT ?= -o $(PROG)                 # Compiler argument for output file

# Source files (modular structure)
SOURCES = main.c server.c gpio_management.c program_logic.c utils.c mongoose.c database_management.c

# Compiler flags
CFLAGS = -W -Wall -Wextra -g -lwiringPi -pthread -lsqlite3 -lcjson -luuid -I.

# Mongoose build options (for debugging)
CFLAGS_MONGOOSE += -DMG_ENABLE_LINES

# Windows compatibility
ifeq ($(OS),Windows_NT)  
  PROG ?= server.exe          
  CC = gcc                     
  CFLAGS += -lws2_32            
  DELETE = cmd /C del /Q /F /S  
  OUT ?= -o $(PROG)             
endif

# Default target: Build and run the program
all: $(PROG)
	$(RUN) ./$(PROG) $(ARGS)

# Build target: Compile each source file separately, then link
$(PROG): $(SOURCES:.c=.o)  
	$(CC) $^ $(CFLAGS) $(CFLAGS_MONGOOSE) $(CFLAGS_EXTRA) $(OUT)

# Compile each .c file into a .o file
%.o: %.c
	$(CC) -c $< $(CFLAGS) $(CFLAGS_MONGOOSE) -o $@

# Migration target (runs the database initialization script)
migrate: migrate.c migration.sql
	$(CC) migrate.c -o migrate -lsqlite3
	./migrate

# Seeder target (inserts seed data into the database)
seeder: seeder.c
	$(CC) seeder.c -o seeder -lsqlite3 -lcjson -luuid
	./seeder

# Clean build artifacts
clean:
	$(DELETE) $(PROG) migrate seeder *.o *.obj *.exe *.dSYM
