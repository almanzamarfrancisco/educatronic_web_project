import RPi.GPIO as GPIO
import time
import sys  # Import sys to access command-line arguments

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
    # print("GPIO cleanup completed.")

def main():
    if len(sys.argv) != 2:
        # print("Usage: python servo.py <angle>")
        sys.exit(1)
    
    servo_pin = 35
    angle = float(sys.argv[1])
    
    if not 0 <= angle <= 180:
        # print("Angle must be between 0 and 180.")
        sys.exit(1)
    
    try:
        servo = setup_servo(servo_pin)
        servo.start(0)  # Start PWM with 0% duty cycle (pulse off)
        move_servo(servo, angle)
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        servo.stop()
        cleanup()

if __name__ == "__main__":
    main()