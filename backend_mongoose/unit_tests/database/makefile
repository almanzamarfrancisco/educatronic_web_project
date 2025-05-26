CC = gcc
CFLAGS = -Wall -Wextra -I/usr/local/include -I../..
LDFLAGS = -L/usr/local/lib
LIBS = -lmongoose -lsqlite3 -luuid

# Source for database management
DB_MGMT = ../../database_management.c
# Path to real SQLite DB file
DB_PATH = ../../educatronic.db

# Output directory for executables and DB link
BIN_DIR = bin

# Unit test sources and target executables
TEST_SRCS = test_answers.c test_exercises.c test_programs.c
EXES = $(TEST_SRCS:.c=)
TEST_PROGS = $(addprefix $(BIN_DIR)/,$(EXES))
# Symlink inside BIN_DIR
DB_LINK = educatronic.db

.PHONY: all test clean

# Default target builds tests and DB symlink
all: $(TEST_PROGS) $(DB_LINK)

# Ensure bin directory exists
dirs: ; @mkdir -p $(BIN_DIR)

# Compile each test into bin/, link DB mgmt
$(BIN_DIR)/%: %.c $(DB_MGMT) | dirs
	$(CC) $(CFLAGS) -o $@ $< $(DB_MGMT) $(LDFLAGS) $(LIBS)

# Create a symlink to the real DB in bin/
$(DB_LINK): | dirs
	ln -sf $(DB_PATH) $(DB_LINK)

# Run all tests sequentially
test: all
	@echo "Running unit tests..."
	@for test in $(TEST_PROGS); do \
		echo "==> Running $$test"; \
		$$test || exit 1; \
	done

# Remove bin directory entirely
clean:
	rm -rf $(BIN_DIR)
	rm -rf educatronic.db