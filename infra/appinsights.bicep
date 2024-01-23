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
