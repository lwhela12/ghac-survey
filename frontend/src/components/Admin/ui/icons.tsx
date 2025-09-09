// frontend/src/components/Admin/ui/icons.tsx
import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const base = (props: IconProps): React.SVGProps<SVGSVGElement> => ({
  width: props.size ?? 20,
  height: props.size ?? 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as React.SVGProps<SVGSVGElement>['strokeLinecap'],
  strokeLinejoin: 'round' as React.SVGProps<SVGSVGElement>['strokeLinejoin'],
});

export const IconChartLine: React.FC<IconProps> = (props) => (
  <svg {...base(props)} {...props}>
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 3 3 5-5" />
  </svg>
);

export const IconList: React.FC<IconProps> = (props) => (
  <svg {...base(props)} {...props}>
    <path d="M8 6h12" />
    <path d="M8 12h12" />
    <path d="M8 18h12" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </svg>
);

export const IconActivity: React.FC<IconProps> = (props) => (
  <svg {...base(props)} {...props}>
    <path d="M22 12h-4l-3 7-6-14-3 7H2" />
  </svg>
);

export const IconBarChart: React.FC<IconProps> = (props) => (
  <svg {...base(props)} {...props}>
    <path d="M3 3v18h18" />
    <rect x="7" y="10" width="3" height="7" />
    <rect x="12" y="6" width="3" height="11" />
    <rect x="17" y="13" width="3" height="4" />
  </svg>
);

export const IconCheckCircle: React.FC<IconProps> = (props) => (
  <svg {...base(props)} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const IconPercent: React.FC<IconProps> = (props) => (
  <svg {...base(props)} {...props}>
    <path d="M19 5L5 19" />
    <circle cx="7" cy="7" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

export const IconClock: React.FC<IconProps> = (props) => (
  <svg {...base(props)} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export const IconFileDown: React.FC<IconProps> = (props) => (
  <svg {...base(props)} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M12 12v6" />
    <path d="M9 15l3 3 3-3" />
  </svg>
);

export const IconLogOut: React.FC<IconProps> = (props) => (
  <svg {...base(props)} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const IconArrowLeft: React.FC<IconProps> = (props) => (
  <svg {...base(props)} {...props}>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

export const IconTrash: React.FC<IconProps> = (props) => (
  <svg {...base(props)} {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

export default IconChartLine;
