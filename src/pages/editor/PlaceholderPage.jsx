
import React from 'react';
import { useLocation } from 'react-router-dom';

export default function PlaceholderPage() {
    const location = useLocation();
    const pageName = location.pathname.split('/').pop();

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-4xl mb-4 opacity-20">🚧</div>
            <h2 className="text-2xl font-bold capitalize">{pageName}</h2>
            <p className="text-muted-foreground mt-2">
                This feature is under development.
            </p>
        </div>
    );
}
