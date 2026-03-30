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

16. As a user, I want to see the mean time between earthquake events, In order to estimate how often they happen  

17. As a user, I want to see the mean time between conventional explosion events, In order to estimate how often they happen  

18. As a user, I want to see the mean time between nuclear explosion events, In order to estimate how often they happen  

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
8000:8000

### PERSISTENCE EVALUATION
The broker does not persist data. It forwards measurements in real time.

### EXTERNAL SERVICES CONNECTIONS
The service connects to:
- Seismic-Simulator REST API for health checks and sensor discovery
- Seismic-Simulator WebSocket endpoints for real-time sensor data streaming
- Processing-Service replicas for measurement redistribution

### MICROSERVICES:

#### MICROSERVICE: broker-service
- TYPE: backend
- DESCRIPTION: Custom broker that captures sensor measurements and forwards them to the processing units.
- PORTS: 8000

- TECHNOLOGICAL SPECIFICATION:
The microservice is implemented in Python using:
    - `FastAPI` for exposing the WebSocket broker endpoint and managing service lifecycle
    - `uvicorn` as the ASGI server
    - `httpx` for asynchronous HTTP communication with the simulator
    - `websockets` for connecting to sensor telemetry streams
    - `asyncio` for concurrent task scheduling and continuous stream handling
    - `json` for parsing incoming sensor messages

- SERVICE ARCHITECTURE:
The broker retrieves the list of sensors from the simulator, opens one WebSocket connection per sensor, and forwards each incoming sensor measurement to all connected processing-unit replicas through its internal WebSocket endpoint.
- ENDPOINTS

| PROTOCOL | METHOD | ENDPOINT  | Description                                      | 
|----------|--------|------|--------------------------------------------------|
| WS       | -      | /ws  | WebSocket endpoint for processing-unit replicas  | 
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
- Internal: `8100`
- External: `8101`–`8110` (one mapped host port per replica)
### PORT USAGE:
All processing-service replicas listen internally on port `8100`.  
The gateway performs health checks using the Docker service names (`processing_1`, ..., `processing_n`) and the internal port `8100`, for example `http://processing_1:8100/health`.

### PERSISTENCE EVALUATION
The processing units do not persist data directly. Sliding windows and intermediate analysis data are kept in memory, while detected events are forwarded to the gateway.

### EXTERNAL SERVICES CONNECTIONS
The service connects to:

- Broker WebSocket endpoint for real-time sensor event subscription
- Simulator REST API for service readiness checks and sensor metadata retrieval
- Simulator SSE control stream for receiving control commands
- Gateway REST API for forwarding detected events

### MICROSERVICES:

#### MICROSERVICE: processing-service
- TYPE: backend
- DESCRIPTION: Replicated service that performs FFT analysis and event classification.
- PORTS: 8100 
- TECHNOLOGICAL SPECIFICATION:
The microservice is implemented in Python using:
  - `FastAPI` for exposing the health-check endpoint and managing service lifecycle
  - `uvicorn` as the ASGI server
  - `httpx` for asynchronous HTTP communication with simulator and gateway services
  - `websockets` for subscribing to the broker event stream
  - `asyncio` for concurrent task scheduling and continuous stream handling
  - `numpy` for numerical processing and FFT-based spectral analysis
  - `collections.deque` for maintaining sliding windows of sensor samples
  - `json` for parsing incoming broker messages
  - `os` and `time` for process control and timestamp handling

- SERVICE ARCHITECTURE:
The service follows an event-driven stream-processing architecture. At startup, it waits for the simulator to become available through its health endpoint, then retrieves sensor metadata from the simulator REST API and stores it locally. This metadata is used during analysis to enrich detections with contextual information such as sensor name, category, region, coordinates, and sampling rate.

- ENDPOINTS

| PROTOCOL | METHOD | ENDPOINT | Description |
|----------|--------|----------|-------------|
| HTTP | GET | `/health` | Health-check endpoint for each processing-unit replica. |

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
None

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

    **events**

    | id | sensor_id | sensor_name | category | region | coordinates | event_type | event_timestamp | time_bucket | dominant_frequency_hz | peak_amplitude | peak_spectrum | window_size | reported_by | created_at |

---

# CONTAINER_NAME: Gateway-API

### DESCRIPTION:
Central API gateway that receives detected events from processing-unit replicas, stores them in PostgreSQL with duplicate protection, exposes event retrieval endpoints for the frontend, and monitors the health status of all processing replicas.


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
8200:8200

### PERSISTENCE EVALUATION
The gateway does not maintain its own long-term runtime state, but it is responsible for writing and reading persistent event data in PostgreSQL.

### EXTERNAL SERVICES CONNECTIONS
The service connects to:
- PostgreSQL for persistent storage of detected events
- Processing-unit replicas for periodic health checks

### MICROSERVICES:

#### MICROSERVICE: gateway-api
- TYPE: backend
- DESCRIPTION: Main REST API entry point consumed by the frontend and by the processing-service replicas.
- PORTS: 8000

- TECHNOLOGICAL SPECIFICATION:
The microservice is implemented in Python using:
  - `FastAPI` for exposing the REST API and managing the application lifecycle
  - `uvicorn` as the ASGI server
  - `asyncpg` for asynchronous PostgreSQL connection pooling and SQL execution
  - `httpx` for asynchronous HTTP communication with processing-unit replicas during heartbeat monitoring
  - `asyncio` for concurrent background tasks
  - `pydantic` for request payload validation
  - `fastapi.middleware.cors.CORSMiddleware` for enabling frontend access from allowed origins
  - `json` for event serialization
  - `datetime` for timestamp parsing, normalization, and serialization

- SERVICE ARCHITECTURE:
The service follows a gateway-and-persistence architecture. At startup, it waits for PostgreSQL to become available, initializes the database connection pool, and creates the `events` table if it does not already exist. It then launches a background heartbeat loop that periodically polls all configured processing-unit health endpoints.

- ENDPOINTS:
 
| Protocol | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| HTTP | GET | `/health` | Gateway health-check endpoint. |
| HTTP | POST | `/api/detections` | Receives detected events from processing-unit replicas and stores them in the database with deduplication. |
| HTTP | GET | `/api/live` | Returns the latest detected events, limited to the most recent records. |
| HTTP | GET | `/api/events` | Returns the complete list of stored detected events. |
| HTTP | GET | `/api/processing-status` | Returns the health and availability status of all configured processing-unit replicas. |

    

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
The frontend connects to the Gateway API through the following base URL:

- `http://localhost:8200/api`

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

- CONSUMED ENDPOINTS:

| Protocol | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| HTTP | GET | `/api/live` | Retrieves recent detected events for the dashboard. |
| HTTP | GET | `/api/events` | Retrieves the historical archive of detected events. |
| HTTP | GET | `/api/processing-status` | Retrieves the status of the processing-unit replicas. |

- PAGES:

| Name | Description | Related Microservice | User Stories |
|-----|-------------|---------------------|-------------|
| Dashboard | Displays live detections, processing unit status, sensor information, system configuration, and event details. Critical events are visually highlighted with color coding. | gateway-api | 1,2,3,4,5,6,7,11,12,13,14,15 |
| Archive | Displays historical detections, MTBE indicators, and filters by date, event type, sensor, and location. | gateway-api | 16,17,18,19,20,21,22,23 |
