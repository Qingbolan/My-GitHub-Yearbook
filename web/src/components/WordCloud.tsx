import React from 'react';
import type { KeywordItem } from '../types';

interface Props {
    data: KeywordItem[];
}

const WordCloud: React.FC<Props> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="p-6 bg-github-card rounded-xl border border-github-border shadow-lg h-96 flex flex-col items-center justify-center text-github-secondary">
                No topics found.
            </div>
        );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));

    // Helper to scale font size between 0.8rem and 2.5rem
    const getFontSize = (value: number) => {
        if (maxValue === minValue) return '1.5rem';
        const normalized = (value - minValue) / (maxValue - minValue);
        const size = 0.8 + (normalized * 1.7); // 0.8rem to 2.5rem
        return `${size}rem`;
    };

    // Helper to get opacity/color intensity
    const getOpacity = (value: number) => {
        if (maxValue === minValue) return 1;
        const normalized = (value - minValue) / (maxValue - minValue);
        return 0.6 + (normalized * 0.4); // 0.6 to 1.0
    };

    const colors = ['#58a6ff', '#238636', '#22d3ee', '#f1e05a', '#f56c6c', '#8b949e'];

    return (
        <div className="p-6 bg-github-card rounded-xl border border-github-border shadow-lg min-h-96 flex flex-col">
            <h2 className="text-xl font-bold mb-6 text-github-text">Topics</h2>
            <div className="flex-grow flex flex-wrap content-center justify-center gap-4 p-4">
                {data.map((item, i) => (
                    <span
                        key={item.text}
                        className="font-bold transition-all duration-300 hover:scale-110 cursor-default"
                        style={{
                            fontSize: getFontSize(item.value),
                            color: colors[i % colors.length],
                            opacity: getOpacity(item.value),
                        }}
                        title={`${item.text}: ${item.value}`}
                    >
                        {item.text}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default WordCloud;
