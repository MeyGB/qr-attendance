import { colors } from "../theme/theme";
import type { AnnouncementType } from "../types";

export const ANNOUNCEMENT_TYPE_META: Record<
  AnnouncementType,
  { label: string; fg: string; bg: string }
> = {
  general: { label: "General", fg: colors.inkSoft, bg: colors.surfaceSunken },
  important: { label: "Important", fg: colors.danger, bg: colors.dangerSoft },
  event: { label: "Event", fg: colors.violet, bg: colors.violetSoft },
  policy: { label: "Policy", fg: colors.amber, bg: colors.amberSoft },
};
