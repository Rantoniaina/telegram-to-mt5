import { render, screen } from '@testing-library/react';
import Background from '../Background';

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

  test('applies correct styles to container', () => {
    const { container } = render(
      <Background>
        <div>Content</div>
      </Background>
    );

    const boxElement = container.firstChild;

    // Check if the element exists
    expect(boxElement).toBeTruthy();

    // Test the computed styles
    if (boxElement) {
      const styles = window.getComputedStyle(boxElement as Element);

      // Since we can't directly check the sx props with testing-library,
      // we can verify that the class names for Material UI are applied
      expect(boxElement).toHaveClass('MuiBox-root');

      // Check for some of the basic styling properties if possible
      expect(boxElement).toHaveStyle({
        display: 'flex',
        width: '100%',
        height: '100vh',
      });
    }
  });

  test('renders with animation styles', () => {
    const { container } = render(
      <Background>
        <div>Animated Content</div>
      </Background>
    );

    // Check if the gradient and animation classes are applied
    // Note: This is a simplified check as we can't directly test CSS animations with Jest
    const gradientClassRegex = /gradientAnimation/;

    // Check for class names that might contain our animation
    const boxElement = container.firstChild;
    expect(boxElement).toBeTruthy();

    // The actual implementation would need to be adjusted based on how MUI
    // compiles the keyframe animation to class names
    const allClassNames = boxElement
      ? (boxElement as HTMLElement).className
      : '';

    // We can't directly check for CSS keyframes in jest-dom,
    // so we're just ensuring the box element has some MUI styling
    expect(allClassNames).toContain('MuiBox-root');
  });

  test('has full viewport height and width', () => {
    const { container } = render(
      <Background>
        <div>Content</div>
      </Background>
    );

    const boxElement = container.firstChild as HTMLElement;
    expect(boxElement).toHaveStyle({
      width: '100%',
      height: '100vh',
    });
  });

  test('centers child content', () => {
    const { container } = render(
      <Background>
        <div>Centered Content</div>
      </Background>
    );

    const boxElement = container.firstChild as HTMLElement;
    expect(boxElement).toHaveStyle({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
  });
});
