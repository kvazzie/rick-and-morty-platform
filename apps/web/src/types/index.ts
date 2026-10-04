export interface PaginatedResponse<T extends Category | Item = Item> {
  info: Info;
  results: T extends Category ? Item<T>[] : T[];
}

export type Category = keyof typeof CategoryMap;

export type Item<T extends Category = Category> = (typeof CategoryMap)[T];

export interface Info {
  count: number;
  pages: number;
  next: UrlString | null;
  prev: UrlString | null;
}
const CategoryMap = {
  character: {} as {
    id: number;
    name: string;
    status: string;
    species: string;
    type: string;
    gender: string;
    origin: {
      name: string;
      url: string;
    };
    location: {
      name: string;
      url: string;
    };
    image: string;
    episode: string[];
    url: string;
    created: string;
  },
  location: {} as {
    id: number;
    name: string;
    type: string;
    dimension: string;
    residents: string[];
    url: string;
    created: string;
  },
  episode: {} as {
    id: number;
    name: string;
    air_date: string;
    episode: string;
    characters: string[];
    url: string;
    created: string;
  },
};
export const CATEGORIES: Category[] = Object.keys(CategoryMap) as Category[];

export type UrlString = string & { __brand: 'UrlString' };
export const asUrlString = (value: string): UrlString => value as UrlString;
export function isUrlString(value: unknown): value is UrlString {
  try {
    new URL(value as string);
    return true;
  } catch {
    return false;
  }
}
