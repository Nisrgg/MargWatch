/**
 * Issue category enumeration
 * Defines the different types of road issues that can be reported
 */
export enum IssueCategory {
  POTHOLE = 'POTHOLE',
  ROAD_INSTABILITY = 'ROAD_INSTABILITY',
  STREETLIGHT_DAMAGE = 'STREETLIGHT_DAMAGE',
  TREE_DAMAGE = 'TREE_DAMAGE',
  OTHER = 'OTHER'
}

export type IssueCategoryType = keyof typeof IssueCategory;
