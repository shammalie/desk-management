'use client';
import React from 'react';

export default function Loading() {
    return (
        <div className="relative flex items-center justify-center min-h-screen w-full bg-background overflow-hidden">
            {/* Centered loading text */}
            <div className="relative z-10 flex flex-col items-center justify-center">
                <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 animate-pulse">
                    Loading
                </h1>
                <div className="flex space-x-2">
                    <span className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
            </div>

            {/* Animated SVG waves at the bottom */}
            <div className="absolute bottom-0 left-0 w-full pointer-events-none z-0">
                {/* Wave Layer 1 - Back */}
                <div className="absolute bottom-0 w-full h-32 animate-wave-cyber-1">
                    <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
                        <path
                            fill="rgba(59, 130, 246, 0.2)"
                            d="M0,80 C150,120 350,0 600,80 C850,160 1050,40 1200,80 L1200,120 L0,120 Z"
                            className="animate-wave-path-1"
                        />
                    </svg>
                </div>

                {/* Wave Layer 2 - Middle */}
                <div className="absolute bottom-0 w-full h-32 animate-wave-cyber-2">
                    <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
                        <path
                            fill="rgba(99, 102, 241, 0.3)"
                            d="M0,100 C200,60 400,140 600,100 C800,60 1000,140 1200,100 L1200,120 L0,120 Z"
                            className="animate-wave-path-2"
                        />
                    </svg>
                </div>

                {/* Wave Layer 3 - Front */}
                <div className="absolute bottom-0 w-full h-32 animate-wave-cyber-3">
                    <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
                        <path
                            fill="rgba(139, 92, 246, 0.4)"
                            d="M0,90 C300,130 600,50 900,90 C1050,110 1150,70 1200,90 L1200,120 L0,120 Z"
                            className="animate-wave-path-3"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
} 