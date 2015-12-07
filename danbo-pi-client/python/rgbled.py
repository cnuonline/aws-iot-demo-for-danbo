# Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use 
# this file except in compliance with the License. A copy of the License is located at
#
#     http://aws.amazon.com/apache2.0/
#
# or in the "license" file accompanying this file. This file is distributed on an "AS IS"
# BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
# License for the specific language governing permissions and limitations under the License.

import RPi.GPIO as GPIO  
import time
import sys

GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)

#repetions
repetitions = int(sys.argv[13])

#delay
delay = float(sys.argv[14])/1000

#red pin 1
GPIO.setup(int(sys.argv[1]), GPIO.OUT)

#green pin 1
GPIO.setup(int(sys.argv[2]), GPIO.OUT)

#blue pin 1
GPIO.setup(int(sys.argv[3]), GPIO.OUT)

#red pin 2
GPIO.setup(int(sys.argv[4]), GPIO.OUT)

#green pin 2
GPIO.setup(int(sys.argv[5]), GPIO.OUT)

#blue pin 2
GPIO.setup(int(sys.argv[6]), GPIO.OUT)

RED1 = GPIO.PWM(int(sys.argv[1]), 100)
GREEN1 = GPIO.PWM(int(sys.argv[2]), 100)
BLUE1 = GPIO.PWM(int(sys.argv[3]), 100)

RED2 = GPIO.PWM(int(sys.argv[4]), 100)
GREEN2 = GPIO.PWM(int(sys.argv[5]), 100)
BLUE2 = GPIO.PWM(int(sys.argv[6]), 100)

RED1.start(0)
RED2.start(0)
GREEN1.start(0)
GREEN2.start(0)
BLUE1.start(0)
BLUE2.start(0)

for x in xrange(0, repetitions):
	RED1.ChangeDutyCycle(100-(int(sys.argv[7]) / 255.0) * 100)
	GREEN1.ChangeDutyCycle(100-(int(sys.argv[8]) / 255.0) * 100)
	BLUE1.ChangeDutyCycle(100-(int(sys.argv[9]) / 255.0) * 100)
	RED2.ChangeDutyCycle(100-(int(sys.argv[10]) / 255.0) * 100)
	GREEN2.ChangeDutyCycle(100-(int(sys.argv[11]) / 255.0) * 100)
	BLUE2.ChangeDutyCycle(100-(int(sys.argv[12]) / 255.0) * 100)

	time.sleep(delay)

	RED1.ChangeDutyCycle(100.0)  
	GREEN1.ChangeDutyCycle(100.0)  
	BLUE1.ChangeDutyCycle(100.0)  
	RED2.ChangeDutyCycle(100.0)  
	GREEN2.ChangeDutyCycle(100.0)  
	BLUE2.ChangeDutyCycle(100.0)  

	time.sleep(delay)

RED1.stop()
GREEN1.stop()
BLUE1.stop()
RED2.stop()
GREEN2.stop()
BLUE2.stop()

GPIO.cleanup()