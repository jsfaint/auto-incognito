import { describe, test, expect } from 'bun:test';

describe('简单测试组', () => {
    test('基本数学运算', () => {
        expect(1 + 1).toBe(2);
        expect(2 * 3).toBe(6);
        expect(10 - 5).toBe(5);
    });

    test('字符串操作', () => {
        expect('hello' + ' world').toBe('hello world');
        expect('testing'.length).toBe(7);
    });
}); 