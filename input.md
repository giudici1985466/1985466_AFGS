# User stories

## 1 

As a user  
I want to see the status of all processing units  
In order to monitor the operational condition of the system  

## 2

As a user  
I want to see when processing units were last checked  
In order to assess the freshness of status information  

## 3
As a user  
I want the processing units status to be refreshed  
In order to have a real-time view of them   

## 4

As a user  
I want to monitor seismic activity in real time    		
In order to immediately notice new events  

## 5

As a user  
I want to see system configuration info  
In order to have an overview about the monitoring process  

## 6

As a user  
I want see only relevant detected events  
In order to avoid noise in the dashboard  

## 7

As a user  
I want to have a detailed view of a detected event  
In order to inspect all the information related to the event   

## 8

As a user  
I want to have an event classified as an earthquake when the dominant frequency is between 0.5 and 3.0 Hz  
In order to easily identify the earthquake event  

## 9

As a user  
I want to to have an event classified as a conventional explosion when the dominant frequency is between 3.0 and 8.0 Hz  
In order to easily identify the conventional explosion event  

## 10

As a user  
I want to have an event classified a nuclear-like when the dominant frequency is at least 8.0 Hz  
In order to easily identify the nuclear-like event  

## 11

As a user  
I want events to be color coded on the dashboard  
in order to immediately distinguish the most important detections  

## 12

As a user    
I want to know which sensor or monitored area detected an event    
In order to localize the source of the alert   

## 13

As a user
I want to see the list of available sensors	
In order to have an overview of the monitored sources

## 14

As a user
I want to know the number of detected events for each sensor
In order to quantitatively estimate seismic activity

## 15

As a user  
I want to know the location of each sensor  
In order to identify the monitored area associated with each sensor  

## 16

As a user  
I want to see the mean time between earthquake events for each sensor  
In order to estimate how often they happen  

## 17

As a user  
I want to see the mean time between conventional explosion events for each sensor  
In order to estimate how often they happen  

##  18

As a user  
I want to see the mean time between nuclear explosion events for each sensor  
In order to estimate how often they happen  

## 19

As a user  
I want to see historical data about detected events  
In order to perform analysis on them  

## 20

As a user  				
I want to filter the detected events  	
In order to have a time-based view  	

## 21

As a user  				
I want to filter the detected events  	
In order to have a type-based view  	

## 22

As a user  
I want to filter the detected events  
In order to have a sensor-based view  

## 23

As a user  
I want to filter the detected events  
In order to have a location-based view  

## 24

As a user  
I want the platform to remain operational even if some processing nodes fail  
so that critical monitoring is not interrupted  

## 25

As a user  
I want the system to automatically ingest data from the sensors  
In order to have an uninterrupted data stream  

# Event schemas

## Broker event schema

{

  "sensor_id": "string",
  
  "timestamp": "ISO-8601 string",
  
  "value": "number"

}



## PU seismic event schema

{

  "sensor_id": "string",
  
  "sensor_name": "string|null",
  
  "category": "string|null",
  
  "region": "string|null",
  
  "coordinates": "object|array|string|null",
  
  "timestamp": "ISO-8601 string",
  
  "dominant_frequency_hz": "number",
  
  "peak_amplitude": "number",
  
  "peak_spectrum": "number",
  
  "event_type": "string",
  
  "window_size": "integer"

}




## PU status event

{

  "service_id": "string",
  
  "status": "string",
  
  "timestamp": "ISO-8601 string"

}

