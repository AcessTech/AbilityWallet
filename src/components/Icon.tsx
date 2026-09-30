import React from 'react';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { color } from '../theme/tokens';

/**
 * The 28 icons the prototype uses — no more (Sep 23: "only the icons the 27
 * reviewed screens already used"). All 24x24, stroked, round caps and joins,
 * matching the prototype's inline SVG exactly.
 */
export type IconName =
  | 'chat' | 'back' | 'file' | 'info' | 'check' | 'ban' | 'home' | 'user'
  | 'card' | 'save' | 'bell' | 'arrow-up-circle' | 'dollar' | 'camera'
  | 'leaf' | 'mic' | 'send' | 'bank' | 'lock' | 'user-plus' | 'bars'
  | 'briefcase' | 'folder' | 'help-circle' | 'phone' | 'file-blank'
  | 'repeat' | 'search';

export function Icon({
  name,
  size = 22,
  stroke = color.navy,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  const p = { stroke, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {body(name, p)}
    </Svg>
  );
}

type P = ReturnType<typeof Object> & Record<string, unknown>;

function body(name: IconName, p: any) {
  switch (name) {
    case 'chat':
      return <Path {...p} d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />;
    case 'back':
      return <Polyline {...p} points="15 18 9 12 15 6" />;
    case 'file':
      return (<>
        <Path {...p} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <Polyline {...p} points="14 2 14 8 20 8" />
        <Line {...p} x1="16" y1="13" x2="8" y2="13" />
        <Line {...p} x1="16" y1="17" x2="8" y2="17" />
      </>);
    case 'file-blank':
      return (<>
        <Path {...p} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <Polyline {...p} points="14 2 14 8 20 8" />
      </>);
    case 'info':
      return (<>
        <Circle {...p} cx="12" cy="12" r="10" />
        <Line {...p} x1="12" y1="8" x2="12" y2="12" />
        <Line {...p} x1="12" y1="16" x2="12.01" y2="16" />
      </>);
    case 'check':
      return <Polyline {...p} points="20 6 9 17 4 12" />;
    case 'ban':
      return (<>
        <Circle {...p} cx="12" cy="12" r="10" />
        <Line {...p} x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </>);
    case 'home':
      return (<>
        <Path {...p} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <Polyline {...p} points="9 22 9 12 15 12 15 22" />
      </>);
    case 'user':
      return (<>
        <Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle {...p} cx="12" cy="7" r="4" />
      </>);
    case 'card':
      return (<>
        <Rect {...p} x="1" y="4" width="22" height="16" rx="2" />
        <Line {...p} x1="1" y1="10" x2="23" y2="10" />
      </>);
    case 'save':
      return (<>
        <Rect {...p} x="3" y="10" width="18" height="11" rx="2" />
        <Path {...p} d="M12 2v6" />
        <Polyline {...p} points="9 5 12 8 15 5" />
      </>);
    case 'bell':
      return (<>
        <Path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <Path {...p} d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>);
    case 'arrow-up-circle':
      return (<>
        <Circle {...p} cx="12" cy="12" r="10" />
        <Polyline {...p} points="16 12 12 8 8 12" />
        <Line {...p} x1="12" y1="16" x2="12" y2="8" />
      </>);
    case 'dollar':
      return (<>
        <Line {...p} x1="12" y1="1" x2="12" y2="23" />
        <Path {...p} d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>);
    case 'camera':
      return (<>
        <Path {...p} d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <Circle {...p} cx="12" cy="13" r="4" />
      </>);
    case 'leaf':
      return (<>
        <Path {...p} d="M17 8C8 10 5.9 16.17 3.82 21.34c1.17-1.2 2.36-1.71 4.18-1.71 5 0 8-4 8-9 0-.5 0-1.5 1-2.63z" />
        <Path {...p} d="M3.82 21.34C6 15 10 11 17 8" />
      </>);
    case 'mic':
      return (<>
        <Path {...p} d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <Path {...p} d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <Line {...p} x1="12" y1="19" x2="12" y2="23" />
        <Line {...p} x1="8" y1="23" x2="16" y2="23" />
      </>);
    case 'send':
      return (<>
        <Line {...p} x1="22" y1="2" x2="11" y2="13" />
        <Polygon {...p} points="22 2 15 22 11 13 2 9 22 2" />
      </>);
    case 'bank':
      return (<>
        <Line {...p} x1="3" y1="22" x2="21" y2="22" />
        <Line {...p} x1="6" y1="18" x2="6" y2="11" />
        <Line {...p} x1="10" y1="18" x2="10" y2="11" />
        <Line {...p} x1="14" y1="18" x2="14" y2="11" />
        <Line {...p} x1="18" y1="18" x2="18" y2="11" />
        <Polygon {...p} points="12 2 20 7 4 7" />
      </>);
    case 'lock':
      return (<>
        <Rect {...p} x="3" y="11" width="18" height="11" rx="2" />
        <Path {...p} d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>);
    case 'user-plus':
      return (<>
        <Path {...p} d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <Circle {...p} cx="8.5" cy="7" r="4" />
        <Line {...p} x1="20" y1="8" x2="20" y2="14" />
        <Line {...p} x1="23" y1="11" x2="17" y2="11" />
      </>);
    case 'bars':
      return (<>
        <Line {...p} x1="18" y1="20" x2="18" y2="10" />
        <Line {...p} x1="12" y1="20" x2="12" y2="4" />
        <Line {...p} x1="6" y1="20" x2="6" y2="14" />
      </>);
    case 'briefcase':
      return (<>
        <Rect {...p} x="2" y="7" width="20" height="14" rx="2" />
        <Path {...p} d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </>);
    case 'folder':
      return <Path {...p} d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />;
    case 'help-circle':
      return (<>
        <Circle {...p} cx="12" cy="12" r="10" />
        <Path {...p} d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <Line {...p} x1="12" y1="17" x2="12.01" y2="17" />
      </>);
    case 'phone':
      return <Path {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />;
    case 'repeat':
      return (<>
        <Polyline {...p} points="23 4 23 10 17 10" />
        <Path {...p} d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </>);
    case 'search':
      return (<>
        <Circle {...p} cx="11" cy="11" r="8" />
        <Line {...p} x1="21" y1="21" x2="16.65" y2="16.65" />
      </>);
  }
}
