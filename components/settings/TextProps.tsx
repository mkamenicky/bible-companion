// TextProps.tsx
import React from 'react';
import { Text as RNText, TextStyle } from 'react-native';

interface TextProps {
    children: React.ReactNode;
    style?: TextStyle | TextStyle[];
}

export default function Text({ children, style }: TextProps) {
    return <RNText style={style}>{children}</RNText>;
}

// Named export for convenience
export { Text };
