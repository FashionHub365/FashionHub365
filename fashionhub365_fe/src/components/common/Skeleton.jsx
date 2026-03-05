import React from 'react';

const Skeleton = ({ className = '', variant = 'rect' }) => {
    const baseClasses = 'bg-gray-200 animate-pulse';
    const variantClasses = {
        rect: 'rounded-md',
        circle: 'rounded-full',
        text: 'rounded h-4 w-full mb-2 last:mb-0',
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
    );
};

export default Skeleton;
