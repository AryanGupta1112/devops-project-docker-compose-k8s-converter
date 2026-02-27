export interface ServiceSummary {
  name: string;
  image: string;
  ports: number[];
  hasConfigMap: boolean;
  hasSecret: boolean;
  volumeCount: number;
}

export interface ConversionResponse {
  jobId: string;
  manifests: Record<string, string>;
  warnings: string[];
  services: ServiceSummary[];
}
