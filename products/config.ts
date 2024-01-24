import { useAzureMonitor, AzureMonitorOpenTelemetryOptions } from "@azure/monitor-opentelemetry";

const options: AzureMonitorOpenTelemetryOptions = {
    azureMonitorExporterOptions: {
      connectionString: "REPLACE_WITH_CONNECTION_STRING",
    }
  };

const enableAppInsights = ()=> {
    useAzureMonitor(options);
}

export default enableAppInsights;