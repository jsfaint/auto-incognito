import { describe, test, expect, vi } from 'bun:test';

describe('Mock 测试', () => {
    test('vi.fn() 应该正常工作', () => {
        const mockFn = vi.fn();

        mockFn();
        mockFn(1, 2);

        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(mockFn).toHaveBeenLastCalledWith(1, 2);
    });

    test('vi.mock 应该正常工作', () => {
        // 创建一个模拟对象
        const mockObj = {
            method: vi.fn().mockReturnValue('mocked value')
        };

        const result = mockObj.method();

        expect(result).toBe('mocked value');
        expect(mockObj.method).toHaveBeenCalled();
    });
}); 