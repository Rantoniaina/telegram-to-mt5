import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Adds custom jest matchers for DOM testing
import Background from './Background';

describe('Background Component', () => {
  test('renders children correctly', () => {
    render(
      <Background>
        <div data-testid='test-child'>Test Content</div>
      </Background>
    );

    const childElement = screen.getByTestId('test-child');
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent('Test Content');
  });

  test('applies the correct styling', () => {
    render(
      <Background>
        <div>Test Content</div>
      </Background>
    );

    // Check for the Box component's root element
    const backgroundElement = screen.getByText('Test Content').parentElement;

    expect(backgroundElement).toHaveStyle({
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });

    // Check for the presence of the background gradient
    // Note: We can't directly test CSS properties like 'background-image' in detail
    // but we can check that the element has a style attribute
    expect(backgroundElement?.getAttribute('style')).toContain('background');
  });

  test('wraps children in a container', () => {
    const { container } = render(
      <Background>
        <button>Click me</button>
      </Background>
    );

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();

    // Verify the component structure
    expect(container.firstChild).toContainElement(button);
  });
});
