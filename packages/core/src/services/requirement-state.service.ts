import { Repository } from 'typeorm';
import { Requirement, RequirementChangeLog } from '../entities';
import { RequirementStatus, ChangeType } from '@req2task/dto';
import { BusinessException, NotFoundException, ValidationException } from '../exceptions/business.exception';

const STATUS_TRANSITIONS: Record<RequirementStatus, RequirementStatus[]> = {
  [RequirementStatus.DRAFT]: [
    RequirementStatus.REVIEWED,
    RequirementStatus.CANCELLED,
  ],
  [RequirementStatus.REVIEWED]: [
    RequirementStatus.APPROVED,
    RequirementStatus.REJECTED,
    RequirementStatus.DRAFT,
  ],
  [RequirementStatus.APPROVED]: [
    RequirementStatus.PROCESSING,
    RequirementStatus.CANCELLED,
  ],
  [RequirementStatus.REJECTED]: [
    RequirementStatus.DRAFT,
    RequirementStatus.CANCELLED,
  ],
  [RequirementStatus.PROCESSING]: [
    RequirementStatus.COMPLETED,
    RequirementStatus.APPROVED,
  ],
  [RequirementStatus.COMPLETED]: [],
  [RequirementStatus.CANCELLED]: [RequirementStatus.DRAFT],
};

export class RequirementStateService {
  constructor(
    private requirementRepository: Repository<Requirement>,
    private changeLogRepository: Repository<RequirementChangeLog>,
  ) {}

  async canTransition(
    currentStatus: RequirementStatus,
    targetStatus: RequirementStatus,
  ): Promise<boolean> {
    if (currentStatus === targetStatus) return true;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(targetStatus);
  }

  async transitionStatus(
    requirementId: string,
    targetStatus: RequirementStatus,
    userId: string,
    comment?: string,
  ): Promise<Requirement> {
    const requirement = await this.requirementRepository.findOne({
      where: { id: requirementId },
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${requirementId} not found`);
    }

    const currentStatus = requirement.status;
    const canTransition = await this.canTransition(currentStatus, targetStatus);

    if (!canTransition) {
      throw new ValidationException(
        `Cannot transition from ${currentStatus} to ${targetStatus}`,
      );
    }

    requirement.status = targetStatus;
    const updated = await this.requirementRepository.save(requirement);

    const changeLog = this.changeLogRepository.create({
      requirementId,
      changeType: ChangeType.STATUS_CHANGE,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      oldValue: currentStatus,
      newValue: targetStatus,
      comment: comment || null,
      changedById: userId,
    });

    await this.changeLogRepository.save(changeLog);

    return updated;
  }

  async getAllowedTransitions(currentStatus: RequirementStatus): Promise<RequirementStatus[]> {
    return STATUS_TRANSITIONS[currentStatus] || [];
  }

  async getChangeHistory(requirementId: string): Promise<RequirementChangeLog[]> {
    return this.changeLogRepository.find({
      where: { requirementId },
      relations: ['changedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async logChange(
    requirementId: string,
    changeType: ChangeType,
    userId: string,
    oldValue: string | null,
    newValue: string | null,
    comment?: string,
  ): Promise<RequirementChangeLog> {
    const changeLog = this.changeLogRepository.create({
      requirementId,
      changeType,
      oldValue,
      newValue,
      comment: comment || null,
      changedById: userId,
    });

    return this.changeLogRepository.save(changeLog);
  }

  async reviewRequirement(
    requirementId: string,
    approved: boolean,
    userId: string,
    comment?: string,
  ): Promise<Requirement> {
    const targetStatus = approved
      ? RequirementStatus.APPROVED
      : RequirementStatus.REJECTED;

    const requirement = await this.transitionStatus(
      requirementId,
      targetStatus,
      userId,
      comment,
    );

    await this.changeLogRepository.save({
      requirementId,
      changeType: ChangeType.REVIEW_RESULT,
      oldValue: null,
      newValue: approved ? 'approved' : 'rejected',
      comment: comment || null,
      changedById: userId,
    });

    return requirement;
  }
}
