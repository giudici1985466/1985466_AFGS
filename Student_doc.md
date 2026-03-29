# SYSTEM DESCRIPTION:

Seismic Monitoring and Analysis Platform is a distributed and fault-tolerant system for real-time seismic event detection and historical analysis. The platform collects seismic measurements from the provided simulator, redistributes them through a custom broker, and processes them using multiple replicated processing units. Each processing replica maintains a sliding window of samples for each sensor, applies frequency-domain analysis through FFT, extracts the dominant frequency component, and classifies the event according to the project rule model.

Detected seismic events are then sent to the gateway, which acts as the single entry point between the frontend and the backend services. The gateway is responsible for collecting detected events from the processing units, storing and retrieving processed seismic events from the shared PostgreSQL database, and monitoring the health of the replicated processing units. A web dashboard allows users to inspect live detections, processing unit status, sensor metadata, system configuration, and historical event data.

The system is organized into multiple backend services deployed with Docker Compose. The provided simulator is treated as an external service, while the platform components communicate over the internal Docker network.


# USER STORIES:

1. As a user, I want to see the status of all processing units, In order to monitor the operational condition of the system  

2. As a user, I want to see when processing units were last checked, In order to assess the freshness of status information  

3. As a user, I want the processing units status to be refreshed, In order to have a real-time view of them  

4. As a user, I want to monitor seismic activity in real time, In order to immediately notice new events  

5. As a user, I want to see system configuration info, In order to have an overview about the monitoring process  

6. As a user, I want see only relevant detected events, In order to avoid noise in the dashboard  

7. As a user, I want to have a detailed view of a detected event, In order to inspect all the information related to the event   

8. As a user, I want to have an event classified as an earthquake when the dominant frequency is between 0.5 and 3.0 Hz, In order to easily identify the earthquake event  

9. As a user, I want to to have an event classified as a conventional explosion when the dominant frequency is between 3.0 and 8.0 Hz, In order to easily identify the conventional explosion event  

10. As a user, I want to have an event classified a nuclear-like when the dominant frequency is at least 8.0 Hz, In order to easily identify the nuclear-like event  

11. As a user, I want events to be color coded on the dashboard, In order to immediately distinguish the most important detections  

12. As a user, I want to know which sensor or monitored area detected an event, In order to localize the source of the alert   

13. As a user, I want to see the list of available sensors, In order to have an overview of the monitored sources  

14. As a user, I want to know the number of detected events for each sensor, In order to quantitatively estimate seismic activity  

15. As a user, I want to know the location of each sensor, In order to identify the monitored area associated with each sensor  

16. As a user, I want to see the mean time between earthquake events for each sensor, In order to estimate how often they happen  

17. As a user, I want to see the mean time between conventional explosion events for each sensor, In order to estimate how often they happen  

18. As a user, I want to see the mean time between nuclear explosion events for each sensor, In order to estimate how often they happen  

19. As a user, I want to see historical data about detected events, In order to perform analysis on them  

20. As a user, I want to filter the detected events, In order to have a time-based view   	

21. As a user, I want to filter the detected events, In order to have a type-based view  	

22. As a user, I want to filter the detected events, In order to have a sensor-based view  

23. As a user, I want to filter the detected events, In order to have a location-based view  

24. As a user, I want the platform to remain operational even if some processing nodes fail, so that critical monitoring is not interrupted  

25. As a user, I want the system to automatically ingest data from the sensors, In order to have an uninterrupted data stream  

# CONTAINERS:

---

# CONTAINER_NAME: Seismic-Simulator

### DESCRIPTION:

The Seismic-Simulator provides the external seismic environment of the platform. It exposes the list of available sensors, the WebSocket measurement streams used to generate sensor data, and the SSE control stream used to simulate failures of processing units.


### USER STORIES:
- 4 - As a user, I want to monitor seismic activity in real time, so that I can immediately notice new events.
- 13 - As a user, I want to see the list of available sensors, so that I can have an overview of the monitored sources.
- 15 - As a user, I want to know the location of each sensor, so that I can identify the monitored area associated with each sensor.
- 24 - As a user, I want the platform to remain operational even if some processing nodes fail, so that critical monitoring is not interrupted.
- 25 - As a user, I want the system to automatically ingest data from the sensors, so that I can have an uninterrupted data stream.

### PORTS:
8080:8080

### PERSISTENCE EVALUATION
The simulator does not persist platform data. It only generates runtime measurements and failure-control events.

### EXTERNAL SERVICES CONNECTIONS
The simulator is consumed by:
- Broker-Service for sensor data acquisition
- Processing-Service replicas for failure event simulation

### MICROSERVICES:

#### MICROSERVICE: seismic-simulator
- TYPE: external service
- DESCRIPTION: Provides seismic sensors, signal streams, and replica shutdown simulation.
- PORTS: 8080

- TECHNOLOGICAL SPECIFICATION:
The simulator is provided as a prebuilt Docker image (`seismic-signal-simulator:multiarch_v1`).
It exposes REST APIs for sensor discovery, WebSocket endpoints for real-time measurements, and an SSE stream for shutdown simulation.

- SERVICE ARCHITECTURE:
The Broker-Service retrieves the list of available sensors and subscribes to their WebSocket streams in order to receive sensor data. Each Processing-Service replica independently subscribes to the simulator control stream in order to receive possible shutdown commands.
---

# CONTAINER_NAME: Broker-Service

### DESCRIPTION:
The Broker-Service is the custom fan-out component required by the project. It acquires sensor measurements from the simulator and redistributes them to the replicated processing units. The broker does not perform any signal analysis or persistence operation.

### USER STORIES:
- 4 - As a user, I want to monitor seismic activity in real time, so that I can immediately notice new events.
- 13 - As a user, I want to see the list of available sensors, so that I can have an overview of the monitored sources.
- 24 - As a user, I want the platform to remain operational even if some processing nodes fail, so that critical monitoring is not interrupted.
- 25 - As a user, I want the system to automatically ingest data from the sensors, so that I can have an uninterrupted data stream.

### PORTS:
No external ports exposed.

### PERSISTENCE EVALUATION
The broker does not persist data. It forwards measurements in real time.

### EXTERNAL SERVICES CONNECTIONS
The service connects to:
- Seismic-Simulator for device discovery and sensor streams
- Processing-Service replicas for measurement redistribution

### MICROSERVICES:

#### MICROSERVICE: broker-service
- TYPE: backend
- DESCRIPTION: Custom broker that captures sensor measurements and forwards them to the processing units.
- PORTS: none

- TECHNOLOGICAL SPECIFICATION:
The microservice is implemented in Python using:
    - FastAPI for internal APIs
    - websockets for sensor stream consumption
    - requests / httpx for internal service communication

- SERVICE ARCHITECTURE:
The broker retrieves the list of sensors from the simulator, opens one WebSocket connection per sensor, and forwards each incoming sensor measurement to all configured processing units through internal communication.
---

# CONTAINER_NAME: Processing-Service

### DESCRIPTION:
The Processing-Service is the analytical core of the platform. It runs as multiple replicas. Each processing unit receives sensor measurements from the broker, maintains a sliding window of recent samples for each sensor, applies FFT analysis, extracts the dominant frequency component, and classifies the detected seismic event. Each replica also listens to the simulator control stream and terminates when a shutdown command is received.


### USER STORIES:
- 4 - As a user, I want to monitor seismic activity in real time, so that I can immediately notice new events.
- 6 - As a user, I want to see only relevant detected events, so that I can avoid noise in the dashboard.
- 8 - As a user, I want an event to be classified as an earthquake when the dominant frequency is between 0.5 and 3.0 Hz, so that I can easily identify the earthquake event.
- 9 - As a user, I want an event to be classified as a conventional explosion when the dominant frequency is between 3.0 and 8.0 Hz, so that I can easily identify the conventional explosion event.
- 10 - As a user, I want an event to be classified as nuclear-like when the dominant frequency is at least 8.0 Hz, so that I can easily identify the nuclear-like event.
- 12 - As a user, I want to know which sensor or monitored area detected an event, so that I can localize the source of the alert.
- 24 - As a user, I want the platform to remain operational even if some processing nodes fail, so that critical monitoring is not interrupted.

### PORTS:
Internal only

### PERSISTENCE EVALUATION
The processing units do not persist data directly. Sliding windows and intermediate analysis data are kept in memory, while detected events are forwarded to the gateway.

### EXTERNAL SERVICES CONNECTIONS
The service connects to:
- Broker-Service for incoming measurements
- Seismic-Simulator control SSE stream
- Gateway-API for forwarding detected seismic events

### MICROSERVICES:

#### MICROSERVICE: processing-service
- TYPE: backend
- DESCRIPTION: Replicated service that performs FFT analysis and event classification.
- PORTS: internal only

- TECHNOLOGICAL SPECIFICATION:
The microservice is implemented in Python using:
    - FastAPI for internal endpoints and health checks
    - NumPy / SciPy for FFT-based processing
    - SSE client utilities for consuming the control stream
    - requests / httpx for sending detected events to the gateway

- SERVICE ARCHITECTURE:
Each processing unit receives measurements from the broker and maintains an in-memory sliding window for each sensor. Once the window is full, the dominant frequency is computed and the event is classified. Relevant detections are sent to the gateway, which is responsible for persistence and external exposure. Each replica exposes a health endpoint and listens to the simulator control stream in order to terminate on command.

- ENDPOINTS:

    | HTTP METHOD | URL | Description | User Stories |
    |-------------|-----|-------------|-------------|
    | GET | /health | Replica health check | 1, 2, 3, 24 |
    | POST | /ingest | Internal endpoint used by the broker to forward measurements | 4, 25 |
    | GET | /replica-info | Returns replica runtime information | 1, 2, 3 |

---

# CONTAINER_NAME: PostgreSQL

### DESCRIPTION:
PostgreSQL is the shared persistence layer of the platform. It stores processed seismic events and supports duplicate-safe persistence through unique event identifiers.

### USER STORIES:
- 6 - As a user, I want to see only relevant detected events, so that I can avoid noise in the dashboard.
- 14 - As a user, I want to know the number of detected events for each sensor, so that I can quantitatively estimate seismic activity.
- 16 - As a user, I want to see the mean time between earthquake events for each sensor, so that I can estimate how often they happen.
- 17 - As a user, I want to see the mean time between conventional explosion events for each sensor, so that I can estimate how often they happen.
- 18 - As a user, I want to see the mean time between nuclear explosion events for each sensor, so that I can estimate how often they happen.
- 19 - As a user, I want to see historical data about detected events, so that I can perform analysis on them.
- 20 - As a user, I want to filter the detected events, so that I can have a time-based view.
- 21 - As a user, I want to filter the detected events, so that I can have a type-based view.
- 22 - As a user, I want to filter the detected events, so that I can have a sensor-based view.
- 23 - As a user, I want to filter the detected events, so that I can have a location-based view.

### PORTS:
5432:5432

### PERSISTENCE EVALUATION
This is the main persistent storage component of the platform.

### EXTERNAL SERVICES CONNECTIONS
The service is used by:
- Gateway-API for event storage and retrieval

### MICROSERVICES:

#### MICROSERVICE: postgres
- TYPE: database
- DESCRIPTION: Shared relational database for processed seismic events.
- PORTS: 5432

- TECHNOLOGICAL SPECIFICATION:
The service uses the official PostgreSQL Docker image.

- SERVICE ARCHITECTURE:
The gateway stores processed seismic events in the database and retrieves them for historical views, filtering, counts, and MTBE statistics.

- DB STRUCTURE:

    **detected_events**

        | id  | sensor_id  | sensor_name  | category  | region  | latitude  | longitude  | event_type  | event_timestamp  | time_bucket  | dominant_frequency_hz  | peak_amplitude  |peak_spectrum  | window_size | reported_by  | created_at |

---

# CONTAINER_NAME: Gateway-API

### DESCRIPTION:
The Gateway-API is the single entry point between the frontend and the backend services. It receives detected seismic events from the processing units, stores and retrieves processed seismic events from PostgreSQL, monitors the health of the processing replicas, and exposes the REST and SSE endpoints used by the dashboard.

### USER STORIES:
- 1 - As a user, I want to see the status of all processing units, so that I can monitor the operational condition of the system.
- 2 - As a user, I want to see when processing units were last checked, so that I can assess the freshness of status information.
- 3 - As a user, I want the processing units status to be refreshed, so that I can have a real-time view of them.
- 4 - As a user, I want to monitor seismic activity in real time, so that I can immediately notice new events.
- 5 - As a user, I want to see system configuration info, so that I can have an overview of the monitoring process.
- 7 - As a user, I want to have a detailed view of a detected event, so that I can inspect all the information related to the event.
- 12 - As a user, I want to know which sensor or monitored area detected an event, so that I can localize the source of the alert.
- 13 - As a user, I want to see the list of available sensors, so that I can have an overview of the monitored sources.
- 14 - As a user, I want to know the number of detected events for each sensor, so that I can quantitatively estimate seismic activity.
- 15 - As a user, I want to know the location of each sensor, so that I can identify the monitored area associated with each sensor.
- 16 - As a user, I want to see the mean time between earthquake events for each sensor, so that I can estimate how often they happen.
- 17 - As a user, I want to see the mean time between conventional explosion events for each sensor, so that I can estimate how often they happen.
- 18 - As a user, I want to see the mean time between nuclear explosion events for each sensor, so that I can estimate how often they happen.
- 19 - As a user, I want to see historical data about detected events, so that I can perform analysis on them.
- 20 - As a user, I want to filter the detected events, so that I can have a time-based view.
- 21 - As a user, I want to filter the detected events, so that I can have a type-based view.
- 22 - As a user, I want to filter the detected events, so that I can have a sensor-based view.
- 23 - As a user, I want to filter the detected events, so that I can have a location-based view.
- 24 - As a user, I want the platform to remain operational even if some processing nodes fail, so that critical monitoring is not interrupted.

### PORTS:
8000:8000

### PERSISTENCE EVALUATION
The gateway does not maintain its own long-term runtime state, but it is responsible for writing and reading persistent event data in PostgreSQL.

### EXTERNAL SERVICES CONNECTIONS
The service connects to:
- Processing-Service replicas for health checks and detected-event intake
- PostgreSQL for persistent storage and event retrieval

### MICROSERVICES:

#### MICROSERVICE: gateway-api
- TYPE: backend
- DESCRIPTION: Main REST/SSE entry point consumed by the frontend.
- PORTS: 8000

- TECHNOLOGICAL SPECIFICATION:
The microservice is implemented in Python using:
    - FastAPI for REST/SSE APIs
    - Uvicorn as the application server
    - psycopg2 or SQLAlchemy for PostgreSQL access
    - requests / httpx for communication with processing replicas

- SERVICE ARCHITECTURE:
The gateway receives detected seismic events from the processing units, stores them in PostgreSQL, queries the database for historical and statistical views, periodically checks the health of the processing units, and exposes the data needed by the frontend.

- ENDPOINTS:

    | HTTP METHOD | URL | Description | User Stories |
    |-------------|-----|-------------|-------------|
    | GET | /health | Service health check | 24 |
    | POST | /api/events | Receives detected seismic events from processing units | 4, 24 |
    | GET | /api/events/latest | Returns the latest detected events | 4, 7 |
    | GET | /api/events/history | Returns historical events with filters | 19, 20, 21, 22, 23 |
    | GET | /api/events/mtbe | Returns MTBE values grouped by event type and/or sensor | 16, 17, 18 |
    | GET | /api/stream/events | SSE endpoint for live event updates | 4 |
    | GET | /api/processing-units | Returns processing units status and last health-check timestamps | 1, 2, 3 |
    | GET | /api/sensors | Returns sensor metadata and event counters | 12, 13, 14, 15 |
    | GET | /api/system/config | Returns system configuration information | 5 |

# CONTAINER_NAME: Frontend

### DESCRIPTION:
The Frontend provides the graphical interface used by the user to inspect both the real-time and historical behavior of the seismic monitoring platform. It is implemented as a static web application composed of a dashboard page and an archive page.

### USER STORIES:
- 1 - As a user, I want to see the status of all processing units, so that I can monitor the operational condition of the system.
- 2 - As a user, I want to see when processing units were last checked, so that I can assess the freshness of status information.
- 3 - As a user, I want the processing units status to be refreshed, so that I can have a real-time view of them.
- 4 - As a user, I want to monitor seismic activity in real time, so that I can immediately notice new events.
- 5 - As a user, I want to see system configuration info, so that I can have an overview of the monitoring process.
- 6 - As a user, I want to see only relevant detected events, so that I can avoid noise in the dashboard.
- 7 - As a user, I want to have a detailed view of a detected event, so that I can inspect all the information related to the event.
- 11 - As a user, I want events to be color coded on the dashboard, so that I can immediately distinguish the most important detections.
- 12 - As a user, I want to know which sensor or monitored area detected an event, so that I can localize the source of the alert.
- 13 - As a user, I want to see the list of available sensors, so that I can have an overview of the monitored sources.
- 14 - As a user, I want to know the number of detected events for each sensor, so that I can quantitatively estimate seismic activity.
- 15 - As a user, I want to know the location of each sensor, so that I can identify the monitored area associated with each sensor.
- 16 - As a user, I want to see the mean time between earthquake events for each sensor, so that I can estimate how often they happen.
- 17 - As a user, I want to see the mean time between conventional explosion events for each sensor, so that I can estimate how often they happen.
- 18 - As a user, I want to see the mean time between nuclear explosion events for each sensor, so that I can estimate how often they happen.
- 19 - As a user, I want to see historical data about detected events, so that I can perform analysis on them.
- 20 - As a user, I want to filter the detected events, so that I can have a time-based view.
- 21 - As a user, I want to filter the detected events, so that I can have a type-based view.
- 22 - As a user, I want to filter the detected events, so that I can have a sensor-based view.
- 23 - As a user, I want to filter the detected events, so that I can have a location-based view.

### PORTS:
None (static web application)

### PERSISTENCE EVALUATION
The frontend does not persist data. It retrieves all information from the Gateway-API.

### EXTERNAL SERVICES CONNECTIONS
The frontend communicates only with the Gateway-API via HTTP requests and SSE.

### MICROSERVICES:

#### MICROSERVICE: frontend
- TYPE: frontend
- DESCRIPTION: Static dashboard and archive web interface.
- PORTS: none

- TECHNOLOGICAL SPECIFICATION:
The frontend is implemented using:
    - HTML
    - CSS
    - JavaScript

- SERVICE ARCHITECTURE:
The frontend is composed of two main pages. The dashboard page provides a live view of the event detections, the system status, the list of sensor and the list of processing unit. The archive page provides historical exploration and filtering of stored events.

- PAGES:

| Name | Description | Related Microservice | User Stories |
|-----|-------------|---------------------|-------------|
| Dashboard | Displays live detections, processing unit status, sensor information, system configuration, and event details. Critical events are visually highlighted with color coding. | gateway-api | 1,2,3,4,5,6,7,11,12,13,14,15 |
| Archive | Displays historical detections, MTBE indicators, and filters by date, event type, sensor, and location. | gateway-api | 16,17,18,19,20,21,22,23 |
