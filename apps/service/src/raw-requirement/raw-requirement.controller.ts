import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RawRequirementService } from "./raw-requirement.service";

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

@Controller("raw-requirements")
@UseGuards(AuthGuard("jwt"))
export class RawRequirementController {
  constructor(
    private readonly rawRequirementService: RawRequirementService,
  ) {}

  @Get(":rawRequirementId")
  async getRawRequirement(
    @Param("rawRequirementId") rawRequirementId: string,
  ): Promise<ApiResponse<unknown>> {
    const result =
      await this.rawRequirementService.getRawRequirementById(rawRequirementId);
    return { code: 0, data: result };
  }

  @Delete(":rawRequirementId")
  async deleteRawRequirement(
    @Param("rawRequirementId") rawRequirementId: string,
  ): Promise<ApiResponse<null>> {
    await this.rawRequirementService.deleteRawRequirement(rawRequirementId);
    return { code: 0, message: "删除成功" };
  }
}
