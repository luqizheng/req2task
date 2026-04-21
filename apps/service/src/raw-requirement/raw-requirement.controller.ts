import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { RawRequirementService } from "./raw-requirement.service";
import { RequirementCollectService } from "./requirement-collect.service";
import { CollectRequirementDto } from "@req2task/dto";

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
    private readonly requirementCollectService: RequirementCollectService,
  ) {}

  @Get(":rawRequirementId")
  async getRawRequirement(
    @Param("rawRequirementId") rawRequirementId: string,
  ): Promise<ApiResponse<unknown>> {
    const result =
      await this.rawRequirementService.getRawRequirementById(rawRequirementId);
    return { code: 0, data: result };
  }

  @Post(":rawRequirementId/collect")
  async collectRequirement(
    @Param("rawRequirementId") rawRequirementId: string,
    @Body() dto: CollectRequirementDto,
    @Res() res: Response,
  ): Promise<void> {
    if (!rawRequirementId) {
      throw new BadRequestException("rawRequirementId 不能为空");
    }

    return this.requirementCollectService.collect(rawRequirementId, dto, res);
  }

  @Delete(":rawRequirementId")
  async deleteRawRequirement(
    @Param("rawRequirementId") rawRequirementId: string,
  ): Promise<ApiResponse<null>> {
    await this.rawRequirementService.deleteRawRequirement(rawRequirementId);
    return { code: 0, message: "删除成功" };
  }
}
