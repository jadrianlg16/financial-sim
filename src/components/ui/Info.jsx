import React, { useState } from 'react';
import {
  HelpCircle
} from 'lucide-react';

export const Info = ({ text }) => {
  const [open, setOpen] = useState(false);
  const toggle = (e) => { e.stopPropagation(); e.preventDefault(); setOpen(o => !o); };
  return (
    <span
      className="info"
      tabIndex={0}
      onClick={toggle}
      onBlur={() => setOpen(false)}
      style={{ cursor:'pointer' }}
    >
      <HelpCircle />
      <span
        className="info-tip"
        style={open ? { opacity:1, pointerEvents:'auto', transform:'translateX(-50%) translateY(0)' } : undefined}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </span>
  );
};
