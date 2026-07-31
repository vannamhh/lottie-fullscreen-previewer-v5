import { CssFilterSettings } from '../types';

export const DEFAULT_CSS_FILTERS: CssFilterSettings = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hueRotate: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  dropShadow: false,
  shadowColor: '#6366f1',
  preset: 'normal'
};

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  filters: CssFilterSettings;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'normal',
    name: 'Mặc định (Gốc)',
    description: 'Không áp dụng hiệu ứng CSS',
    badge: 'Mặc định',
    filters: { ...DEFAULT_CSS_FILTERS }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Tăng rực màu, dịch màu xanh neon kèm hiệu ứng phát sáng',
    badge: 'Neon',
    filters: {
      brightness: 110,
      contrast: 130,
      saturate: 220,
      hueRotate: 180,
      blur: 0,
      grayscale: 0,
      sepia: 0,
      invert: 0,
      dropShadow: true,
      shadowColor: '#00f0ff',
      preset: 'cyberpunk'
    }
  },
  {
    id: 'vintage',
    name: 'Phim Cổ Điển (Sepia)',
    description: 'Tông màu hoài cổ ấm áp nhẹ nhàng',
    badge: 'Vintage',
    filters: {
      brightness: 95,
      contrast: 105,
      saturate: 90,
      hueRotate: 0,
      blur: 0,
      grayscale: 10,
      sepia: 75,
      invert: 0,
      dropShadow: false,
      shadowColor: '#6366f1',
      preset: 'vintage'
    }
  },
  {
    id: 'noir',
    name: 'Đen Trắng Điện Ảnh',
    description: 'Trắng đen tương phản cao thanh lịch',
    badge: 'B&W',
    filters: {
      brightness: 105,
      contrast: 160,
      saturate: 0,
      hueRotate: 0,
      blur: 0,
      grayscale: 100,
      sepia: 0,
      invert: 0,
      dropShadow: false,
      shadowColor: '#6366f1',
      preset: 'noir'
    }
  },
  {
    id: 'sunset',
    name: 'Hoàng Hôn Ấm Áp',
    description: 'Màu cam hồng rực rỡ ngọt ngào',
    badge: 'Warm',
    filters: {
      brightness: 105,
      contrast: 115,
      saturate: 170,
      hueRotate: 320,
      blur: 0,
      grayscale: 0,
      sepia: 20,
      invert: 0,
      dropShadow: true,
      shadowColor: '#f97316',
      preset: 'sunset'
    }
  },
  {
    id: 'high-voltage',
    name: 'Siêu Tương Phản',
    description: 'Màu sắc cực mạnh và nổi bật',
    badge: 'Vivid',
    filters: {
      brightness: 100,
      contrast: 180,
      saturate: 200,
      hueRotate: 0,
      blur: 0,
      grayscale: 0,
      sepia: 0,
      invert: 0,
      dropShadow: false,
      shadowColor: '#6366f1',
      preset: 'high-voltage'
    }
  },
  {
    id: 'inverted',
    name: 'Đảo Màu Đột Biến',
    description: 'Đảo ngược toàn bộ bảng màu âm bản',
    badge: 'Inverted',
    filters: {
      brightness: 100,
      contrast: 110,
      saturate: 100,
      hueRotate: 180,
      blur: 0,
      grayscale: 0,
      sepia: 0,
      invert: 100,
      dropShadow: false,
      shadowColor: '#6366f1',
      preset: 'inverted'
    }
  },
  {
    id: 'dreamy',
    name: 'Mờ Ảo Huyền Diệu',
    description: 'Làm mờ nhẹ kết hợp hiệu ứng phát sáng mộng mơ',
    badge: 'Dreamy',
    filters: {
      brightness: 115,
      contrast: 105,
      saturate: 140,
      hueRotate: 0,
      blur: 1.5,
      grayscale: 0,
      sepia: 0,
      invert: 0,
      dropShadow: true,
      shadowColor: '#a855f7',
      preset: 'dreamy'
    }
  }
];

export function getFilterCssString(filters?: CssFilterSettings): string {
  if (!filters) return 'none';
  
  const parts: string[] = [];
  
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturate !== 100) parts.push(`saturate(${filters.saturate}%)`);
  if (filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
  if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`);
  if (filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`);
  if (filters.invert > 0) parts.push(`invert(${filters.invert}%)`);
  if (filters.dropShadow) {
    const color = filters.shadowColor || '#6366f1';
    parts.push(`drop-shadow(0px 8px 24px ${color})`);
  }
  
  return parts.length > 0 ? parts.join(' ') : 'none';
}
