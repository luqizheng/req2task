import simpleGit, { SimpleGit } from 'simple-git';
import pino from 'pino';
import { Config } from './types.js';

const logger = pino({ name: 'git-manager' });

export class GitManager {
  private git: SimpleGit;
  private config: Config;
  private currentBranch: string | null = null;

  constructor(config: Config) {
    this.config = config;
    this.git = simpleGit(config.developer.workspace);

    this.git.env({
      GIT_AUTHOR_NAME: config.git.userName,
      GIT_AUTHOR_EMAIL: config.git.userEmail,
      GIT_COMMITTER_NAME: config.git.userName,
      GIT_COMMITTER_EMAIL: config.git.userEmail,
    });
  }

  async init(repoUrl?: string): Promise<void> {
    try {
      const isRepo = await this.git.checkIsRepo();

      if (!isRepo) {
        if (repoUrl) {
          logger.info({ url: repoUrl }, 'Cloning repository');
          await this.git.clone(repoUrl, this.config.developer.workspace);
          this.git = simpleGit(this.config.developer.workspace);
        } else {
          logger.info('Initializing new repository');
          await this.git.init();
        }
      }

      await this.git.addConfig('user.name', this.config.git.userName);
      await this.git.addConfig('user.email', this.config.git.userEmail);

      logger.info('Git initialized');
    } catch (error) {
      logger.error({ error }, 'Git initialization failed');
      throw error;
    }
  }

  async createBranch(taskType: string, taskId: string): Promise<string> {
    try {
      const prefix = this.getBranchPrefix(taskType);
      const branchName = `${prefix}${taskId}`;

      await this.git.checkoutLocalBranch(branchName);
      this.currentBranch = branchName;

      logger.info({ branch: branchName }, 'Branch created');
      return branchName;
    } catch (error) {
      logger.error({ error, taskType, taskId }, 'Branch creation failed');
      throw error;
    }
  }

  private getBranchPrefix(taskType: string): string {
    switch (taskType) {
      case 'bug':
        return 'bug/';
      case 'feature':
        return 'feature/';
      case 'hotfix':
        return 'hotfix/';
      default:
        return 'task/';
    }
  }

  async commit(message: string): Promise<string> {
    try {
      await this.git.add('.');
      const result = await this.git.commit(message);
      const hash = result.commit;

      logger.info({ hash, message }, 'Commit created');
      return hash;
    } catch (error) {
      logger.error({ error }, 'Commit failed');
      throw error;
    }
  }

  async push(): Promise<void> {
    try {
      const branch = this.currentBranch || (await this.git.branch()).current;
      await this.git.push(this.config.git.remote, branch, { '--set-upstream': null });

      logger.info({ branch }, 'Branch pushed');
    } catch (error) {
      logger.error({ error }, 'Push failed');
      throw error;
    }
  }

  async getStatus(): Promise<{ modified: string[]; untracked: string[] }> {
    const status = await this.git.status();
    return {
      modified: status.modified,
      untracked: status.not_added,
    };
  }

  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current;
  }
}
