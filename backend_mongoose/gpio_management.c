#include "gpio_management.h"
#include <wiringPi.h>
#include <stdio.h>
#include <stdlib.h>

#define LED_PIN 2
#define MOTOR_PIN 0

void init_gpio() {
    if (wiringPiSetup() == -1)
    {
        perror("Failed to initialize WiringPi");
        exit(1);
    }
    pinMode(LED_PIN, OUTPUT);
    pinMode(MOTOR_PIN, OUTPUT);
}

void led_on() {
    printf("[I] Turning LED on...\n");
    digitalWrite(LED_PIN, HIGH);
}

void led_off() {
    printf("[I] Turning LED off...\n");
    digitalWrite(LED_PIN, LOW);
}

void motor_on() {
    printf("[I] Turning MOTOR on...\n");
    digitalWrite(MOTOR_PIN, HIGH);
}

void motor_off() {
    printf("[I] Turning MOTOR off...\n");
    digitalWrite(MOTOR_PIN, LOW);
}
