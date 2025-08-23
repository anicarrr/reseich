'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, ChevronDown, ChevronUp } from 'lucide-react';

interface WebhookDebugToolProps {
  onDataChange: (data: { key: string; value: string; enabled: boolean }) => void;
}

export function WebhookDebugTool({ onDataChange }: WebhookDebugToolProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [key, setKey] = useState('form-id');
  const [value, setValue] = useState('chat');
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyChange = (newKey: string) => {
    setKey(newKey);
    onDataChange({ key: newKey, value, enabled });
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onDataChange({ key, value: newValue, enabled });
  };

  const handleEnabledChange = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    onDataChange({ key, value, enabled: newEnabled });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('WebhookDebugTool toggle clicked!');
    setIsOpen(!isOpen);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('WebhookDebugTool close clicked!');
    setIsOpen(false);
  };

  if (!mounted) return null;

  const toolContent = (
    <div 
      style={{
        position: 'fixed',
        top: '15px',
        right: '20px',
        zIndex: 999999,
        pointerEvents: 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
        style={{
          background: 'linear-gradient(135deg, #e9407a 0%, #ff8a00 100%)',
          color: 'white',
          padding: '12px',
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.3s ease',
          pointerEvents: 'auto',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
        }}
        title="Webhook Debug Tool"
        aria-label="Toggle Webhook Debug Tool"
      >
        <Settings size={16} />
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '60px',
            right: '0',
            width: '320px',
            backgroundColor: '#1f263e',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            padding: '16px',
            pointerEvents: 'auto',
            userSelect: 'none'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>Webhook Debug Tool</h3>
            <button 
              onClick={handleClose}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                color: '#9ca3af',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.2s ease',
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              aria-label="Close Webhook Debug Tool"
            >
              <X size={16} />
            </button>
          </div>

          {/* Enable/Disable Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <input
              type="checkbox"
              id="webhook-enabled"
              checked={enabled}
              onChange={(e) => handleEnabledChange(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: '#e9407a',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            />
            <label 
              htmlFor="webhook-enabled" 
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              Include in webhook body
            </label>
          </div>

          {/* Key Input */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', color: '#d1d5db', fontSize: '12px', fontWeight: '500', marginBottom: '8px' }}>Key</label>
            <input
              type="text"
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s ease',
                cursor: 'text',
                pointerEvents: 'auto'
              }}
              placeholder="Enter key name"
              onFocus={(e) => {
                e.target.style.borderColor = '#e9407a';
                e.target.style.boxShadow = '0 0 0 2px rgba(233, 64, 122, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Value Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#d1d5db', fontSize: '12px', fontWeight: '500', marginBottom: '8px' }}>Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s ease',
                cursor: 'text',
                pointerEvents: 'auto'
              }}
              placeholder="Enter value"
              onFocus={(e) => {
                e.target.style.borderColor = '#e9407a';
                e.target.style.boxShadow = '0 0 0 2px rgba(233, 64, 122, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: enabled ? '#10b981' : '#6b7280'
            }}></div>
            <span style={{ color: '#9ca3af' }}>
              {enabled ? 'Active - will be included in requests' : 'Inactive - will not be included'}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Use portal to render at document body level
  return createPortal(toolContent, document.body);
}
