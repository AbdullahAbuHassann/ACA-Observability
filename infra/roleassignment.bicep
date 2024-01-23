param registryName string
param roleId string
param principalId string

// Get a reference to the existing registry
resource registry 'Microsoft.ContainerRegistry/registries@2021-06-01-preview' existing = {
  name: registryName
}

// Create role assignment
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2020-04-01-preview' = {
  name: guid(registry.id, roleId, principalId)
  scope: registry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleId)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}
