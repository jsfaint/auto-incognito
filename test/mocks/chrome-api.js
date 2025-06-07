import { vi } from 'bun:test';

/**
 * 模拟Chrome扩展API用于测试
 */

const mockStorage = {
    local: {
        get: vi.fn(),
        set: vi.fn(),
        clear: vi.fn()
    },
    sync: {
        get: vi.fn(),
        set: vi.fn(),
        clear: vi.fn()
    }
};

const mockTabs = {
    get: vi.fn(),
    remove: vi.fn(),
    onRemoved: {
        addListener: vi.fn(),
        removeListener: vi.fn()
    },
    onUpdated: {
        addListener: vi.fn(),
        removeListener: vi.fn()
    }
};

const mockWindows = {
    create: vi.fn(),
    getAll: vi.fn()
};

const mockWebNavigation = {
    onBeforeNavigate: {
        addListener: vi.fn(),
        removeListener: vi.fn()
    }
};

const mockHistory = {
    deleteUrl: vi.fn()
};

const mockRuntime = {
    id: "9527"
};

// 设置全局Chrome API模拟
global.chrome = {
    storage: mockStorage,
    tabs: mockTabs,
    windows: mockWindows,
    webNavigation: mockWebNavigation,
    history: mockHistory,
    runtime: mockRuntime,
};

// 重置所有模拟功能
export function resetMocks() {
    vi.clearAllMocks();

    // 重置storage
    mockStorage.local.get.mockImplementation((keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
    });

    mockStorage.local.set.mockImplementation((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
    });

    mockStorage.sync.get.mockImplementation((keys, callback) => {
        if (callback) callback({});
        return Promise.resolve({});
    });

    mockStorage.sync.set.mockImplementation((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
    });

    // 重置tabs
    mockTabs.get.mockResolvedValue({});
    mockTabs.remove.mockResolvedValue();

    // 重置windows
    mockWindows.create.mockResolvedValue({});
    mockWindows.getAll.mockResolvedValue([]);

    // 重置history
    mockHistory.deleteUrl.mockResolvedValue();
}