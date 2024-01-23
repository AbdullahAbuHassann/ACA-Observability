# Azure Container Apps Observability
This is a repo with a code example of instrumenting an Azure Container Apps Microservices with Open Telemetry and exporting it to Azure Monitor.

# Application Overview
Our application is simple, it will retrieve a collection of Products with the properties of name & amount/stock. Behind the scenes, however, I deliberately overcomplicated it to simulate a distributed system communicating asynchronously. Technically though, this is all synchronous communication as we will build our own dummy event bus.
We will have 4 main services: 
1. Product Service: Responsible for returning back a list of all products with their associated inventory.
2. Inventory Service: Responsible for tracking & updating inventory of products created by Product Service.
3. Events Service: Responsible for acting as an event bus.

The services will talk to each other through events. If an inventory is updated for a specific product, an event is emitted by the inventory service, gets sent to the Events service, and the Events service will push that to the Aggregator Service to display the correct amount of inventory. If a product is deleted, the product will communicate that with inventory service via the event bus.

## Dapr
We are using Dapr for service-service invocation. Again, outside of buzzwords, Dapr offloads common logic such as service-service communication, network retries, error handling, state management, and many others into a container running side by side with your main application container (hence, called sidecar container). With common functionalities handled by the sidecar, your application becomes easier to maintain and update, as changes to these functionalities can often be made without altering your application code. In your code, you can focus on business logic.

## Prerequisites 
1. Create an [Azure Log Analytics Workspace](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/quick-create-workspace?tabs=azure-portal), an [Azure Application Insights Resource](https://learn.microsoft.com/en-us/azure/azure-monitor/app/create-workspace-resource#create-a-workspace-based-resource) an [Azure Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal?tabs=azure-cli) resource. Make sure when you create the Application Insights resource, you pick the same Log Analytics resource that you created:
![image](https://github.com/AbdullahAbuHassann/ACA-Observability/assets/84739483/4eae1144-c124-4419-a4f9-5c66f61ee15b)
2. Take note of Azure Application Insights Connection String on the overview page in the portal.
3. Ensure Docker is [installed](https://docs.docker.com/engine/install/) locally on your machine.


## Setup
1. Login to Azure (make sure Azure CLI is installed)
```
az login
```
2. Authenticate to the Azure Container Registry (you might need to provide credentials, which you can get from the portal)
```
az acr login --name myregistry
```
3. Clone the repository locally
```
git clone https://github.com/AbdullahAbuHassann/ACA-Observability.git
```
4. Configure Products Service

Navigate to /products. In the config.ts file, replace the connection string property with your connection string noted in the Prerequisites section.
```typescript
const options: AzureMonitorOpenTelemetryOptions = {
    azureMonitorExporterOptions: {
      connectionString: "REPLACE_WITH_CONNECTION_STRING",
    }
  };
```
Now, we will build a docker container from the provided Dockerfile, replace ACRName below as appropriate.
```
 docker build -t <ACRName>.azurecr.io/products:v1 .   
```
Push the container to Azure
```
docker push <ACRName>.azurecr.io/products:v1 .
```
Repeat step 4 with /inventory and /events (ensure different image names are used)

5. Setup Bicep Template

Navigate to /infra/appinsights.bicep and replace fill in appInsightsName and workspaceResourceId

```bicep
param location string = 'westeurope' // You can change the location as needed
param appInsightsName string = '<App Insights Resource Name>' // Provide a unique name for the Application Insights resource
param workspaceResourceId string = '<Resource ID of the Log Analytics workspace>' // Provide the resource ID of the Log Analytics workspace

resource appInsights 'Microsoft.Insights/components@2020-02-02-preview' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspaceResourceId
  }
}
```
Navigate to /infra/aca.bicep and adjust environmentName, acrName, Log Analytics Workspace Id & Key, Image names, RG Name for the scope of the user managed identity, and daprAIConnectionString
```bicep
param environmentName string = '<ACA Environment Name>' // Provide an Azure Container Apps Environment unique name
param acrName string = '<ACA Name>' // Your Azure Container Registry name


// Assuming the managed environment is in the same resource group and subscription
var environmentId = resourceId('Microsoft.App/managedEnvironments', environmentName)

param location string = 'westeurope' // Change as needed
param logAnalyticsCustomerId string = '<Workspace ID>'// Provide Log Analytics Workspace Customer ID
param logAnalyticsSharedKey string = '<Workspace Key>' // Provide Log Analytics Workspace Shared Key
param inventoryImage string = '<Image Name>' // Provide the image name
param eventsImage string = '<Image Name>'  // Provide the image name
param productsImage string = '<Image Name>' // Provide the image name


// Assign AcrPull permission
module roleAssignment 'roleassignment.bicep' = {
  name: 'container-registry-role-assignment'
  scope: resourceGroup('<RG Name>') //Replace Value
  params: {
    roleId: '7f951dda-4ed3-4680-a7ca-43fe172d538d' // AcrPull
    principalId: userManagedIdentity.properties.principalId
    registryName: acrName
  }
}

// Azure Container Apps Environment
resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsCustomerId
        sharedKey: logAnalyticsSharedKey
      }
    }
    daprAIConnectionString: '<App Insights Connection String>'
  }
}
```
6. Deploy Bicep template

Ensure you are on /infra and run (replace with your resource group name as appropriate:
```
az deployment group create --resource-group <RG_Name> --template-file aca.bicep
```
You should now have an Azure Container Apps 
To tidy up, delete the resource group later on
```
az group delete -n <RG_Name> --yes
```


