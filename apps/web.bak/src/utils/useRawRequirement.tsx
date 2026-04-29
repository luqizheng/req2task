import { RawRequirementStatus } from "@req2task/dto";

export const useRawRequirementStatus = (status: RawRequirementStatus) => {
  if (status=== RawRequirementStatus.PENDING) {
    return "待澄清";
  }
  if (status=== RawRequirementStatus.CLARIFIED) {
    return "已澄清";
  }
  if (status=== RawRequirementStatus.PROCESSING) {
    return "处理中";
  }
  if (status=== RawRequirementStatus.COMPLETED) {
    return "已完成";
  }
  if (status=== RawRequirementStatus.CONVERTED) {
    return "已转换";
  }
  if (status=== RawRequirementStatus.DISCARDED) {
    return "已丢弃";
  }
  if (status=== RawRequirementStatus.FAILED) {
    return "失败";
  }
  return "-";
};

