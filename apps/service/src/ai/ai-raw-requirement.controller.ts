import {
  Controller,
  Get,
  Param,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RawRequirementService } from "../raw-requirement/raw-requirement.service";

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

@Controller("ai/projects")
@UseGuards(AuthGuard("jwt"))
export class AiRawRequirementController {
  constructor(
    private readonly rawRequirementService: RawRequirementService,
  ) {}

  @Get(":projectId/raw-requirements")
  async getRawRequirementsByProject(
    @Param("projectId") projectId: string,
  ): Promise<ApiResponse<unknown>> {
    const result =
      await this.rawRequirementService.getRawRequirementsByProject(projectId);
    return { code: 0, data: result };
  }
}
