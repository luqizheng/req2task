import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requirement, RawRequirement, Task, Project } from '@req2task/core';

export enum EntityKeyType {
  REQ = 'REQ',
  RAW = 'RAW',
  TSK = 'TSK',
}

@Injectable()
export class EntityKeyService {
  constructor(
    @InjectRepository(Requirement)
    private requirementRepository: Repository<Requirement>,
    @InjectRepository(RawRequirement)
    private rawRequirementRepository: Repository<RawRequirement>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async generateEntityKey(
    projectId: string,
    type: EntityKeyType,
    count: number = 1,
  ): Promise<string[]> {
    if (count < 1) {
      throw new Error('Count must be at least 1');
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['projectKey'],
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const prefix = `${project.projectKey}-${type}`;
    const maxSeq = await this.getMaxSequence(prefix, type);
    console.warn('max key sequence:', maxSeq, 'count:', count);
    return Array.from({ length: count }, (_, i) => `${prefix}-${maxSeq + 1 + i}`);
  }

  private async getMaxSequence(
    prefix: string,
    type: EntityKeyType,
  ): Promise<number> {
    let repository: Repository<any>;

    switch (type) {
      case EntityKeyType.REQ:
        repository = this.requirementRepository;
        break;
      case EntityKeyType.RAW:
        repository = this.rawRequirementRepository;
        break;
      case EntityKeyType.TSK:
        repository = this.taskRepository;
        break;
    }

    const result = await repository
      .createQueryBuilder('entity')
      .select(`MAX(REGEXP_REPLACE(entity.entity_key, '${prefix}-', '', 'g'))`, 'maxSeq')
      .where(`entity.entity_key LIKE :prefix`, { prefix: `${prefix}-%` })
      .getRawOne();
    const maxSeq = result?.maxSeq ? parseInt(result.maxSeq, 10) : 0;
    return isNaN(maxSeq) ? 0 : maxSeq;
  }

  async getProjectKey(projectId: string): Promise<string | null> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['projectKey'],
    });
    return project?.projectKey || null;
  }
}
