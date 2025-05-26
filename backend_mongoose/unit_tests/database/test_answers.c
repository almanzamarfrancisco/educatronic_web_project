#include <assert.h>
#include <sqlite3.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <uuid/uuid.h>

#include "../../database_management.h"

int main() {
    sqlite3 *db = connect_database();
    char *json = get_answers_json(db);
    if (!json) {
        fprintf(stderr, "get_answers_json returned NULL\n");
        sqlite3_close(db);
        return EXIT_FAILURE;
    }
    printf("🧪 Running test: get_answers_json()\n");

    if (json && strstr(json, "\"expected_output\":")) {
        printf("Raw JSON:\n%s\n\n", json);
        // printf("Pretty JSON:\n");
        // pretty_print_json(json);
        printf("✅ Success: JSON contains at least one answer\n");
    } else {
        printf("❌ Failure: JSON does not contain expected data\n");
        printf("🟥 Result: %s\n", json ? json : "(null)");
        return 1;
    }

    free(json);
    sqlite3_close(db);
    return EXIT_SUCCESS;
}
