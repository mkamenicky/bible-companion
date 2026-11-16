import React, {ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';

interface Props {
    columns: number;
    children: ReactNode[];
}

/**
 * Lays its children out in a fixed number of equally wide columns.
 * The last row is padded so its tiles keep the same width as the others.
 */
export default function TileGrid({columns, children}: Props) {
    const cellWidth = `${100 / columns}%` as const;

    return (
        <View style={styles.grid}>
            {children.map((child, index) => (
                <View key={index} style={[styles.cell, {width: cellWidth}]}>
                    {child}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: -3,
    },
    cell: {
        padding: 3,
    },
});
