import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export const Group = ({ icon: Icon, title, children, defaultOpen = true, blurb }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="group">
      <div className="group-title" onClick={() => setOpen(!open)}>
        <span className="group-title-l">
          {Icon && <Icon size={11} />}
          {title}
        </span>
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </div>
      {open && blurb && <div className="group-blurb">{blurb}</div>}
      {open && children}
    </div>
  );
};
