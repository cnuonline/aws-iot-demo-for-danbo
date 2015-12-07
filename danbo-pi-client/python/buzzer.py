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

import RPi.GPIO as GPIO   #import the GPIO library
import time               #import the time library
import argparse

GPIO.setwarnings(False)

parser = argparse.ArgumentParser() 
parser.add_argument('--pitches', nargs='*')
parser.add_argument('--durations', nargs='*')
args = parser.parse_args()
pitches = args.pitches[0].split(',')
durations = args.durations[0].split(',')

def buzz(pitch, duration): #create the function "buzz" and feed it the pitch and duration)
	duration=duration*0.7
	if(pitch==0):
		time.sleep(duration)
		return
	period = 1.0 / pitch     #in physics, the period (sec/cyc) is the inverse of the frequency (cyc/sec)
	delay = period / 2     #calcuate the time for half of the wave  
	cycles = int(duration * pitch)   #the number of waves to produce is the duration times the frequency

	for i in range(cycles):    #start a loop from 0 to the variable "cycles" calculated above
		GPIO.output(buzzer_pin, True)   #set pin 18 to high
		time.sleep(delay)    #wait with pin 18 high
		GPIO.output(buzzer_pin, False)    #set pin 18 to low
		time.sleep(delay)    #wait with pin 18 low

GPIO.setmode(GPIO.BCM)  
buzzer_pin = 13
GPIO.setup(buzzer_pin, GPIO.IN)
GPIO.setup(buzzer_pin, GPIO.OUT)

GPIO.setmode(GPIO.BCM)
GPIO.setup(buzzer_pin, GPIO.OUT)
x=0

for p in pitches:
	buzz(float(p), float(durations[x]))  #feed the pitch and duration to the func$
	time.sleep(float(durations[x])*0.1)
	x+=1

GPIO.setup(buzzer_pin, GPIO.IN)
