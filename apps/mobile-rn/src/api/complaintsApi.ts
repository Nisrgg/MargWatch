import type {
  ApiResponse,
  Complaint,
  ComplaintFilters,
  HeatMapData,
  Pagination,
} from '@margwatch/shared-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockComplaints } from '../data/mockComplaints';

export interface ComplaintsResponseData {
  complaints: Complaint[];
  pagination: Pagination;
}

export interface ComplaintSubmissionResponseData {
  complaint: Complaint;
}

export interface HeatMapResponseData {
  heatMapData: HeatMapData[];
}

const STORAGE_KEY = 'demo_complaints';

let demoComplaints: Complaint[] = [];

function getRandomImageForCategory(category: string): string {
  if (category === 'Electric Pole') {
    return '/sample_images/electric_pole_1.jpg';
  }

  if (category === 'Fallen Tree') {
    const index = Math.floor(Math.random() * 6) + 1;
    return `/sample_images/fallen_tree_${index}.jpg`;
  }

  if (category === 'Pothole') {
    const index = Math.floor(Math.random() * 7) + 1;
    return `/sample_images/pothole_${index}.jpg`;
  }

  return '/sample_images/pothole_1.jpg';
}

function fromMockToComplaint(): Complaint[] {
  return mockComplaints.map((c, index) => ({
    id: c.id,
    title: c.title,
    description: c.title,
    category: c.category as any,
    status: c.status as any,
    latitude: c.latitude,
    longitude: c.longitude,
    address: '',
    imageUrl: c.image,
    imageCount: 1,
    mlCategory: null as any,
    mlConfidence: null as any,
    mlModelVersion: null as any,
    mlProcessingTime: null as any,
    severity: null as any,
    rejectionReason: null,
    userId: `user-${index + 1}`,
    approvedBy: null,
    approvedAt: null,
    createdAt: c.createdAt,
    updatedAt: c.createdAt,
  }));
}

async function loadDemoComplaints(): Promise<Complaint[]> {
  if (demoComplaints.length > 0) {
    return demoComplaints;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored) as Complaint[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        demoComplaints = parsed;
        return demoComplaints;
      }
    }
  } catch {
    // ignore and fall back to mock data
  }

  demoComplaints = fromMockToComplaint();
  return demoComplaints;
}

async function persistDemoComplaints() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(demoComplaints));
  } catch {
    // ignore persistence errors in demo mode
  }
}

export const complaintsApi = {
  /** Submit complaint - in demo mode, append to local demo array and persist */
  submit: async (formData: FormData) => {
    const title = (formData.get('title') as string) || 'New demo complaint';
    const category = ((formData.get('category') as string) || 'Pothole') as any;
    const lat = parseFloat((formData.get('latitude') as string) || '23.2599');
    const lng = parseFloat((formData.get('longitude') as string) || '77.4126');
    const id = Date.now().toString();

    const complaint: Complaint = {
      id,
      title,
      description: title,
      category,
      status: 'Pending' as any,
      latitude: lat,
      longitude: lng,
      address: '',
      imageUrl: getRandomImageForCategory(category as string),
      imageCount: 1,
      mlCategory: null as any,
      mlConfidence: null as any,
      mlModelVersion: null as any,
      mlProcessingTime: null as any,
      severity: null as any,
      rejectionReason: null,
      userId: 'demo-user',
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Ensure current state is loaded before appending
    await loadDemoComplaints();
    demoComplaints = [complaint, ...demoComplaints];
    await persistDemoComplaints();

    const response: ApiResponse<ComplaintSubmissionResponseData> = {
      success: true,
      message: 'Complaint submitted (demo mode)',
      data: { complaint },
    };

    return { data: response };
  },

  getMyComplaints: async (params?: ComplaintFilters) => {
    const current = await loadDemoComplaints();
    const page = params?.page ?? 1;
    const limit = params?.limit ?? current.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const slice = current.slice(start, end);

    const pagination: Pagination = {
      page,
      limit,
      total: current.length,
      pages: Math.max(1, Math.ceil(current.length / limit)),
    };

    const response: ApiResponse<ComplaintsResponseData> = {
      success: true,
      message: 'Complaints loaded (demo mode)',
      data: {
        complaints: slice,
        pagination,
      },
    };

    return { data: response };
  },

  getById: async (id: string) => {
    const current = await loadDemoComplaints();
    const complaint = current.find((c) => c.id === id) ?? current[0];
    const response: ApiResponse<{ complaint: Complaint }> = {
      success: true,
      message: 'Complaint loaded (demo mode)',
      data: { complaint },
    };
    return { data: response };
  },

  getHeatMapData: async () => {
    const current = await loadDemoComplaints();
    const heatMapData: HeatMapData[] = current.map((c) => ({
      latitude: c.latitude,
      longitude: c.longitude,
      category: c.category as any,
      status: c.status as any,
    }));

    const response: ApiResponse<HeatMapResponseData> = {
      success: true,
      message: 'Heatmap data (demo mode)',
      data: { heatMapData },
    };

    return { data: response };
  },
};
