import React from 'react';

/**
 * TextShimmer Component
 * 
 * A text component with an optional shimmer/shine effect
 * 
 * @param {Object} props
 * @param {boolean} props.shimmer - Whether to apply the shimmer effect
 * @param {React.ReactNode} props.children - The text content to display
 * @param {string} props.className - Additional CSS classes to apply
 * @param {string} props.as - HTML element type (default: 'div')
 * @returns {JSX.Element}
 */
const TextShimmer = ({
    shimmer = false,
    children,
    className = '',
    as: Component = 'div',
    ...props
}) => {
    const shimmerClasses = shimmer
        ? 'animate-shine !bg-clip-text text-transparent [background:radial-gradient(circle_at_center,rgb(255_255_255_/_95%),transparent)_-200%_50%_/_200%_100%_no-repeat,rgb(20_20_20)] dark:[background:radial-gradient(circle_at_center,rgb(255_255_255_/_95%),transparent)_-200%_50%_/_200%_100%_no-repeat,rgb(120_120_120)]'
        : '';

    return (
        <Component
            className={`${shimmerClasses} ${className}`}
            {...props}
        >
            {children}
        </Component>
    );
};

export default TextShimmer;

