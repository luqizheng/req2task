import { writeFileSync, chmodSync, existsSync } from 'fs';
import { dirname } from 'path';
import { mkdirSync } from 'fs';
import pino from 'pino';
import { Config, CredentialPayload } from './types.js';

const logger = pino({ name: 'ssh-manager' });

export class SshKeyManager {
  private config: Config;
  private installedCredentials = new Set<string>();

  constructor(config: Config) {
    this.config = config;
    this.ensureSshDir();
  }

  private ensureSshDir(): void {
    const sshDir = dirname(this.config.ssh.gitKeyPath);
    if (!existsSync(sshDir)) {
      mkdirSync(sshDir, { recursive: true });
      chmodSync(sshDir, 0o700);
    }
  }

  async installCredential(credential: CredentialPayload): Promise<boolean> {
    try {
      const path = this.getPathForType(credential.type);
      if (!path) {
        logger.error({ type: credential.type }, 'Unknown credential type');
        return false;
      }

      const dir = dirname(path);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        chmodSync(dir, 0o700);
      }

      writeFileSync(path, credential.content, { mode: 0o600 });

      this.installedCredentials.add(credential.type);
      logger.info({ type: credential.type, path }, 'Credential installed');

      return true;
    } catch (error) {
      logger.error({ error, type: credential.type }, 'Failed to install credential');
      return false;
    }
  }

  private getPathForType(type: string): string | null {
    switch (type) {
      case 'git_ssh_key':
        return this.config.ssh.gitKeyPath;
      case 'host_access_key':
        return this.config.ssh.hostKeyPath;
      case 'known_hosts':
        return this.config.ssh.knownHostsPath;
      default:
        return null;
    }
  }

  isInstalled(type: string): boolean {
    return this.installedCredentials.has(type);
  }

  getInstalledTypes(): string[] {
    return Array.from(this.installedCredentials);
  }
}
