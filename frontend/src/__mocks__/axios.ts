import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create properly typed mock response helper
const createMockResponse = <T = any>(data: T): Promise<AxiosResponse<T>> =>
  Promise.resolve({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as AxiosRequestConfig,
  } as AxiosResponse<T>);

// Define mock axios instance with proper typing to avoid circular reference
const mockAxiosInstance: jest.Mocked<AxiosInstance> = {
  defaults: { headers: { common: {} } },
  get: jest.fn(() => createMockResponse({})),
  post: jest.fn(() => createMockResponse({})),
  put: jest.fn(() => createMockResponse({})),
  delete: jest.fn(() => createMockResponse({})),
  patch: jest.fn(() => createMockResponse({})),
  head: jest.fn(() => createMockResponse({})),
  options: jest.fn(() => createMockResponse({})),
  request: jest.fn(() => createMockResponse({})),
  getUri: jest.fn(() => ''),
  interceptors: {
    request: { 
      use: jest.fn(() => 0), 
      eject: jest.fn(),
      clear: jest.fn(),
    },
    response: { 
      use: jest.fn(() => 0), 
      eject: jest.fn(),
      clear: jest.fn(),
    },
  },
} as unknown as jest.Mocked<AxiosInstance>;

// Mock axios module - create returns the same mock instance (no circular ref)
const mockAxios = {
  ...mockAxiosInstance,
  create: jest.fn(() => mockAxiosInstance),
  isAxiosError: jest.fn(() => false),
  isCancel: jest.fn(() => false),
  all: jest.fn((promises: Promise<any>[]) => Promise.all(promises)),
  spread: jest.fn((callback: (...args: any[]) => any) => (arr: any[]) => callback(...arr)),
  toFormData: jest.fn(),
  formToJSON: jest.fn(),
  CancelToken: {
    source: jest.fn(() => ({
      token: { promise: Promise.resolve(), reason: undefined },
      cancel: jest.fn(),
    })),
  },
  Axios: jest.fn(),
  AxiosError: jest.fn(),
  AxiosHeaders: jest.fn(),
};

export default mockAxios;


















