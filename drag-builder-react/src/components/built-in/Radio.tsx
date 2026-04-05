/**
 * Radio 单选组件定义
 */

import { v4 as uuidv4 } from 'uuid';
import type { ComponentDefinition } from '../../store/componentRegistry';
import { generateVisualStyle } from './utils';
import { useComponentStore } from '../../store/componentStore';

/**
 * Radio 单选组件定义
 */
export const radioDefinition: ComponentDefinition = {
  type: 'radio',
  material: {
    type: 'radio',
    label: '单选',
    icon: 'Circle',
    description: '单选按钮',
    backgroundColor: '#dbeafe',
    starColor: '#60a5fa',
    category: 'form',
  },
  defaults: {
    position: { x: 0, y: 0, width: 200, height: 80, zIndex: 0 },
    styles: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      borderRadius: 8,
      textColor: '#0F172A',
      fontSize: 14,
      padding: 12,
    },
    content: {
      options: [
        { id: uuidv4(), label: '选项 1', checked: true, disabled: false },
        { id: uuidv4(), label: '选项 2', checked: false, disabled: false },
      ],
    },
  },
  propertyGroups: [
    {
      id: 'style',
      label: '样式',
      properties: [
        {
          key: 'styles.backgroundColor',
          label: '背景色',
          type: 'color',
          defaultValue: '#FFFFFF',
        },
        {
          key: 'styles.borderColor',
          label: '边框色',
          type: 'color',
          defaultValue: '#E2E8F0',
        },
        {
          key: 'styles.borderWidth',
          label: '边框宽度',
          type: 'number',
          defaultValue: 1,
          min: 0,
          max: 5,
          suffix: 'px',
        },
        {
          key: 'styles.borderRadius',
          label: '圆角',
          type: 'number',
          defaultValue: 8,
          min: 0,
          max: 50,
          suffix: 'px',
        },
        {
          key: 'styles.fontSize',
          label: '字体大小',
          type: 'number',
          defaultValue: 14,
          min: 8,
          max: 32,
          suffix: 'px',
        },
        {
          key: 'styles.padding',
          label: '内边距',
          type: 'number',
          defaultValue: 12,
          min: 0,
          max: 32,
          suffix: 'px',
        },
      ],
    },
    {
      id: 'animation',
      label: '动画配置',
      properties: [],
    },
  ],
  render: ({ component, onClick }) => {
    const style = generateVisualStyle(component);
    const options = component.content.options || [];

    return (
      <div
        className="w-full h-full"
        style={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflow: 'auto',
        }}
        onClick={onClick}
      >
        {options.map(option => (
          <label
            key={option.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: option.disabled ? 'not-allowed' : 'pointer',
              userSelect: 'none',
              opacity: option.disabled ? 0.5 : 1,
            }}
            onClick={e => {
              e.stopPropagation();
              if (option.disabled) return;
              const updatedOptions = component.content.options?.map(opt => ({
                ...opt,
                checked: opt.id === option.id,
              }));
              useComponentStore.getState().updateComponent(component.id, {
                content: {
                  ...component.content,
                  options: updatedOptions,
                },
              });
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid currentColor',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {option.checked && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'currentColor',
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 'inherit' }}>{option.label}</span>
          </label>
        ))}
      </div>
    );
  },
  codeGen: {
    generateJSX: (component, style) => {
      const options = component.content.options || [];
      const groupName = `radio-${component.id}`;
      const optionsJSX = options
        .map(option => {
          const checked = option.checked ? ' defaultChecked' : '';
          const disabled = option.disabled ? ' disabled' : '';
          return `        <label key="${option.id}" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="radio" name="${groupName}" value="${option.id}"${checked}${disabled} />
          <span>${option.label}</span>
        </label>`;
        })
        .join('\n');
      return `<div style={${style}}>
${optionsJSX}
      </div>`;
    },
  },
};
