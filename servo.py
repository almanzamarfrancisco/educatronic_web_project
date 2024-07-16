import RPi.GPIO as GPIO
import time

def setup_servo(pin):
    """Initializes a servo on the specified GPIO pin."""
    GPIO.setmode(GPIO.BOARD)
    GPIO.setup(pin, GPIO.OUT)
    return GPIO.PWM(pin, 50)  # 50Hz pulse for servo

def move_servo(servo, angle):
    """Moves the servo to the specified angle."""
    duty_cycle = 2 + (angle / 18)
    servo.ChangeDutyCycle(duty_cycle)
    time.sleep(0.5)
    servo.ChangeDutyCycle(0)

def cleanup():
    """Cleans up GPIO resources."""
    GPIO.cleanup()
    print("GPIO cleanup completed.")

def main():
    servo_pin = 35
    try:
        servo = setup_servo(servo_pin)
        servo.start(0)  # Start PWM with 0% duty cycle (pulse off)
        print("Servo control program. Press Ctrl+C to exit.")
        while True:
            angle = float(input("Enter angle between 0 & 180: "))
            if 0 <= angle <= 180:
                move_servo(servo, angle)
            else:
                print("Angle must be between 0 and 180.")
    except KeyboardInterrupt:
        print("\nProgram exited by user.")
    except ValueError:
        print("Invalid input. Please enter a valid number for the angle.")
    finally:
        servo.stop()
        cleanup()
        print("Goodbye!")

if __name__ == "__main__":
    main()