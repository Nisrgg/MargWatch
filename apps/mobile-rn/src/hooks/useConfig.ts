import { useQuery } from '@tanstack/react-query';
import { getConfig, ConfigTexts } from '../api/configApi';

const configKeys = { config: ['config'] as const };

const defaultCategories: ConfigTexts['categories'] = [
  { id: 'POTHOLE', label: 'Pothole', colorClass: 'bg-red-100 text-red-800' },
  { id: 'ROAD_INSTABILITY', label: 'Road Instability', colorClass: 'bg-orange-100 text-orange-800' },
  { id: 'STREETLIGHT_DAMAGE', label: 'Streetlight Damage', colorClass: 'bg-yellow-100 text-yellow-800' },
  { id: 'TREE_DAMAGE', label: 'Tree Damage', colorClass: 'bg-green-100 text-green-800' },
  { id: 'OTHER', label: 'Other', colorClass: 'bg-gray-100 text-gray-800' },
];

export function useConfig() {
  const { data: res } = useQuery({
    queryKey: configKeys.config,
    queryFn: getConfig,
    staleTime: 5 * 60 * 1000,
  });

  const config = res?.success && res.data ? res.data : undefined;
  const categories = config?.categories?.length ? config.categories : defaultCategories;

  const formatCategory = (categoryId: string): string => {
    if (!categoryId) return categoryId;
    const byId = categories.find((x) => x.id === categoryId);
    if (byId) return byId.label;
    const byLabel = categories.find((x) => x.label === categoryId);
    if (byLabel) return categoryId;
    return categoryId;
  };

  return {
    config,
    categories,
    formatCategory,
  };
}
