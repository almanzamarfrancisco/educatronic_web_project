#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "../../database_management.h"

int main() {
    sqlite3 *db = connect_database();
    char *json = get_programs_json(db);
    if (!json) {
        fprintf(stderr, "get_programs_json returned NULL\n");
        sqlite3_close(db);
        return EXIT_FAILURE;
    }
    printf("🧪 Running test: get_programs_json()\n");

    if (json && strstr(json, "\"name\":")) {
        printf("Raw JSON:\n%s\n\n", json);
        // printf("Pretty JSON:\n");
        // pretty_print_json(json);
        printf("✅ Success: JSON contains at least one program\n");
    } else {
        printf("❌ Failure: JSON does not contain expected data\n");
        printf("🟥 Result: %s\n", json ? json : "(null)");
        return 1;
    }

    free(json);
    sqlite3_close(db);
    return EXIT_SUCCESS;
}
