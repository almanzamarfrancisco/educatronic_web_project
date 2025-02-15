#include "utils.h"
#include <ctype.h>
#include <string.h>

void trim_non_alphanumeric(char *str) {
    int i, j;
    for (i = 0, j = 0; str[i] != '\0'; i++)
    {
        if (isalnum((unsigned char)str[i]) || strchr("_[]()\"',:{} ", str[i]))
        {
            str[j++] = str[i];
        }
    }
    str[j] = '\0';
}
