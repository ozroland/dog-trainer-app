import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

describe('Sanity Check', () => {
    it('renders correctly', () => {
        const { getByText } = render(
            <View>
                <Text>Hello World</Text>
            </View>
        );
        expect(getByText('Hello World')).toBeTruthy();
    });
});
