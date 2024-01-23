# Azure Container Apps Observability
This is a repo with a code example of instrumenting an Azure Container Apps Microservices with Open Telemetry and exporting it to Azure Monitor.

# Application Overview
Our application is simple, it will retrieve a collection of Products with the properties of name & amount/stock. Behind the scenes, however, I deliberately overcomplicated it to simulate a distributed system communicating asynchronously. Technically though, this is all synchronous communication as we will build our own dummy event bus.
We will have 4 main services: 
1. Product Service: Responsible for creating & deleting products. 
2. Inventory Service: Responsible for tracking & updating inventory of products.
3. Events Service: Responsible for acting as an event bus.
4. Aggregator Service: Responsible for returning back a list of all products with their associated inventory. 

The services will talk to each other through events. If an inventory is updated for a specific product, an event is emitted by the inventory service, gets sent to the Events service, and the Events service will push that to the Aggregator Service to display the correct amount of inventory. If a product is deleted, the product will communicate that with inventory service via the event bus.

# Dapr
We are using Dapr for service-service invocation. Again, outside of buzzwords, Dapr offloads common logic such as service-service communication, network retries, error handling, state management, and many others into a container running side by side with your main application container (hence, called sidecar container). With common functionalities handled by the sidecar, your application becomes easier to maintain and update, as changes to these functionalities can often be made without altering your application code. In your code, you can focus on business logic.
