import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

// "?" tooltip that also works on touch screens. On desktop it runs on the CSS
// :hover; a tap toggles `open` and forces visibility with an inline style. It
// closes on blur or a second tap; stopPropagation keeps the tap from firing the
// parent's handler (e.g. a group header).
export const Info = ({ text }) => {
  const [open, setOpen] = useState(false);
  const toggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen((o) => !o);
  };
  return (
    <span
      className="info"
      tabIndex={0}
      onClick={toggle}
      onBlur={() => setOpen(false)}
      style={{ cursor: 'pointer' }}
    >
      <HelpCircle />
      <span
        className="info-tip"
        style={
          open
            ? { opacity: 1, pointerEvents: 'auto', transform: 'translateX(-50%) translateY(0)' }
            : undefined
        }
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </span>
  );
};
