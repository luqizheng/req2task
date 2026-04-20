export interface NacosNamingClient {
  registerInstance(serviceName: string, instance: NacosInstance): Promise<void>;
  deregisterInstance(serviceName: string, instanceId: string, groupName?: string): Promise<void>;
  beat(serviceName: string, instanceId: string, beatInfo?: any): Promise<void>;
  selectInstances(serviceName: string, groups?: string[], healthy?: boolean): Promise<NacosInstance[]>;
  selectOneHealthyInstance(serviceName: string, groups?: string[]): Promise<NacosInstance | null>;
  subscribe(serviceName: string, callback: (instances: NacosInstance[]) => void): Promise<void>;
  unsubscribe(serviceName: string): Promise<void>;
  close(): Promise<void>;
}

export interface NacosInstance {
  instanceId?: string;
  ip: string;
  port: number;
  serviceName?: string;
  healthCheckType?: string;
  healthy?: boolean;
  enabled?: boolean;
  ephemeral?: boolean;
  clusterName?: string;
  weight?: number;
  metadata?: Record<string, string>;
}

export interface NacosConfigClient {
  getConfig(dataId: string, group: string): Promise<string>;
  publishConfig(dataId: string, group: string, content: string): Promise<boolean>;
  deleteConfig(dataId: string, group: string): Promise<boolean>;
  subscribe(dataId: string, group: string, callback: (config: string) => void): Promise<void>;
  unsubscribe(dataId: string, group: string): Promise<void>;
  close(): Promise<void>;
}

export interface NamingMaintainOptions {
  serviceName: string;
  ip: string;
  port: number;
  clusterName?: string;
  weight?: number;
  enabled?: boolean;
  healthy?: boolean;
  metadata?: Record<string, string>;
  ephemeral?: boolean;
  clusterNames?: string;
}

export interface ConfigMaintainOptions {
  dataId: string;
  group?: string;
  content: string;
  type?: string;
  cas?: boolean;
}

export interface ConfigQueryOptions {
  dataId: string;
  group?: string;
  pageNo?: number;
  pageSize?: number;
}
