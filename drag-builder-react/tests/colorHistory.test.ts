/**
 * 颜色历史记录 Store 测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useColorHistoryStore } from '../src/store/colorHistoryStore';

describe('颜色历史记录 Store', () => {
  beforeEach(() => {
    // 每次测试前清空历史记录
    useColorHistoryStore.getState().clearHistory();
  });

  it('应该能够添加颜色到历史记录', () => {
    const { addColor } = useColorHistoryStore.getState();
    
    addColor('#FF0000');
    
    expect(useColorHistoryStore.getState().recentColors).toContain('#FF0000');
  });

  it('应该将颜色标准化为大写', () => {
    const { addColor } = useColorHistoryStore.getState();
    
    addColor('#ff0000');
    
    expect(useColorHistoryStore.getState().recentColors).toContain('#FF0000');
  });

  it('应该将新颜色添加到最前面', () => {
    const { addColor } = useColorHistoryStore.getState();
    
    addColor('#FF0000');
    addColor('#00FF00');
    addColor('#0000FF');
    
    const colors = useColorHistoryStore.getState().recentColors;
    expect(colors[0]).toBe('#0000FF');
    expect(colors[1]).toBe('#00FF00');
    expect(colors[2]).toBe('#FF0000');
  });

  it('应该移除重复的颜色并移到最前面', () => {
    const { addColor } = useColorHistoryStore.getState();
    
    addColor('#FF0000');
    addColor('#00FF00');
    addColor('#0000FF');
    addColor('#FF0000'); // 重复
    
    const colors = useColorHistoryStore.getState().recentColors;
    expect(colors[0]).toBe('#FF0000');
    expect(colors.length).toBe(3);
  });

  it('应该最多保留 10 种颜色', () => {
    const { addColor } = useColorHistoryStore.getState();
    
    // 添加 15 种颜色
    for (let i = 0; i < 15; i++) {
      addColor(`#${i.toString(16).padStart(6, '0')}`);
    }
    
    const colors = useColorHistoryStore.getState().recentColors;
    expect(colors.length).toBe(10);
  });

  it('应该能够清空历史记录', () => {
    const { addColor, clearHistory } = useColorHistoryStore.getState();
    
    addColor('#FF0000');
    addColor('#00FF00');
    
    clearHistory();
    
    expect(useColorHistoryStore.getState().recentColors.length).toBe(0);
  });

  it('最新添加的颜色应该在最前面', () => {
    const { addColor } = useColorHistoryStore.getState();
    
    addColor('#111111');
    addColor('#222222');
    addColor('#333333');
    
    const colors = useColorHistoryStore.getState().recentColors;
    expect(colors[0]).toBe('#333333');
    expect(colors[colors.length - 1]).toBe('#111111');
  });
});
