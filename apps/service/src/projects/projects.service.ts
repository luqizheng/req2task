import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, User } from '@req2task/core';
import { ProjectStatus } from '@req2task/dto';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
  ProjectListResponseDto,
  AddMemberDto,
  ProjectMemberDto,
} from '@req2task/dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private toResponseDto(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      projectKey: project.projectKey,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      ownerId: project.ownerId,
      members: (project.members || []).map((m) => ({
        id: m.id,
        username: m.username,
        displayName: m.displayName,
        email: m.email,
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      systemType: project.systemType,
      architectureType: project.architectureType,
      techStack: project.techStack,
      databaseTypes: project.databaseTypes,
      cloudProvider: project.cloudProvider,
      securityLevel: project.securityLevel,
      projectScale: project.projectScale,
      teamSize: project.teamSize,
      isMicroservices: project.isMicroservices,
      expectedDurationMonths: project.expectedDurationMonths,
      budget: project.budget,
      businessDomain: project.businessDomain,
      targetAudience: project.targetAudience,
      wizardCompleted: project.wizardCompleted,
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<ProjectListResponseDto> {
    const [items, total] = await this.projectRepository.findAndCount({
      relations: ['members'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items: items.map((p) => this.toResponseDto(p)),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return this.toResponseDto(project);
  }

  async findByKey(projectKey: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { projectKey },
      relations: ['members'],
    });
    if (!project) {
      throw new NotFoundException(`Project with key ${projectKey} not found`);
    }
    return this.toResponseDto(project);
  }

  async create(createProjectDto: CreateProjectDto, ownerId: string): Promise<ProjectResponseDto> {
    const existingProject = await this.projectRepository.findOne({
      where: { projectKey: createProjectDto.projectKey },
    });
    if (existingProject) {
      throw new ConflictException('Project key already exists');
    }

    const project = this.projectRepository.create({
      name: createProjectDto.name,
      description: createProjectDto.description || null,
      projectKey: createProjectDto.projectKey,
      status: createProjectDto.status || ProjectStatus.PLANNING,
      startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : null,
      endDate: createProjectDto.endDate ? new Date(createProjectDto.endDate) : null,
      ownerId,
      members: [],
    });

    const savedProject = await this.projectRepository.save(project);
    return this.toResponseDto(savedProject);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (updateProjectDto.name) project.name = updateProjectDto.name;
    if (updateProjectDto.description !== undefined) project.description = updateProjectDto.description;
    if (updateProjectDto.status) project.status = updateProjectDto.status;
    if (updateProjectDto.startDate) project.startDate = new Date(updateProjectDto.startDate);
    if (updateProjectDto.endDate) project.endDate = new Date(updateProjectDto.endDate);

    if (updateProjectDto.systemType !== undefined) project.systemType = updateProjectDto.systemType;
    if (updateProjectDto.architectureType !== undefined) project.architectureType = updateProjectDto.architectureType;
    if (updateProjectDto.techStack !== undefined) project.techStack = updateProjectDto.techStack;
    if (updateProjectDto.databaseTypes !== undefined) project.databaseTypes = updateProjectDto.databaseTypes;
    if (updateProjectDto.cloudProvider !== undefined) project.cloudProvider = updateProjectDto.cloudProvider;
    if (updateProjectDto.securityLevel !== undefined) project.securityLevel = updateProjectDto.securityLevel;
    if (updateProjectDto.projectScale !== undefined) project.projectScale = updateProjectDto.projectScale;
    if (updateProjectDto.teamSize !== undefined) project.teamSize = updateProjectDto.teamSize;
    if (updateProjectDto.isMicroservices !== undefined) project.isMicroservices = updateProjectDto.isMicroservices;
    if (updateProjectDto.expectedDurationMonths !== undefined) project.expectedDurationMonths = updateProjectDto.expectedDurationMonths;
    if (updateProjectDto.budget !== undefined) project.budget = updateProjectDto.budget;
    if (updateProjectDto.businessDomain !== undefined) project.businessDomain = updateProjectDto.businessDomain;
    if (updateProjectDto.targetAudience !== undefined) project.targetAudience = updateProjectDto.targetAudience;

    const updatedProject = await this.projectRepository.save(project);
    return this.toResponseDto(updatedProject);
  }

  async delete(id: string): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    await this.projectRepository.remove(project);
  }

  async addMember(projectId: string, addMemberDto: AddMemberDto): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: addMemberDto.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${addMemberDto.userId} not found`);
    }

    const isMember = project.members.some((m) => m.id === user.id);
    if (isMember) {
      throw new ConflictException('User is already a member of this project');
    }

    project.members.push(user);
    const updatedProject = await this.projectRepository.save(project);
    return this.toResponseDto(updatedProject);
  }

  async removeMember(projectId: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const memberIndex = project.members.findIndex((m) => m.id === userId);
    if (memberIndex === -1) {
      throw new NotFoundException(`User is not a member of this project`);
    }

    project.members.splice(memberIndex, 1);
    const updatedProject = await this.projectRepository.save(project);
    return this.toResponseDto(updatedProject);
  }

  async getMembers(projectId: string): Promise<ProjectMemberDto[]> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    return project.members.map((m) => ({
      id: m.id,
      username: m.username,
      displayName: m.displayName,
      email: m.email,
    }));
  }

  async createFromWizard(
    projectData: {
      name: string;
      description?: string;
      projectKey: string;
      systemType?: any;
      architectureType?: any;
      techStack?: any;
      databaseTypes?: any;
      cloudProvider?: any;
      securityLevel?: any;
      projectScale?: any;
      teamSize?: number;
      isMicroservices?: boolean;
      expectedDurationMonths?: number;
      budget?: number;
      businessDomain?: string;
      targetAudience?: string;
      wizardCompleted?: boolean;
    },
    ownerId: string,
  ): Promise<Project> {
    const existingProject = await this.projectRepository.findOne({
      where: { projectKey: projectData.projectKey },
    });
    if (existingProject) {
      throw new ConflictException('Project key already exists');
    }

    const project = this.projectRepository.create({
      name: projectData.name,
      description: projectData.description || null,
      projectKey: projectData.projectKey,
      status: ProjectStatus.PLANNING,
      ownerId,
      members: [],
      systemType: projectData.systemType || null,
      architectureType: projectData.architectureType || null,
      techStack: projectData.techStack || null,
      databaseTypes: projectData.databaseTypes || [],
      cloudProvider: projectData.cloudProvider || null,
      securityLevel: projectData.securityLevel || null,
      projectScale: projectData.projectScale || null,
      teamSize: projectData.teamSize || null,
      isMicroservices: projectData.isMicroservices || false,
      expectedDurationMonths: projectData.expectedDurationMonths || null,
      budget: projectData.budget || null,
      businessDomain: projectData.businessDomain || null,
      targetAudience: projectData.targetAudience || null,
      wizardCompleted: projectData.wizardCompleted || false,
    });

    return this.projectRepository.save(project);
  }
}
