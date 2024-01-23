import { useAzureMonitor, AzureMonitorOpenTelemetryOptions } from "@azure/monitor-opentelemetry";

const options: AzureMonitorOpenTelemetryOptions = {
    azureMonitorExporterOptions: {
      connectionString: process.env.CONNECTION_STRING
    }
  };

const enableAppInsights = ()=> {
    useAzureMonitor(options);
}

export default enableAppInsights;
