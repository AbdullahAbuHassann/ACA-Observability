param environmentName string = '<ACA Environment Name>' // Provide an Azure Container Apps Environment unique name
param acrName string = '<ACR Name>' // Your Azure Container Registry name


// Assuming the managed environment is in the same resource group and subscription
var environmentId = resourceId('Microsoft.App/managedEnvironments', environmentName)

param location string = 'westeurope' // Change as needed
param logAnalyticsCustomerId string = '<Workspace ID>'// Provide Log Analytics Workspace Customer ID
param logAnalyticsSharedKey string = '<Workspace Key>' // Provide Log Analytics Workspace Shared Key
param inventoryImage string = '<Image Name>' // Provide the image name without the ACR name prefix, example: 'inventory:v1'
param eventsImage string = '<Image Name>'  // Provide the image name without the ACR name prefix, example: 'events:v1'
param productsImage string = '<Image Name>' // Provide the image name without the ACR name prefix, example: 'products:v1'


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


//user managed identity
resource userManagedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2018-11-30' = {
  name: 'aca-user-managed-identity'
  location: location
}

// Container App 1 (Inventory)
resource inventory 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'inventory'
  location: location
  properties: {
    configuration: {
      dapr: {
        appId: 'inventory'
        appPort: 3001 // Assuming your app listens on port 80, change as needed
        appProtocol: 'http'
        enableApiLogging: true
        enabled: true
        logLevel: 'info'
      }
      ingress: {
        allowInsecure: false
        external: true
        targetPort: 3001
      }
      registries: [
        {
          server: '${acrName}.azurecr.io'
          identity: userManagedIdentity.id
        }
      ]
    }
    environmentId: environmentId
    template: {
      containers: [
        {
          image: '${acrName}.azurecr.io/${inventoryImage}'
          name: 'inventory'
          }
      ]
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userManagedIdentity.id}': {}
    }
  }
  dependsOn: [
    containerAppEnvironment
    roleAssignment
  ]
}

// Container App 2 (Events)
resource events 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'events'
  location: location
  properties: {
    configuration: {
      dapr: {
        appId: 'events'
        appPort: 4000 // Assuming your app listens on port 80, change as needed
        appProtocol: 'http'
        enableApiLogging: true
        enabled: true
        logLevel: 'info'
      }
      ingress: {
        allowInsecure: false
        external: true
        targetPort: 4000
      }
      registries: [
        {
          server: '${acrName}.azurecr.io'
          identity: userManagedIdentity.id
        }
      ]
    }
    environmentId: environmentId
    template: {
      containers: [
        {
          image: '${acrName}.azurecr.io/${eventsImage}'
          name: 'events'
          }
      ]
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userManagedIdentity.id}': {}
    }
  }
  dependsOn: [
    containerAppEnvironment
    roleAssignment
  ]
}

// Container App 3 (Products)
resource products 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'products'
  location: location
  properties: {
    configuration: {
      dapr: {
        appId: 'products'
        appPort: 3002 // Assuming your app listens on port 80, change as needed
        appProtocol: 'http'
        enableApiLogging: true
        enabled: true
        logLevel: 'info'
      }
      ingress: {
        allowInsecure: false
        external: true
        targetPort: 3002
      }
      registries: [
        {
          server: '${acrName}.azurecr.io'
          identity: userManagedIdentity.id
        }
      ]
    }
    environmentId: environmentId
    template: {
      containers: [
        {
          image: '${acrName}.azurecr.io/${productsImage}'
          name: 'products'
          }
      ]
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userManagedIdentity.id}': {}
    }
  }
  dependsOn: [
    containerAppEnvironment
    roleAssignment
  ]
}

