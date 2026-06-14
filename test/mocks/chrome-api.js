import { vi } from 'bun:test';

/**
 * Mock Chrome extension APIs for testing.
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
    },
    onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn()
    }
};

const mockTabs = {
    get: vi.fn(),
    create: vi.fn(),
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
    id: "9527",
    getURL: vi.fn()
};

// Set up the global Chrome API mock
global.chrome = {
    storage: mockStorage,
    tabs: mockTabs,
    windows: mockWindows,
    webNavigation: mockWebNavigation,
    history: mockHistory,
    runtime: mockRuntime,
};

// Reset all mock implementations
export function resetMocks() {
    vi.clearAllMocks();

    // Reset storage
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

    // Reset tabs
    mockTabs.get.mockResolvedValue({});
    mockTabs.create.mockResolvedValue({});
    mockTabs.remove.mockResolvedValue();

    // Reset runtime
    mockRuntime.getURL.mockImplementation((path) => `chrome-extension://9527/${path}`);

    // Reset windows
    mockWindows.create.mockResolvedValue({});
    mockWindows.getAll.mockResolvedValue([]);

    // Reset history
    mockHistory.deleteUrl.mockResolvedValue();
}